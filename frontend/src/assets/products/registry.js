/**
 * Registre des images produits locales.
 * -------------------------------------
 * Les produits de démonstration utilisent des images distantes (Unsplash).
 * Pour passer à des visuels locaux, il suffit de DEUX étapes :
 *
 *   1. déposer le fichier dans ce dossier, ex. `src/assets/products/tomates.jpg`
 *   2. importer le fichier ici et l'associer à l'id du produit :
 *
 *        import tomates from './tomates.jpg'
 *
 *        export const localProductImages = {
 *          'p-001': tomates,
 *        }
 *
 * C'est tout : le reste de l'application (boutique, fiche produit, panier,
 * dashboard admin) affichera automatiquement l'image locale, car toute la
 * lecture des produits passe par `resolveProductImage()` (src/services/db.js).
 *
 * Les ids disponibles se trouvent dans `src/data/products.js` (p-001 … p-030).
 * Aucun composant n'a besoin d'être modifié.
 */

/** id produit → image locale importée (vide par défaut = images distantes). */
export const localProductImages = {
  // 'p-001': tomates,
}
