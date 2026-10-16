/**
 * Application du schéma PostgreSQL.
 * --------------------------------
 *   npm run db:migrate            -> applique schema.sql (idempotent)
 *   npm run db:migrate -- --reset -> vide le schéma public puis le recrée
 *
 * Le fichier schema.sql est idempotent (CREATE TABLE IF NOT EXISTS…),
 * le suivi `migrations` sert d'historique lisible.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { pool, testConnection, closePool } from './pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCHEMA_FILE = path.join(__dirname, 'schema.sql')
const MIGRATION_NAME = '0001_init'

async function main() {
  const reset = process.argv.includes('--reset')

  const info = await testConnection()
  console.log(`[db] connecté à « ${info.db} »`)
  console.log(`[db] ${info.version.split(' on ')[0]}`)

  if (reset) {
    console.log('[db] --reset : suppression du schéma public…')
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE')
    await pool.query('CREATE SCHEMA public')
  }

  const sql = await fs.readFile(SCHEMA_FILE, 'utf8')
  await pool.query(sql)
  console.log('[db] schema.sql appliqué.')

  await pool.query(
    `INSERT INTO migrations (name) VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET applied_at = now()`,
    [MIGRATION_NAME]
  )

  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`
  )
  console.log(`[db] ${rows.length} tables : ${rows.map((r) => r.table_name).join(', ')}`)
  console.log('[db] migration terminée.')
}

main()
  .catch((err) => {
    console.error('[db] échec de la migration :', err.message)
    process.exitCode = 1
  })
  .finally(closePool)
