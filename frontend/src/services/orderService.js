import { api, toQueryString } from './api'

/**
 * Service commandes (API REST).
 * Les prix et frais de livraison sont recalculés côté serveur.
 */

function unwrapList(res) {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.items)) return res.items
  return []
}

export const orderService = {
  computeDelivery(subtotal, city) {
    // Estimation instantanée côté client (le serveur recalcule à la commande).
    const zones = {
      douala: { fee: 1500, eta: '24 h', freeAbove: 25000 },
      yaounde: { fee: 2000, eta: '24-48 h', freeAbove: 25000 },
    }
    const key = String(city || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z]/g, '')
    const zone = zones[key]
    if (!zone) return { fee: 2000, eta: '24 à 48 h', free: false }
    const free = zone.freeAbove ? subtotal >= zone.freeAbove : false
    return { fee: free ? 0 : zone.fee, eta: zone.eta, free, freeAbove: zone.freeAbove }
  },

  async quote(city, subtotal) {
    return api.post('/delivery/quote', { city, subtotal })
  },

  async list(filters = {}) {
    const res = await api.get(`/admin/orders${toQueryString(filters)}`)
    return unwrapList(res)
  },

  async listByUser() {
    const res = await api.get('/orders/mine')
    return unwrapList(res)
  },

  async getById(id) {
    return api.get(`/orders/mine/${encodeURIComponent(id)}`)
  },

  async getByReference(ref) {
    const orders = await this.listByUser()
    return orders.find((o) => o.reference === ref) || null
  },

  /** Crée une commande depuis le panier serveur (adresse + paiement). */
  async create(orderPayload) {
    return api.post('/orders', {
      city: orderPayload?.city,
      neighborhood: orderPayload?.neighborhood ?? orderPayload?.quartier,
      address: orderPayload?.address,
      additionalInfo: orderPayload?.additionalInfo ?? '',
      phone: orderPayload?.phone ?? '',
      paymentMethod: orderPayload?.paymentMethod ?? 'cash',
      note: orderPayload?.note ?? '',
      saveAddress: orderPayload?.saveAddress ?? true,
    })
  },

  async updateStatus(id, status) {
    return api.patch(`/admin/orders/${encodeURIComponent(id)}/status`, { status })
  },

  async cancel(id) {
    return api.patch(`/admin/orders/${encodeURIComponent(id)}/status`, {
      status: 'cancelled',
    })
  },

  async stats() {
    return api.get('/admin/orders/stats')
  },

  /** Nouvelles commandes d'id > after (notifications admin). */
  async feed(after = 0) {
    return api.get(`/admin/orders/feed?after=${encodeURIComponent(after)}`)
  },
}

export function formatOrderRef(n) {
  return `KM-${String(n).padStart(4, '0')}`
}
