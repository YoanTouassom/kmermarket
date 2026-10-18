import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Trash2 } from 'lucide-react'
import { reviewService } from '../../services/reviewService'
import { useUIStore } from '../../store/uiStore'
import AdminToolbar from '../components/AdminToolbar'
import { Select, EmptyState, Spinner, Pagination, StarRating, ConfirmDialog } from '../../components/ui/primitives'
import { formatDate } from '../../utils/format'

const PER_PAGE = 10

/** Modération des avis clients. */
export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stars, setStars] = useState('')
  const [page, setPage] = useState(1)
  const [ask, setAsk] = useState(null)
  const success = useUIStore((s) => s.success)
  const error = useUIStore((s) => s.error)

  useEffect(() => {
    reviewService
      .adminList()
      .then(setReviews)
      .catch((e) => error(e.message))
      .finally(() => setLoading(false))
  }, [error])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviews.filter(
      (r) =>
        (!stars || r.rating === Number(stars)) &&
        (!q || [r.comment, r.author, r.email, r.productName].some((v) => String(v || '').toLowerCase().includes(q)))
    )
  }, [reviews, search, stars])

  useEffect(() => setPage(1), [search, stars])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const view = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const remove = async () => {
    try {
      await reviewService.adminRemove(ask.id)
      setReviews((prev) => prev.filter((r) => r.id !== ask.id))
      success('Avis supprimé')
    } catch (e) {
      error(e.message)
    } finally {
      setAsk(null)
    }
  }

  return (
    <>
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Commentaire, client, produit…">
        <Select value={stars} onChange={(e) => setStars(e.target.value)} style={{ minWidth: 160 }}>
          <option value="">Toutes les notes</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>
          ))}
        </Select>
      </AdminToolbar>

      <div className="mf-panel">
        {loading ? (
          <Spinner label="Chargement des avis…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={reviews.length ? 'Aucun avis ne correspond' : 'Aucun avis pour le moment'}
            text={reviews.length ? 'Modifiez la recherche ou le filtre.' : 'Les avis laissés par les clients sur les fiches produits apparaîtront ici.'}
          />
        ) : (
          <>
            <div className="mf-table-wrap">
              <table className="mf-table">
                <thead>
                  <tr><th>Produit</th><th>Client</th><th>Note</th><th>Commentaire</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {view.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>
                        <Link to={`/product/${r.productId}`} target="_blank" rel="noreferrer">{r.productName}</Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.author}</div>
                        <div className="sub">{r.email}</div>
                      </td>
                      <td><StarRating value={r.rating} size={13} /></td>
                      <td style={{ maxWidth: 380, fontSize: 13.5, whiteSpace: 'normal' }}>{r.comment}</td>
                      <td style={{ fontSize: 13, color: 'var(--ink-600)', whiteSpace: 'nowrap' }}>{formatDate(r.createdAt, true)}</td>
                      <td>
                        <button className="mf-act-btn del" onClick={() => setAsk(r)} title="Supprimer l’avis" aria-label="Supprimer l’avis">
                          <Trash2 size={16} />
                        </button>
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

      <ConfirmDialog
        open={!!ask}
        onClose={() => setAsk(null)}
        onConfirm={remove}
        title="Supprimer cet avis ?"
        message={ask ? `L’avis de ${ask.author} sur « ${ask.productName} » sera supprimé et la note du produit recalculée.` : ''}
        confirmLabel="Supprimer"
        tone="danger"
      />
    </>
  )
}
