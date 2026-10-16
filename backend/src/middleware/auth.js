/**
 * Authentification JWT (stateless) + contrôle des rôles.
 * ------------------------------------------------
 * Le token est accepté soit dans l'en-tête `Authorization: Bearer <token>`
 * (utilisé par le frontend React), soit dans le cookie `km_token`
 * (pratique pour les tests navigateur / futurs clients tiers).
 *
 * IMPORTANT : le rôle est TOUJOURS revérifié en base. Un token forgé
 * côté client ne suffit jamais pour accéder aux routes admin.
 */
import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'
import { query } from '../database/pool.js'
import ApiError from '../utils/ApiError.js'
import { toUser } from '../utils/mappers.js'

export const AUTH_COOKIE = 'km_token'

/** Extrait le token brut de la requête. */
function extractToken(req) {
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) return header.slice(7).trim()
  if (req.cookies && req.cookies[AUTH_COOKIE]) return req.cookies[AUTH_COOKIE]
  return null
}

/** Vérifie le token et charge l'utilisateur réel depuis PostgreSQL. */
export async function authenticate(req, _res, next) {
  try {
    const token = extractToken(req)
    if (!token) throw ApiError.unauthorized('Authentification requise.')

    let payload
    try {
      payload = jwt.verify(token, env.jwt.secret)
    } catch {
      throw ApiError.unauthorized('Session expirée ou token invalide.')
    }

    const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.sub])
    const row = rows[0]

    if (!row) throw ApiError.unauthorized('Compte introuvable.')
    if (!row.is_active) throw ApiError.forbidden('Ce compte a été désactivé.')

    req.user = toUser(row)
    req.userRow = row
    next()
  } catch (err) {
    next(err)
  }
}

/** Authentification facultative : renseigne req.user si un token valide est présent. */
export async function optionalAuth(req, _res, next) {
  const token = extractToken(req)
  if (!token) return next()
  try {
    const payload = jwt.verify(token, env.jwt.secret)
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.sub])
    if (rows[0] && rows[0].is_active) {
      req.user = toUser(rows[0])
      req.userRow = rows[0]
    }
  } catch {
    // Token invalide : on continue en anonyme.
  }
  next()
}

/** Réservé aux administrateurs (après `authenticate`). */
export function requireAdmin(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized('Authentification requise.'))
  if (req.user.role !== 'admin') {
    return next(ApiError.forbidden('Cette action est réservée aux administrateurs.'))
  }
  next()
}

/** Signature d'un token pour un utilisateur donné. */
export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  })
}

export default authenticate
