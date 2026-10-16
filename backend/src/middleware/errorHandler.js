/**
 * Gestion centralisée des erreurs.
 * Toutes les réponses d'erreur suivent le même contrat :
 *   { "error": { "message": "...", "details": ... } }
 */
import { env, isProd } from '../config/env.js'
import ApiError from '../utils/ApiError.js'

/** 404 — aucune route ne correspond. */
export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route introuvable : ${req.method} ${req.originalUrl}`))
}

/** Convertit les erreurs PostgreSQL en erreurs HTTP lisibles. */
function normalize(err) {
  if (err instanceof ApiError) return err

  // Contrainte d'unicité PostgreSQL
  if (err.code === '23505') {
    const target = (err.detail || '').match(/\(([^)]+)\)/)?.[1]
    const message = target
      ? `Cette valeur est déjà utilisée (${target}).`
      : 'Cette ressource existe déjà.'
    return new ApiError(409, message)
  }

  // Violation de clé étrangère
  if (err.code === '23503') {
    return ApiError.badRequest('Référence invalide : la ressource liée est introuvable.')
  }

  // Violation de contrainte de vérification (stock négatif, quantité…)
  if (err.code === '23514') {
    return ApiError.badRequest('Valeur refusée par une contrainte de la base de données.')
  }

  // JSON malformé envoyé par le client
  if (err.type === 'entity.parse.failed') {
    return ApiError.badRequest('Corps de requête JSON invalide.')
  }

  return null
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const normalized = normalize(err)

  if (normalized) {
    return res.status(normalized.status).json({
      error: {
        message: normalized.message,
        ...(normalized.details ? { details: normalized.details } : {}),
      },
    })
  }

  // Erreur inattendue : on journalise côté serveur, sans fuiter d'information.
  console.error('[api] erreur inattendue :', err)

  res.status(500).json({
    error: {
      message: 'Une erreur interne est survenue. Merci de réessayer.',
      ...(isProd ? {} : { details: err.message }),
    },
  })
}

export default errorHandler
