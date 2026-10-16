/**
 * Catégories de produits — KmerMarket.
 * `icon` référence un nom d'icône Lucide affiché dans les cards catégorie.
 */
export const categories = [
  {
    id: 'cat-fruits',
    name: 'Fruits',
    slug: 'fruits',
    description: 'Mangues, ananas, avocats, pastèques et autres fruits de saison.',
    icon: 'Apple',
    color: '#e8892f',
    image:
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=640&q=70',
  },
  {
    id: 'cat-legumes',
    name: 'Légumes',
    slug: 'legumes',
    description: 'Tomates, gombo, poivrons, choux et légumes frais du jour.',
    icon: 'Carrot',
    color: '#1b7f52',
    image:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=640&q=70',
  },
  {
    id: 'cat-tubercules',
    name: 'Tubercules',
    slug: 'tubercules',
    description: 'Manioc, macabo, igname, patates douces et taro.',
    icon: 'Sprout',
    color: '#8a6d3b',
    image:
      'https://images.unsplash.com/photo-1596120408700-2d3d49ec6ee5?auto=format&fit=crop&w=640&q=70',
  },
  {
    id: 'cat-feculents',
    name: 'Féculents',
    slug: 'feculents',
    description: 'Plantains, bananes, pommes de terre et riz local.',
    icon: 'Wheat',
    color: '#c96f1b',
    image:
      'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=640&q=70',
  },
  {
    id: 'cat-cereales',
    name: 'Céréales',
    slug: 'cereales',
    description: 'Maïs, haricots, arachides et légumineuses du terroir.',
    icon: 'Wheat',
    color: '#a35414',
    image:
      'https://images.unsplash.com/photo-1568347877321-f8935c7dc5a3?auto=format&fit=crop&w=640&q=70',
  },
  {
    id: 'cat-epices',
    name: 'Épices',
    slug: 'epices',
    description: 'Piments, ail, gingembre, poivre de Penja et épices locales.',
    icon: 'Flame',
    color: '#d0442c',
    image:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=640&q=70',
  },
  {
    id: 'cat-vivriers',
    name: 'Produits vivriers',
    slug: 'produits-vivriers',
    description: 'Huile de palme, arachide, farines et produits transformés.',
    icon: 'ShoppingBasket',
    color: '#2e9e6b',
    image:
      'https://images.unsplash.com/photo-1584473457409-ae5c91d7d8b1?auto=format&fit=crop&w=640&q=70',
  },
  {
    id: 'cat-frais',
    name: 'Produits frais',
    slug: 'produits-frais',
    description: 'Sélection du jour, cueillie et livrée en un temps record.',
    icon: 'Leaf',
    color: '#4aa678',
    image:
      'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=640&q=70',
  },
]

export function getCategoryById(id) {
  return categories.find((c) => c.id === id) || null
}

export function getCategoryBySlug(slug) {
  return categories.find((c) => c.slug === slug) || null
}