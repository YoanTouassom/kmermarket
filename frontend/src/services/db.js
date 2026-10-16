import { STORAGE_KEYS, SEED_VERSION } from '../utils/constants'
import { products as seedProducts } from '../data/products'
import { categories as seedCategories } from '../data/categories'
import { users as seedUsers } from '../data/users'
import { orders as seedOrders } from '../data/orders'
import { siteContent as seedContent, settings as seedSettings } from '../data/content'
import { resolveProductImage } from '../utils/images'
import { localProductImages } from '../assets/products/registry'

/**
 * Couche de persistance locale.
 * -----------------------------
 * Ce module simule une base de données en utilisant localStorage.
 * Il est le SEUL endroit qui touche au stockage.
 *
 * 👉 Pour brancher une vraie API REST plus tard, réécrivez les fonctions
 *    `read`/`write` des services (productService, orderService, …) pour
 *    appeler fetch/axios. La forme des données reste identique.
 */

const isBrowser = typeof window !== 'undefined' && !!window.localStorage

function read(key, fallback) {
  if (!isBrowser) return clone(fallback)
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      write(key, fallback)
      return clone(fallback)
    }
    return JSON.parse(raw)
  } catch {
    return clone(fallback)
  }
}

function write(key, value) {
  if (!isBrowser) return value
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota — on ignore silencieusement */
  }
  return value
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

/** Clé interne mémorisant la version du jeu de données installée. */
const SEED_VERSION_KEY = 'kmermarket.seedVersion'

/**
 * Réaligne la base locale sur la version courante du jeu de données.
 * ------------------------------------------------------------------
 * Si la version installée diffère de `SEED_VERSION` (src/utils/constants.js),
 * les collections amorcées depuis `src/data/*` sont purgées : elles seront
 * réécrites à la première lecture, avec les données à jour.
 *
 * Le panier de l'utilisateur est volontairement préservé ; la session est
 * invalidée automatiquement si elle référence un compte qui n'existe plus.
 */
function syncSeedVersion() {
  if (!isBrowser) return
  try {
    const installed = Number(window.localStorage.getItem(SEED_VERSION_KEY) || 0)
    if (installed === SEED_VERSION) return
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (name === 'CART') return
      window.localStorage.removeItem(key)
    })
    window.localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
  } catch {
    /* stockage indisponible — on poursuit avec les données par défaut */
  }
}

syncSeedVersion()

/**
 * Initialise la base locale si elle n'existe pas encore.
 * Appelé (ou déclenché) au démarrage de l'app.
 */
export function seedDatabase({ force = false } = {}) {
  if (!isBrowser) return
  const checks = [
    [STORAGE_KEYS.CATALOG, 'products', seedProducts],
    [STORAGE_KEYS.CATALOG + '.categories', 'categories', seedCategories],
    [STORAGE_KEYS.USERS, 'users', seedUsers],
    [STORAGE_KEYS.ORDERS, 'orders', seedOrders],
    [STORAGE_KEYS.CONTENT, 'content', seedContent],
    [STORAGE_KEYS.SETTINGS, 'settings', seedSettings],
  ]
  checks.forEach(([key, , seed]) => {
    if (force || !window.localStorage.getItem(key)) {
      write(key, seed)
    }
  })
}

/**
 * Images locales : lecture résolue, écriture canonique.
 * ----------------------------------------------------
 * Les images des produits sont hébergées à distance et peuvent être
 * remplacées par des fichiers locaux (voir src/assets/products/README.md).
 *
 * - à la LECTURE, on renvoie l'image locale si elle existe ;
 * - à l'ÉCRITURE, on restaure l'image d'origine pour ne jamais persister
 *   un chemin généré par le bundler dans localStorage.
 */
const canonicalImageById = Object.fromEntries(
  seedProducts.map((p) => [p.id, p.image])
)

function withResolvedImages(items) {
  return items.map((p) => {
    const image = resolveProductImage(p)
    return image === p.image ? p : { ...p, image }
  })
}

function restoreCanonicalImage(p) {
  if (!(p.id in localProductImages)) return p
  const canonical = canonicalImageById[p.id]
  return canonical ? { ...p, image: canonical } : p
}

export const storage = {
  get products() {
    return withResolvedImages(read(STORAGE_KEYS.CATALOG, seedProducts))
  },
  set products(v) {
    write(STORAGE_KEYS.CATALOG, v.map(restoreCanonicalImage))
  },
  get categories() {
    return read(STORAGE_KEYS.CATALOG + '.categories', seedCategories)
  },
  set categories(v) {
    write(STORAGE_KEYS.CATALOG + '.categories', v)
  },
  get users() {
    return read(STORAGE_KEYS.USERS, seedUsers)
  },
  set users(v) {
    write(STORAGE_KEYS.USERS, v)
  },
  get orders() {
    return read(STORAGE_KEYS.ORDERS, seedOrders)
  },
  set orders(v) {
    write(STORAGE_KEYS.ORDERS, v)
  },
  get content() {
    return read(STORAGE_KEYS.CONTENT, seedContent)
  },
  set content(v) {
    write(STORAGE_KEYS.CONTENT, v)
  },
  get settings() {
    return read(STORAGE_KEYS.SETTINGS, seedSettings)
  },
  set settings(v) {
    write(STORAGE_KEYS.SETTINGS, v)
  },
}

/** Petit délai pour simuler une latence réseau réaliste. */
export function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Génère un identifiant unique simple. */
export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`
}