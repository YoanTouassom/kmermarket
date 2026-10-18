import { localProductImages } from '../assets/products/registry'

/**
 * Résout l'image d'un produit.
 *
 * - si une image locale est enregistrée dans `src/assets/products/registry.js`,
 *   elle est utilisée ;
 * - sinon on retombe sur l'URL distante fournie par les données.
 *
 * @param {object} product
 * @returns {string} chemin/URL de l'image
 */
export function resolveProductImage(product) {
  if (!product) return ''
  return localProductImages[product.id] || product.image || ''
}

/**
 * Vrai si le produit dispose d'une image locale (utile pour les diagnostics).
 */
export function hasLocalImage(productId) {
  return Boolean(localProductImages[productId])
}

/** Visuel neutre (panier vert sur fond crème) quand une photo manque ou ne charge pas. */
export const IMAGE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#eef6f1"/><g fill="none" stroke="#7fbf9c" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" transform="translate(150 95)"><path d="M10 40h80l-10 60H20z"/><path d="M30 40l15-30M70 40L55 10"/></g></svg>'
  )

/** onError d'un <img> : bascule une seule fois sur le visuel neutre. */
export function onImageError(e) {
  e.currentTarget.onerror = null
  e.currentTarget.src = IMAGE_PLACEHOLDER
}
