/**
 * Vérification de cohérence du projet KmerMarket.
 * ------------------------------------------------
 * Usage : npm run verify
 * Contrôle : fichiers requis, variables d'env documentées,
 * absence de secrets versionnés, contrats frontend/backend.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

let failures = 0
const ok = (label) => console.log(`  ✅ ${label}`)
const fail = (label, hint = '') => {
  failures += 1
  console.log(`  ❌ ${label}${hint ? ` — ${hint}` : ''}`)
}

const exists = (p) => fs.existsSync(path.join(root, p))

console.log('\n🔍 KmerMarket — vérification du projet\n')

/* ---------- 1. Fichiers requis ---------- */
console.log('📁 Fichiers requis :')
const required = [
  'package.json',
  'backend/Dockerfile',
  'DEPLOY.md',
  '.env.production.example',
  'backend/package.json',
  'backend/.env.example',
  'backend/src/server.js',
  'backend/src/app.js',
  'backend/src/config/env.js',
  'backend/src/database/pool.js',
  'backend/src/database/schema.sql',
  'backend/src/database/migrate.js',
  'backend/src/database/seed.js',
  'frontend/package.json',
  'frontend/vite.config.js',
  'frontend/vercel.json',
  'frontend/index.html',
  'frontend/src/main.jsx',
  'frontend/src/App.jsx',
  'frontend/src/services/api.js',
]
for (const f of required) {
  if (exists(f)) ok(f)
  else fail(f, 'fichier manquant')
}

/* ---------- 2. Secrets non versionnés ---------- */
console.log('\n🔐 Secrets :')
const secretFiles = ['backend/.env', 'frontend/.env', 'frontend/.env.local']
for (const f of secretFiles) {
  const content = exists('.gitignore')
    ? fs.readFileSync(path.join(root, '.gitignore'), 'utf8')
    : ''
  const backendIgnore = exists('backend/.gitignore')
    ? fs.readFileSync(path.join(root, 'backend/.gitignore'), 'utf8')
    : ''
  const ignored =
    content.includes('.env') || backendIgnore.includes(path.basename(f)) || backendIgnore.includes('.env')
  if (ignored) ok(`${f} ignoré par git`)
  else fail(`${f} potentiellement versionné`, 'ajoutez-le au .gitignore')
}

/* ---------- 3. Variables d'environnement documentées ---------- */
console.log('\n⚙️  Variables documentées (.env.example) :')
try {
  const example = fs.readFileSync(path.join(root, 'backend/.env.example'), 'utf8')
  const envSrc = fs.readFileSync(path.join(root, 'backend/src/config/env.js'), 'utf8')
  const used = [...envSrc.matchAll(/process\.env\.([A-Z_]+)/g)].map((m) => m[1])
  const missing = [...new Set(used)].filter((k) => !example.includes(k))
  if (missing.length === 0) ok(`toutes les variables (${[...new Set(used)].length}) documentées`)
  else fail(`variables non documentées : ${missing.join(', ')}`)
} catch {
  fail("lecture de backend/.env.example ou config/env.js impossible")
}

/* ---------- 4. Contrats frontend/backend ---------- */
console.log('\n🔌 Contrats :')
try {
  const api = fs.readFileSync(path.join(root, 'frontend/src/services/api.js'), 'utf8')
  if (api.includes('VITE_API_URL')) ok('frontend lit VITE_API_URL')
  else fail('VITE_API_URL absent de frontend/src/services/api.js')

  const app = fs.readFileSync(path.join(root, 'backend/src/app.js'), 'utf8')
  if (app.includes('/api/health')) ok('healthcheck /api/health présent')
  else fail('healthcheck /api/health absent de backend/src/app.js')

  const auth = fs.readFileSync(
    path.join(root, 'backend/src/controllers/authController.js'),
    'utf8'
  )
  if (auth.includes("sameSite: isProd ? 'none' : 'lax'")) ok('cookie cross-domain prod/ local OK')
  else fail('logique sameSite prod/local absente de authController.js')

  const pool = fs.readFileSync(path.join(root, 'backend/src/database/pool.js'), 'utf8')
  if (pool.includes('DATABASE_URL') || pool.includes('connectionString'))
    ok('pool compatible DATABASE_URL (Neon/Koyeb/Railway)')
  else fail('pool incompatible DATABASE_URL', 'voir backend/src/database/pool.js')
} catch {
  fail('lecture des fichiers de contrat impossible')
}

/* ---------- Résultat ---------- */
console.log('')
if (failures > 0) {
  console.log(`❌ ${failures} problème(s) détecté(s). Corrigez avant de déployer.\n`)
  process.exit(1)
}
console.log('✅ Projet cohérent — prêt pour le déploiement (voir DEPLOY.md).\n')
