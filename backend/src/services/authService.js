/**
 * Authentification et comptes (PostgreSQL + bcrypt + JWT).
 * --------------------------------------------------------
 * Les mots de passe ne sont JAMAIS stockés en clair : seul le hash bcrypt
 * est écrit dans `users.password_hash`.
 */
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'

import { query, withTransaction } from '../database/pool.js'
import { toUser } from '../utils/mappers.js'
import { signToken } from '../middleware/auth.js'
import ApiError from '../utils/ApiError.js'

const BCRYPT_ROUNDS = 10
const RESET_TTL_MINUTES = 60

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

/** Normalise un numéro camerounais pour la comparaison (chiffres uniquement). */
export function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d]/g, '')
}

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/** Crée le panier de l'utilisateur si nécessaire (idempotent). */
async function ensureCart(userId) {
  await query('INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId])
}

/** Charge un utilisateur par identifiant. */
export async function findById(id) {
  const numeric = Number.parseInt(id, 10)
  if (!Number.isFinite(numeric)) return null
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [numeric])
  return rows[0] || null
}

export async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE lower(email) = $1', [
    normalizeEmail(email),
  ])
  return rows[0] || null
}

/** Inscription d'un nouveau client. */
export async function register(payload = {}) {
  const firstName = String(payload.firstName || '').trim()
  const lastName = String(payload.lastName || '').trim()
  const email = normalizeEmail(payload.email)
  const phone = String(payload.phone || '').trim()
  const password = String(payload.password || '')

  if (await findByEmail(email)) {
    throw ApiError.conflict('Un compte existe déjà avec cet email.')
  }

  const phoneDigits = normalizePhone(phone)
  if (phoneDigits) {
    const { rows } = await query(
      `SELECT id FROM users WHERE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $1`,
      [phoneDigits]
    )
    if (rows[0]) throw ApiError.conflict('Ce numéro de téléphone est déjà utilisé.')
  }

  const passwordHash = await hashPassword(password)

  const user = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, 'customer')
       RETURNING *`,
      [firstName, lastName, email, phone || null, passwordHash]
    )
    await client.query('INSERT INTO carts (user_id) VALUES ($1)', [rows[0].id])
    return rows[0]
  })

  const publicUser = toUser(user)
  return { user: publicUser, token: signToken(publicUser) }
}

/** Connexion par email + mot de passe. */
export async function login(payload = {}) {
  const email = normalizeEmail(payload.email)
  const password = String(payload.password || '')

  const row = await findByEmail(email)
  // Message volontairement identique dans les deux cas (pas d'énumération de comptes).
  if (!row) throw ApiError.unauthorized('Email ou mot de passe incorrect.')

  const ok = await verifyPassword(password, row.password_hash)
  if (!ok) throw ApiError.unauthorized('Email ou mot de passe incorrect.')

  if (!row.is_active) {
    throw ApiError.forbidden('Ce compte a été désactivé. Contactez le support.')
  }

  await ensureCart(row.id)

  const publicUser = toUser(row)
  return { user: publicUser, token: signToken(publicUser) }
}

/** Changement de mot de passe depuis l'espace client. */
export async function changePassword(userId, payload = {}) {
  const row = await findById(userId)
  if (!row) throw ApiError.notFound('Utilisateur introuvable.')

  const ok = await verifyPassword(String(payload.currentPassword || ''), row.password_hash)
  if (!ok) throw ApiError.badRequest('Mot de passe actuel incorrect.')

  const sameAsOld = await verifyPassword(String(payload.newPassword || ''), row.password_hash)
  if (sameAsOld) {
    throw ApiError.badRequest('Le nouveau mot de passe doit être différent de l’ancien.')
  }

  const hash = await hashPassword(String(payload.newPassword))
  await query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [
    row.id,
    hash,
  ])
  return true
}

/**
 * Demande de réinitialisation.
 * On renvoie toujours la même réponse afin de ne pas révéler l'existence
 * d'un compte. Le token n'est retourné qu'hors production (aucun service
 * d'envoi d'email n'est configuré dans ce projet).
 */
export async function requestPasswordReset(email) {
  const row = await findByEmail(email)
  const message =
    'Si un compte correspond à cet email, un lien de réinitialisation vous a été envoyé.'

  if (!row) return { message, devToken: null }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000)

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [row.id, hashToken(token), expiresAt]
  )

  return {
    message,
    devToken: process.env.NODE_ENV === 'production' ? null : token,
    expiresInMinutes: RESET_TTL_MINUTES,
  }
}

/** Consomme un token de réinitialisation. */
export async function resetPassword(payload = {}) {
  const token = String(payload.token || '').trim()
  if (!token) throw ApiError.badRequest('Token de réinitialisation manquant.')

  const { rows } = await query(
    `SELECT * FROM password_reset_tokens
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [hashToken(token)]
  )
  const record = rows[0]
  if (!record) throw ApiError.badRequest('Lien de réinitialisation invalide ou expiré.')

  const hash = await hashPassword(String(payload.password || ''))
  await withTransaction(async (client) => {
    await client.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [
      record.user_id,
      hash,
    ])
    await client.query('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [
      record.id,
    ])
  })

  return true
}

/** Représentation publique d'un utilisateur (sans données sensibles). */
export function present(row) {
  return toUser(row)
}