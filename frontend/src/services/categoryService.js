import { api } from './api'

/** Service catégories (API REST). */

function unwrapList(res) {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.items)) return res.items
  return []
}

export const categoryService = {
  async list() {
    const res = await api.get('/categories')
    return unwrapList(res)
  },

  async listWithCounts() {
    const res = await api.get('/categories')
    return unwrapList(res)
  },

  async getById(id) {
    const res = await api.get(`/categories/${encodeURIComponent(id)}`)
    if (res && typeof res === 'object' && res.category !== undefined) return res.category
    return res
  },

  async create(payload) {
    return api.post('/admin/categories', payload)
  },

  async update(id, payload) {
    return api.patch(`/admin/categories/${encodeURIComponent(id)}`, payload)
  },

  async remove(id) {
    await api.del(`/admin/categories/${encodeURIComponent(id)}`)
    return true
  },
}
