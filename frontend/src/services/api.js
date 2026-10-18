/**
 * Client HTTP de l'API KmerMarket.
 * --------------------------------
 * Toutes les requêtes passent par ici : base URL configurable
 * (VITE_API_URL), cookies HttpOnly inclus, et erreurs normalisées
 * en `{ status, message, details }` pour les pages.
 */
// En production, l'API est servie par le même domaine (vercel.json → /api).
const RAW_BASE =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')
const API_BASE = String(RAW_BASE).replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function readErrorMessage(payload, fallback) {
  if (!payload) return fallback
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }
  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error
  }
  return fallback
}

async function parseJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

/** Aplatis le détail backend { error: { message, details } } en message lisible. */
function buildErrorMessage(payload, fallback, status) {
  const node = payload?.error && typeof payload.error === 'object' ? payload.error : payload
  if (Array.isArray(node?.details) && node.details.length) {
    const parts = node.details
      .map((d) => (typeof d === 'string' ? d : d?.message))
      .filter(Boolean)
    if (parts.length) {
      const head = typeof node.message === 'string' && node.message.trim() ? `${node.message} ` : ''
      return `${head}(${parts.join(' · ')})`
    }
  }
  return readErrorMessage(node, fallback) + (status ? ` (erreur ${status})` : '')
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new ApiError(
      0,
      'Impossible de joindre le serveur. Vérifiez que le backend est démarré (npm run dev dans backend).'
    )
  }

  const payload = await parseJsonSafe(res)
  if (res.ok) return payload

  throw new ApiError(
    res.status,
    buildErrorMessage(payload, `Erreur ${res.status}`, res.status),
    payload?.error?.details ?? payload?.details ?? null
  )
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
}

export function toQueryString(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export { API_BASE }
