/**
 * Validation des entrées avec Zod.
 * --------------------------------
 * Chaque route déclare un schéma `{ body, params, query }` ; le middleware
 * remplace les valeurs par les données validées (et converties).
 */
import ApiError from '../utils/ApiError.js'

/** Formate les issues Zod en une liste lisible pour le frontend. */
function formatIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.join('.') || '(racine)',
    message: issue.message,
  }))
}

/**
 * @param {{ body?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny }} schemas
 */
export function validate(schemas = {}) {
  return (req, _res, next) => {
    for (const key of ['body', 'params', 'query']) {
      const schema = schemas[key]
      if (!schema) continue

      const result = schema.safeParse(req[key] ?? {})
      if (!result.success) {
        return next(ApiError.badRequest('Données invalides.', formatIssues(result.error.issues)))
      }

      // req.query est un getter en lecture seule dans Express 5 : on copie.
      if (key === 'query') {
        Object.defineProperty(req, 'validatedQuery', { value: result.data, writable: true })
      } else {
        req[key] = result.data
      }
    }
    next()
  }
}

export default validate
