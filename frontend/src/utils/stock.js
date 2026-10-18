/**
 * Disponibilité d'un produit côté client.
 * L'API ne renvoie la quantité (stock) qu'à l'admin ; les clients reçoivent
 * seulement inStock. On gère les deux formes.
 */
export function isOutOfStock(product) {
  if (!product || product.available === false) return true
  if (typeof product.inStock === 'boolean') return !product.inStock
  return Number(product.stock) <= 0
}
