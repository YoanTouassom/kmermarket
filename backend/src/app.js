/**
 * Application Express.
 * --------------------
 * Les routes sont montées sur `/api` et `/api/admin` pour laisser la
 * racine libre (healthcheck + futurs usages).
 */
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { env } from './config/env.js'
import { pool } from './database/pool.js'
import publicRoutes from './routes/publicRoutes.js'
import userRoutes from './routes/userRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')

  // Derrière le proxy Vercel (TLS terminé en amont), Express doit faire confiance
  // à `X-Forwarded-Proto` pour que les cookies `Secure` / `SameSite=None`
  // fonctionnent correctement en production.
  app.set('trust proxy', 1)

  app.use(
    cors({
      origin: env.cors.origin,
      credentials: true,
    })
  )
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))

  /** Sonde de santé (uptime, monitoring, vérification du déploiement). */
  app.get('/api/health', async (_req, res) => {
    // État de la base : uniquement un code (jamais l'URL ni le message brut).
    let db = 'ok'
    try {
      await pool.query('SELECT 1 FROM categories LIMIT 1')
    } catch (err) {
      db = `error:${err.code || 'unknown'}`
    }
    res.json({
      ok: true,
      service: 'kmermarket-api',
      db,
      dbConfigured: Boolean(env.db.url),
      time: new Date().toISOString(),
    })
  })

  app.use('/api', publicRoutes)
  app.use('/api', userRoutes)
  app.use('/api/admin', adminRoutes)

  app.use('/api', notFoundHandler)
  app.use(errorHandler)

  return app
}

export default createApp
