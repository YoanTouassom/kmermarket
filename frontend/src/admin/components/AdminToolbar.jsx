import { Search } from 'lucide-react'

/** Barre d'outils admin : recherche + filtres + action. */
export default function AdminToolbar({ search, onSearch, placeholder = 'Rechercher…', children, action }) {
  return (
    <div className="mf-admin-toolbar">
      <div className="mf-search-inline">
        <Search size={16} />
        <input className="input" placeholder={placeholder} value={search} onChange={(e) => onSearch(e.target.value)} />
      </div>
      {children}
      <span className="spacer" />
      {action}
    </div>
  )
}