/**
 * Erreur applicative avec code HTTP.
 * Permet au middleware d'erreur de renvoyer une réponse cohérente.
 */
export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  static badRequest(message = 'Requête invalide', details) {
    return new ApiError(400, message, details)
  }

  static unauthorized(message = 'Authentification requise') {
    return new ApiError(401, message)
  }

  static forbidden(message = 'Accès interdit') {
    return new ApiError(403, message)
  }

  static notFound(message = 'Ressource introuvable') {
    return new ApiError(404, message)
  }

  static conflict(message = 'Conflit avec une ressource existante', details) {
    return new ApiError(409, message, details)
  }

  static internal(message = 'Erreur interne du serveur') {
    return new ApiError(500, message)
  }
}

export default ApiError
