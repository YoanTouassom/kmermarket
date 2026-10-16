import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, ShoppingCart } from 'lucide-react'
import { orderService } from '../../services/orderService'
import { useUIStore } from '../../store/uiStore'
import AdminToolbar from '../components/AdminToolbar'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import { Select, EmptyState, Spinner, Pagination } from '../../components/ui/primitives'
import { formatPrice, formatDate } from '../../utils/format'
import { ORDER_STATUS_LIST } from '../../utils/constants'

const PER_PAGE = 8

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const error = useUIStore((s) => s.error)

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const list = await orderService.list({ search, status, sort: 'recent' })
        if (active) { setOrders(list); setPage(1) }
      } catch (e) { error(e.message) } finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [search, status, error])

  const totalPages = Math.ceil(orders.length / PER_PAGE)
  const view = orders.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <>
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Référence, client, téléphone, ville…">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 180 }}>
          <option value="">Tous les statuts</option>
          {ORDER_STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </AdminToolbar>

      <div className="mf-panel">
        {loading ? (
          <Spinner label="Chargement des commandes…" />
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Aucune commande" text="Aucune commande ne correspond à ces critères." />
        ) : (
          <>
            <div className="mf-table-wrap">
              <table className="mf-table">
                <thead>
                  <tr><th>Référence</th><th>Client</th><th>Date</th><th>Paiement</th><th>Statut</th><th>Montant</th><th></th></tr>
                </thead>
                <tbody>
                  {view.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{o.reference}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.customer.firstName} {o.customer.lastName}</div>
                        <div className="sub">{o.customer.phone} · {o.customer.city}</div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--ink-600)' }}>{formatDate(o.createdAt, true)}</td>
                      <td style={{ fontSize: 13 }}>{o.paymentMethod === 'cash' ? 'À la livraison' : (o.paymentMethod === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money')}</td>
                      <td><OrderStatusBadge status={o.status} /></td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(o.total)}</td>
                      <td>
                        <Link to={`/admin/orders/${o.id}`} className="mf-act-btn edit" title="Détail"><Eye size={16} /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>
    </>
  )
}