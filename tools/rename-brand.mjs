/**
 * Utilitaire ponctuel : renomme la marque « Mboa Fresh » en « KmerMarket »
 * dans tout le code source (hors node_modules, dist et fichiers Markdown).
 *
 * Usage : node tools/rename-brand.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const roots = ['frontend', 'backend']
const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.svg', '.sql', '.example', '.config'])
const skip = /node_modules|[\\/]dist[\\/]|\.vercel|package-lock\.json|\.md$|\.env$/

const rules = [
  [/mboa-fresh/gi, 'kmer-market'],
  [/mboafresh/gi, 'kmermarket'],
  [/Mboa Fresh/g, 'KmerMarket'],
  [/MboaFresh/g, 'KmerMarket'],
  [/mboaFresh/g, 'kmerMarket'],
  [/Mboa/g, 'Kmer'],
  [/mboa/g, 'kmer'],
]

let changed = 0

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (skip.test(full)) continue
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!exts.has(path.extname(entry.name))) continue

    const before = fs.readFileSync(full, 'utf8')
    let after = before
    for (const [re, to] of rules) after = after.replace(re, to)
    if (after !== before) {
      fs.writeFileSync(full, after, 'utf8')
      console.log('  updated:', path.relative(process.cwd(), full))
      changed += 1
    }
  }
}

for (const root of roots) {
  if (fs.existsSync(root)) walk(root)
}

console.log(`\n${changed} fichier(s) mis a jour.`)
