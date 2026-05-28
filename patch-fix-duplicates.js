// patch-fix-duplicates.js
// 1. Removes duplicate Layout imports from all dashboard pages
// 2. Fixes bd.tsx and ao.tsx Layout wrapping
const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, 'pages', 'dashboard');

// ── FIX DUPLICATE LAYOUT IMPORTS ──
const ALL_PAGES = fs.readdirSync(DASHBOARD_DIR).filter(f => f.endsWith('.tsx'));

ALL_PAGES.forEach(page => {
  const filePath = path.join(DASHBOARD_DIR, page);
  let content = fs.readFileSync(filePath, 'utf8');

  // Count Layout imports
  const matches = content.match(/import Layout from ['"].*\/Layout['"]\;?/g);
  if (matches && matches.length > 1) {
    // Keep only the first one, remove duplicates
    let first = true;
    content = content.replace(/import Layout from ['"].*\/Layout['"]\;?\n/g, (match) => {
      if (first) { first = false; return `import Layout from '../../src/components/Layout';\n`; }
      return ''; // remove duplicate
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed duplicate Layout import: ${page}`);
  }
});

// ── FIX bd.tsx ──
const bdPath = path.join(DASHBOARD_DIR, 'bd.tsx');
let bd = fs.readFileSync(bdPath, 'utf8');

if (!bd.includes('<Layout>')) {
  // Add import
  if (!bd.includes("import Layout")) {
    bd = `import Layout from '../../src/components/Layout';\n` + bd;
  }
  // bd.tsx return is at line 220, pattern: "  return (\n    <>"
  // Wrap the return content
  bd = bd.replace(/(\n  return \()\n(\s+<>)/, '$1\n    <Layout>\n$2');
  bd = bd.replace(/(\n    <\/>\n  \);)(\s*\n\})/, '\n    </Layout>$1$2');

  // If that didn't work, try simpler pattern
  if (!bd.includes('<Layout>')) {
    bd = bd.replace('  return (', '  return (\n    <Layout>');
    // Find last ); before closing }
    const lastParen = bd.lastIndexOf('\n  );');
    if (lastParen !== -1) {
      bd = bd.substring(0, lastParen) + '\n    </Layout>' + bd.substring(lastParen);
    }
  }

  fs.copyFileSync(bdPath, bdPath + '.bak');
  fs.writeFileSync(bdPath, bd, 'utf8');
  console.log('✅ Fixed bd.tsx');
} else {
  console.log('✅ bd.tsx already has Layout');
}

// ── FIX ao.tsx ──
const aoPath = path.join(DASHBOARD_DIR, 'ao.tsx');
let ao = fs.readFileSync(aoPath, 'utf8');

if (!ao.includes('<Layout>')) {
  // Add import after first line
  if (!ao.includes("import Layout")) {
    ao = ao.replace(
      /^(\/\/ @ts-nocheck\n)/,
      `// @ts-nocheck\nimport Layout from '../../src/components/Layout';\n`
    );
    // If no @ts-nocheck
    if (!ao.includes("import Layout")) {
      ao = `import Layout from '../../src/components/Layout';\n` + ao;
    }
  }

  // ao.tsx return is simple: "  return (\n    <>"
  // Remove ao's own sidebar div and wrap with Layout instead
  ao = ao.replace(
    /(\n  return \()\n(\s+<>)/,
    '$1\n    <Layout>\n$2'
  );

  // Last </> before closing
  const lastFrag = ao.lastIndexOf('\n    </>');
  if (lastFrag !== -1) {
    ao = ao.substring(0, lastFrag + '\n    </>'.length)
      + '\n    </Layout>'
      + ao.substring(lastFrag + '\n    </>'.length);
  }

  fs.copyFileSync(aoPath, aoPath + '.bak');
  fs.writeFileSync(aoPath, ao, 'utf8');
  console.log('✅ Fixed ao.tsx');
} else {
  console.log('✅ ao.tsx already has Layout');
}

console.log('\n✅ All fixes done! Run: npm run dev');
