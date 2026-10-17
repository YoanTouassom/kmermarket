/**
 * Point d'entrée du serveur HTTP.
 * -------------------------------
 * Démarre l'application Express sur le port configuré et affiche
 * un récapitulatif utile en développement.
 */
import { createApp } from './app.js'
import { env } from './config/env.js'
import { testConnection, closePool } from './database/pool.js'
import { runMigrations } from './database/migrate.js'

async function main() {
  try {
    const info = await testConnection()
    console.log(`[api] PostgreSQL connecté : « ${info.db} »`)
  } catch (err) {
    console.error('[api] impossible de joindre PostgreSQL :', err.message)
    console.error('[api] vérifiez DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME dans backend/.env')
    process.exitCode = 1
    return
  }

  // En production (Render), le schéma est appliqué automatiquement à chaque
  // démarrage : les déploiements mettent la base à jour sans action manuelle.
  // `schema.sql` est idempotent (CREATE TABLE IF NOT EXISTS…) : sans danger.
  if (process.env.DB_AUTO_MIGRATE !== 'false') {
    try {
      await runMigrations()
    } catch (err) {
      console.error('[api] échec de la migration automatique :', err.message)
      process.exitCode = 1
      return
    }
  }

  const app = createApp()
  const server = app.listen(env.port, () => {
    console.log(`[api] KmerMarket API → http://localhost:${env.port}/api/health`)
    console.log(`[api] CORS autorisé : ${env.cors.origin.join(', ')}`)
  })

  const shutdown = (signal) => {
    console.log(`[api] ${signal} reçu, arrêt…`)
    server.close(() => closePool().finally(() => process.exit(0)))
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main()
