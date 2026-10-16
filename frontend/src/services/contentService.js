import { api } from './api'

/** Service contenu & paramètres boutique (admin + pages publiques). */

export const contentService = {
  async getContent() {
    return api.get('/content')
  },

  async updateContent(payload) {
    return api.put('/admin/content', payload)
  },

  async getSettings() {
    return api.get('/settings')
  },

  async updateSettings(payload) {
    return api.put('/admin/settings', payload)
  },
}
