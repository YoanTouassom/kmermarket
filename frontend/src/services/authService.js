import { api } from './api'

/**
 * Service d'authentification (API REST).
 * Les cookies HttpOnly portent le JWT : le frontend ne stocke aucun secret.
 */

export const authService = {
  async current() {
    try {
      const res = await api.get('/auth/me')
      return res.user || null
    } catch {
      return null
    }
  },

  async login({ email, password }) {
    const res = await api.post('/auth/login', { email, password })
    return res.user
  },

  async register({ firstName, lastName, email, phone, password }) {
    const res = await api.post('/auth/register', {
      firstName,
      lastName,
      email,
      phone,
      password,
    })
    return res.user
  },

  async logout() {
    try {
      await api.post('/auth/logout', {})
    } catch {
      /* la session est de toute façon terminée côté client */
    }
    return true
  },

  async requestPasswordReset(email) {
    return api.post('/auth/forgot-password', { email })
  },

  async updateProfile(_userId, payload) {
    const res = await api.patch('/me', payload)
    return res.user
  },

  async changePassword(payload) {
    return api.post('/me/change-password', payload)
  },
}
