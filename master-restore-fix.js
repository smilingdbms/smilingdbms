// master-restore-fix.js
// FINAL SOLUTION: Restore broken pages + fix Layout wrappers + build
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIR = path.join(__dirname, 'pages', 'dashboard');

// Pages that are broken — restore from oldest available backup
const BROKEN = [
  'add-profile.tsx',
  'interviews.tsx', 
  'new-candidate.tsx',
  'permissions.tsx',
  'dashboard_bugs_fixed.tsx',
];

// ── Step 1: Restore from oldest backup ──
BROKEN.forEach(page => {
  const base = path.join(DIR, page);
  // Try backups from oldest to newest
  const suffixes = ['.bak', '.bak2', '.bak3', '.bak4', '.bak5'];
  let restored = false;
  
  for (const suf of suffixes) {
    const bakFile = base + suf;
    if (fs.existsSync(bakFile)) {
      // Save current broken version
      fs.copyFileSync(base, base + '.broken');
      fs.copyFileSync(bakFile, base);
      console.log(`✅ Restored ${page} from ${suf}`);
      restored = true;
      break;
    }
  }
  if (!restored) console.log(`⚠️  No backup found for ${page}`);
});

// ── Step 2: Remove Layout wrappers from ALL dashboard pages ──
// Since _app.tsx wraps /dashboard/* with Layout, individual pages must NOT have Layout
const ALL_PAGES = fs.readdirSync(DIR).filter(f => f.endsWith('.tsx'));

ALL_PAGES.forEach(page => {
  const filePath = path.join(DIR, page);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const hasLayoutImport = /import Layout from/.test(content);
  const hasLayoutJSX = /<Layout[\s>]/.test(content) || /<\/Layout>/.test(content);
  const hasDashboardNav = /import DashboardNav/.test(content) || /<DashboardNav/.test(content);
  
  if (!hasLayoutImport && !hasLayoutJSX && !hasDashboardNav) return;
  
  // Normalize line endings for processing
  const crlf = content.includes('\r\n');
  let c = content.replace(/\r\n/g, '\n');
  
  // Remove imports
  c = c.replace(/import Layout from ['"][^'"]+['"];\n/g, '');
  c = c.replace(/import DashboardNav from ['"][^'"]+['"];\n/g, '');
  
  // Remove DashboardNav JSX
  c = c.replace(/<DashboardNav[^/]*\/>/g, '');
  c = c.replace(/<DashboardNav[^>]*>[\s\S]*?<\/DashboardNav>/g, '');
  
  // Replace <Layout> → <> and </Layout> → </>
  c = c.replace(/<Layout>\n/g, '<>\n');
  c = c.replace(/<Layout [\s\S]*?>\n/g, '<>\n');  // with props
  c = c.replace(/<\/Layout>/g, '</>');
  
  // More aggressive replacement for remaining Layout tags
  c = c.replace(/<Layout[^>]*>/g, '<>');
  
  // Restore line endings
  if (crlf) c = c.replace(/\n/g, '\r\n');
  
  fs.writeFileSync(filePath, c, 'utf8');
  console.log(`✅ Fixed Layout wrapper: ${page}`);
});

// ── Step 3: Check for pages with no root JSX element ──
// If return( is followed by {/* or <style> without a wrapping element, add <>
ALL_PAGES.forEach(page => {
  const filePath = path.join(DIR, page);
  let content = fs.readFileSync(filePath, 'utf8');
  const crlf = content.includes('\r\n');
  let c = content.replace(/\r\n/g, '\n');

  // Find the export default function
  const exportIdx = c.lastIndexOf('export default function');
  if (exportIdx === -1) return;

  // Find return ( after the function declaration  
  const returnIdx = c.indexOf('\n  return (\n', exportIdx);
  if (returnIdx === -1) return;

  const afterReturn = c.substring(returnIdx + '\n  return (\n'.length);
  
  // Check if content starts with {/* or <style or non-JSX-element
  const noRootElement = /^(\s*\n)*\s*(\{\/\*|<style)/.test(afterReturn);
  const hasRoot = /^(\s*\n)*\s*(<[A-Za-z<>])/.test(afterReturn);

  if (noRootElement && !c.includes('<>\n') && !hasRoot) {
    // Add <> wrapper
    const insertAt = returnIdx + '\n  return (\n'.length;
    c = c.substring(0, insertAt) + '    <>\n' + c.substring(insertAt);
    
    // Add </> before last );
    const lastBrace = c.lastIndexOf('\n}');
    const lastParen = c.lastIndexOf('\n  );', lastBrace);
    if (lastParen !== -1) {
      c = c.substring(0, lastParen) + '\n    </>' + c.substring(lastParen);
    }
    
    if (crlf) c = c.replace(/\n/g, '\r\n');
    fs.writeFileSync(filePath, c, 'utf8');
    console.log(`✅ Added <> wrapper: ${page}`);
  }
});

console.log('\n═══════════════════════════════════');
console.log('✅ All pages restored and fixed!');
console.log('Running build check...');
console.log('═══════════════════════════════════\n');

// ── Step 4: Test build ──
try {
  execSync('npm run build 2>&1', { stdio: 'inherit', cwd: __dirname });
  console.log('\n✅ BUILD PASSED!');
  console.log('\nTo deploy live: npx vercel --prod');
} catch (e) {
  console.log('\n⚠️  Build has errors — check output above');
  console.log('Run: npm run build 2>&1 | more');
}
