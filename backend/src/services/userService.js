/**
 * Espace client : profil, adresses, liste des utilisateurs (admin).
 * ---------------------------------------------------------------------------
 * Sécurité : chaque requête « /me » est filtrée sur `req.user.id`. Un
 * utilisateur ne peut jamais lire ou modifier les lignes d'un autre.
 */
import { query, withTransaction } from '../database/pool.js'
import { toUser, toAddress } from '../utils/mappers.js'
import ApiError from '../utils/ApiError.js'
import { normalizePhone } from './authService.js'

function toInt(value) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

/* ---------------------------- Profil ---------------------------- */

export async function getProfile(userId) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [toInt(userId)])
  return toUser(rows[0])
}

/** Mise à jour partielle du profil (champs autorisés uniquement). */
export async function updateProfile(userId, payload = {}) {
  const id = toInt(userId)
  if (id === null) throw ApiError.badRequest('Identifiant invalide.')

  const fields = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    phone: payload.phone === undefined ? undefined : normalizePhone(payload.phone),
    city: payload.city,
    neighborhood: payload.quartier ?? payload.neighborhood,
    address: payload.address,
    avatar: payload.avatar,
    preferences: payload.preferences === undefined
      ? undefined
      : JSON.stringify(payload.preferences),
  }

  const sets = []
  const params = [id]

  for (const [column, value] of Object.entries(fields)) {
    if (value === undefined) continue
    params.push(value)
    sets.push(`${column} = $${params.length}`)
  }

  if (!sets.length) return getProfile(id)

  sets.push('updated_at = now()')
  const { rows } = await query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params
  )
  return toUser(rows[0])
}

/* ---------------------------- Adresses ---------------------------- */

async function hasAnyAddress(client, userId) {
  const { rows } = await client.query(
    'SELECT 1 FROM addresses WHERE user_id = $1 LIMIT 1',
    [userId]
  )
  return rows.length > 0
}

async function clearDefaults(client, userId) {
  await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId])
}

/** S'assure que l'adresse appartient bien à l'utilisateur, sinon 404. */
async function requireOwnership(addressId, userId) {
  const id = toInt(addressId)
  if (id === null) throw ApiError.notFound('Adresse introuvable.')

  const { rows } = await query('SELECT * FROM addresses WHERE id = $1', [id])
  const row = rows[0]
  if (!row || String(row.user_id) !== String(userId)) {
    throw ApiError.notFound('Adresse introuvable.')
  }
  return row
}

export async function listAddresses(userId) {
  const { rows } = await query(
    'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
    [toInt(userId)]
  )
  return rows.map(toAddress)
}

export async function createAddress(userId, payload = {}) {
  const id = toInt(userId)
  if (id === null) throw ApiError.badRequest('Identifiant invalide.')

  return withTransaction(async (client) => {
    const shouldBeDefault =
      payload.isDefault === true || !(await hasAnyAddress(client, id))
    if (shouldBeDefault) await clearDefaults(client, id)

    const { rows } = await client.query(
      `INSERT INTO addresses (user_id, label, city, neighborhood, address, additional_info, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        id,
        payload.label || 'Domicile',
        payload.city || '',
        payload.quartier ?? payload.neighborhood ?? '',
        payload.address || '',
        payload.additionalInfo ?? payload.additional_info ?? '',
        shouldBeDefault,
      ]
    )
    return toAddress(rows[0])
  })
}

/** Vrai si cette adresse est la seule → on ne peut pas la retirer du défaut. */
async function hasOnlyDefault(client, userId) {
  const { rows } = await client.query(
    'SELECT COUNT(*)::int AS total FROM addresses WHERE user_id = $1',
    [userId]
  )
  return (rows[0]?.total || 0) === 1
}

export async function updateAddress(userId, addressId, payload = {}) {
  const existing = await requireOwnership(addressId, userId)

  return withTransaction(async (client) => {
    if (payload.isDefault === true) await clearDefaults(client, userId)

    let keepDefault = existing.is_default
    if (payload.isDefault === true) keepDefault = true
    else if (payload.isDefault === false) keepDefault = !(await hasOnlyDefault(client, userId))

    const { rows } = await client.query(
      `UPDATE addresses
          SET label = $3, city = $4, neighborhood = $5, address = $6,
              additional_info = $7, is_default = $8, updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
      [
        existing.id,
        userId,
        payload.label ?? existing.label,
        payload.city ?? existing.city,
        payload.quartier ?? payload.neighborhood ?? existing.neighborhood,
        payload.address ?? existing.address,
        payload.additionalInfo ?? payload.additional_info ?? existing.additional_info,
        keepDefault,
      ]
    )
    return toAddress(rows[0])
  })
}

export async function setDefaultAddress(userId, addressId) {
  const existing = await requireOwnership(addressId, userId)

  return withTransaction(async (client) => {
    await clearDefaults(client, userId)
    const { rows } = await client.query(
      'UPDATE addresses SET is_default = TRUE, updated_at = now() WHERE id = $1 RETURNING *',
      [existing.id]
    )
    return toAddress(rows[0])
  })
}

export async function removeAddress(userId, addressId) {
  const existing = await requireOwnership(addressId, userId)

  return withTransaction(async (client) => {
    await client.query('DELETE FROM addresses WHERE id = $1', [existing.id])
    // Toujours conserver une adresse par défaut si d'autres existent.
    if (existing.is_default) {
      const { rows } = await client.query(
        'SELECT id FROM addresses WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
        [userId]
      )
      if (rows[0]) {
        await client.query('UPDATE addresses SET is_default = TRUE WHERE id = $1', [rows[0].id])
      }
    }
    return true
  })
}

/* ---------------------------- Administration ---------------------------- */

const ADMIN_STATS_JOIN = `
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS orders, COALESCE(SUM(total), 0)::float AS spent
      FROM orders o
     WHERE o.user_id = u.id AND o.status <> 'cancelled'
  ) s ON TRUE
`

/** Liste des utilisateurs avec filtres (recherche, rôle, statut). */
export async function listAllUsers(filters = {}) {
  const { search = '', role = 'all', status = 'all' } = filters
  const where = []
  const params = []

  if (role && role !== 'all') {
    params.push(role)
    where.push(`u.role = $${params.length}`)
  }

  if (status && status !== 'all') {
    params.push(status === 'active')
    where.push(`u.is_active = $${params.length}`)
  }

  const q = String(search || '').trim()
  if (q) {
    params.push(`%${q}%`)
    const i = params.length
    where.push(
      `(u.first_name ILIKE $${i} OR u.last_name ILIKE $${i}
        OR u.email ILIKE $${i} OR COALESCE(u.phone, '') ILIKE $${i}
        OR COALESCE(u.city, '') ILIKE $${i})`
    )
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const { rows } = await query(
    `SELECT u.*, s.orders, s.spent
       FROM users u ${ADMIN_STATS_JOIN}
       ${clause}
      ORDER BY u.created_at DESC`,
    params
  )

  return rows.map((row) => ({ ...toUser(row), orders: row.orders, spent: Number(row.spent) }))
}

export async function getUserDetail(id) {
  const numeric = toInt(id)
  if (numeric === null) return null
  const { rows } = await query(
    `SELECT u.*, s.orders, s.spent
       FROM users u ${ADMIN_STATS_JOIN}
      WHERE u.id = $1`,
    [numeric]
  )
  const row = rows[0]
  if (!row) return null
  return { ...toUser(row), orders: row.orders, spent: Number(row.spent) }
}

/** Active ou désactive un compte. Impossible de se désactiver soi-même. */
export async function setUserStatus(id, isActive, requesterId = null) {
  const numeric = toInt(id)
  if (numeric === null) throw ApiError.notFound('Utilisateur introuvable.')
  if (!isActive && String(numeric) === String(requesterId)) {
    throw ApiError.badRequest('Vous ne pouvez pas désactiver votre propre compte.')
  }

  const { rows } = await query(
    'UPDATE users SET is_active = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [numeric, !!isActive]
  )
  if (!rows[0]) throw ApiError.notFound('Utilisateur introuvable.')
  return toUser(rows[0])
}

/** Change le rôle en refusant de retirer le dernier administrateur actif. */
export async function setUserRole(id, role, requesterId = null) {
  const numeric = toInt(id)
  if (numeric === null) throw ApiError.notFound('Utilisateur introuvable.')

  if (role === 'customer') {
    if (String(numeric) === String(requesterId)) {
      throw ApiError.badRequest('Vous ne pouvez pas modifier votre propre rôle.')
    }
    const current = await getUserDetail(numeric)
    if (current?.role === 'admin') {
      const { rows } = await query(
        "SELECT COUNT(*)::int AS total FROM users WHERE role = 'admin' AND is_active = TRUE"
      )
      if ((rows[0]?.total || 0) <= 1) {
        throw ApiError.badRequest('Impossible de retirer le dernier administrateur.')
      }
    }
  }

  const { rows } = await query(
    'UPDATE users SET role = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [numeric, role]
  )
  if (!rows[0]) throw ApiError.notFound('Utilisateur introuvable.')
  return toUser(rows[0])
}

/** Supprime un compte client (les commandes conservent la copie client). */
export async function deleteUser(id, requesterId = null) {
  const numeric = toInt(id)
  if (numeric === null) throw ApiError.notFound('Utilisateur introuvable.')
  if (String(numeric) === String(requesterId)) {
    throw ApiError.badRequest('Vous ne pouvez pas supprimer votre propre compte.')
  }

  const target = await getUserDetail(numeric)
  if (!target) throw ApiError.notFound('Utilisateur introuvable.')
  if (target.role === 'admin') {
    throw ApiError.badRequest('La suppression d’un administrateur est interdite.')
  }

  const { rowCount } = await query('DELETE FROM users WHERE id = $1', [numeric])
  return rowCount > 0
}

