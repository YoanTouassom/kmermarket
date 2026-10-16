import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { productService } from '../../services/productService'
import { useCatalogStore } from '../../store/catalogStore'
import { useUIStore } from '../../store/uiStore'
import AdminToolbar from '../components/AdminToolbar'
import { Button, Select, EmptyState, ConfirmDialog, Spinner } from '../../components/ui/primitives'
import { formatPrice } from '../../utils/format'

export default function AdminProducts() {
  const { products, categories, refresh } = useCatalogStore()
  const success = useUIStore((s) => s.success)
  const error = useUIStore((s) => s.error)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('')
  const [ask, setAsk] = useState(null)

  const load = async () => {
    setLoading(true)
    await refresh()
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!cat || p.categoryId === cat) &&
          p.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [products, search, cat]
  )

  const catName = (id) => categories.find((c) => c.id === id)?.name || '—'

  const remove = async () => {
    try {
      await productService.remove(ask.id)
      success('Produit supprimé')
      await load()
    } catch (e) {
      error(e.message)
    } finally {
      setAsk(null)
    }
  }

  const toggleFlag = async (p, field) => {
    await productService.update(p.id, { [field]: !p[field] })
    await load()
  }

  return (
    <>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher un produit…"
        action={
          <Link to="/admin/products/new" className="btn btn-primary">
            <Plus size={17} /> Nouveau produit
          </Link>
        }
      >
        <Select value={cat} onChange={(e) => setCat(e.target.value)} style={{ minWidth: 180 }}>
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </AdminToolbar>

      <div className="mf-panel">
        {loading ? (
          <Spinner label="Chargement des produits…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Star} title="Aucun produit" text="Ajoutez votre premier produit ou modifiez vos filtres." />
        ) : (
          <div className="mf-table-wrap">
            <table className="mf-table">
              <thead>
                <tr>
                  <th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th>
                  <th>Vedette</th><th>Statut</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-prod">
                        <img src={p.image} alt="" />
                        <div>
                          <div className="nm">{p.name}</div>
                          <div className="sub">{p.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td>{catName(p.categoryId)}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{formatPrice(p.price)}</div>
                      {p.oldPrice ? <div className="sub" style={{ textDecoration: 'line-through', fontSize: 12, color: 'var(--ink-400)' }}>{formatPrice(p.oldPrice)}</div> : null}
                    </td>
                    <td>
                      <span className={`mf-stock-pill ${p.stock <= 0 ? 'out' : p.stock <= 20 ? 'low' : ''}`}>{p.stock}</span>
                    </td>
                    <td>
                      <button className={`mf-star-btn ${p.featured ? 'on' : ''}`} onClick={() => toggleFlag(p, 'featured')} title="Produit vedette">
                        <Star size={16} fill={p.featured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td>
                      <span className={`mf-pill ${p.available ? 'ok' : 'off'}`}>{p.available ? 'Actif' : 'Masqué'}</span>
                    </td>
                    <td>
                      <div className="mf-table-actions">
                        <button className="mf-act-btn edit" onClick={() => toggleFlag(p, 'available')} title="Activer / désactiver">
                          <span className={`mf-dot ${p.available ? 'on' : ''}`} />
                        </button>
                        <Link to={`/admin/products/${p.id}/edit`} className="mf-act-btn edit" title="Modifier">
                          <Pencil size={16} />
                        </Link>
                        <button className="mf-act-btn del" onClick={() => setAsk(p)} title="Supprimer">
                          <Trash2 size={16} />
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

      <ConfirmDialog
        open={!!ask}
        onClose={() => setAsk(null)}
        onConfirm={remove}
        title="Supprimer ce produit ?"
        message={`Le produit « ${ask?.name} » sera définitivement supprimé du catalogue.`}
        confirmLabel="Supprimer"
      />
    </>
  )
}