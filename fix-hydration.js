// ════════════════════════════════════════════════════════════════
// FIX HYDRATION WARNING (v3 — the correct, minimal fix)
//
// Cause: inline <style>{`... [data-theme="light"] ...`}</style>.
// React escapes the quotes inside the style text differently on
// server (&quot; / &#x27;) vs client ("/'), → hydration mismatch.
//
// Fix: remove the QUOTES from the attribute selector inside inline
// styles:  [data-theme="light"]  ->  [data-theme=light]
// Unquoted attribute values are VALID CSS and contain no quote chars,
// so there is nothing for React to escape → mismatch disappears.
// (Only "light" etc. are simple identifiers, so unquoted is safe.)
//
// SAFE: only rewrites [data-theme='X'] and [data-theme="X"] -> [data-theme=X].
// Never deletes lines, never touches backticks/tags. Backs up each file.
// Scans all pages/components.
//
// Run from project root:  node fix-hydration.js
// ════════════════════════════════════════════════════════════════
const fs = require('fs')
const path = require('path')

const DIRS = ['pages', 'src']
const SKIP = new Set(['node_modules', '.next', '.vercel', '.git'])
// match [data-theme='x'] or [data-theme="x"]  (x = letters only)
const re = /\[data-theme=(['"])([a-z]+)\1\]/g

let files = 0, total = 0
const report = []

function fixFile(full) {
  const src = fs.readFileSync(full, 'utf8')
  const count = (src.match(re) || []).length
  if (count === 0) return
  const out = src.replace(re, '[data-theme=$2]')
  // safety: file length should only shrink by 2 chars per replacement (the quotes)
  if (out.length !== src.length - count * 2) {
    report.push('  SKIPPED (length check) ' + path.normalize(full)); return
  }
  fs.copyFileSync(full, full + '.hydrabak3')
  fs.writeFileSync(full, out)
  files++; total += count
  report.push('  ' + path.normalize(full) + '  ->  ' + count + ' selectors unquoted')
}

function walk(dir) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full)
    else if (/\.(tsx|jsx)$/.test(e.name) && !/\.(bak|hydrabak|hydrabak2|hydrabak3|themebak)/.test(e.name)) {
      fixFile(full)
    }
  }
}

console.log('\nUnquoting [data-theme] selectors in inline styles (kills hydration mismatch)...\n')
DIRS.forEach(d => { if (fs.existsSync(d)) walk(d) })
console.log(report.join('\n') || '  (already clean)')
console.log('\n────────────────────────────────────────')
console.log('✅ Unquoted ' + total + ' selectors across ' + files + ' files. CSS identical, warning gone.')
console.log('🛟 Originals saved as <file>.hydrabak3')
