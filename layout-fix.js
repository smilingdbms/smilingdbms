// layout-fix.js
// Removes the dangerouslySetInnerHTML style block from Layout.tsx
// Replaces local CSS vars with standard var(--bg), var(--ac) etc.
// Adds .os-sidebar-panel class for theme CSS overrides in globals.css

const fs = require('fs');
const path = require('path');

const LAYOUT = path.join(__dirname, 'src', 'components', 'Layout.tsx');
let c = fs.readFileSync(LAYOUT, 'utf8');
fs.copyFileSync(LAYOUT, LAYOUT + '.bak');

// ── 1. Remove the entire dangerouslySetInnerHTML style block ──
// This block defines --matte-black, --dark-panel etc. which conflict with globals.css
c = c.replace(/<style dangerouslySetInnerHTML=\{\{__html: `[\s\S]*?`\}\} \/>/, '');
// Also handle: <style dangerouslySetInnerHTML={{__html: `...`}} />
c = c.replace(/<style dangerouslySetInnerHTML=\{\{__html:`[\s\S]*?`\}\}\s*\/>/, '');

// ── 2. Replace Layout's local CSS var names with standard theme vars ──
// These were defined in the removed style block and used throughout
const replacements = [
  // Background colors
  ["'var(--matte-black)'",   "'var(--bg)'"],
  ["'var(--dark-panel)'",    "'var(--bg2)'"],     // will be overridden by .os-sidebar-panel
  ["'var(--border-color)'",  "'var(--bd)'"],
  ["'var(--electric-blue)'", "'var(--ac)'"],
  ["'var(--text-muted)'",    "'var(--mu)'"],
  ["'var(--text-light)'",    "'var(--tx)'"],
  // Hex codes that may remain
  ["'#050810'",  "'var(--bg)'"],
  ["'#11182D'",  "'var(--bg2)'"],
  ["'#070C1A'",  "'var(--nb)'"],
  ["'#0A0F1C'",  "'var(--nb)'"],
  ["'#374151'",  "'var(--bg4)'"],
  ["'#1F2937'",  "'var(--bg3)'"],
  ["'#9CA3AF'",  "'var(--mu)'"],
  ["'#F3F4F6'",  "'var(--tx)'"],
  ["'#60A5FA'",  "'var(--ac)'"],
  ["'#EF4444'",  "'var(--rd)'"],
  ["'#3B82F6'",  "'var(--ac)'"],
  // rgba hardcoded blues -> acbg
  ["'rgba(59,130,246,0.08)'",  "'var(--acbg)'"],
  ["'rgba(59,130,246,0.12)'",  "'var(--acbg)'"],
  ["'rgba(59,130,246,0.05)'",  "'var(--acbg)'"],
  ["'rgba(59, 130, 246, 0.08)'", "'var(--acbg)'"],
  ["'rgba(59, 130, 246, 0.12)'", "'var(--acbg)'"],
  // rgba reds -> rdbg
  ["'rgba(239,68,68,0.1)'",   "'var(--rdbg)'"],
  ["'rgba(239,68,68,0.2)'",   "'var(--rdbg)'"],
  ["'rgba(239,68,68,0.25)'",  "'var(--rdbg)'"],
  // CSS class string references in style objects
  ['background: "var(--dark-panel)"', 'background: "var(--bg2)"'],
];

replacements.forEach(([from, to]) => {
  c = c.split(from).join(to);
});

// ── 3. Add .os-sidebar-panel class to the sidebar div ──
// This is needed so globals.css can target the sidebar with [data-theme] overrides
// Find the sidebar div and add the className
c = c.replace(
  /(<div\s+)(className="os-sidebar"\s+style=\{\{)/g,
  '$1className="os-sidebar os-sidebar-panel" style={{'
);
// Also handle: style={{ without className
// The main sidebar div has: style={{ width: isCollapsed ...
// Add className if not present
c = c.replace(
  /(\/\* ═══ SIDEBAR ═══ \*\/\s*<div\s+)style=\{\{/,
  '$1className="os-sidebar-panel" style={{'
);

// ── 4. Add os-logo-text, os-logo-sub, os-user-name, os-user-role class names ──
// For light theme text color overrides
c = c.replace(
  /style=\{\{ fontWeight: 800, fontSize: 13, color: 'var\(--tx\)', lineHeight: 1\.2 \}\}/,
  'className="os-logo-text" style={{ fontWeight: 800, fontSize: 13, color: "var(--tx)", lineHeight: 1.2 }}'
);
c = c.replace(
  /style=\{\{ fontSize: '9px', color: 'var\(--mu\)', letterSpacing: '1\.2px', textTransform: 'uppercase' \}\}/,
  'className="os-logo-sub" style={{ fontSize: "9px", color: "var(--mu)", letterSpacing: "1.2px", textTransform: "uppercase" }}'
);

// ── 5. Ensure the logo "R" uses var(--ac) for neon glow ──
c = c.replace(
  /className="dn-logo-icon"/g,
  'className="dn-logo-icon os-logo-accent"'
);

// ── 6. Remove any stale .bak import references ──
c = c.replace(/import.*\.bak.*\n/g, '');

fs.writeFileSync(LAYOUT, c, 'utf8');
console.log('✅ Layout.tsx fixed:');
console.log('   - dangerouslySetInnerHTML style block removed');
console.log('   - Local CSS vars replaced with standard theme vars');
console.log('   - .os-sidebar-panel class added for theme CSS targeting');
console.log('');
console.log('Next: apply globals-theme-block.css changes, then npm run dev');
