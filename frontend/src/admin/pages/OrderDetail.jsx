import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, Package, Truck, XCircle } from 'lucide-react'
import { orderService } from '../../services/orderService'
import { useUIStore } from '../../store/uiStore'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import { Button, Select, Field, EmptyState, Spinner, ConfirmDialog } from '../../components/ui/primitives'
import { formatPrice, formatDate } from '../../utils/format'
import { ORDER_STATUS_LIST, ORDER_STATUS } from '../../utils/constants'

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const success = useUIStore((s) => s.success)
  const error = useUIStore((s) => s.error)

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [askCancel, setAskCancel] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const o = await orderService.getById(id)
      if (active) {
        setOrder(o)
        setStatus(o?.status || '')
        setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id])

  const updateStatus = async () => {
    if (status === order.status) return
    setSaving(true)
    try {
      const updated = await orderService.updateStatus(order.id, status)
      setOrder({ ...updated })
      success('Statut mis à jour')
    } catch (e) {
      error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const cancel = async () => {
    try {
      const updated = await orderService.cancel(order.id)
      setOrder({ ...updated })
      setStatus(updated.status)
      success('Commande annulée')
    } catch (e) {
      error(e.message)
    } finally {
      setAskCancel(false)
    }
  }

  if (loading) return <Spinner label="Chargement…" />

  if (!order) {
    return (
      <EmptyState
        icon={Package}
        title="Commande introuvable"
        text="Cette commande n’existe pas."
        action={<Button variant="primary" onClick={() => navigate('/admin/orders')}>Retour aux commandes</Button>}
      />
    )
  }

  return (
    <>
      <Link to="/admin/orders" className="mf-back-link"><ArrowLeft size={16} /> Retour aux commandes</Link>

      <div className="mf-grid-2" style={{ marginTop: 16 }}>
        <div className="mf-panel">
          <div className="mf-panel-head">
            <h3>Commande {order.reference}</h3>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="mf-panel-body">
            <div className="mf-info-block">
              <div className="tt"><MapPin size={15} /> Livraison</div>
              <div className="ln">{order.customer.firstName} {order.customer.lastName}</div>
              <div className="ln">{order.customer.address}</div>
              <div className="ln">{order.customer.quartier}, {order.customer.city}</div>
            </div>
            <div className="mf-info-block" style={{ marginTop: 14 }}>
              <div className="tt"><Phone size={15} /> Contact</div>
              <div className="ln">{order.customer.phone}</div>
              {order.customer.email && <div className="ln">{order.customer.email}</div>}
            </div>
            {order.note && (
              <div className="mf-info-block" style={{ marginTop: 14 }}>
                <div className="tt">Instructions</div>
                <div className="ln">{order.note}</div>
              </div>
            )}
            <div className="mf-info-block" style={{ marginTop: 14 }}>
              <div className="tt"><Truck size={15} /> Paiement</div>
              <div className="ln">{order.paymentMethod === 'cash' ? 'Paiement à la livraison' : (order.paymentMethod === 'mtn_momo' ? 'MTN Mobile Money' : 'Orange Money')}</div>
            </div>
          </div>
        </div>

        <div className="mf-panel">
          <div className="mf-panel-head"><h3>Gestion du statut</h3></div>
          <div className="mf-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Statut de la commande">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {ORDER_STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </Field>
            <Button variant="primary" onClick={updateStatus} loading={saving} disabled={status === order.status}>
              Mettre à jour le statut
            </Button>
            {order.status !== ORDER_STATUS.CANCELLED && (
              <Button variant="danger" icon={XCircle} onClick={() => setAskCancel(true)}>
                Annuler la commande
              </Button>
            )}
            <div className="mf-info-block" style={{ marginTop: 8 }}>
              <div className="tt">Passée le</div>
              <div className="ln">{formatDate(order.createdAt, true)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mf-panel" style={{ marginTop: 20 }}>
        <div className="mf-panel-head"><h3>Articles ({order.items.length})</h3></div>
        <div className="mf-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {order.items.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <img src={it.image} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{it.unit} · {it.quantity} × {formatPrice(it.price)}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{formatPrice(it.price * it.quantity)}</div>
            </div>
          ))}
        </div>
        <div className="mf-panel-body" style={{ borderTop: '1px solid var(--ink-200)' }}>
          <div className="mf-summary-row"><span>Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="mf-summary-row"><span>Livraison</span><span>{order.deliveryFee ? formatPrice(order.deliveryFee) : 'Offerte'}</span></div>
          <div className="mf-summary-row total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </div>

      <ConfirmDialog
        open={askCancel}
        onClose={() => setAskCancel(false)}
        onConfirm={cancel}
        title="Annuler la commande ?"
        message="La commande sera marquée comme annulée."
        confirmLabel="Oui, annuler"
      />
    </>
  )
}