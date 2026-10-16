/** Enveloppe un handler async pour propager les erreurs au middleware d'erreur. */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

export default asyncHandler
