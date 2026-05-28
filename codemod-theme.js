// ════════════════════════════════════════════════════════════════
// UNIVERSAL THEME CODEMOD
// Replaces hardcoded DARK-palette hex colors with theme var() tokens
// so Light / Gradient / Neon / Aurora / Glass themes work everywhere.
//
// SAFE BY DESIGN:
//  • Only touches clearly dark backgrounds, light text, gray muted.
//  • Leaves brand/accent colors (#6c8cff, #3dd68c, #ff6b6b...) untouched.
//  • Leaves #fff untouched (button text stays white).
//  • Skips theme.ts and globals.css (the source of truth).
//  • Backs up every changed file as <file>.themebak before editing.
//  • In DARK theme the result looks essentially identical.
//
// APPLY:  node codemod-theme.js
// UNDO :  node codemod-theme.js --undo
// ════════════════════════════════════════════════════════════════
const fs = require('fs')
const path = require('path')

const DIRS = ['pages', 'src']
const SKIP_DIRS = new Set(['node_modules', '.next', '.vercel', '.git'])
const SKIP_FILES = [
  path.normalize('src/components/theme.ts'),
  path.normalize('src/styles/globals.css'),
]
const UNDO = process.argv.includes('--undo')

// ── Hex → CSS variable mapping (lowercase keys) ──
const MAP = {
  '#050810':'var(--bg)', '#060913':'var(--bg)', '#0a0d14':'var(--bg)',
  '#0b0e14':'var(--bg)', '#0d0f14':'var(--bg)', '#0e1117':'var(--bg)',
  '#0e1018':'var(--bg)', '#080a0f':'var(--bg)', '#080c16':'var(--bg)',
  '#0f1117':'var(--bg)', '#111318':'var(--bg)', '#12161f':'var(--bg)',
  '#111827':'var(--bg2)', '#11182d':'var(--bg2)', '#1a1d24':'var(--bg2)',
  '#1a1d27':'var(--bg2)', '#161921':'var(--bg2)', '#1e2130':'var(--bg2)',
  '#1e2230':'var(--bg2)', '#1a1f2e':'var(--bg2)', '#151820':'var(--bg2)',
  '#1f2937':'var(--bg3)', '#22262f':'var(--bg3)', '#2a2f45':'var(--bg3)',
  '#2a2d35':'var(--bg3)', '#282d3a':'var(--bg3)', '#2a2e38':'var(--bg3)',
  '#374151':'var(--bg4)', '#4b5563':'var(--bg4)', '#3a3d4a':'var(--bg4)',
  '#e8eaf0':'var(--tx)', '#e5e7eb':'var(--tx)', '#d1d5db':'var(--tx)',
  '#f9fafb':'var(--tx)', '#c8c8d8':'var(--tx)', '#c8cad0':'var(--tx)',
  '#c8cad6':'var(--tx)',
  '#7a7f90':'var(--mu)', '#9ca3af':'var(--mu)', '#888':'var(--mu)',
  '#aaa':'var(--mu)', '#666':'var(--mu)', '#999':'var(--mu)',
  '#505468':'var(--mu2)', '#6b7280':'var(--mu2)', '#555':'var(--mu2)',
}

let changed = 0, total = 0, restored = 0
const report = []

function skip(rel){ return SKIP_FILES.some(s => rel.endsWith(s)) }

function applyFile(full) {
  const rel = path.normalize(full)
  if (skip(rel)) return
  let txt = fs.readFileSync(full, 'utf8')
  let hits = 0
  for (const [hex, varName] of Object.entries(MAP)) {
    const re = new RegExp(hex + '\\b', 'gi')
    const n = (txt.match(re) || []).length
    if (n) { txt = txt.replace(re, varName); hits += n }
  }
  if (hits > 0) {
    fs.copyFileSync(full, full + '.themebak')
    fs.writeFileSync(full, txt)
    changed++; total += hits
    report.push('  ' + rel + '  ->  ' + hits + ' replaced')
  }
}

function undoFile(full) {
  if (full.endsWith('.themebak')) {
    const orig = full.slice(0, -'.themebak'.length)
    fs.copyFileSync(full, orig)
    fs.unlinkSync(full)
    restored++
    report.push('  restored ' + path.normalize(orig))
  }
}

function walk(dir, fn) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, fn)
    else fn(full)
  }
}

if (UNDO) {
  console.log('\nUndoing theme codemod (restoring originals)...\n')
  DIRS.forEach(d => { if (fs.existsSync(d)) walk(d, undoFile) })
  console.log(report.join('\n') || '  (no .themebak files found)')
  console.log('\n✅ Restored ' + restored + ' files to original.\n')
} else {
  console.log('\nRunning universal theme codemod...\n')
  DIRS.forEach(d => { if (fs.existsSync(d)) walk(d, f => {
    if (/\.(tsx|ts|jsx|js)$/.test(f) && !f.endsWith('.bak') && !f.endsWith('.themebak')) applyFile(f)
  }) })
  console.log(report.join('\n') || '  (no matching colors found)')
  console.log('\n--------------------------------------------------')
  console.log('✅ Done. ' + total + ' colors replaced across ' + changed + ' files.')
  console.log('🛟 Each original saved as <file>.themebak')
  console.log('\nTo UNDO everything:  node codemod-theme.js --undo\n')
}
