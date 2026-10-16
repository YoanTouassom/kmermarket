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
