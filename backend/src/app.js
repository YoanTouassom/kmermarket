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
import publicRoutes from './routes/publicRoutes.js'
import userRoutes from './routes/userRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')

  // Derrière Koyeb (TLS terminé par le proxy), Express doit faire confiance
  // à `X-Forwarded-Proto` pour que les cookies `Secure` / `SameSite=None`
  // fonctionnent correctement en production cross-domain (Vercel ↔ Koyeb).
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
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'kmermarket-api', time: new Date().toISOString() })
  })

  app.use('/api', publicRoutes)
  app.use('/api', userRoutes)
  app.use('/api/admin', adminRoutes)

  app.use('/api', notFoundHandler)
  app.use(errorHandler)

  return app
}

export default createApp
