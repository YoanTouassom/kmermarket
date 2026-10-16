/**
 * Pool de connexions PostgreSQL partagé par toute l'application.
 */
import pg from 'pg'
import { env } from '../config/env.js'

const { Pool } = pg

export const pool = new Pool(
  env.db.url
    ? {
        connectionString: env.db.url,
        ssl: env.db.ssl,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
      }
    : {
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.name,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
      }
)

pool.on('error', (err) => {
  console.error('[pg] erreur inattendue sur un client inactif :', err.message)
})

/** Exécute une requête paramétrée. */
export function query(text, params) {
  return pool.query(text, params)
}

/**
 * Exécute une suite d'opérations dans une transaction.
 * `fn` reçoit un client dédié ; COMMIT/ROLLBACK sont gérés automatiquement.
 */
export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** Teste réellement la connexion à la base. */
export async function testConnection() {
  const { rows } = await pool.query('SELECT current_database() AS db, version() AS version')
  return rows[0]
}

export async function closePool() {
  await pool.end()
}
