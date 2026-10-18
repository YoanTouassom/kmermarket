import { Link } from 'react-router-dom'
import { Plus, Heart } from 'lucide-react'
import { formatPrice, discountPercent } from '../utils/format'
import { Badge, StarRating } from './ui/primitives'
import { useCartStore } from '../store/cartStore'
import { useUIStore } from '../store/uiStore'
import { IMAGE_PLACEHOLDER, onImageError } from '../utils/images'
import { isOutOfStock } from '../utils/stock'

/**
 * Carte produit réutilisable (accueil, boutique, résultats, similaires).
 */
export default function ProductCard({ product, compact = false }) {
  const addItem = useCartStore((s) => s.addItem)
  const success = useUIStore((s) => s.success)
  const favorites = useUIStore((s) => s.favorites)
  const toggleFavorite = useUIStore((s) => s.toggleFavorite)

  const discount = discountPercent(product.price, product.oldPrice)
  const out = isOutOfStock(product)
  const isFav = favorites.includes(product.id)

  const handleAdd = (e) => {
    e.preventDefault()
    if (out) return
    addItem(product, 1)
    success(`${product.name} ajouté au panier`)
  }

  return (
    <article className={`mf-pcard ${compact ? 'compact' : ''}`}>
      <Link to={`/product/${product.id}`} className="mf-pcard-media">
        <img src={product.image || IMAGE_PLACEHOLDER} alt={product.name} loading="lazy" onError={onImageError} />
        <div className="mf-pcard-tags">
          {discount > 0 && <Badge tone="orange">-{discount}%</Badge>}
          {product.isNew && <Badge tone="green">Nouveau</Badge>}
          {out && <Badge tone="red">Rupture</Badge>}
        </div>
        <button
          className={`mf-fav ${isFav ? 'on' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            toggleFavorite(product.id)
          }}
          aria-label="Ajouter aux favoris"
        >
          <Heart size={17} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </Link>

      <div className="mf-pcard-body">
        <span className="mf-pcard-origin">{product.origin}</span>
        <Link to={`/product/${product.id}`} className="mf-pcard-name">
          {product.name}
        </Link>
        <div className="mf-pcard-meta">
          {product.reviews > 0 ? (
            <StarRating value={product.rating} count={product.reviews} size={13} />
          ) : (
            <span className="mf-pcard-noreview">Aucun avis</span>
          )}
          <span className="mf-pcard-unit">{product.unit}</span>
        </div>
        <div className="mf-pcard-foot">
          <div className="mf-pcard-price">
            <span className="price">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="mf-old-price">{formatPrice(product.oldPrice)}</span>
            )}
          </div>
          <button
            className="mf-add-btn"
            onClick={handleAdd}
            disabled={out}
            aria-label="Ajouter au panier"
            title={out ? 'Produit indisponible' : 'Ajouter au panier'}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  )
}