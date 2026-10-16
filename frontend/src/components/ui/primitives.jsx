import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Loader2,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  PackageOpen,
} from 'lucide-react'

/* ============ Button ============ */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className = '',
  type = 'button',
  ...rest
}) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={cls} type={type} disabled={loading || rest.disabled} {...rest}>
      {loading ? <Loader2 size={17} className="mf-spin" /> : Icon ? <Icon size={17} /> : null}
      {children}
    </button>
  )
}

/* ============ Field + inputs ============ */
export function Field({ label, required, error, hint, children, htmlFor }) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={htmlFor}>
          {label} {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="field-error">{error}</span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </div>
  )
}

export function Input({ error, className = '', ...rest }) {
  return <input className={`input ${error ? 'error' : ''} ${className}`} {...rest} />
}

export function Textarea({ error, className = '', ...rest }) {
  return <textarea className={`textarea ${error ? 'error' : ''} ${className}`} {...rest} />
}

export function Select({ error, className = '', children, ...rest }) {
  return (
    <select className={`select ${error ? 'error' : ''} ${className}`} {...rest}>
      {children}
    </select>
  )
}

/* ============ Badge ============ */
export function Badge({ children, tone = 'gray', className = '' }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>
}

/* ============ Spinner & Skeleton ============ */
export function Spinner({ size = 22, label }) {
  return (
    <span className="mf-spinner" role="status" aria-live="polite">
      <Loader2 size={size} className="mf-spin" />
      {label && <span className="mf-spinner-label">{label}</span>}
    </span>
  )
}

export function Skeleton({ height = 16, width = '100%', radius = 8, style }) {
  return (
    <span
      className="mf-skeleton"
      style={{ height, width, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

export function ProductSkeleton() {
  return (
    <div className="card mf-product-skel">
      <Skeleton height={170} radius={0} />
      <div style={{ padding: 14 }}>
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} width="40%" style={{ marginTop: 10 }} />
        <Skeleton height={20} width="55%" style={{ marginTop: 16 }} />
      </div>
    </div>
  )
}

/* ============ StarRating ============ */
export function StarRating({ value = 0, count, size = 15 }) {
  return (
    <span className="mf-rating" aria-label={`Note ${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'mf-star on' : 'mf-star'}
          fill={i <= Math.round(value) ? 'currentColor' : 'none'}
        />
      ))}
      {typeof count === 'number' && <span className="mf-rating-count">({count})</span>}
    </span>
  )
}

/* ============ EmptyState ============ */
export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  text,
  action,
}) {
  return (
    <div className="mf-empty">
      <span className="mf-empty-icon">
        <Icon size={30} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && <div className="mt-16">{action}</div>}
    </div>
  )
}

/* ============ Modal ============ */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="mf-modal-overlay" onMouseDown={(e) => e.target === ref.current && onClose?.()}>
      <div ref={ref} className={`mf-modal mf-modal-${size}`} role="dialog" aria-modal="true">
        <div className="mf-modal-head">
          <h3>{title}</h3>
          <button className="mf-modal-x" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        <div className="mf-modal-body">{children}</div>
        {footer && <div className="mf-modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

/* ============ ConfirmDialog ============ */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmer l’action',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="mf-confirm">
        <span className={`mf-confirm-icon mf-confirm-${tone}`}>
          <AlertTriangle size={22} />
        </span>
        <p>{message}</p>
      </div>
    </Modal>
  )
}

/* ============ Pagination ============ */
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = buildPages(page, totalPages)
  return (
    <nav className="mf-pagination" aria-label="Pagination">
      <button
        className="mf-page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Page précédente"
      >
        <ChevronLeft size={17} />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="mf-page-ellipsis">
            …
          </span>
        ) : (
          <button
            key={p}
            className={`mf-page-btn ${p === page ? 'active' : ''}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        className="mf-page-btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Page suivante"
      >
        <ChevronRight size={17} />
      </button>
    </nav>
  )
}

function buildPages(current, total) {
  const out = []
  const add = (v) => out.push(v)
  if (total <= 7) {
    for (let i = 1; i <= total; i++) add(i)
    return out
  }
  add(1)
  if (current > 3) add('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) add(i)
  if (current < total - 2) add('…')
  add(total)
  return out
}