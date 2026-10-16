import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, ShoppingCart, Users, Package, AlertTriangle, PackageX, ArrowRight, ArrowUpRight, RefreshCw } from 'lucide-react'
import { orderService } from '../../services/orderService'
import { useCatalogStore } from '../../store/catalogStore'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import { Skeleton, Button } from '../../components/ui/primitives'
import { formatPrice, formatNumber, timeAgo } from '../../utils/format'

function Stat({ icon: Icon, tone, label, value, hint }) {
  return (
    <div className={`mf-stat ${tone}`}>
      <div className="top">
        <div>
          <div className="lbl">{label}</div>
          <div className="val">{value}</div>
        </div>
        <span className="ic"><Icon size={21} /></span>
      </div>
      {hint && <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>{hint}</div>}
    </div>
  )
}

function statusCount(stats, status) {
  if (Array.isArray(stats?.orders?.byStatus)) {
    const row = stats.orders.byStatus.find((r) => r.status === status)
    if (row) return Number(row.total) || 0
  }
  if (stats?.orders && stats.orders[status] !== undefined) return Number(stats.orders[status]) || 0
  if (stats?.byStatus && stats.byStatus[status] !== undefined) return Number(stats.byStatus[status]) || 0
  return 0
}

export default function Dashboard() {
  const loadCatalog = useCatalogStore((s) => s.load)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    setError('')
    setLoading(true)
    try {
      setStats(await orderService.stats())
    } catch (err) {
      setError(err?.message || 'Impossible de charger les statistiques.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCatalog()
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCatalog])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="mf-stats">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={120} radius={16} />)}</div>
        <Skeleton height={300} radius={16} />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="mf-panel">
        <div className="mf-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start', padding: 28 }}>
          <h3 style={{ fontSize: 17 }}>Le tableau de bord n'a pas pu se charger</h3>
          <p style={{ color: 'var(--ink-500)', fontSize: 14 }}>
            {error || 'Aucune donnée reçue du serveur.'} Vérifiez que le backend est démarré
            (<code>npm run dev</code> dans <code>backend</code>) puis réessayez.
          </p>
          <Button variant="primary" icon={RefreshCw} onClick={fetchStats}>Réessayer</Button>
        </div>
      </div>
    )
  }

  const revenue = Number(stats?.revenue?.total ?? stats?.revenue ?? 0)
  const avgBasket = Number(stats?.revenue?.average ?? stats?.avgBasket ?? 0)
  const ordersCount = Number(stats?.orders?.total ?? stats?.ordersCount ?? 0)
  const customersCount = Number(stats?.users?.total ?? stats?.customersCount ?? 0)
  const productsCount = Number(stats?.products?.total ?? stats?.productsCount ?? 0)
  const outOfStockCount = Number(stats?.products?.outOfStock ?? stats?.outOfStock ?? 0)
  const lowStockCount = Number(stats?.products?.lowStock ?? stats?.lowStock ?? 0)
  const monthly = Array.isArray(stats?.monthly) ? stats.monthly : []
  const topProducts = Array.isArray(stats?.topProducts) ? stats.topProducts : []
  const recentOrders = Array.isArray(stats?.recentOrders) ? stats.recentOrders : []
  const outOfStockList = Array.isArray(stats?.outOfStock) ? stats.outOfStock : []

  const maxMonthly = Math.max(...monthly.map((m) => Number(m.total) || 0), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="mf-stats">
        <Stat icon={Wallet} tone="green" label="Chiffre d’affaires" value={formatPrice(revenue)} hint={avgBasket ? `Panier moyen ${formatPrice(avgBasket)}` : undefined} />
        <Stat icon={ShoppingCart} tone="blue" label="Commandes" value={formatNumber(ordersCount)} hint={`${statusCount(stats, 'pending')} en attente`} />
        <Stat icon={Users} tone="purple" label="Clients" value={formatNumber(customersCount)} />
        <Stat icon={Package} tone="orange" label="Produits" value={formatNumber(productsCount)} hint={lowStockCount ? `${lowStockCount} en stock faible` : undefined} />
      </div>

      <div className="mf-stats">
        <Stat icon={PackageX} tone="red" label="Produits en rupture" value={formatNumber(outOfStockCount)} />
        <Stat icon={AlertTriangle} tone="orange" label="À réapprovisionner" value={formatNumber(lowStockCount)} hint="≤ 5 unités en stock" />
      </div>

      <div className="mf-grid-2">
        <div className="mf-panel">
          <div className="mf-panel-head"><h3>Chiffre d’affaires · 6 derniers mois</h3><span className="mf-mini-badge">Tendance</span></div>
          <div className="mf-panel-body">
            {monthly.length === 0 ? (
              <p style={{ color: 'var(--ink-500)', fontSize: 14 }}>Pas encore de données de chiffre d’affaires.</p>
            ) : (
              <div className="mf-bars">
                {monthly.map((m) => (
                  <div key={m.key} className="mf-bar-col" title={formatPrice(m.total)}>
                    <span className="bv">{m.total ? formatNumber(Math.round(m.total / 1000)) + 'k' : '—'}</span>
                    <div className="mf-bar" style={{ height: `${Math.max(4, ((Number(m.total) || 0) / maxMonthly) * 100)}%` }} />
                    <span className="bl">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mf-panel">
          <div className="mf-panel-head"><h3>Produits populaires</h3></div>
          <div className="mf-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topProducts.length === 0 ? (
              <p style={{ color: 'var(--ink-500)', fontSize: 14 }}>Aucune vente enregistrée.</p>
            ) : topProducts.map((p, i) => (
              <div key={p.productId || p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mf-rank">{i + 1}</span>
                {p.image && <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover' }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
                    {Number(p.qty ?? p.ordered ?? p.sold ?? 0)} vendus
                    {p.stock !== undefined && ` · stock ${p.stock}`}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                  {formatPrice(p.revenue ?? (Number(p.price) || 0) * Number(p.qty ?? p.ordered ?? 0))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {outOfStockList.length > 0 && (
        <div className="mf-panel">
          <div className="mf-panel-head">
            <h3>Stock critique</h3>
            <Link to="/admin/products" className="mf-see-all">Gérer les produits <ArrowRight size={15} /></Link>
          </div>
          <div className="mf-table-wrap">
            <table className="mf-table">
              <thead>
                <tr><th>Produit</th><th>Stock</th><th>Unité</th></tr>
              </thead>
              <tbody>
                {outOfStockList.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>
                      <span className={`mf-stock-pill ${Number(p.stock) <= 0 ? 'out' : 'low'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ color: 'var(--ink-600)', fontSize: 13 }}>{p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mf-panel">
        <div className="mf-panel-head">
          <h3>Commandes récentes</h3>
          <Link to="/admin/orders" className="mf-see-all">Voir toutes <ArrowRight size={15} /></Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="mf-panel-body">
            <p style={{ color: 'var(--ink-500)', fontSize: 14 }}>Aucune commande. Les nouvelles commandes apparaîtront ici.</p>
          </div>
        ) : (
          <div className="mf-table-wrap">
            <table className="mf-table">
              <thead>
                <tr><th>Référence</th><th>Client</th><th>Date</th><th>Statut</th><th>Montant</th><th></th></tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{o.reference}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.customer?.firstName} {o.customer?.lastName}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>{o.customer?.city}</div>
                    </td>
                    <td style={{ color: 'var(--ink-600)', fontSize: 13 }}>{timeAgo(o.createdAt)}</td>
                    <td><OrderStatusBadge status={o.status} /></td>
                    <td style={{ fontWeight: 700 }}>{formatPrice(o.total)}</td>
                    <td>
                      <Link to={`/admin/orders/${o.id}`} className="mf-act-btn"><ArrowUpRight size={17} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}