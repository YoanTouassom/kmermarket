import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Image,
  Settings,
  Menu,
  X,
  Store,
  LogOut,
  ExternalLink,
  MessageSquare,
} from 'lucide-react'
import Logo from '../../components/brand/Logo'
import { useAuthStore } from '../../store/authStore'
import { initials } from '../../utils/format'
import { useOrderNotifStore } from '../../store/orderNotifStore'
import { useCatalogStore } from '../../store/catalogStore'
import { useOrderNotifications } from '../hooks/useOrderNotifications'
import OrderBell from './OrderBell'

const NAV_GROUPS = [
  {
    label: 'Pilotage',
    items: [{ to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/admin/products', label: 'Produits', icon: Package },
      { to: '/admin/categories', label: 'Catégories', icon: FolderTree },
    ],
  },
  {
    label: 'Activité',
    items: [
      { to: '/admin/orders', label: 'Commandes', icon: ShoppingCart },
      { to: '/admin/users', label: 'Clients', icon: Users },
      { to: '/admin/reviews', label: 'Avis clients', icon: MessageSquare },
    ],
  },
  {
    label: 'Contenu',
    items: [
      { to: '/admin/content', label: 'Page d’accueil', icon: Image },
      { to: '/admin/settings', label: 'Paramètres', icon: Settings },
    ],
  },
]

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const unreadOrders = useOrderNotifStore((s) => s.unread.length)
  useOrderNotifications()
  // Le catalogue a pu être chargé avant la connexion (sans les quantités en
  // stock, réservées à l'admin) : on le recharge à l'ouverture de l'admin.
  const refreshCatalog = useCatalogStore((s) => s.refresh)
  useEffect(() => {
    refreshCatalog()
  }, [refreshCatalog])

  return (
    <div className="mf-admin">
      <aside className={`mf-admin-side ${open ? 'open' : ''}`}>
        <div className="mf-admin-brand">
          <Logo variant="light" size={34} />
        </div>
        <nav className="mf-admin-nav">
          {NAV_GROUPS.map((g) => (
            <div key={g.label}>
              <div className="grp">{g.label}</div>
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setOpen(false)}>
                  <it.icon size={18} /> {it.label}
                  {it.to === '/admin/orders' && unreadOrders > 0 && (
                    <span className="mf-admin-nav-badge">{unreadOrders}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="mf-admin-foot">
          <div className="mf-admin-user">
            <span className="av">{initials(user?.name || user?.firstName)}</span>
            <div>
              <div className="nm">{user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`}</div>
              <div className="em">Administrateur</div>
            </div>
          </div>
          <Link to="/" className="mf-admin-foot-link">
            <ExternalLink size={16} /> Voir le site
          </Link>
          <button className="mf-admin-foot-link" onClick={logout}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {open && <div className="mf-admin-scrim" onClick={() => setOpen(false)} />}

      <div className="mf-admin-main">
        <header className="mf-admin-top">
          <button className="btn btn-ghost mf-admin-burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center',
                background: 'var(--green-50)', color: 'var(--green-600)',
              }}
            >
              <Store size={19} />
            </span>
            <div>
              <h1>Espace administrateur</h1>
              <div className="sub">KmerMarket · Gestion de la boutique</div>
            </div>
          </div>
          <span className="spacer" />
          <OrderBell />
        </header>

        <div className="mf-admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}