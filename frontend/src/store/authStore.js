import { create } from 'zustand'
import { authService } from '../services/authService'
import { useCartStore } from './cartStore'

/**
 * Store d'authentification.
 * Ne conserve en session que l'utilisateur « public » (sans mot de passe).
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  initialized: false,
  error: null,

  init: async () => {
    set({ loading: true })
    const user = await authService.current()
    set({ user, loading: false, initialized: true })
    return user
  },

  login: async ({ email, password }) => {
    set({ loading: true, error: null })
    try {
      const user = await authService.login({ email, password })
      set({ user, loading: false })
      try {
        await useCartStore.getState().syncFromServer()
      } catch {
        /* panier local conservé en cas d'échec réseau */
      }
      return user
    } catch (e) {
      set({ loading: false, error: e.message })
      throw e
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null })
    try {
      const user = await authService.register(payload)
      set({ user, loading: false })
      try {
        await useCartStore.getState().syncFromServer()
      } catch {
        /* panier local conservé en cas d'échec réseau */
      }
      return user
    } catch (e) {
      set({ loading: false, error: e.message })
      throw e
    }
  },

  logout: async () => {
    await authService.logout()
    set({ user: null })
    useCartStore.setState({ items: [], synced: false })
  },

  updateProfile: async (payload) => {
    const current = get().user
    if (!current) return null
    const user = await authService.updateProfile(current.id, payload)
    set({ user })
    return user
  },

  clearError: () => set({ error: null }),
}))