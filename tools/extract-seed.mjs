/**
 * Utilitaire ponctuel : exporte le catalogue du frontend vers un JSON
 * consommé par le seed PostgreSQL du backend.
 *
 * Usage : node tools/extract-seed.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { categories } from '../frontend/src/data/categories.js'
import { products } from '../frontend/src/data/products.js'
import { testimonials } from '../frontend/src/data/testimonials.js'
import { siteContent, settings } from '../frontend/src/data/content.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'backend', 'src', 'database', 'data')
fs.mkdirSync(outDir, { recursive: true })

const payload = { categories, products, testimonials, siteContent, settings }
const outFile = path.join(outDir, 'seed.json')
fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8')

console.log(`seed.json ecrit : ${categories.length} categories, ${products.length} produits, ${testimonials.length} temoignages`)
