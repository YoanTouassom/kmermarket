# Images produits locales

Ce dossier est prévu pour héberger les visuels des produits **en local**, afin de
ne plus dépendre d'images externes (Unsplash) utilisées pour la démonstration.

## Pourquoi les images sont distantes aujourd'hui ?

Le catalogue de démonstration (`src/data/products.js`) pointe vers des photos
hébergées sur Unsplash. Cela permet d'avoir immédiatement un site crédible,
sans alourdir le dépôt.

## Comment basculer une image en local

1. Déposez le fichier dans ce dossier, par exemple :

   ```
   src/assets/products/tomates-fraiches.jpg
   ```

2. Déclarez-le dans `registry.js` (deux lignes suffisent) :

   ```js
   import tomates from './tomates-fraiches.jpg'

   export const localProductImages = {
     'p-001': tomates,
   }
   ```

3. C'est tout. Aucun composant à modifier : la boutique, la fiche produit, le
   panier, les commandes et le dashboard admin lisent les produits via
   `resolveProductImage()` (`src/utils/images.js`), appelée dans
   `src/services/db.js`.

## Bon à savoir

- Les identifiants produits sont dans `src/data/products.js` (`p-001` à `p-030`).
- Les images distantes restent la valeur de repli : un produit sans image locale
  continue de s'afficher normalement.
- Lorsqu'un produit est enregistré depuis le dashboard admin, l'image locale
  n'est **pas** persistée dans `localStorage` : le chemin canonique est conservé.
  Il n'y a donc jamais de chemin de bundler obsolète stocké côté client.
- Formats conseillés : `.jpg` ou `.webp`, environ 800 × 800 px, moins de 150 Ko.
