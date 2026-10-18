/**
 * Accès aux données « produits » (PostgreSQL).
 * -------------------------------------------
 * Toute la logique de filtrage / tri / pagination vit ici : les contrôleurs
 * restent fins et les règles métier sont testables.
 */
import { query } from '../database/pool.js'
import { toProduct } from '../utils/mappers.js'
import { slugify } from '../utils/slugify.js'

const SELECT_BASE = `
  SELECT p.*, c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`

const SORT_SQL = {
  'price-asc': 'p.price ASC, p.id ASC',
  'price-desc': 'p.price DESC, p.id DESC',
  rating: 'p.rating DESC, p.reviews DESC',
  newest: 'p.created_at DESC, p.id DESC',
  'name-asc': 'p.name ASC',
  popular: 'p.sold DESC, p.rating DESC',
}

function toInt(value) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Construit la clause WHERE + les paramètres selon les filtres demandés. */
function buildFilters(opts = {}) {
  const {
    search = '',
    categoryId = '',
    inStockOnly = false,
    onSale = false,
    featured = false,
    isNew = false,
    minPrice = null,
    maxPrice = null,
    includeInactive = false,
  } = opts

  const where = []
  const params = []

  if (!includeInactive) where.push('p.is_active = TRUE')

  const catId = toInt(categoryId)
  if (catId !== null) {
    params.push(catId)
    where.push(`p.category_id = $${params.length}`)
  }

  if (inStockOnly) where.push('p.stock > 0')
  if (onSale) where.push('p.is_on_sale = TRUE AND p.old_price IS NOT NULL AND p.old_price > p.price')
  if (featured) where.push('p.is_featured = TRUE')
  if (isNew) where.push('p.is_new = TRUE')

  const min = toNumberOrNull(minPrice)
  if (min !== null) {
    params.push(min)
    where.push(`p.price >= $${params.length}`)
  }

  const max = toNumberOrNull(maxPrice)
  if (max !== null) {
    params.push(max)
    where.push(`p.price <= $${params.length}`)
  }

  const q = String(search || '').trim()
  if (q) {
    params.push(`%${q}%`)
    const i = params.length
    where.push(
      `(p.name ILIKE $${i}
        OR COALESCE(p.tagline, '') ILIKE $${i}
        OR COALESCE(p.origin, '') ILIKE $${i}
        OR EXISTS (SELECT 1 FROM unnest(p.tags) AS t WHERE t ILIKE $${i}))`
    )
  }

  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params }
}

/**
 * Liste les produits.
 * Retourne un tableau (contrat frontend) sauf si `page` est fourni :
 * la réponse devient alors `{ items, total, page, pages, limit }`.
 */
export async function list(opts = {}) {
  const { sort = 'popular', page = null, limit = null } = opts
  const { clause, params } = buildFilters(opts)
  const orderBy = SORT_SQL[sort] || SORT_SQL.popular

  const pageNum = toInt(page)
  const limitNum = toInt(limit)

  if (pageNum === null && limitNum === null) {
    const { rows } = await query(
      `${SELECT_BASE} ${clause} ORDER BY ${orderBy}`,
      params
    )
    return rows.map(toProduct)
  }

  const perPage = Math.min(Math.max(limitNum || 12, 1), 100)
  const current = Math.max(pageNum || 1, 1)

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM products p ${clause}`,
    params
  )
  const total = countRows[0]?.total || 0

  const { rows } = await query(
    `${SELECT_BASE} ${clause} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, perPage, (current - 1) * perPage]
  )

  return {
    items: rows.map(toProduct),
    total,
    page: current,
    pages: Math.max(Math.ceil(total / perPage), 1),
    limit: perPage,
  }
}

/** Liste complète réservée à l'admin (produits inactifs inclus). */
export async function listAll() {
  const { rows } = await query(`${SELECT_BASE} ORDER BY p.created_at DESC, p.id DESC`)
  return rows.map(toProduct)
}

export async function findById(id) {
  const numeric = toInt(id)
  if (numeric === null) return null
  const { rows } = await query(`${SELECT_BASE} WHERE p.id = $1`, [numeric])
  return toProduct(rows[0])
}

export async function findBySlug(slug) {
  const { rows } = await query(`${SELECT_BASE} WHERE p.slug = $1`, [slug])
  return toProduct(rows[0])
}

/** Produits d'une même catégorie ou partageant au moins un tag. */
export async function related(id, limit = 4) {
  const product = await findById(id)
  if (!product) return []
  const { rows } = await query(
    `${SELECT_BASE}
     WHERE p.is_active = TRUE
       AND p.id <> $1
       AND (p.category_id = (SELECT category_id FROM products WHERE id = $1) OR p.tags && $2::text[])
     ORDER BY p.sold DESC
     LIMIT $3`,
    [Number(product.id), product.tags || [], limit]
  )
  return rows.map(toProduct)
}

/** Suggestions d'autocomplétion (barre de recherche). */
export async function suggest(term, limit = 5) {
  const q = String(term || '').trim()
  if (q.length < 2) return []
  const { rows } = await query(
    `${SELECT_BASE} WHERE p.is_active = TRUE AND p.name ILIKE $1 ORDER BY p.sold DESC LIMIT $2`,
    [`%${q}%`, limit]
  )
  return rows.map(toProduct)
}

/* ------------------------- Écriture (admin) ------------------------- */

/** Normalise le payload reçu du Dashboard admin. */
function normalizePayload(payload = {}, fallback = {}) {
  const name = String(payload.name ?? fallback.name ?? '').trim()
  return {
    name,
    slug: payload.slug || fallback.slug || slugify(name),
    categoryId: toInt(payload.categoryId ?? fallback.categoryId),
    description: payload.description ?? fallback.description ?? '',
    tagline: payload.tagline ?? fallback.tagline ?? '',
    price: Number(payload.price ?? fallback.price ?? 0) || 0,
    oldPrice: toNumberOrNull(payload.oldPrice ?? fallback.oldPrice),
    unit: payload.unit ?? fallback.unit ?? 'Unité',
    stock: Math.max(Number.parseInt(payload.stock ?? fallback.stock ?? 0, 10) || 0, 0),
    image: payload.image ?? fallback.image ?? '',
    origin: payload.origin ?? fallback.origin ?? '',
    // Note et nombre d'avis : uniquement issus des vrais avis (reviewService),
    // jamais saisis — même un appel direct à l'API ne peut pas les modifier.
    rating: Number(fallback.rating ?? 0) || 0,
    reviews: Number.parseInt(fallback.reviews ?? 0, 10) || 0,
    sold: Number.parseInt(payload.sold ?? fallback.sold ?? 0, 10) || 0,
    tags: Array.isArray(payload.tags) ? payload.tags : fallback.tags || [],
    available:
      payload.available === undefined
        ? fallback.available !== false
        : payload.available !== false,
    featured: payload.featured === undefined ? !!fallback.featured : !!payload.featured,
    isNew: payload.isNew === undefined ? !!fallback.isNew : !!payload.isNew,
  }
}

export async function create(payload) {
  const p = normalizePayload(payload)
  const onSale = p.oldPrice !== null && p.oldPrice > p.price

  const { rows } = await query(
    `INSERT INTO products
       (category_id, name, slug, description, tagline, price, old_price, unit, stock,
        image, origin, rating, reviews, sold, tags, is_active, is_featured, is_new, is_on_sale)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     RETURNING *`,
    [
      p.categoryId, p.name, p.slug, p.description, p.tagline, p.price, p.oldPrice, p.unit,
      p.stock, p.image, p.origin, p.rating, p.reviews, p.sold, p.tags, p.available,
      p.featured, p.isNew, onSale,
    ]
  )
  return toProduct(rows[0])
}

export async function update(id, payload) {
  const numeric = toInt(id)
  if (numeric === null) return null

  const current = await findById(numeric)
  if (!current) return null

  const p = normalizePayload(payload, current)
  const onSale = p.oldPrice !== null && p.oldPrice > p.price

  const { rows } = await query(
    `UPDATE products SET
       category_id = $2, name = $3, slug = $4, description = $5, tagline = $6,
       price = $7, old_price = $8, unit = $9, stock = $10, image = $11, origin = $12,
       rating = $13, reviews = $14, sold = $15, tags = $16, is_active = $17,
       is_featured = $18, is_new = $19, is_on_sale = $20, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      numeric, p.categoryId, p.name, p.slug, p.description, p.tagline, p.price, p.oldPrice,
      p.unit, p.stock, p.image, p.origin, p.rating, p.reviews, p.sold, p.tags, p.available,
      p.featured, p.isNew, onSale,
    ]
  )
  return toProduct(rows[0])
}

/** Met à jour uniquement le stock (action rapide du Dashboard admin). */
export async function updateStock(id, stock) {
  const numeric = toInt(id)
  if (numeric === null) return null
  const value = Math.max(Number.parseInt(stock, 10) || 0, 0)
  const { rows } = await query(
    'UPDATE products SET stock = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [numeric, value]
  )
  return toProduct(rows[0])
}

/**
 * Supprime un produit. Les lignes de commande conservent une copie du nom
 * (product_id passe à NULL grâce à ON DELETE SET NULL).
 */
export async function remove(id) {
  const numeric = toInt(id)
  if (numeric === null) return false
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [numeric])
  return rowCount > 0
}

/** Décrémente le stock et incrémente les ventes (dans la transaction de commande). */
export async function decrementStock(client, lines) {
  for (const line of lines) {
    // Lignes panier : `product_id` (SQL) ou `productId` (déjà mappé).
    const pid = Number(line.product_id ?? line.productId)
    const qty = Number(line.quantity)
    if (!Number.isFinite(pid) || !Number.isFinite(qty) || qty <= 0) continue
    await client.query(
      `UPDATE products
          SET stock = GREATEST(stock - $2, 0), sold = sold + $2, updated_at = now()
        WHERE id = $1`,
      [pid, qty]
    )
  }
}

