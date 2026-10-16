import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

/** Conteneur de notifications global (coin inférieur droit). */
export default function Toaster() {
  const toasts = useUIStore((s) => s.toasts)
  const dismiss = useUIStore((s) => s.dismiss)
  if (!toasts.length) return null
  return (
    <div className="mf-toasts" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info
        return (
          <div key={t.id} className={`mf-toast ${t.type}`}>
            <Icon size={20} className="ic" />
            <span className="msg">{t.message}</span>
            <button className="x" onClick={() => dismiss(t.id)} aria-label="Fermer">
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}