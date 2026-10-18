import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '../utils/constants'
import { cartService } from '../services/cartService'
import { isOutOfStock } from '../utils/stock'
import { useAuthStore } from './authStore'

/**
 * Panier hybride : localStorage pour les invités, PostgreSQL pour les connectés.
 * À la connexion, le panier invité est fusionné sur le serveur puis vidé en local.
 */
function isLoggedIn() {
  try {
    return !!useAuthStore.getState().user
  } catch {
    return false
  }
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      synced: false,
      syncing: false,

      /** Charge le panier serveur (appelé au login / au boot si connecté). */
      syncFromServer: async () => {
        if (!isLoggedIn()) return
        set({ syncing: true })
        try {
          const guest = get().items.filter((i) => i.productId)
          if (guest.length) {
            const merged = await cartService.merge(
              guest.map((i) => ({ productId: i.productId, quantity: i.quantity }))
            )
            set({ items: merged.items || [], synced: true })
          } else {
            const cart = await cartService.get()
            set({ items: cart.items || [], synced: true })
          }
        } catch {
          /* hors-ligne ou session expirée : on garde le panier local */
        } finally {
          set({ syncing: false })
        }
      },

      /** Ajoute un produit (ou incrémente la quantité existante). */
      addItem: async (product, quantity = 1) => {
        const q = Math.max(1, Math.floor(quantity) || 1)
        if (isLoggedIn()) {
          try {
            const cart = await cartService.add(product, q)
            set({ items: cart.items || [] })
            return
          } catch {
            /* repli local ci-dessous */
          }
        }
        const items = [...get().items]
        const idx = items.findIndex((i) => i.productId === product.id)
        if (idx > -1) {
          items[idx].quantity += quantity
        } else {
          items.push({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            unit: product.unit,
            price: product.price,
            oldPrice: product.oldPrice || null,
            image: product.image,
            inStock: !isOutOfStock(product),
            quantity,
          })
        }
        set({ items })
      },

      removeItem: async (productId) => {
        if (isLoggedIn()) {
          try {
            const cart = await cartService.remove(productId)
            set({ items: cart.items || [] })
            return
          } catch {
            /* repli local */
          }
        }
        set({ items: get().items.filter((i) => i.productId !== productId) })
      },

      setQuantity: async (productId, quantity) => {
        const q = Math.max(1, Math.floor(quantity) || 1)
        if (isLoggedIn()) {
          try {
            const cart = await cartService.setQuantity(productId, q)
            set({ items: cart.items || [] })
            return
          } catch {
            /* repli local */
          }
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity: q } : i
          ),
        })
      },

      increment: async (productId) => {
        const line = get().items.find((i) => i.productId === productId)
        if (!line) return
        return get().setQuantity(productId, line.quantity + 1)
      },

      decrement: async (productId) => {
        const line = get().items.find((i) => i.productId === productId)
        if (!line) return
        if (line.quantity <= 1) return get().removeItem(productId)
        return get().setQuantity(productId, line.quantity - 1)
      },

      clear: async () => {
        if (isLoggedIn()) {
          try {
            await cartService.clear()
          } catch {
            /* repli local */
          }
        }
        set({ items: [] })
      },

      /* ---------- Sélecteurs dérivés ---------- */
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((s, i) => s + i.price * i.quantity, 0),

      /** Total avec frais de livraison. */
      total: (deliveryFee = 0) => get().subtotal() + deliveryFee,
    }),
    {
      name: STORAGE_KEYS.CART,
      version: 1,
    }
  )
)

/** Hook utilitaire : nombre d'articles (recalculé à chaque changement). */
export function useCartCount() {
  return useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
}

/** Hook utilitaire : sous-total. */
export function useCartSubtotal() {
  return useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  )
}