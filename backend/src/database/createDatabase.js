/**
 * Création de la base de données si elle n'existe pas.
 * ------------------------------------------------
 * On se connecte à la base d'administration `postgres` puis on crée
 * la base applicative si nécessaire. Script idempotent.
 *
 * Usage : npm run db:create
 */
import pg from 'pg'
import { env } from '../config/env.js'

const { Client } = pg

async function main() {
  const client = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: 'postgres',
  })

  await client.connect()

  const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [env.db.name])

  if (rows.length > 0) {
    console.log(`[db] la base « ${env.db.name} » existe déjà.`)
  } else {
    // Le nom de base ne peut pas être passé en paramètre lié : on l'échappe.
    const safeName = `"${env.db.name.replace(/"/g, '""')}"`
    await client.query(`CREATE DATABASE ${safeName} ENCODING 'UTF8'`)
    console.log(`[db] base « ${env.db.name} » créée.`)
  }

  await client.end()
}

main().catch((err) => {
  console.error('[db] échec de la création de la base :', err.message)
  process.exit(1)
})
