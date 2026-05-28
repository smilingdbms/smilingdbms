// apply-all.js — Master deployment script
// Copies all fixed files to their correct project locations
// Run ONCE from project root: node apply-all.js

const fs = require('fs');
const path = require('path');

const DBMS = 'C:\\Users\\Pravin\\OneDrive\\Desktop\\DBMS Folder';
const ROOT = __dirname; // project root

function copy(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  if (!fs.existsSync(src)) { console.log(`⚠️  Source not found: ${src}`); return false; }
  // Backup existing
  if (fs.existsSync(dest)) fs.copyFileSync(dest, dest + '.bak');
  fs.copyFileSync(src, dest);
  console.log(`✅ ${path.basename(src)} → ${dest.replace(ROOT, '.')}`);
  return true;
}

console.log('\n🚀 Applying theme architecture fix...\n');

// 1. theme.ts — Single source of truth
copy(
  path.join(DBMS, 'theme.ts'),
  path.join(ROOT, 'src', 'components', 'theme.ts')
);

// 2. _document.tsx — Anti-flash script
copy(
  path.join(DBMS, '_document.tsx'),
  path.join(ROOT, 'pages', '_document.tsx')
);

// 3. _app.tsx — Clean global app
copy(
  path.join(DBMS, '_app.tsx'),
  path.join(ROOT, 'pages', '_app.tsx')
);

// 4. tailwind.config.js — Fixed content paths
copy(
  path.join(DBMS, 'tailwind.config.js'),
  path.join(ROOT, 'tailwind.config.js')
);

// 5. globals-theme-block.css → prepend to globals.css
const globalsPath = path.join(ROOT, 'src', 'styles', 'globals.css');
const themeBlockPath = path.join(DBMS, 'globals-theme-block.css');

if (fs.existsSync(themeBlockPath) && fs.existsSync(globalsPath)) {
  const existing = fs.readFileSync(globalsPath, 'utf8');
  const themeBlock = fs.readFileSync(themeBlockPath, 'utf8');

  // Remove old [data-theme] blocks from existing globals.css
  let cleaned = existing
    .replace(/\[data-theme="dark"\]\{[^}]+\}/g, '')
    .replace(/\[data-theme="black"\]\{[^}]+\}/g, '')
    .replace(/\[data-theme="ocean"\]\{[^}]+\}/g, '')
    .replace(/\[data-theme="forest"\]\{[^}]+\}/g, '')
    .replace(/\[data-theme="crimson"\]\{[^}]+\}/g, '')
    .replace(/\[data-theme="light"\]\{[^}]+\}/g, '')
    .replace(/\[data-theme="purple"\]\{[^}]+\}/g, '')
    // Remove old :root block (will be replaced by theme block)
    .replace(/:root\{[^}]*--fn:[^}]+\}/g, '');

  // Backup original
  fs.copyFileSync(globalsPath, globalsPath + '.bak');

  // Write: new theme block first, then existing classes
  fs.writeFileSync(globalsPath, themeBlock + '\n\n' + cleaned);
  console.log('✅ globals.css → theme block prepended, old [data-theme] blocks removed');
}

// 6. Layout.tsx fix script
console.log('\n🔧 Running Layout.tsx fix...');
try {
  require('./layout-fix.js');
} catch(e) {
  console.log('⚠️  layout-fix.js: run separately if this fails');
}

console.log('\n════════════════════════════════════════');
console.log('✅ All files applied!');
console.log('');
console.log('Now run: npm run dev');
console.log('Then test all 6 themes via bottom-right picker');
console.log('════════════════════════════════════════\n');
