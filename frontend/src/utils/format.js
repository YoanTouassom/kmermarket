/**
 * Formatting helpers — prices, dates, text.
 * Centralisés pour rester cohérents dans toute l'application.
 */

/**
 * Formate un montant en franc CFA (XAF).
 * @param {number} value
 * @returns {string} ex: "1 500 FCFA"
 */
export function formatPrice(value) {
  const num = Number(value) || 0
  return (
    new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(Math.round(num)) + ' FCFA'
  )
}

/**
 * Formate un nombre avec séparateurs.
 */
export function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR').format(Number(value) || 0)
}

/**
 * Formate une date ISO en date lisible française.
 * @param {string} iso
 * @param {boolean} withTime
 */
export function formatDate(iso, withTime = false) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const opts = { day: '2-digit', month: 'long', year: 'numeric' }
  if (withTime) {
    opts.hour = '2-digit'
    opts.minute = '2-digit'
  }
  return d.toLocaleDateString('fr-FR', opts)
}

/**
 * Date courte : 21/09/2026
 */
export function formatDateShort(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR')
}

/**
 * "il y a 3 jours"
 */
export function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 31) return `il y a ${days} j`
  const months = Math.round(days / 30)
  if (months < 12) return `il y a ${months} mois`
  return `il y a ${Math.round(months / 12)} an(s)`
}

/**
 * Calcule le pourcentage de remise.
 */
export function discountPercent(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0
  return Math.round(((oldPrice - price) / oldPrice) * 100)
}

/**
 * Initiales à partir d'un nom complet.
 */
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/**
 * Tronque un texte avec ellipse.
 */
export function truncate(text = '', max = 90) {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

/**
 * Slugify pour noms de fichiers / ids.
 */
export function slugify(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}