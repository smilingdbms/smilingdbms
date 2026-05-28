// patch-layout-v2.js — Fixed version
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages', 'dashboard', 'index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// ── STEP 1: Add Layout import ──
const LAYOUT_IMPORT = `import Layout from '../../src/components/Layout';`;
if (content.includes(LAYOUT_IMPORT)) {
  console.log('✅ Layout import already exists.');
} else {
  content = content.replace(
    `import { supabase } from '../../src/lib/supabase';`,
    `import { supabase } from '../../src/lib/supabase';\n${LAYOUT_IMPORT}`
  );
  console.log('✅ Layout import added.');
}

// ── STEP 2: Find the export default function and its return ──
// The main component return uses <> fragment. We need to:
// Replace the FIRST <> after "return (" in the main component with <Layout>
// And replace the LAST </> before the function closing with </Layout>

if (content.includes('<Layout>')) {
  console.log('✅ Layout wrapper already present.');
  fs.writeFileSync(filePath, content, 'utf8');
  process.exit(0);
}

// Find "export default function" position
const exportIdx = content.indexOf('export default function');
if (exportIdx === -1) {
  console.error('❌ Could not find export default function');
  process.exit(1);
}

// Find "return (" after the export default function
const returnIdx = content.indexOf('\n  return (', exportIdx);
if (returnIdx === -1) {
  console.error('❌ Could not find main return statement');
  process.exit(1);
}

// Find the first <> or <div after return (
const afterReturn = content.indexOf('\n    <>', returnIdx);
const afterReturnDiv = content.indexOf('\n    <div', returnIdx);

let wrapStart, originalOpen, newOpen;

if (afterReturn !== -1 && (afterReturnDiv === -1 || afterReturn < afterReturnDiv)) {
  // Root is Fragment <>
  wrapStart = afterReturn;
  originalOpen = '\n    <>';
  newOpen = '\n    <Layout>';
  console.log('📌 Root element: Fragment <>');
} else if (afterReturnDiv !== -1) {
  // Root is <div
  // We'll wrap outside the div
  wrapStart = returnIdx;
  // Just insert <Layout> right after "return ("
  content = content.substring(0, returnIdx + '\n  return ('.length)
    + '\n    <Layout>'
    + content.substring(returnIdx + '\n  return ('.length);
  // Now find the last ); of the function and add </Layout> before it
  const lastBrace = content.lastIndexOf('\n}');
  const lastParen = content.lastIndexOf('\n  );', lastBrace);
  if (lastParen !== -1) {
    content = content.substring(0, lastParen)
      + '\n    </Layout>'
      + content.substring(lastParen);
    console.log('✅ Layout wrapped around <div> root.');
  }
  // Save
  fs.copyFileSync(filePath, filePath + '.bak');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('💾 Saved. Test: npm run dev → localhost:3000/dashboard');
  process.exit(0);
} else {
  console.error('❌ Could not find root JSX element');
  process.exit(1);
}

// Replace first <> with <Layout>
content = content.substring(0, wrapStart)
  + newOpen
  + content.substring(wrapStart + originalOpen.length);

// Now find the matching </> — it's the LAST </> before the function closing }
// Find last occurrence of '\n    </>'
const lastFrag = content.lastIndexOf('\n    </>');
if (lastFrag === -1) {
  // Try without indent
  const lastFrag2 = content.lastIndexOf('</>');
  if (lastFrag2 === -1) {
    console.error('❌ Could not find closing </> fragment');
    process.exit(1);
  }
  content = content.substring(0, lastFrag2)
    + '</Layout>'
    + content.substring(lastFrag2 + '</>'.length);
} else {
  content = content.substring(0, lastFrag)
    + '\n    </Layout>'
    + content.substring(lastFrag + '\n    </>'.length);
}

console.log('✅ Layout wrapper added.');

// ── STEP 3: Save ──
fs.copyFileSync(filePath, filePath + '.bak');
console.log('💾 Backup saved: index.tsx.bak');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Patch complete! Run: npm run dev');
