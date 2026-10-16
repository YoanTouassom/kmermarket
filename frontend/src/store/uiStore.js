import { create } from "zustand";

/**
 * Store UI : notifications toast (succès, erreur, info) + favoris.
 */
let nextId = 1;

export const useUIStore = create((set, get) => ({
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

  isFavorite: (productId) => get().favorites.includes(productId),
}));
