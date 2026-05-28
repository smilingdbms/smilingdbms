// patch-remove-layout.js
// _app.tsx already wraps /dashboard/* with Layout
// So remove Layout import + wrapper from all individual dashboard pages

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, 'pages', 'dashboard');
const pages = fs.readdirSync(DASHBOARD_DIR).filter(f => f.endsWith('.tsx'));

let fixed = 0;

pages.forEach(page => {
  const filePath = path.join(DASHBOARD_DIR, page);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('import Layout from')) {
    console.log(`⏭️  No Layout: ${page}`);
    return;
  }

  // Backup
  fs.copyFileSync(filePath, filePath + '.bak2');

  // 1. Remove Layout import lines
  content = content.replace(/import Layout from ['"][^'"]+Layout['"];?\n/g, '');

  // 2. Replace <Layout> with <> (restore fragment)
  content = content.replace(/\n(\s+)<Layout>\n/g, '\n$1<>\n');

  // 3. Replace </Layout> with </> 
  content = content.replace(/\n(\s+)<\/Layout>/g, '\n$1</>');

  // 4. Clean up double fragments if any <><> pattern
  content = content.replace(/<>\s*\n\s*<>/g, '<>');
  content = content.replace(/<\/>\s*\n\s*<\/>/g, '</>');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Cleaned: ${page}`);
  fixed++;
});

console.log(`\n✅ Done! ${fixed} files cleaned.`);
console.log('_app.tsx handles Layout for all /dashboard/* pages.');
console.log('Run: npm run dev');
