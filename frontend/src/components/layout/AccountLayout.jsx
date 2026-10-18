import { NavLink, Outlet, Link } from 'react-router-dom'
import { User, Package, MapPin, Heart, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { initials } from '../../utils/format'

const NAV = [
  { to: '/account', label: 'Mon profil', icon: User, end: true },
  { to: '/orders', label: 'Mes commandes', icon: Package },
  { to: '/account/favorites', label: 'Mes favoris', icon: Heart },
  { to: '/account/addresses', label: 'Mes adresses', icon: MapPin },
  { to: '/account/preferences', label: 'Préférences', icon: Settings },
]

/** Layout de l'espace client : barre latérale + contenu. */
export default function AccountLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 50 }}>
      <div className="mf-account-layout">
        <aside className="mf-account-nav">
          <div className="user">
            <span className="mf-avatar">{initials(user?.firstName ? `${user.firstName} ${user.lastName}` : user?.name)}</span>
            <div style={{ minWidth: 0 }}>
              <div className="nm">{user?.firstName ? `${user.firstName} ${user.lastName}` : user?.name}</div>
              <div className="em">{user?.email}</div>
            </div>
          </div>

          <nav>
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>
                <n.icon size={17} /> {n.label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <Link to="/admin">
                <LayoutDashboard size={17} /> Dashboard admin
              </Link>
            )}
            <button onClick={logout} className="logout">
              <LogOut size={17} /> Se déconnecter
            </button>
          </nav>
        </aside>

        <div className="mf-account-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}