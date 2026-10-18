import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Star, MessageSquare, Trash2 } from 'lucide-react'
import { reviewService } from '../services/reviewService'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { Button, StarRating, Textarea } from './ui/primitives'
import { formatDate } from '../utils/format'

const LABELS = ['', 'Décevant', 'Moyen', 'Correct', 'Très bien', 'Excellent']

/** Sélecteur de note (1 à 5 étoiles) accessible au clavier. */
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="mf-star-input" role="radiogroup" aria-label="Votre note" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} étoile${i > 1 ? 's' : ''} — ${LABELS[i]}`}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className={i <= shown ? 'on' : ''}
        >
          <Star size={26} fill={i <= shown ? 'currentColor' : 'none'} />
        </button>
      ))}
      <span className="lbl">{LABELS[shown] || 'Choisissez une note'}</span>
    </div>
  )
}

/**
 * Avis clients d'un produit : moyenne, formulaire (client connecté), liste.
 * `onStats({ average, count })` permet à la fiche de mettre à jour son en-tête.
 */
export default function ProductReviews({ productId, onStats }) {
  const user = useAuthStore((s) => s.user)
  const success = useUIStore((s) => s.success)
  const error = useUIStore((s) => s.error)
  const location = useLocation()

  const [data, setData] = useState({ items: [], count: 0, average: 0, mine: null })
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    try {
      const res = await reviewService.forProduct(productId)
      setData(res)
      onStats?.({ average: res.average, count: res.count })
      if (res.mine) {
        setRating(res.mine.rating)
        setComment(res.mine.comment)
      }
    } catch {
      /* avis indisponibles : la fiche reste utilisable */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setEditing(false)
    setRating(0)
    setComment('')
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user?.id])

  const submit = async (e) => {
    e.preventDefault()
    if (!rating) return setFormError('Choisissez une note entre 1 et 5 étoiles.')
    if (comment.trim().length < 10) return setFormError('Votre avis doit contenir au moins 10 caractères.')
    setFormError('')
    setSaving(true)
    try {
      await reviewService.save(productId, { rating, comment: comment.trim() })
      success(data.mine ? 'Avis mis à jour, merci !' : 'Merci pour votre avis !')
      setEditing(false)
      await load()
    } catch (e2) {
      error(e2.message)
    } finally {
      setSaving(false)
    }
  }

  const removeMine = async () => {
    try {
      await reviewService.removeMine(productId)
      success('Votre avis a été supprimé')
      setRating(0)
      setComment('')
      setEditing(false)
      await load()
    } catch (e2) {
      error(e2.message)
    }
  }

  const showForm = user && (!data.mine || editing)

  return (
    <section className="mf-section mf-reviews">
      <div className="mf-reviews-head">
        <h2>Avis clients</h2>
        {data.count > 0 ? (
          <div className="mf-reviews-avg">
            <strong>{String(data.average).replace('.', ',')}</strong>
            <StarRating value={data.average} />
            <span>
              {data.count} avis
            </span>
          </div>
        ) : (
          !loading && <span className="mf-reviews-none">Aucun avis pour l’instant</span>
        )}
      </div>

      {!user && (
        <div className="mf-review-cta">
          <MessageSquare size={18} />
          <span>Vous avez goûté ce produit ? Partagez votre avis avec les autres clients.</span>
          <Link to="/login" state={{ from: location.pathname }} className="btn btn-outline btn-sm">
            Se connecter pour donner son avis
          </Link>
        </div>
      )}

      {user && data.mine && !editing && (
        <div className="mf-review-cta mine">
          <span>Vous avez noté ce produit {data.mine.rating}/5. Merci !</span>
          <div className="actions">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Modifier mon avis
            </Button>
            <button className="mf-act-btn del" onClick={removeMine} aria-label="Supprimer mon avis" title="Supprimer mon avis">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <form className="mf-review-form" onSubmit={submit}>
          <h3>{data.mine ? 'Modifier mon avis' : 'Donner mon avis'}</h3>
          <StarInput value={rating} onChange={(v) => { setRating(v); setFormError('') }} />
          <Textarea
            rows={3}
            maxLength={1000}
            value={comment}
            onChange={(e) => { setComment(e.target.value); setFormError('') }}
            placeholder="Qualité, fraîcheur, goût, livraison… (10 caractères minimum)"
            error={formError}
          />
          {formError && <span className="field-error">{formError}</span>}
          <div className="actions">
            {editing && (
              <Button variant="ghost" onClick={() => { setEditing(false); setRating(data.mine.rating); setComment(data.mine.comment) }}>
                Annuler
              </Button>
            )}
            <Button type="submit" variant="primary" loading={saving}>
              {data.mine ? 'Mettre à jour' : 'Publier mon avis'}
            </Button>
          </div>
        </form>
      )}

      {data.items.length > 0 && (
        <div className="mf-review-list">
          {data.items.map((r) => (
            <article key={r.id} className={`mf-review ${r.mine ? 'mine' : ''}`}>
              <div className="top">
                <span className="av">{r.author.charAt(0)}</span>
                <div className="who">
                  <strong>{r.author}{r.mine ? ' (vous)' : ''}</strong>
                  <span>{formatDate(r.updatedAt || r.createdAt)}</span>
                </div>
                <StarRating value={r.rating} size={14} />
              </div>
              <p>{r.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
