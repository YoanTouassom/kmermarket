/**
 * Commandes — logique transactionnelle.
 * -------------------------------------
 * Règle d'or : le montant envoyé par le frontend n'est JAMAIS utilisé.
 * On relit le panier et les prix en base, on recalcule sous-total, frais
 * de livraison et total, puis on écrit la commande dans une transaction.
 */
import { query, withTransaction } from '../database/pool.js'
import { toOrder, toOrderItem } from '../utils/mappers.js'
import { computeDelivery } from '../config/delivery.js'
import * as cartService from './cartService.js'
import { decrementStock } from './productService.js'
import ApiError from '../utils/ApiError.js'

const ORDER_SELECT = `
  SELECT o.*,
         (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS item_count
    FROM orders o
`

/** Statuts autorisés (alignés sur l'enum PostgreSQL). */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'shipping',
  'delivered',
  'cancelled',
]

function toInt(value) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100
}

/** Libellé court français d'un mois « YYYY-MM » (janv., févr., …). */
const MONTH_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
function monthLabel(key) {
  if (!key) return ''
  const [y, m] = String(key).split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) return String(key)
  return MONTH_SHORT[m - 1]
}

/** Référence lisible : KM-20260921-4F7A. */
function generateOrderNumber() {
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase()
  return `KM-${stamp}-${rand}`
}

async function loadItems(orderId) {
  const { rows } = await query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC',
    [orderId]
  )
  return rows.map(toOrderItem)
}

async function loadTimeline(orderId) {
  const { rows } = await query(
    `SELECT status, created_at FROM order_status_history
      WHERE order_id = $1 ORDER BY created_at ASC, id ASC`,
    [orderId]
  )
  return rows
}

/** Assemble une commande complète (lignes + timeline). */
async function hydrate(row) {
  if (!row) return null
  const [items, timeline] = await Promise.all([loadItems(row.id), loadTimeline(row.id)])
  const order = toOrder(row, items, timeline)
  order.itemCount = row.item_count === undefined ? items.length : Number(row.item_count)
  return order
}

/** Enregistre une transition de statut dans l'historique. */
async function pushStatus(client, orderId, status) {
  await client.query(
    'INSERT INTO order_status_history (order_id, status) VALUES ($1, $2)',
    [orderId, status]
  )
}

/** Devis de livraison calculé côté serveur (utilisé par le checkout). */
export function quote(city, subtotal) {
  const amount = Math.max(Number(subtotal) || 0, 0)
  const delivery = computeDelivery(amount, city)
  return {
    city: String(city || ''),
    subtotal: round2(amount),
    deliveryFee: delivery.fee,
    total: round2(amount + delivery.fee),
    eta: delivery.eta,
    free: delivery.free,
    freeAbove: delivery.freeAbove,
  }
}

/**
 * Crée une commande à partir du panier serveur.
 * Stock, prix et frais de livraison sont recalculés ici.
 */
export async function createFromCart(userId, payload = {}) {
  const numeric = toInt(userId)
  if (numeric === null) throw ApiError.badRequest('Utilisateur invalide.')

  const city = String(payload.city || '').trim()
  const neighborhood = String(payload.neighborhood || '').trim()
  const address = String(payload.address || '').trim()
  if (!city || !neighborhood || !address) {
    throw ApiError.badRequest(
      'Veuillez renseigner la ville, le quartier et l’adresse de livraison.'
    )
  }

  const paymentMethod = ['cash', 'mtn_momo', 'orange_money'].includes(payload.paymentMethod)
    ? payload.paymentMethod
    : 'cash'

  return withTransaction(async (client) => {
    /* 1. Le client — ses coordonnées sont figées sur la commande */
    const { rows: userRows } = await client.query('SELECT * FROM users WHERE id = $1', [numeric])
    const user = userRows[0]
    if (!user) throw ApiError.notFound('Utilisateur introuvable.')
    if (!user.is_active) throw ApiError.forbidden('Ce compte est désactivé.')

    const phone = String(payload.phone || user.phone || '').trim()
    if (!phone) {
      throw ApiError.badRequest('Un numéro de téléphone est requis pour la livraison.')
    }

    /* 2. Le panier — verrouillé contre les commandes concurrentes */
    const cart = await cartService.getOrCreateCart(numeric)
    const lines = await cartService.getCartLines(client, cart.id)
    if (!lines.length) throw ApiError.badRequest('Votre panier est vide.')

    /* 3. Vérification du stock et calcul des montants à partir de la base */
    let subtotal = 0
    for (const line of lines) {
      if (!line.is_active) {
        throw ApiError.badRequest(`« ${line.name} » n’est plus disponible à la vente.`)
      }
      if (line.quantity > line.stock) {
        throw ApiError.badRequest(
          `Stock insuffisant pour « ${line.name} » : ${line.stock} ${line.unit} disponible(s).`
        )
      }
      subtotal += Number(line.price) * Number(line.quantity)
    }
    subtotal = round2(subtotal)

    const delivery = computeDelivery(subtotal, city)
    const total = round2(subtotal + delivery.fee)
    const reference = generateOrderNumber()

    /* 4. La commande */
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (user_id, order_number, status, subtotal, delivery_fee, total,
          payment_method, payment_status, note,
          customer_first_name, customer_last_name, customer_email, customer_phone,
          city, neighborhood, address)
       VALUES ($1,$2,'pending',$3,$4,$5,$6,'pending',$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        numeric, reference, subtotal, delivery.fee, total,
        paymentMethod, payload.note ? String(payload.note).trim() : null,
        user.first_name, user.last_name, user.email, phone,
        city, neighborhood,
        address + (payload.additionalInfo ? ` — ${String(payload.additionalInfo).trim()}` : ''),
      ]
    )
    const order = orderRows[0]

    /* 5. Les lignes (prix unitaire figé au moment de l'achat) */
    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, product_name, unit, unit_price, quantity, subtotal, image)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          order.id, line.product_id, line.name, line.unit, line.price,
          line.quantity, round2(Number(line.price) * Number(line.quantity)), line.image,
        ]
      )
    }

    /* 6. Historique, stock, panier */
    await pushStatus(client, order.id, 'pending')
    await decrementStock(client, lines)
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id])

    /* 7. Adresse réutilisable si le client le souhaite */
    if (payload.saveAddress) {
      await saveAddressFor(client, numeric, { city, neighborhood, address }, payload.additionalInfo)
    }

    const { rows: full } = await client.query(`${ORDER_SELECT} WHERE o.id = $1`, [order.id])
    return hydrate(full[0])
  })
}

/* ---------------------------------------------------------------- */
/*  Lecture côté client                                             */
/* ---------------------------------------------------------------- */

/** Historique de commandes d'un utilisateur, la plus récente d'abord. */
export async function listByUser(userId) {
  const numeric = toInt(userId)
  if (numeric === null) throw ApiError.badRequest('Utilisateur invalide.')

  const { rows } = await query(
    `${ORDER_SELECT} WHERE o.user_id = $1 ORDER BY o.created_at DESC, o.id DESC`,
    [numeric]
  )
  return Promise.all(rows.map(hydrate))
}

/**
 * Détail d'une commande.
 * Un client ne peut lire que ses propres commandes ; l'admin voit tout.
 */
export async function findById(id, requester = null) {
  const numeric = toInt(id)
  if (numeric === null) throw ApiError.badRequest('Identifiant de commande invalide.')

  const { rows } = await query(`${ORDER_SELECT} WHERE o.id = $1`, [numeric])
  const row = rows[0]
  if (!row) throw ApiError.notFound('Commande introuvable.')

  if (requester && requester.role !== 'admin' && String(row.user_id) !== String(requester.id)) {
    throw ApiError.forbidden('Vous n’avez pas accès à cette commande.')
  }

  return hydrate(row)
}

/* ---------------------------------------------------------------- */
/*  Lecture / actions admin                                         */
/* ---------------------------------------------------------------- */

/** Liste filtrée de toutes les commandes (Dashboard admin). */
export async function listAll(filters = {}) {
  const params = []
  const where = []

  if (filters.status && filters.status !== 'all') {
    params.push(filters.status)
    where.push(`o.status = $${params.length}`)
  }

  const q = String(filters.search || '').trim()
  if (q) {
    params.push(`%${q}%`)
    const i = params.length
    where.push(
      `(o.order_number ILIKE $${i}
        OR o.customer_first_name ILIKE $${i}
        OR o.customer_last_name ILIKE $${i}
        OR COALESCE(o.customer_email, '') ILIKE $${i}
        OR o.customer_phone ILIKE $${i}
        OR o.city ILIKE $${i})`
    )
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const { rows } = await query(
    `${ORDER_SELECT} ${clause} ORDER BY o.created_at DESC, o.id DESC`,
    params
  )
  return Promise.all(rows.map(hydrate))
}

/**
 * Flux léger des nouvelles commandes (notifications admin, interrogé souvent).
 * Renvoie les commandes d'id > afterId et le dernier id connu.
 */
export async function listNewSince(afterId = 0, limit = 20) {
  const { rows } = await query(
    `SELECT id, order_number, customer_first_name, customer_last_name, total,
            city, payment_method, created_at
     FROM orders WHERE id > $1 ORDER BY id DESC LIMIT $2`,
    [afterId, limit]
  )
  const { rows: last } = await query('SELECT COALESCE(MAX(id), 0) AS id FROM orders')
  return {
    latestId: String(last[0].id),
    orders: rows.map((r) => ({
      id: String(r.id),
      reference: r.order_number,
      customerName: `${r.customer_first_name} ${r.customer_last_name}`.trim(),
      total: Number(r.total),
      city: r.city,
      paymentMethod: r.payment_method,
      createdAt: r.created_at,
    })),
  }
}

/** Change le statut d'une commande (annuler remet le stock en vente). */
export async function updateStatus(id, status) {
  const numeric = toInt(id)
  if (numeric === null) throw ApiError.badRequest('Identifiant de commande invalide.')
  if (!ORDER_STATUSES.includes(status)) {
    throw ApiError.badRequest('Statut de commande inconnu.')
  }

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT * FROM orders WHERE id = $1 FOR UPDATE',
      [numeric]
    )
    const current = rows[0]
    if (!current) throw ApiError.notFound('Commande introuvable.')

    if (current.status === status) return hydrate(current)

    if (current.status === 'delivered' && status === 'cancelled') {
      throw ApiError.conflict('Une commande déjà livrée ne peut plus être annulée.')
    }

    /* Annulation : le stock réservé est remis en vente. */
    if (status === 'cancelled' && current.status !== 'cancelled') {
      await client.query(
        `UPDATE products p
            SET stock = p.stock + oi.quantity, sold = GREATEST(p.sold - oi.quantity, 0)
           FROM order_items oi
          WHERE oi.order_id = $1 AND oi.product_id = p.id`,
        [numeric]
      )
    }

    const { rows: updated } = await client.query(
      `UPDATE orders SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [numeric, status]
    )
    await pushStatus(client, numeric, status)

    return hydrate(updated[0])
  })
}

/** Statistiques du Dashboard administrateur. */
export async function getStats() {
  const { rows: counts } = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM orders)                                      AS orders_total,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'pending')             AS orders_pending,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'delivered')           AS orders_delivered,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'cancelled')           AS orders_cancelled,
      (SELECT COALESCE(SUM(total), 0)::float FROM orders
        WHERE status <> 'cancelled')                                          AS revenue_total,
      (SELECT COALESCE(SUM(total), 0)::float FROM orders
        WHERE status <> 'cancelled'
          AND created_at >= date_trunc('month', now()))                       AS revenue_month,
      (SELECT COUNT(*)::int FROM users WHERE role = 'customer')               AS customers_total,
      (SELECT COUNT(*)::int FROM users WHERE role = 'customer' AND is_active) AS customers_active,
      (SELECT COUNT(*)::int FROM products)                                    AS products_total,
      (SELECT COUNT(*)::int FROM products WHERE is_active)                    AS products_active,
      (SELECT COUNT(*)::int FROM products WHERE stock <= 0)                   AS products_out_of_stock,
      (SELECT COUNT(*)::int FROM products WHERE stock > 0 AND stock <= 5)     AS products_low_stock
  `)

  const { rows: byStatus } = await query(
    'SELECT status, COUNT(*)::int AS total FROM orders GROUP BY status'
  )

  const { rows: monthly } = await query(`
    SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS key,
           COALESCE(SUM(total), 0)::float AS total,
           COUNT(*)::int AS orders
      FROM orders
     WHERE status <> 'cancelled'
       AND created_at >= date_trunc('month', now()) - INTERVAL '5 months'
     GROUP BY 1
     ORDER BY 1 ASC
  `)

  const { rows: recentOrders } = await query(
    `${ORDER_SELECT} ORDER BY o.created_at DESC, o.id DESC LIMIT 5`
  )

  const { rows: lowStock } = await query(
    `SELECT id, name, stock, unit FROM products
      WHERE stock <= 5 ORDER BY stock ASC, name ASC LIMIT 8`
  )

  const { rows: topProducts } = await query(
    `SELECT p.id, p.name, p.price, p.sold, p.image,
            COALESCE(SUM(oi.quantity), 0)::int AS ordered
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
      GROUP BY p.id
      ORDER BY ordered DESC, p.sold DESC
      LIMIT 5`
  )

  const base = counts[0] || {}
  return {
    users: { total: base.customers_total || 0, active: base.customers_active || 0 },
    products: {
      total: base.products_total || 0,
      active: base.products_active || 0,
      outOfStock: base.products_out_of_stock || 0,
      lowStock: base.products_low_stock || 0,
    },
    orders: {
      total: base.orders_total || 0,
      pending: base.orders_pending || 0,
      delivered: base.orders_delivered || 0,
      cancelled: base.orders_cancelled || 0,
      byStatus,
    },
    revenue: {
      total: Number(base.revenue_total || 0),
      month: Number(base.revenue_month || 0),
      average:
        base.orders_total > 0
          ? Math.round(Number(base.revenue_total || 0) / Number(base.orders_total))
          : 0,
    },
    recentOrders: await Promise.all(recentOrders.map(hydrate)),
    monthly: monthly.map((m) => ({
      key: m.key,
      label: monthLabel(m.key),
      total: Number(m.total),
      orders: Number(m.orders),
    })),
    outOfStock: lowStock.map((p) => ({
      id: String(p.id),
      name: p.name,
      stock: Number(p.stock),
      unit: p.unit,
    })),
    topProducts: topProducts.map((p) => ({
      id: String(p.id),
      name: p.name,
      price: Number(p.price),
      sold: Number(p.sold),
      ordered: Number(p.ordered),
      image: p.image || '',
    })),
  }
}

/** Marque une commande comme payée (encaissement à la livraison / MoMo). */
export async function markAsPaid(id, paid = true) {
  const numeric = toInt(id)
  if (numeric === null) throw ApiError.badRequest('Identifiant de commande invalide.')

  const { rows } = await query(
    `UPDATE orders SET payment_status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [numeric, paid ? 'paid' : 'pending']
  )
  if (!rows[0]) throw ApiError.notFound('Commande introuvable.')
  return hydrate(rows[0])
}


/** Enregistre une adresse (et gère l'adresse par défaut). */
async function saveAddressFor(client, userId, data, additionalInfo = '') {
  const { rows: existing } = await client.query(
    'SELECT id FROM addresses WHERE user_id = $1 LIMIT 1',
    [userId]
  )
  const isDefault = existing.length === 0

  if (isDefault) {
    await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId])
  }

  await client.query(
    `INSERT INTO addresses (user_id, city, neighborhood, address, additional_info, is_default)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [userId, data.city, data.neighborhood, data.address, additionalInfo || null, isDefault]
  )
}
