// ════════════════════════════════════════════════════════════════
// COLOR SCANNER (read-only — changes NOTHING)
// Lists every hardcoded hex color used in pages/ and src/ with counts.
// Run from project root:  node scan-colors.js
// ════════════════════════════════════════════════════════════════
const fs = require('fs')
const path = require('path')

const DIRS = ['pages', 'src']
const SKIP = new Set(['node_modules', '.next', '.vercel', '.git'])
const counts = {}
let fileCount = 0

function walk(dir) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full)
    else if (/\.(tsx|ts|jsx|js|css)$/.test(e.name) && !e.name.endsWith('.bak')) {
      fileCount++
      const txt = fs.readFileSync(full, 'utf8')
      const hexes = txt.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []
      for (const h of hexes) {
        const k = h.toLowerCase()
        counts[k] = (counts[k] || 0) + 1
      }
    }
  }
}

DIRS.forEach(d => { if (fs.existsSync(d)) walk(d) })

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])

console.log(`\nScanned ${fileCount} files. Found ${sorted.length} distinct hex colors.\n`)
console.log('COLOR      COUNT')
console.log('---------------')
for (const [color, n] of sorted) {
  console.log(color.padEnd(10), n)
}
console.log('\n(This script changed nothing — read-only scan.)')
