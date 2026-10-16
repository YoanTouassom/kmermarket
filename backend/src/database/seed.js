/**
 * Seed KmerMarket — remplit PostgreSQL avec les données initiales.
 * ---------------------------------------------------------------
 *   npm run db:seed
 *
 * Idempotent : catégories/produits par slug, contenu/paramètres par clé,
 * admin par email. Les commandes de démonstration ne sont créées que si
 * la table `orders` est vide (pour ne jamais polluer une base en usage).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { pool, testConnection, closePool } from './pool.js'
import { env } from '../config/env.js'
import { hashPassword } from '../services/authService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEED_FILE = path.join(__dirname, 'data', 'seed.json')

async function readSeed() {
  const raw = await fs.readFile(SEED_FILE, 'utf8')
  return JSON.parse(raw)
}

async function seedCategories(categories) {
  for (const c of categories || []) {
    await pool.query(
      `INSERT INTO categories (name, slug, description, icon, color, image)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name, description = EXCLUDED.description,
         icon = EXCLUDED.icon, color = EXCLUDED.color, image = EXCLUDED.image,
         updated_at = now()`,
      [c.name, c.slug, c.description || null, c.icon || 'Leaf', c.color || '#1b7f52', c.image || null]
    )
  }
  console.log(`[seed] ${(categories || []).length} catégories.`)
}

async function categoryIdBySlug(slug) {
  const { rows } = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug])
  return rows[0]?.id ?? null
}

const LEGACY_CATEGORY_IDS = {
  'cat-fruits': 'fruits',
  'cat-legumes': 'legumes',
  'cat-tubercules': 'tubercules',
  'cat-feculents': 'feculents',
  'cat-cereales': 'cereales',
  'cat-epices': 'epices',
  'cat-vivriers': 'produits-vivriers',
  'cat-frais': 'produits-frais',
}

async function seedProducts(products) {
  let count = 0
  for (const p of products || []) {
    const rawSlug = p.categoryId || p.categorySlug
    const slug = LEGACY_CATEGORY_IDS[rawSlug] || rawSlug
    const categoryId = slug ? await categoryIdBySlug(slug) : null
    const onSale =
      p.oldPrice !== null && p.oldPrice !== undefined && Number(p.oldPrice) > Number(p.price)
    await pool.query(
      `INSERT INTO products
         (category_id, name, slug, description, tagline, price, old_price, unit, stock,
          image, origin, rating, reviews, sold, tags, is_active, is_featured, is_new, is_on_sale)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (slug) DO UPDATE SET
         category_id = EXCLUDED.category_id, name = EXCLUDED.name,
         description = EXCLUDED.description, tagline = EXCLUDED.tagline,
         price = EXCLUDED.price, old_price = EXCLUDED.old_price, unit = EXCLUDED.unit,
         stock = EXCLUDED.stock, image = EXCLUDED.image, origin = EXCLUDED.origin,
         rating = EXCLUDED.rating, reviews = EXCLUDED.reviews, sold = EXCLUDED.sold,
         tags = EXCLUDED.tags, is_active = EXCLUDED.is_active,
         is_featured = EXCLUDED.is_featured, is_new = EXCLUDED.is_new,
         is_on_sale = EXCLUDED.is_on_sale, updated_at = now()`,
      [
        Number.isFinite(Number(categoryId)) ? Number(categoryId) : null,
        p.name, p.slug, p.description || '', p.tagline || '',
        Number(p.price) || 0,
        p.oldPrice === null || p.oldPrice === undefined ? null : Number(p.oldPrice),
        p.unit || 'Unité', Math.max(Number.parseInt(p.stock, 10) || 0, 0),
        p.image || '', p.origin || '', Number(p.rating) || 0,
        Number.parseInt(p.reviews, 10) || 0, Number.parseInt(p.sold, 10) || 0,
        Array.isArray(p.tags) ? p.tags : [],
        p.available !== false, !!p.featured, !!p.isNew, !!onSale,
      ]
    )
    count += 1
  }
  console.log(`[seed] ${count} produits.`)
}

async function writeJson(table, key, value) {
  await pool.query(
    `INSERT INTO ${table} (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  )
}
async function seedContent(seed) {
  const content = { ...(seed.siteContent || {}) }
  if (seed.testimonials) content.testimonials = seed.testimonials
  await writeJson('site_content', 'site', content)
  await writeJson('site_settings', 'app', seed.settings || {})
  console.log('[seed] contenu + paramÃ¨tres.')
}

async function seedAdmin() {
  const email = String(env.admin.email || '').trim().toLowerCase()
  const password = String(env.admin.password || '')

  if (!email || !password) {
    console.log('[seed] admin ignorÃ© (ADMIN_EMAIL / ADMIN_PASSWORD non dÃ©finis dans .env).')
    return
  }

  const passwordHash = await hashPassword(password)
  const { rows } = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [email])

  if (rows[0]) {
    await pool.query(
      `UPDATE users SET first_name = $2, last_name = $3, phone = $4,
        password_hash = $5, role = 'admin', is_active = TRUE, updated_at = now()
       WHERE id = $1`,
      [rows[0].id, env.admin.firstName || 'Admin', env.admin.lastName || 'KmerMarket', env.admin.phone || null, passwordHash]
    )
    console.log(`[seed] admin Â« ${email} Â» mis Ã  jour.`)
  } else {
    const created = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
       VALUES ($1,$2,$3,$4,$5,'admin') RETURNING id`,
      [env.admin.firstName || 'Admin', env.admin.lastName || 'KmerMarket', email, env.admin.phone || null, passwordHash]
    )
    await pool.query('INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [
      created.rows[0].id,
    ])
    console.log(`[seed] admin Â« ${email} Â» crÃ©Ã©.`)
  }
}

async function seedDemoOrders() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM orders')
  if ((rows[0]?.total || 0) > 0) {
    console.log('[seed] commandes existantes : dÃ©mo ignorÃ©e.')
    return
  }

  const { rows: users } = await pool.query(
    "SELECT id, first_name, last_name, email, phone FROM users WHERE role = 'customer' ORDER BY id LIMIT 3"
  )
  const { rows: products } = await pool.query(
    'SELECT id, name, unit, price, image FROM products WHERE is_active = TRUE ORDER BY id LIMIT 12'
  )
  if (!products.length) {
    console.log('[seed] aucun produit : dÃ©mo commandes ignorÃ©e.')
    return
  }

  const buyer = users[0] || null
  const statuses = ['delivered', 'delivered', 'shipping', 'pending']

  for (let i = 0; i < 4; i += 1) {
    const lines = [0, 1, 2].map((k) => {
      const p = products[(i * 3 + k) % products.length]
      const quantity = 1 + ((i + k) % 3)
      return { ...p, quantity, line: Math.round(Number(p.price) * quantity) }
    })
    const subtotal = lines.reduce((s, l) => s + l.line, 0)
    const fee = subtotal >= 25000 ? 0 : 1500
    const status = statuses[i % statuses.length]
    const placedAt = new Date(Date.now() - (6 - i) * 86400000)

    const created = await pool.query(
      `INSERT INTO orders
         (user_id, order_number, status, subtotal, delivery_fee, total,
          payment_method, payment_status, customer_first_name, customer_last_name,
          customer_email, customer_phone, city, neighborhood, address, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,'cash',$7,$8,$9,$10,$11,'Douala','Akwa','123 rue Joffre',$12)
       RETURNING id`,
      [
        buyer?.id ?? null, `KM-DEMO-${String(i + 1).padStart(3, '0')}`, status,
        subtotal, fee, subtotal + fee, status === 'delivered' ? 'paid' : 'pending',
        buyer?.first_name || 'Awa', buyer?.last_name || 'Ndiaye',
        buyer?.email || 'awa.ndiaye@example.cm', buyer?.phone || '+237 6 90 00 00 01',
        placedAt.toISOString(),
      ]
    )

    for (const l of lines) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit, unit_price, quantity, subtotal, image)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [created.rows[0].id, l.id, l.name, l.unit, l.price, l.quantity, l.line, l.image]
      )
    }
    await pool.query('INSERT INTO order_status_history (order_id, status) VALUES ($1, $2)', [
      created.rows[0].id, status,
    ])
  }
  console.log('[seed] 4 commandes de dÃ©monstration.')
}

async function main() {
  const info = await testConnection()
  console.log(`[seed] connectÃ© Ã  Â« ${info.db} Â»`)

  const seed = await readSeed()
  await seedCategories(seed.categories)
  await seedProducts(seed.products)
  await seedContent(seed)
  await seedAdmin()
  await seedDemoOrders()

  console.log('[seed] terminÃ©.')
}

main()
  .catch((err) => {
    console.error('[seed] Ã©chec :', err.message)
    process.exitCode = 1
  })
  .finally(closePool)
