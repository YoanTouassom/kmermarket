import { useEffect, useState } from 'react'
import { Users as UsersIcon, Ban, CheckCircle2, Eye } from 'lucide-react'
import { userService } from '../../services/userService'
import { orderService } from '../../services/orderService'
import { useUIStore } from '../../store/uiStore'
import AdminToolbar from '../components/AdminToolbar'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import { Select, Modal, EmptyState, Spinner, ConfirmDialog, Button } from '../../components/ui/primitives'
import { formatPrice, formatDate, initials } from '../../utils/format'

export default function AdminUsers() {
  const success = useUIStore((s) => s.success)
  const error = useUIStore((s) => s.error)

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailOrders, setDetailOrders] = useState([])
  const [ask, setAsk] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      const list = await userService.list({ search, role, status })
      if (active) setUsers(list)
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [search, role, status])

  const openDetail = async (u) => {
    setDetail(u)
    const orders = await orderService.listByUser(u.id)
    setDetailOrders(orders)
  }

  const toggle = async () => {
    try {
      await userService.toggleStatus(ask.id)
      setUsers((prev) => prev.map((u) => (u.id === ask.id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u)))
      success('Statut du compte mis à jour')
    } catch (e) {
      error(e.message)
    } finally {
      setAsk(null)
    }
  }

  const spent = detailOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)

  return (
    <>
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Nom, email, téléphone, ville…">
        <Select value={role} onChange={(e) => setRole(e.target.value)} style={{ minWidth: 150 }}>
          <option value="">Tous les rôles</option>
          <option value="customer">Clients</option>
          <option value="admin">Administrateurs</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 150 }}>
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Désactivés</option>
        </Select>
      </AdminToolbar>

      <div className="mf-panel">
        {loading ? (
          <Spinner label="Chargement des utilisateurs…" />
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} title="Aucun utilisateur" text="Aucun utilisateur ne correspond à ces critères." />
        ) : (
          <div className="mf-table-wrap">
            <table className="mf-table">
              <thead>
                <tr><th>Utilisateur</th><th>Contact</th><th>Ville</th><th>Rôle</th><th>Statut</th><th></th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="cell-prod">
                        <span className="mf-avatar">{initials(u.name || u.firstName)}</span>
                        <div>
                          <div className="nm">{u.name || `${u.firstName} ${u.lastName}`}</div>
                          <div className="sub">Inscrit le {formatDate(u.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{u.email}</div>
                      <div className="sub">{u.phone || '—'}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.city || '—'}</td>
                    <td><span className={`mf-pill ${u.role === 'admin' ? 'admin' : ''}`}>{u.role === 'admin' ? 'Admin' : 'Client'}</span></td>
                    <td><span className={`mf-pill ${u.status === 'active' ? 'ok' : 'off'}`}>{u.status === 'active' ? 'Actif' : 'Désactivé'}</span></td>
                    <td>
                      <div className="mf-table-actions">
                        <button className="mf-act-btn edit" onClick={() => openDetail(u)} title="Détail"><Eye size={16} /></button>
                        <button className={`mf-act-btn ${u.status === 'active' ? 'del' : 'edit'}`} onClick={() => setAsk(u)} title="Activer / désactiver">
                          {u.status === 'active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Fiche client" size="lg">
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span className="mf-avatar lg">{initials(detail.name || detail.firstName)}</span>
              <div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 18 }}>{detail.name || `${detail.firstName} ${detail.lastName}`}</div>
                <div style={{ color: 'var(--ink-500)', fontSize: 13 }}>{detail.email} · {detail.phone || 'sans téléphone'}</div>
              </div>
            </div>
            <div className="mf-stats sm">
              <div className="mf-mini-stat"><span>Commandes</span><strong>{detailOrders.length}</strong></div>
              <div className="mf-mini-stat"><span>Total dépensé</span><strong>{formatPrice(spent)}</strong></div>
              <div className="mf-mini-stat"><span>Ville</span><strong>{detail.city || '—'}</strong></div>
            </div>
            <div>
              <div className="mf-sub-title">Historique de commandes</div>
              {detailOrders.length === 0 ? (
                <p style={{ color: 'var(--ink-500)', fontSize: 14 }}>Aucune commande pour ce client.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                  {detailOrders.map((o) => (
                    <div key={o.id} className="mf-line-row">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{o.reference}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>{formatDate(o.createdAt, true)}</div>
                      </div>
                      <OrderStatusBadge status={o.status} />
                      <div style={{ fontWeight: 700, width: 110, textAlign: 'right' }}>{formatPrice(o.total)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!ask}
        onClose={() => setAsk(null)}
        onConfirm={toggle}
        title={ask?.status === 'active' ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
        message={ask?.status === 'active' ? `« ${ask?.name || ask?.email} » ne pourra plus se connecter.` : `« ${ask?.name || ask?.email} » pourra de nouveau se connecter.`}
        confirmLabel={ask?.status === 'active' ? 'Désactiver' : 'Réactiver'}
        tone={ask?.status === 'active' ? 'danger' : 'primary'}
      />
    </>
  )
}