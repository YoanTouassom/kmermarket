/**
 * Zones de livraison (Cameroun) — source de vérité côté serveur.
 * -------------------------------------------------------------
 * Le frontend affiche ces informations mais c'est le backend qui
 * recalcule les frais lors de la création d'une commande : le montant
 * envoyé par le client n'est jamais considéré comme fiable.
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

/** Normalise une ville pour la comparaison (accents / casse / espaces). */
function normalizeCity(city = '') {
  return String(city)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function getDeliveryZone(city) {
  const target = normalizeCity(city)
  return DELIVERY_ZONES.find((z) => normalizeCity(z.city) === target) || null
}

/**
 * Calcule les frais de livraison côté serveur.
 * @returns {{ fee: number, eta: string, free: boolean, freeAbove: number|null }}
 */
export function computeDelivery(subtotal, city) {
  const zone = getDeliveryZone(city)
  if (!zone) {
    return { fee: DEFAULT_DELIVERY_FEE, eta: '24 à 48 h', free: false, freeAbove: null }
  }
  const free = zone.freeAbove ? subtotal >= zone.freeAbove : false
  return {
    fee: free ? 0 : zone.fee,
    eta: zone.eta,
    free,
    freeAbove: zone.freeAbove ?? null,
  }
}
