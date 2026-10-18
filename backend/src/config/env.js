/**
 * Configuration centralisée lue depuis .env
 * -----------------------------------------
 * Aucun secret n'est écrit en dur dans le code : tout passe par l'environnement.
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// backend/.env (racine du dossier backend)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

function required(key, fallback = undefined) {
  const value = process.env[key] ?? fallback
  if (value === undefined || value === '') {
    throw new Error(`Variable d'environnement manquante : ${key}`)
  }
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),

  db: {
    // DATABASE_URL prioritaire (Neon). Sinon champs séparés (local).
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'kmermarket',
    // SSL exigé par la plupart des Postgres managés. Forcer 'false' en local si besoin.
    ssl:
      process.env.DB_SSL === 'false'
        ? false
        : process.env.DB_SSL === 'true' || !!process.env.DATABASE_URL
          ? { rejectUnauthorized: false }
          : false,
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  admin: {
    firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
    lastName: process.env.ADMIN_LAST_NAME || 'KmerMarket',
    email: process.env.ADMIN_EMAIL || 'admin@kmermarket.cm',
    phone: process.env.ADMIN_PHONE || '',
    password: process.env.ADMIN_PASSWORD || '',
  },
}

export const isProd = env.nodeEnv === 'production'
