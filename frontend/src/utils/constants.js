/**
 * Constantes métier de KmerMarket.
 */

export const APP_NAME = 'KmerMarket'
export const APP_TAGLINE = 'Les produits frais du Cameroun, livrés chez vous.'
export const CURRENCY = 'FCFA'

/* ---- Statuts de commande ---- */
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
}

export const ORDER_STATUS_LIST = [
  { value: ORDER_STATUS.PENDING, label: 'En attente', tone: 'yellow' },
  { value: ORDER_STATUS.CONFIRMED, label: 'Confirmée', tone: 'blue' },
  { value: ORDER_STATUS.PREPARING, label: 'En préparation', tone: 'orange' },
  { value: ORDER_STATUS.SHIPPING, label: 'En livraison', tone: 'blue' },
  { value: ORDER_STATUS.DELIVERED, label: 'Livrée', tone: 'green' },
  { value: ORDER_STATUS.CANCELLED, label: 'Annulée', tone: 'red' },
]

export function getOrderStatusMeta(value) {
  return (
    ORDER_STATUS_LIST.find((s) => s.value === value) || {
      value,
      label: value,
      tone: 'gray',
    }
  )
}

/* ---- Paiement ---- */
export const PAYMENT_METHODS = [
  {
    value: 'cash',
    label: 'Paiement à la livraison',
    description: 'Réglez en espèces au moment de la réception.',
    icon: 'Wallet',
  },
  {
    value: 'mtn_momo',
    label: 'MTN Mobile Money',
    description: 'Paiement mobile MTN MoMo (bientôt disponible).',
    icon: 'Smartphone',
    // Structure prête pour une future intégration réelle
    provider: 'mtn',
  },
  {
    value: 'orange_money',
    label: 'Orange Money',
    description: 'Paiement mobile Orange Money (bientôt disponible).',
    icon: 'Smartphone',
    provider: 'orange',
  },
]

/* ---- Villes & zones de livraison (Cameroun) ---- */
export const CITIES = [
  'Douala',
  'Yaoundé',
  'Bafoussam',
  'Bamenda',
  'Garoua',
  'Maroua',
  'Ngaoundéré',
  'Bertoua',
  'Ebolowa',
  'Kribi',
  'Limbé',
  'Buea',
  'Dschang',
  'Edéa',
]

/**
 * Zones de livraison : frais associés + délai estimé.
 * Les frais sont calculés dans le service de commande.
 */
export const DELIVERY_ZONES = [
  { city: 'Douala', fee: 1000, eta: '2 à 4 h', freeAbove: 25000 },
  { city: 'Yaoundé', fee: 1200, eta: '3 à 6 h', freeAbove: 25000 },
  { city: 'Bafoussam', fee: 2000, eta: '24 h', freeAbove: 50000 },
  { city: 'Bamenda', fee: 2500, eta: '24 à 48 h', freeAbove: 50000 },
  { city: 'Buea', fee: 1500, eta: '6 à 12 h', freeAbove: 30000 },
  { city: 'Limbé', fee: 1500, eta: '6 à 12 h', freeAbove: 30000 },
  { city: 'Kribi', fee: 2000, eta: '12 à 24 h', freeAbove: 40000 },
  { city: 'Dschang', fee: 2200, eta: '24 h', freeAbove: 50000 },
  { city: 'Edéa', fee: 1800, eta: '12 h', freeAbove: 35000 },
  { city: 'Garoua', fee: 3500, eta: '48 h', freeAbove: 75000 },
  { city: 'Maroua', fee: 3800, eta: '48 h', freeAbove: 75000 },
  { city: 'Ngaoundéré', fee: 3200, eta: '48 h', freeAbove: 75000 },
  { city: 'Bertoua', fee: 2800, eta: '48 h', freeAbove: 60000 },
  { city: 'Ebolowa', fee: 2500, eta: '24 à 48 h', freeAbove: 50000 },
]

export const DEFAULT_DELIVERY_FEE = 2000

/** Seuil de livraison offerte (affiché côté client). */
export const FREE_DELIVERY_THRESHOLD = 25000

export function getDeliveryZone(city) {
  return DELIVERY_ZONES.find((z) => z.city === city) || null
}

/* ---- Unités de vente adaptées aux denrées ---- */
export const SELL_UNITS = [
  '1 kg',
  '2 kg',
  '5 kg',
  'Sac 25 kg',
  'Sac 50 kg',
  'Régime',
  'Tas',
  'Botte',
  'Bouteille 1 L',
  'Bouteille 5 L',
  'Carton',
  'Douzaine',
  'Unité',
  'Pièce',
]

/* ---- Tri boutique ---- */
export const SORT_OPTIONS = [
  { value: 'popular', label: 'Popularité' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'name-asc', label: 'Nom (A → Z)' },
]

/* ---- Rôles ---- */
export const ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
}

/* ---- Version du jeu de données initial ----
 * Incrémentez cette valeur à chaque changement structurel des fichiers
 * `src/data/*` : les navigateurs possédant déjà une base locale plus ancienne
 * seront automatiquement réinitialisés au prochain chargement (voir db.js).
 */
export const SEED_VERSION = 2

/* ---- Clés localStorage ---- */
export const STORAGE_KEYS = {
  CART: 'kmermarket.cart',
  AUTH: 'kmermarket.auth',
  CATALOG: 'kmermarket.catalog',
  ORDERS: 'kmermarket.orders',
  USERS: 'kmermarket.users',
  CONTENT: 'kmermarket.content',
  SETTINGS: 'kmermarket.settings',
}