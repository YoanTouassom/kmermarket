import { api } from './api'

/** Avis clients sur les produits. */
export const reviewService = {
  /** { items, count, average, mine } */
  async forProduct(idOrSlug) {
    return api.get(`/products/${encodeURIComponent(idOrSlug)}/reviews`)
  },

  /** Crée ou modifie l'avis du client connecté. */
  async save(idOrSlug, { rating, comment }) {
    return api.post(`/products/${encodeURIComponent(idOrSlug)}/reviews`, { rating, comment })
  },

  async removeMine(idOrSlug) {
    return api.del(`/products/${encodeURIComponent(idOrSlug)}/reviews/mine`)
  },

  /** Derniers avis positifs (page d'accueil). */
  async recent(limit = 6) {
    const res = await api.get(`/reviews/recent?limit=${limit}`)
    return Array.isArray(res) ? res : []
  },

  /* ------------------------------ Admin ------------------------------ */
  async adminList() {
    const res = await api.get('/admin/reviews')
    return Array.isArray(res) ? res : []
  },

  async adminRemove(id) {
    return api.del(`/admin/reviews/${encodeURIComponent(id)}`)
  },
}
