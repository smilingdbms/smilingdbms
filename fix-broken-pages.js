// fix-broken-pages.js
// Removes stray <Layout> JSX tags from pages that _app.tsx already wraps
// Also removes DashboardNav imports/usage
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'pages', 'dashboard');

// ── Restore bd.tsx from backup first (patch corrupted it) ──
const bdBak = path.join(DIR, 'bd.tsx.bak2');
const bdFile = path.join(DIR, 'bd.tsx');
if (fs.existsSync(bdBak)) {
  fs.copyFileSync(bdBak, bdFile);
  console.log('✅ bd.tsx restored from backup');
} else if (fs.existsSync(path.join(DIR, 'bd.tsx.bak'))) {
  fs.copyFileSync(path.join(DIR, 'bd.tsx.bak'), bdFile);
  console.log('✅ bd.tsx restored from .bak');
}

const pages = fs.readdirSync(DIR).filter(f => f.endsWith('.tsx'));

pages.forEach(page => {
  const filePath = path.join(DIR, page);
  let c = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Skip if no Layout issues
  const hasLayoutJSX = c.includes('<Layout') || c.includes('</Layout>');
  const hasDashboardNav = c.includes('<DashboardNav') || c.includes('import DashboardNav');
  if (!hasLayoutJSX && !hasDashboardNav) return;

  fs.copyFileSync(filePath, filePath + '.bak3');

  // 1. Remove Layout import lines
  c = c.replace(/import Layout from ['"][^'"]+['"]\s*;?\n/g, '');

  // 2. Remove DashboardNav import
  c = c.replace(/import DashboardNav from ['"][^'"]+['"]\s*;?\n/g, '');

  // 3. Remove <DashboardNav ... /> (self-closing)
  c = c.replace(/<DashboardNav[^/]*\/>/g, '');

  // 4. Remove <Layout> and </Layout> (no props version)
  c = c.replace(/\n\s*<Layout>\n?/g, '\n');
  c = c.replace(/\n\s*<\/Layout>\n?/g, '\n');

  // 5. Remove <Layout with props> e.g. <Layout appUser={appUser} unreadCount={unreadCount}>
  c = c.replace(/<Layout[^>]*>/g, '');
  c = c.replace(/<\/Layout>/g, '');

  // 6. Fix bd.tsx specific issue: "return (<Layout>) =>" corruption
  // This happens when patch replaced </> inside a function with </Layout>
  c = c.replace(/return \(\s*<Layout>\)\s*=>/g, 'return () =>');
  c = c.replace(/<Layout>\)\s*=>/g, '() =>');

  // 7. Fix double fragments <><> → <>
  c = c.replace(/<>\s*\n\s*<>/g, '<>');
  c = c.replace(/<\/>\s*\n\s*<\/>/g, '</>');

  // 8. Clean empty lines (max 2 consecutive)
  c = c.replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(filePath, c, 'utf8');
  console.log(`✅ Fixed: ${page}`);
  changed = true;
});

console.log('\n✅ All broken pages fixed!');
console.log('Run: npm run build');
