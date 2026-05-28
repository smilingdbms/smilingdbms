// patch-all-pages.js
// 1. Adds Layout import + wrapper to all dashboard pages
// 2. Removes old DashboardNav import + usage
// Run from project root: node patch-all-pages.js

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, 'pages', 'dashboard');

// Pages to patch (skip index.tsx — already done)
const PAGES = [
  'admin.tsx', 'analytics.tsx', 'applications.tsx', 'bd.tsx',
  'communications.tsx', 'companies.tsx', 'company.tsx', 'company-permissions.tsx',
  'import.tsx', 'interviews.tsx', 'invite.tsx', 'jobs.tsx',
  'permissions.tsx', 'settings.tsx', 'stakeholders.tsx',
  'add-profile.tsx', 'new-candidate.tsx', 'ao.tsx',
  'dashboard_bugs_fixed.tsx'
];

// Layout import line (relative from pages/dashboard/)
const LAYOUT_IMPORT = `import Layout from '../../src/components/Layout';`;

let patched = 0;
let skipped = 0;
let errors = [];

PAGES.forEach(page => {
  const filePath = path.join(DASHBOARD_DIR, page);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping (not found): ${page}`);
    skipped++;
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // ── Check if already patched ──
  if (content.includes('<Layout>') || content.includes('<Layout ')) {
    console.log(`✅ Already has Layout: ${page}`);
    skipped++;
    return;
  }

  // ── Backup ──
  fs.copyFileSync(filePath, filePath + '.bak');

  // ── STEP 1: Remove DashboardNav import ──
  content = content.replace(/import DashboardNav from[^\n]+\n/g, '');

  // ── STEP 2: Remove DashboardNav JSX usage (self-closing and wrapped) ──
  content = content.replace(/<DashboardNav[^/]*\/>/g, '');
  content = content.replace(/<DashboardNav[^>]*>[\s\S]*?<\/DashboardNav>/g, '');

  // ── STEP 3: Add Layout import ──
  if (!content.includes(LAYOUT_IMPORT)) {
    // Add after first import line
    const firstImportEnd = content.indexOf('\n', content.indexOf('import '));
    if (firstImportEnd !== -1) {
      content = content.substring(0, firstImportEnd + 1)
        + LAYOUT_IMPORT + '\n'
        + content.substring(firstImportEnd + 1);
    }
  }

  // ── STEP 4: Wrap main return with Layout ──
  // Find export default function
  const exportIdx = content.indexOf('export default function');
  if (exportIdx === -1) {
    // Try arrow function export
    const arrowIdx = content.indexOf('export default ');
    if (arrowIdx === -1) {
      errors.push(`${page}: no export default found`);
      return;
    }
  }

  // Find the main component's return (2-space indent)
  // Try patterns: "\n  return (\n    <>" or "\n  return (\n    <div"
  const patterns = [
    { find: /(\n  return \(\n)(\s+<>)/, fragTag: true },
    { find: /(\n  return \(\n)(\s+<div)/, fragTag: false },
    { find: /(\n  return \(\n)(\s+<main)/, fragTag: false },
    { find: /(\n  return \(\n)(\s+<section)/, fragTag: false },
    { find: /(\n  return \(\n)(\s+<)/, fragTag: false },
    // No-indent variant
    { find: /(\n return \(\n)(\s+<)/, fragTag: false },
  ];

  let wrapped = false;

  for (const pat of patterns) {
    const match = pat.find.exec(content);
    if (match) {
      // Insert <Layout> right after "return (\n"
      const insertPos = match.index + match[1].length;
      content = content.substring(0, insertPos)
        + '    <Layout>\n'
        + content.substring(insertPos);

      // Now find the last closing tag before function end
      // For fragment: last </> → </Layout>
      // For div/main: wrap differently — add </Layout> before last );
      const lastBrace = content.lastIndexOf('\n}');
      const lastParen = content.lastIndexOf('\n  );', lastBrace);

      if (lastParen !== -1) {
        content = content.substring(0, lastParen)
          + '\n    </Layout>'
          + content.substring(lastParen);
        wrapped = true;
      } else {
        // Try last </div> or </>
        const lastDiv = content.lastIndexOf('</div>');
        const lastFrag = content.lastIndexOf('</>');
        const lastClose = Math.max(lastDiv, lastFrag);
        if (lastClose !== -1) {
          const closeLen = lastDiv > lastFrag ? '</div>'.length : '</>'.length;
          content = content.substring(0, lastClose + closeLen)
            + '\n    </Layout>'
            + content.substring(lastClose + closeLen);
          wrapped = true;
        }
      }
      break;
    }
  }

  if (!wrapped) {
    // Last resort: simple string replacement
    // Find "  return (" and add Layout after the first JSX opening
    const simpleReturn = content.indexOf('\n  return (');
    if (simpleReturn !== -1) {
      // Just add Layout wrapper text — manual check needed
      errors.push(`${page}: could not auto-wrap, needs manual Layout addition`);
      // Restore backup
      fs.copyFileSync(filePath + '.bak', filePath);
      return;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Patched: ${page}`);
  patched++;
});

console.log('');
console.log('═══════════════════════════════');
console.log(`✅ Patched: ${patched} files`);
console.log(`⏭️  Skipped: ${skipped} files`);
if (errors.length > 0) {
  console.log(`❌ Errors (manual fix needed):`);
  errors.forEach(e => console.log(`   - ${e}`));
}
console.log('═══════════════════════════════');
console.log('Done! Run: npm run dev');
