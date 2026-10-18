import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  Package,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'
import Logo from '../brand/Logo'
import { useCartCount } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { productService } from '../../services/productService'
import { formatPrice } from '../../utils/format'
import { siteContent } from '../../data/content'

const NAV = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/shop', label: 'Boutique' },
  { to: '/shop?category=fruits', label: 'Fruits' },
  { to: '/shop?category=legumes', label: 'Légumes' },
  { to: '/shop?category=tubercules', label: 'Tubercules' },
]

/** NavLink ignore la query : on compare aussi ?category= pour n'activer qu'un lien. */
function isNavActive(item, location) {
  const [path, query = ''] = item.to.split('?')
  if (path === '/') return location.pathname === '/'
  if (location.pathname !== path) return false
  const current = new URLSearchParams(location.search).get('category') || ''
  return (new URLSearchParams(query).get('category') || '') === current
}

export default function Navbar() {
  const count = useCartCount()
  const favCount = useUIStore((s) => s.favorites.length)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const boxRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
  }, [menuOpen])

  useEffect(() => {
    let active = true
    const t = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([])
        return
      }
      const res = await productService.suggest(query, 5)
      if (active) setSuggestions(res)
    }, 200)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [query])

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setSuggestions([])
      if (!e.target.closest('.mf-user-wrap')) setUserMenu(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const submitSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setSuggestions([])
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`)
  }

  const closeAll = () => {
    setMenuOpen(false)
    setSuggestions([])
  }

  return (
    <>
      <div className="mf-announce">
        <div className="container">
          <span>
            <Package size={15} /> {siteContent.announcement}
          </span>
        </div>
      </div>

      <header className="mf-header">
        <div className="container mf-header-inner">
          <Logo size={38} />
          <nav className="mf-nav">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={closeAll} className={() => (isNavActive(n, location) ? 'active' : '')}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="mf-header-search" ref={boxRef}>
            <form onSubmit={submitSearch}>
              <Search size={17} className="mf-search-icon" />
              <input
                type="text"
                placeholder="Rechercher un produit…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Rechercher un produit"
              />
            </form>
            {suggestions.length > 0 && (
              <div className="mf-suggest">
                {suggestions.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="mf-suggest-item"
                    onClick={() => {
                      setQuery('')
                      setSuggestions([])
                    }}
                  >
                    <img src={p.image} alt="" />
                    <span style={{ flex: 1 }}>
                      <span className="nm">{p.name}</span>
                    </span>
                    <span className="pr">{formatPrice(p.price)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mf-header-actions">
            <Link to="/account/favorites" className="mf-icon-btn mf-fav-btn" aria-label="Favoris">
              <Heart size={20} />
              {favCount > 0 && <span className="mf-badge-count">{favCount}</span>}
            </Link>

            {user ? (
              <div className="mf-user-wrap" style={{ position: 'relative' }}>
                <button
                  className="mf-icon-btn"
                  onClick={() => setUserMenu((v) => !v)}
                  aria-label="Mon compte"
                >
                  <User size={20} />
                </button>
                {userMenu && (
                  <div className="mf-dropdown">
                    <div className="mf-dropdown-head">
                      <strong>{user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link to="/account" onClick={() => setUserMenu(false)}>
                      <User size={16} /> Mon compte
                    </Link>
                    <Link to="/orders" onClick={() => setUserMenu(false)}>
                      <Package size={16} /> Mes commandes
                    </Link>
                    <Link to="/account/favorites" onClick={() => setUserMenu(false)}>
                      <Heart size={16} /> Mes favoris
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setUserMenu(false)}>
                        <LayoutDashboard size={16} /> Dashboard admin
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        await logout()
                        setUserMenu(false)
                        navigate('/')
                      }}
                    >
                      <LogOut size={16} /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-outline btn-sm mf-hide-sm">
                Connexion
              </Link>
            )}

            <Link to="/cart" className="mf-icon-btn" aria-label="Panier">
              <ShoppingCart size={20} />
              {count > 0 && <span className="mf-badge-count">{count}</span>}
            </Link>

            <button
              className="mf-icon-btn mf-burger"
              onClick={() => setMenuOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <div className={`mf-mobile-nav ${menuOpen ? 'open' : ''}`}>
        <div className="mf-mobile-backdrop" onClick={closeAll} />
        <div className="mf-mobile-panel">
          <div className="mf-mobile-head">
            <Logo size={34} />
            <button className="mf-icon-btn" onClick={closeAll} aria-label="Fermer">
              <X size={22} />
            </button>
          </div>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={closeAll} className={() => (isNavActive(n, location) ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
          <NavLink to="/cart" onClick={closeAll}>
            Panier ({count})
          </NavLink>
          <NavLink to="/account/favorites" onClick={closeAll}>
            Favoris ({favCount})
          </NavLink>
          <hr className="divider" style={{ margin: '10px 0' }} />
          {user ? (
            <>
              <NavLink to="/account" onClick={closeAll}>
                Mon compte
              </NavLink>
              <NavLink to="/orders" onClick={closeAll}>
                Mes commandes
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" onClick={closeAll}>
                  Dashboard admin
                </NavLink>
              )}
              <button className="btn btn-outline btn-block mt-8" onClick={async () => { await logout(); closeAll(); navigate('/') }}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={closeAll}>
                Connexion
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-block mt-8" onClick={closeAll}>
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}