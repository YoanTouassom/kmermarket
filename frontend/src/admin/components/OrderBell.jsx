import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellRing, Volume2, VolumeX } from 'lucide-react'
import { useOrderNotifStore } from '../../store/orderNotifStore'
import { formatPrice } from '../../utils/format'

function timeAgo(date) {
  const s = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000))
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`
  return new Date(date).toLocaleDateString('fr-FR')
}

/** Cloche « nouvelles commandes » de la barre admin. */
export default function OrderBell() {
  const unread = useOrderNotifStore((s) => s.unread)
  const markRead = useOrderNotifStore((s) => s.markRead)
  const markAllRead = useOrderNotifStore((s) => s.markAllRead)
  const sound = useOrderNotifStore((s) => s.sound)
  const toggleSound = useOrderNotifStore((s) => s.toggleSound)

  const [open, setOpen] = useState(false)
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  )
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const askPermission = async () => {
    try {
      setPermission(await Notification.requestPermission())
    } catch {
      /* ignore */
    }
  }

  const count = unread.length
  const Icon = count ? BellRing : Bell

  return (
    <div className="mf-bell" ref={ref}>
      <button
        className={`mf-icon-btn ${count ? 'ringing' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={count ? `${count} nouvelle(s) commande(s)` : 'Notifications'}
      >
        <Icon size={20} />
        {count > 0 && <span className="mf-badge-count">{count}</span>}
      </button>

      {open && (
        <div className="mf-dropdown mf-bell-panel">
          <div className="mf-bell-head">
            <strong>Nouvelles commandes</strong>
            <button onClick={toggleSound} aria-label={sound ? 'Couper le son' : 'Activer le son'} title={sound ? 'Son activé' : 'Son coupé'}>
              {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
          </div>

          {permission === 'default' && (
            <button className="mf-bell-enable" onClick={askPermission}>
              <BellRing size={16} /> Activer les notifications du navigateur
            </button>
          )}
          {permission === 'denied' && (
            <div className="mf-bell-note">
              Notifications du navigateur bloquées : autorisez-les dans les réglages du site.
            </div>
          )}

          {count === 0 ? (
            <div className="mf-bell-empty">Aucune nouvelle commande.</div>
          ) : (
            <>
              <div className="mf-bell-list">
                {unread.map((o) => (
                  <Link
                    key={o.id}
                    to={`/admin/orders/${o.id}`}
                    onClick={() => {
                      markRead(o.id)
                      setOpen(false)
                    }}
                  >
                    <span className="ref">{o.reference}</span>
                    <span className="who">
                      {o.customerName} · {o.city}
                    </span>
                    <span className="meta">
                      {formatPrice(o.total)} · {timeAgo(o.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
              <button className="mf-bell-clear" onClick={markAllRead}>
                Tout marquer comme lu
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
