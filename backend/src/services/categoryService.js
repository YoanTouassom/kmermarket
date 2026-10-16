/**
 * Accès aux données « catégories » (PostgreSQL).
 */
import { query } from '../database/pool.js'
import { toCategory } from '../utils/mappers.js'
import { slugify } from '../utils/slugify.js'
import ApiError from '../utils/ApiError.js'

function toInt(value) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

/** Liste les catégories, avec le nombre de produits si demandé. */
export async function list({ withCounts = false } = {}) {
  const sql = withCounts
    ? `SELECT c.*, COUNT(p.id)::int AS product_count
         FROM categories c
         LEFT JOIN products p ON p.category_id = c.id
        GROUP BY c.id
        ORDER BY c.name ASC`
    : 'SELECT * FROM categories ORDER BY name ASC'

  const { rows } = await query(sql)
  return rows.map(toCategory)
}

export async function findById(id) {
  const numeric = toInt(id)
  if (numeric === null) return null
  const { rows } = await query('SELECT * FROM categories WHERE id = $1', [numeric])
  return toCategory(rows[0])
}

export async function create(payload = {}) {
  const name = String(payload.name || '').trim()
  if (!name) throw ApiError.badRequest('Le nom de la catégorie est obligatoire.')

  const { rows } = await query(
    `INSERT INTO categories (name, slug, description, icon, color, image)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      name,
      payload.slug || slugify(name),
      payload.description || '',
      payload.icon || 'Leaf',
      payload.color || '#1b7f52',
      payload.image || '',
    ]
  )
  return toCategory(rows[0])
}

export async function update(id, payload = {}) {
  const numeric = toInt(id)
  if (numeric === null) return null

  const current = await findById(numeric)
  if (!current) return null

  const name = String(payload.name ?? current.name).trim()

  const { rows } = await query(
    `UPDATE categories SET
       name = $2, slug = $3, description = $4, icon = $5, color = $6, image = $7, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      numeric,
      name,
      payload.slug || current.slug || slugify(name),
      payload.description ?? current.description,
      payload.icon ?? current.icon,
      payload.color ?? current.color,
      payload.image ?? current.image,
    ]
  )
  return toCategory(rows[0])
}

/** Refuse la suppression tant que des produits y sont rattachés. */
export async function remove(id) {
  const numeric = toInt(id)
  if (numeric === null) return false

  const { rows } = await query(
    'SELECT COUNT(*)::int AS total FROM products WHERE category_id = $1',
    [numeric]
  )
  if ((rows[0]?.total || 0) > 0) {
    throw ApiError.conflict(
      'Impossible de supprimer : des produits sont rattachés à cette catégorie.'
    )
  }

  const { rowCount } = await query('DELETE FROM categories WHERE id = $1', [numeric])
  return rowCount > 0
}
