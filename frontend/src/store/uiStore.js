import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../utils/constants";

/**
 * Store UI : notifications toast (succès, erreur, info) + favoris.
 * Seuls les favoris sont persistés (localStorage), pas les toasts.
 */
let nextId = 1;

export const useUIStore = create(
  persist(
    (set, get) => ({
      toasts: [],
      favorites: [],

      notify: (message, type = "success", duration = 3200) => {
        const id = nextId++;
        set({ toasts: [...get().toasts, { id, message, type }] });
        setTimeout(() => get().dismiss(id), duration);
        return id;
      },

      success: (msg) => get().notify(msg, "success"),
      error: (msg) => get().notify(msg, "error", 4200),
      info: (msg) => get().notify(msg, "info"),

      dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

      toggleFavorite: (productId) => {
        const favs = get().favorites;
        set({
          favorites: favs.includes(productId)
            ? favs.filter((f) => f !== productId)
            : [...favs, productId],
        });
      },

      /** Retire des favoris les produits qui n'existent plus. */
      pruneFavorites: (validIds) =>
        set({ favorites: get().favorites.filter((f) => validIds.includes(f)) }),

      isFavorite: (productId) => get().favorites.includes(productId),
    }),
    {
      name: STORAGE_KEYS.UI,
      partialize: (s) => ({ favorites: s.favorites }),
    }
  )
);
