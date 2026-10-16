/**
 * Recherche les traces de l'ancien nom de marque dans le projet.
 * Usage : node tools/scan-brand.mjs [motif]
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOTS = ['frontend', 'backend', 'tools']
const EXTS = new Set(['.js', '.jsx', '.json', '.html', '.css', '.md', '.sql', '.svg', '.example'])
const SKIP = new Set(['node_modules', '.git', 'dist', '.vite', 'package-lock.json'])

const pattern = new RegExp(process.argv[2] || 'mboa', 'i')
const hits = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
    } else if (EXTS.has(path.extname(entry.name)) || entry.name.startsWith('.env')) {
      const text = fs.readFileSync(full, 'utf8')
      if (!pattern.test(text)) continue
      text.split(/\r?\n/).forEach((line, i) => {
        if (pattern.test(line)) hits.push(`${full.replace(/\\/g, '/')}:${i + 1} :: ${line.trim()}`)
      })
    }
  }
}

for (const root of ROOTS) {
  if (fs.existsSync(root)) walk(root)
}

console.log(hits.length ? hits.join('\n') : `Aucune trace pour /${pattern.source}/i`)
console.log(`\n${hits.length} occurrence(s).`)
