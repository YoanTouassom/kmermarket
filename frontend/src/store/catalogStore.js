import { create } from 'zustand'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'

/**
 * Store catalogue : produits + catégories.
 * Contient aussi l'état des filtres de la boutique.
 */
export const useCatalogStore = create((set, get) => ({
  products: [],
  categories: [],
  loading: false,
  loaded: false,

  async load() {
    if (get().loading) return
    set({ loading: true })
    const [products, categories] = await Promise.all([
      productService.listAll(),
      categoryService.list(),
    ])
    set({ products, categories, loading: false, loaded: true })
  },

  async refresh() {
    const [products, categories] = await Promise.all([
      productService.listAll(),
      categoryService.list(),
    ])
    set({ products, categories })
  },

  categoryName(categoryId) {
    return get().categories.find((c) => c.id === categoryId)?.name || '—'
  },
}))