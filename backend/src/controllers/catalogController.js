/**
 * Contrôleur catalogue : produits, catégories, contenu et livraison.
 */
import { asyncHandler } from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import * as productService from '../services/productService.js'
import * as categoryService from '../services/categoryService.js'
import * as contentService from '../services/contentService.js'
import { DELIVERY_ZONES, computeDelivery } from '../config/delivery.js'

/** Un identifiant peut être un id numérique ou un slug (URL partagées). */
async function findProduct(idOrSlug) {
  const numeric = Number.parseInt(idOrSlug, 10)
  const product = Number.isFinite(numeric)
    ? await productService.findById(numeric)
    : null
  return product || (await productService.findBySlug(String(idOrSlug)))
}

/**
 * La quantité en stock n'est visible que par l'admin (gestion du stock).
 * Les clients ne reçoivent que inStock (true / false).
 */
function forViewer(req, product) {
  if (!product) return product
  const inStock = Number(product.stock) > 0
  if (req.user?.role === 'admin') return { ...product, inStock }
  const { stock: _hidden, ...rest } = product
  return { ...rest, inStock }
}
const listForViewer = (req, items) => (items || []).map((p) => forViewer(req, p))

/* ------------------------------- Produits ------------------------------- */

export const listProducts = asyncHandler(async (req, res) => {
  const q = req.validatedQuery || req.query
  const truthy = (v) => v === true || v === 'true' || v === '1'
  const result = await productService.list({
    ...q,
    inStockOnly: truthy(q.inStock ?? q.inStockOnly),
    onSale: truthy(q.onSale),
    featured: truthy(q.featured),
    page: q.page ? Number(q.page) : null,
    limit: q.limit ? Number(q.limit) : null,
  })

  // Sans pagination demandée → tableau simple (contrat historique du frontend).
  if (Array.isArray(result)) return res.json({ items: listForViewer(req, result), total: result.length })
  return res.json({ ...result, items: listForViewer(req, result.items) })
})

export const featuredProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 24)
  const { items } = await productService.list({ featured: true, page: 1, limit })
  res.json({ items: listForViewer(req, items) })
})

export const onSaleProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 24)
  const { items } = await productService.list({ onSale: true, page: 1, limit, sort: 'rating' })
  res.json({ items: listForViewer(req, items) })
})

export const popularProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 24)
  const { items } = await productService.list({ sort: 'popular', page: 1, limit })
  res.json({ items: listForViewer(req, items) })
})

export const newArrivals = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 24)
  const { items } = await productService.list({ sort: 'newest', page: 1, limit })
  res.json({ items: listForViewer(req, items) })
})

export const suggestProducts = asyncHandler(async (req, res) => {
  const items = await productService.suggest(req.query.q, Math.min(Number(req.query.limit) || 5, 10))
  res.json({ items: listForViewer(req, items) })
})

export const getProduct = asyncHandler(async (req, res) => {
  const product = await findProduct(req.params.idOrSlug)
  if (!product) throw ApiError.notFound('Produit introuvable.')
  res.json({ product: forViewer(req, product) })
})

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await findProduct(req.params.idOrSlug)
  if (!product) throw ApiError.notFound('Produit introuvable.')
  const items = await productService.related(product.id, Math.min(Number(req.query.limit) || 4, 12))
  res.json({ items: listForViewer(req, items) })
})

/* ------------------------------ Catégories ------------------------------ */

export const listCategories = asyncHandler(async (_req, res) => {
  const items = await categoryService.list({ withCounts: true })
  res.json({ items })
})

export const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.findById(req.params.id)
  if (!category) throw ApiError.notFound('Catégorie introuvable.')
  res.json({ category })
})

/* ------------------------- Contenu & livraison ------------------------- */

export const getContent = asyncHandler(async (_req, res) => {
  res.json(await contentService.getContent())
})

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await contentService.getSettings()
  res.json({ ...settings, deliveryZones: DELIVERY_ZONES })
})

export const listZones = asyncHandler(async (_req, res) => {
  res.json({ zones: DELIVERY_ZONES })
})

export const quoteDelivery = asyncHandler(async (req, res) => {
  const { city, subtotal } = req.body
  res.json(computeDelivery(Number(subtotal) || 0, city))
})
