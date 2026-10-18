import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Notifications admin « nouvelle commande ».
 * - lastSeenId : dernier id de commande connu (persisté : pas de rafale au rechargement)
 * - unread     : nouvelles commandes pas encore consultées (persistées aussi)
 * - version    : incrémenté à chaque arrivée, pour que les pages se rafraîchissent
 */
export const useOrderNotifStore = create(
  persist(
    (set, get) => ({
      lastSeenId: null,
      unread: [],
      version: 0,
      sound: true,

      setLastSeen: (id) => set({ lastSeenId: id }),

      push: (orders) =>
        set({
          unread: [...orders, ...get().unread].slice(0, 30),
          version: get().version + 1,
        }),

      markRead: (id) => set({ unread: get().unread.filter((o) => o.id !== id) }),
      markAllRead: () => set({ unread: [] }),
      toggleSound: () => set({ sound: !get().sound }),
    }),
    {
      name: "kmermarket.admin.orders",
      partialize: (s) => ({ lastSeenId: s.lastSeenId, unread: s.unread, sound: s.sound }),
    }
  )
);
