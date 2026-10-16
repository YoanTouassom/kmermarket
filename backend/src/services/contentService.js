/**
 * Contenu éditorial & paramètres de la boutique.
 * ---------------------------------------------
 * Stockés en JSONB dans `site_content` / `site_settings` : l'admin envoie le
 * même objet plat que celui manipulé par le frontend, aucune migration de
 * schéma n'est nécessaire quand on ajoute un champ d'affichage.
 */
import { query } from '../database/pool.js'
import ApiError from '../utils/ApiError.js'

const CONTENT_KEY = 'site'
const SETTINGS_KEY = 'app'

async function readJson(table, key, fallback = {}) {
  const { rows } = await query(`SELECT value FROM ${table} WHERE key = $1`, [key])
  if (!rows[0]) return fallback
  return typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value
}

async function writeJson(table, key, value) {
  const { rows } = await query(
    `INSERT INTO ${table} (key, value)
     VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = now()
     RETURNING value`,
    [key, JSON.stringify(value)]
  )
  return typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value
}

/** Fusion profonde sur 1 niveau : les blocs (hero, banners…) sont remplacés en entier. */
function mergeShallow(current, patch) {
  const next = { ...current }
  for (const [k, v] of Object.entries(patch || {})) {
    if (v === undefined) continue
    next[k] = v
  }
  return next
}

export async function getContent() {
  return readJson('site_content', CONTENT_KEY, {})
}

export async function updateContent(patch = {}) {
  const current = await getContent()
  const next = mergeShallow(current, patch)
  await writeJson('site_content', CONTENT_KEY, next)
  return next
}

export async function getSettings() {
  return readJson('site_settings', SETTINGS_KEY, {})
}

export async function updateSettings(patch = {}) {
  if (!patch || typeof patch !== 'object') {
    throw ApiError.badRequest('Paramètres invalides.')
  }
  const current = await getSettings()
  const next = mergeShallow(current, patch)
  await writeJson('site_settings', SETTINGS_KEY, next)
  return next
}
