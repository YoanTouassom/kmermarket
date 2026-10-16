import { api, toQueryString } from './api'

/**
 * Service produits (API REST).
 * Les boucles frontend gardent la même signature : list, listAll,
 * getById/getBySlug, featured/onSale/popular/newArrivals/related/suggest.
 */

function unwrapList(res) {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.items)) return res.items
  return []
}

function unwrapOne(res, key) {
  if (res && typeof res === 'object' && res[key] !== undefined) return res[key]
  return res
}

export const productService = {
  async list({ search = '', categoryId = '', sort = 'popular', inStockOnly = false, onSale = false, featured = false, maxPrice = 0 } = {}) {
    const res = await api.get(
      `/products${toQueryString({
        search, categoryId, sort, inStockOnly, onSale, featured,
        maxPrice: maxPrice || '',
      })}`
    )
    return unwrapList(res)
  },

  async listAll() {
    const res = await api.get('/products')
    return unwrapList(res)
  },

  async getById(id) {
    const res = await api.get(`/products/${encodeURIComponent(id)}`)
    return unwrapOne(res, 'product')
  },

  async getBySlug(slug) {
    const res = await api.get(`/products/${encodeURIComponent(slug)}`)
    return unwrapOne(res, 'product')
  },

  async featured(limit = 8) {
    const res = await api.get(`/products/featured${toQueryString({ limit })}`)
    return unwrapList(res)
  },

  async onSale(limit = 8) {
    const res = await api.get(`/products/on-sale${toQueryString({ limit })}`)
    return unwrapList(res)
  },

  async popular(limit = 8) {
    const res = await api.get(`/products/popular${toQueryString({ limit })}`)
    return unwrapList(res)
  },

  async newArrivals(limit = 8) {
    const res = await api.get(`/products/new${toQueryString({ limit })}`)
    return unwrapList(res)
  },

  async related(product, limit = 4) {
    if (!product?.id) return []
    const res = await api.get(
      `/products/${encodeURIComponent(product.id)}/related${toQueryString({ limit })}`
    )
    return unwrapList(res)
  },

  async suggest(query, limit = 5) {
    if (!query || String(query).trim().length < 2) return []
    const res = await api.get(`/products/suggest${toQueryString({ q: query, limit })}`)
    return unwrapList(res)
  },

  /* ---------- Admin (CRUD) ---------- */

  async create(payload) {
    return api.post('/admin/products', payload)
  },

  async update(id, payload) {
    return api.patch(`/admin/products/${encodeURIComponent(id)}`, payload)
  },

  async remove(id) {
    await api.del(`/admin/products/${encodeURIComponent(id)}`)
    return true
  },

  async setStock(id, stock) {
    return api.patch(`/admin/products/${encodeURIComponent(id)}/stock`, { stock })
  },
}
