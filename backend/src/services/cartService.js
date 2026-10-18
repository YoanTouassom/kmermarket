/**
 * Panier persistant (PostgreSQL).
 * -------------------------------
 * Un panier par utilisateur. Les invités gardent leur panier dans le
 * localStorage du navigateur ; il est fusionné à la connexion.
 */
import { query, withTransaction } from '../database/pool.js'
import { toCartItem } from '../utils/mappers.js'
import ApiError from '../utils/ApiError.js'

function toInt(value) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

/** Récupère (ou crée) le panier d'un utilisateur. */
export async function getOrCreateCart(userId) {
  const numeric = toInt(userId)
  if (numeric === null) throw ApiError.badRequest('Utilisateur invalide.')

  const { rows } = await query('SELECT * FROM carts WHERE user_id = $1', [numeric])
  if (rows[0]) return rows[0]

  const inserted = await query(
    `INSERT INTO carts (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
     RETURNING *`,
    [numeric]
  )
  return inserted.rows[0]
}

const ITEMS_SQL = `
  SELECT ci.product_id, ci.quantity,
         p.name, p.slug, p.unit, p.price, p.old_price, p.image, p.stock, p.category_id
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
   WHERE ci.cart_id = $1
   ORDER BY ci.created_at ASC
`

/** Contenu du panier sous le format attendu par le frontend. */
export async function getCart(userId) {
  const cart = await getOrCreateCart(userId)
  const { rows } = await query(ITEMS_SQL, [cart.id])
  return { cartId: cart.id, items: rows.map(toCartItem) }
}

/** Charge un produit actif en vérifiant son existence. */
async function requireProduct(productId, client = null) {
  const numeric = toInt(productId)
  if (numeric === null) throw ApiError.badRequest('Identifiant produit invalide.')

  const { rows } = client
    ? await client.query('SELECT * FROM products WHERE id = $1', [numeric])
    : await query('SELECT * FROM products WHERE id = $1', [numeric])

  const product = rows[0]
  if (!product) throw ApiError.notFound('Produit introuvable.')
  if (!product.is_active) throw ApiError.badRequest('Ce produit n’est plus disponible.')
  return product
}

/** Erreur de stock homogène. */
function stockError(product, available) {
  // La quantité restante n'est pas révélée au client.
  return ApiError.badRequest(
    available > 0
      ? `Quantité demandée indisponible pour « ${product.name} ». Essayez une quantité plus petite.`
      : `« ${product.name} » est en rupture de stock.`
  )
}


/** Ajoute une quantité (cumule si la ligne existe déjà). */
export async function addItem(userId, productId, quantity = 1) {
  const qty = Math.max(Number.parseInt(quantity, 10) || 1, 1)

  return withTransaction(async (client) => {
    const product = await requireProduct(productId, client)
    if (product.stock <= 0) throw stockError(product, 0)

    const cart = await getOrCreateCart(userId)
    const { rows: existing } = await client.query(
      'SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cart.id, product.id]
    )

    const target = (existing[0]?.quantity || 0) + qty
    if (target > product.stock) throw stockError(product, product.stock)

    await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = $3, updated_at = now()`,
      [cart.id, product.id, target]
    )
    await client.query('UPDATE carts SET updated_at = now() WHERE id = $1', [cart.id])

    return getCart(userId)
  })
}

/** Fixe la quantité exacte d'une ligne (0 ou moins → suppression). */
export async function setQuantity(userId, productId, quantity) {
  const qty = Number.parseInt(quantity, 10) || 0

  return withTransaction(async (client) => {
    const cart = await getOrCreateCart(userId)
    const product = await requireProduct(productId, client)

    if (qty <= 0) {
      await client.query(
        'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cart.id, product.id]
      )
      return getCart(userId)
    }

    if (qty > product.stock) throw stockError(product, product.stock)

    await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = $3, updated_at = now()`,
      [cart.id, product.id, qty]
    )

    return getCart(userId)
  })
}

export async function removeItem(userId, productId) {
  const cart = await getOrCreateCart(userId)
  const numeric = toInt(productId)
  if (numeric === null) throw ApiError.badRequest('Identifiant produit invalide.')

  await query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [
    cart.id,
    numeric,
  ])
  return getCart(userId)
}

/** Vide entièrement le panier de l'utilisateur. */
export async function clear(userId) {
  const cart = await getOrCreateCart(userId)
  await query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id])
  return { cartId: cart.id, items: [] }
}

/**
 * Fusionne le panier invité (localStorage) avec le panier serveur.
 * Les quantités sont additionnées puis plafonnées au stock disponible.
 */
export async function mergeItems(userId, items = []) {
  const cart = await getOrCreateCart(userId)
  let merged = 0

  for (const item of items) {
    const productId = toInt(item?.productId ?? item?.id)
    const qty = Math.max(Number.parseInt(item?.quantity, 10) || 0, 0)
    if (productId === null || qty <= 0) continue

    const { rows } = await query('SELECT * FROM products WHERE id = $1', [productId])
    const product = rows[0]
    if (!product || !product.is_active || product.stock <= 0) continue

    await query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = LEAST(cart_items.quantity + $3, $4), updated_at = now()`,
      [cart.id, productId, qty, product.stock]
    )
    merged += 1
  }

  await query('UPDATE carts SET updated_at = now() WHERE id = $1', [cart.id])
  return { ...(await getCart(userId)), merged }
}

/** Lignes du panier verrouillées pour la création de commande. */
export async function getCartLines(client, cartId) {
  const { rows } = await client.query(
    `SELECT ci.product_id, ci.quantity,
            p.name, p.unit, p.price, p.image, p.stock, p.is_active
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = $1
      FOR UPDATE OF p`,
    [cartId]
  )
  return rows
}
