/**
 * Avis clients sur les produits.
 * ------------------------------
 * Un avis par client et par produit (le renvoyer le modifie).
 * La note moyenne et le nombre d'avis du produit sont recalculés à chaque
 * changement : products.rating / products.reviews reflètent les vrais avis.
 */
import { query } from '../database/pool.js'
import ApiError from '../utils/ApiError.js'

function toInt(value) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && String(n) === String(value).trim() ? n : null
}

/** Nom public discret : « Prénom N. » */
function publicName(first, last) {
  const initial = String(last || '').trim().charAt(0)
  return `${String(first || '').trim()}${initial ? ` ${initial.toUpperCase()}.` : ''}`.trim() || 'Client'
}

function toReview(row, viewerId = null) {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    rating: Number(row.rating),
    comment: row.comment,
    author: publicName(row.first_name, row.last_name),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mine: viewerId !== null && String(row.user_id) === String(viewerId),
    ...(row.product_name ? { productName: row.product_name, productSlug: row.product_slug } : {}),
  }
}

/** Id numérique d'un produit actif à partir d'un id ou d'un slug. */
async function resolveProductId(idOrSlug) {
  const numeric = toInt(idOrSlug)
  const { rows } = await query(
    numeric !== null
      ? 'SELECT id FROM products WHERE id = $1'
      : 'SELECT id FROM products WHERE slug = $1',
    [numeric !== null ? numeric : String(idOrSlug)]
  )
  if (!rows[0]) throw ApiError.notFound('Produit introuvable.')
  return rows[0].id
}

async function refreshProductRating(productId) {
  await query(
    `UPDATE products SET
       rating  = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM product_reviews WHERE product_id = $1), 0),
       reviews = (SELECT COUNT(*)::int FROM product_reviews WHERE product_id = $1)
     WHERE id = $1`,
    [productId]
  )
}

const REVIEW_SELECT = `
  SELECT r.*, u.first_name, u.last_name
    FROM product_reviews r
    JOIN users u ON u.id = r.user_id`

/** Avis d'un produit (plus récents d'abord) + moyenne. */
export async function listForProduct(idOrSlug, viewerId = null) {
  const productId = await resolveProductId(idOrSlug)
  const { rows } = await query(
    `${REVIEW_SELECT} WHERE r.product_id = $1 ORDER BY r.created_at DESC LIMIT 100`,
    [productId]
  )
  const count = rows.length
  const average = count ? Math.round((rows.reduce((s, r) => s + Number(r.rating), 0) / count) * 10) / 10 : 0
  const items = rows.map((r) => toReview(r, viewerId))
  return {
    items,
    count,
    average,
    mine: items.find((r) => r.mine) || null,
  }
}

/** Crée ou met à jour l'avis du client connecté. */
export async function upsertMine(idOrSlug, userId, { rating, comment }) {
  const productId = await resolveProductId(idOrSlug)
  const { rows } = await query(
    `INSERT INTO product_reviews (product_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (product_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
     RETURNING id`,
    [productId, userId, rating, comment]
  )
  await refreshProductRating(productId)
  const { rows: full } = await query(`${REVIEW_SELECT} WHERE r.id = $1`, [rows[0].id])
  return toReview(full[0], userId)
}

/** Supprime l'avis du client connecté sur ce produit. */
export async function deleteMine(idOrSlug, userId) {
  const productId = await resolveProductId(idOrSlug)
  await query('DELETE FROM product_reviews WHERE product_id = $1 AND user_id = $2', [productId, userId])
  await refreshProductRating(productId)
}

/** Derniers avis positifs avec commentaire (page d'accueil). */
export async function listRecent(limit = 6) {
  const { rows } = await query(
    `SELECT r.*, u.first_name, u.last_name, p.name AS product_name, p.slug AS product_slug
       FROM product_reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
      WHERE r.rating >= 4 AND length(trim(r.comment)) >= 10 AND p.is_active = TRUE
      ORDER BY r.created_at DESC
      LIMIT $1`,
    [Math.min(Math.max(Number(limit) || 6, 1), 12)]
  )
  return rows.map((r) => toReview(r))
}

/** Admin : tous les avis (plus récents d'abord). */
export async function listAll() {
  const { rows } = await query(
    `SELECT r.*, u.first_name, u.last_name, u.email, p.name AS product_name, p.slug AS product_slug
       FROM product_reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
      ORDER BY r.created_at DESC
      LIMIT 500`
  )
  return rows.map((r) => ({ ...toReview(r), email: r.email }))
}

/** Admin : supprime un avis (modération). */
export async function remove(id) {
  const numeric = toInt(id)
  if (numeric === null) throw ApiError.notFound('Avis introuvable.')
  const { rows } = await query('DELETE FROM product_reviews WHERE id = $1 RETURNING product_id', [numeric])
  if (!rows[0]) throw ApiError.notFound('Avis introuvable.')
  await refreshProductRating(rows[0].product_id)
}
