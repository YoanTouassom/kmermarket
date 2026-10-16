import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProductCard from './ProductCard'
import { ProductSkeleton } from './ui/primitives'
import { useCatalogStore } from '../store/catalogStore'

/** Titre de section réutilisable avec lien « voir tout ». */
export function SectionHeading({ eyebrow, title, text, to, toLabel = 'Voir tout' }) {
  return (
    <div className="mf-sec-head">
      <div>
        {eyebrow && <span className="mf-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {to && (
        <Link to={to} className="mf-see-all">
          {toLabel} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  )
}

/** Carte catégorie (image + nom + compteur). */
export function CategoryCard({ category, count }) {
  return (
    <Link to={`/shop?category=${category.id}`} className="mf-cat-card">
      <img src={category.image} alt={category.name} loading="lazy" />
      <div className="mf-cat-card-body">
        <div className="nm">{category.name}</div>
        {typeof count === 'number' && (
          <div className="ct">{count} produit{count > 1 ? 's' : ''}</div>
        )}
      </div>
    </Link>
  )
}

/** Grille de produits avec état de chargement (skeletons). */
export function ProductGrid({ products, loading, skeletonCount = 8, empty }) {
  if (loading) {
    return (
      <div className="mf-grid-products">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    )
  }
  if (!products?.length) return empty || null
  return (
    <div className="mf-grid-products">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}

/** Grille de catégories alimentée par le catalogue global. */
export function CategoryGrid({ categories, products }) {
  const categoriesWithCount = categories.map((c) => ({
    ...c,
    count: products.filter((p) => p.categoryId === c.id).length,
  }))
  return (
    <div className="mf-cat-grid">
      {categoriesWithCount.map((c) => (
        <CategoryCard key={c.id} category={c} count={c.count} />
      ))}
    </div>
  )
}

/** Accès au catalogue (helper utilisé dans les pages). */
export function useCategoriesWithProducts() {
  const categories = useCatalogStore((s) => s.categories)
  const products = useCatalogStore((s) => s.products)
  return { categories, products }
}