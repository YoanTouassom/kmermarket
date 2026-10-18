import { api, toQueryString } from './api'

/** Service utilisateurs : profil client + gestion admin. */

export const userService = {
  async list({ search = '', role = '', status = '' } = {}) {
    const res = await api.get(`/admin/users${toQueryString({ search, role, status })}`)
    if (Array.isArray(res)) return res
    return res.items || []
  },

  async getById(id) {
    return api.get(`/admin/users/${encodeURIComponent(id)}`)
  },

  /** L'API attend { isActive: boolean } (et renvoie status: 'active' | 'inactive'). */
  async setStatus(id, isActive) {
    return api.patch(`/admin/users/${encodeURIComponent(id)}/status`, { isActive: !!isActive })
  },

  /** Inverse le statut d'un utilisateur déjà chargé (liste admin). */
  async toggleStatus(user) {
    return this.setStatus(user.id, user.status !== 'active')
  },

  async setRole(id, role) {
    return api.patch(`/admin/users/${encodeURIComponent(id)}/role`, { role })
  },

  /* ------------------------- Profil + adresses ------------------------- */

  async getProfile() {
    const res = await api.get('/me')
    return res.user
  },

  async updateProfile(payload) {
    const res = await api.patch('/me', payload)
    return res.user
  },

  async listAddresses() {
    const res = await api.get('/me/addresses')
    return res.items || []
  },

  async createAddress(payload) {
    return api.post('/me/addresses', payload)
  },

  async updateAddress(id, payload) {
    return api.patch(`/me/addresses/${encodeURIComponent(id)}`, payload)
  },

  async setDefaultAddress(id) {
    return api.post(`/me/addresses/${encodeURIComponent(id)}/default`, {})
  },

  async removeAddress(id) {
    await api.del(`/me/addresses/${encodeURIComponent(id)}`)
    return true
  },
}
