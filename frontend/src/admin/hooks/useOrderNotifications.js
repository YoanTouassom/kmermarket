import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { orderService } from "../../services/orderService";
import { useOrderNotifStore } from "../../store/orderNotifStore";
import { useUIStore } from "../../store/uiStore";
import { formatPrice } from "../../utils/format";

// L'hébergement serverless (Vercel) ne garde pas de connexion ouverte :
// on interroge un flux léger, plus souvent quand l'onglet est visible.
const VISIBLE_MS = 15_000;
const HIDDEN_MS = 45_000;
const BASE_TITLE = document.title;

let audioCtx = null;
/** Petit « ding » en deux notes, sans fichier audio. */
function playChime() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    [880, 1320].forEach((freq, i) => {
      const t = audioCtx.currentTime + i * 0.18;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {
    /* audio indisponible (navigateur, autoplay) : on ignore */
  }
}

// Les navigateurs bloquent le son tant que l'utilisateur n'a pas interagi :
// on « déverrouille » l'audio au premier clic dans l'admin.
function unlockAudioOnce() {
  const unlock = () => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.resume();
    } catch {
      /* ignore */
    }
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  return () => window.removeEventListener("pointerdown", unlock);
}

function systemNotify(order, onClick) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(`Nouvelle commande ${order.reference}`, {
      body: `${order.customerName} · ${formatPrice(order.total)} · ${order.city}`,
      icon: "/favicon.svg",
      tag: `order-${order.id}`,
    });
    n.onclick = () => {
      window.focus();
      onClick();
      n.close();
    };
  } catch {
    /* ex. Chrome Android exige un service worker : la notif interne suffit */
  }
}

/** À monter une fois dans le layout admin. */
export function useOrderNotifications() {
  const navigate = useNavigate();
  const notify = useUIStore((s) => s.notify);
  const unreadCount = useOrderNotifStore((s) => s.unread.length);
  const timer = useRef(null);

  useEffect(() => unlockAudioOnce(), []);

  // Titre de l'onglet : « (2) Nouvelle commande · … »
  useEffect(() => {
    document.title = unreadCount ? `(${unreadCount}) Nouvelle commande · ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [unreadCount]);

  useEffect(() => {
    let stopped = false;
    let inFlight = false;

    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      const store = useOrderNotifStore.getState();
      try {
        // Première visite : on mémorise le dernier id sans notifier l'historique.
        const after = store.lastSeenId ?? 0;
        const res = await orderService.feed(after);
        if (stopped) return;
        if (store.lastSeenId === null) {
          store.setLastSeen(res.latestId);
        } else if (res.orders.length) {
          const fresh = res.orders.filter((o) => Number(o.id) > Number(store.lastSeenId));
          store.setLastSeen(res.latestId);
          if (fresh.length) {
            store.push(fresh);
            if (store.sound) playChime();
            const first = fresh[0];
            notify(
              fresh.length === 1
                ? `🛒 Nouvelle commande ${first.reference} — ${first.customerName}, ${formatPrice(first.total)}`
                : `🛒 ${fresh.length} nouvelles commandes`,
              "success",
              9000
            );
            fresh.forEach((o) => systemNotify(o, () => navigate(`/admin/orders/${o.id}`)));
          }
        } else if (Number(res.latestId) < Number(store.lastSeenId)) {
          // Base réinitialisée : on se recale.
          store.setLastSeen(res.latestId);
        }
      } catch {
        /* réseau / session expirée : on réessaiera au prochain tour */
      }
      inFlight = false;
      if (!stopped) schedule();
    };

    const schedule = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(poll, document.hidden ? HIDDEN_MS : VISIBLE_MS);
    };

    // Retour sur l'onglet : vérification immédiate.
    const onVisible = () => {
      if (!document.hidden) {
        clearTimeout(timer.current);
        poll();
      }
    };

    poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [navigate, notify]);
}
