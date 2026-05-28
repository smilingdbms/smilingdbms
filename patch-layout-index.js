// patch-layout-index.js
// Adds Layout wrapper to pages/dashboard/index.tsx
// Run: node patch-layout-index.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages', 'dashboard', 'index.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// ── STEP 1: Add Layout import after supabase import ──
const LAYOUT_IMPORT = `import Layout from '../../src/components/Layout';`;

if (content.includes(LAYOUT_IMPORT)) {
  console.log('✅ Layout import already exists — skipping import step.');
} else {
  // Insert after the last import line at the top
  content = content.replace(
    `import { supabase } from '../../src/lib/supabase';`,
    `import { supabase } from '../../src/lib/supabase';\n${LAYOUT_IMPORT}`
  );
  console.log('✅ Layout import added.');
}

// ── STEP 2: Wrap the main component return with Layout ──
// Find "export default function RebuiltDashboard()" and wrap its return
// Strategy: find the exact return pattern at the component level (not inside nested functions)

// The main return of RebuiltDashboard starts with:
// return (\n    <div  OR  return (\n    <>
// We look for the return that comes right after all the hooks/state declarations

// Simple approach: find 'export default function' and then the LAST top-level return
// We'll wrap by replacing the opening of the main return and adding </Layout> before the final closing

// Check if already wrapped
if (content.includes('<Layout>') || content.includes('<Layout ')) {
  console.log('✅ Layout wrapper already exists — skipping wrap step.');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ File saved (no changes needed).');
  process.exit(0);
}

// Find the main component's return statement
// The main return is typically: `\n  return (\n    <`  (2 spaces indent)
// Inner function returns are: `    return ...` (4+ spaces) or `return ` (inline)

// Strategy: find all occurrences of '\n  return (' and take the last one
// (the main component return is usually the last top-level return)

const mainReturnPattern = /\n  return \(\n/g;
let match;
let lastIndex = -1;
let lastMatch = null;

while ((match = mainReturnPattern.exec(content)) !== null) {
  lastIndex = match.index;
  lastMatch = match[0];
}

if (lastIndex === -1) {
  // Try alternate pattern with no leading spaces
  const altPattern = /\n  return \(/;
  const altMatch = altPattern.exec(content);
  if (altMatch) {
    lastIndex = altMatch.index;
    lastMatch = altMatch[0];
  }
}

if (lastIndex === -1) {
  console.error('❌ Could not find main return statement. Manual edit required.');
  process.exit(1);
}

// Insert <Layout> right after "return ("
const beforeReturn = content.substring(0, lastIndex);
const returnAndAfter = content.substring(lastIndex);

// Replace first "\n  return (\n" with "\n  return (\n    <Layout>\n"
const wrappedReturn = returnAndAfter.replace(
  /\n  return \(\n(\s+)</,
  (match, spaces) => `\n  return (\n    <Layout>\n${spaces}<`
);

// Now add </Layout> before the final ");" that closes the main return
// Find the last ");" or "  );" at the end of the file
const finalContent = beforeReturn + wrappedReturn;

// Add </Layout> before the last closing paren of the function
// Pattern: ends with "\n  );\n}" 
const closingPattern = /(\n  \);\n\}[\s]*)$/;
const closingMatch = closingPattern.exec(finalContent);

let result;
if (closingMatch) {
  result = finalContent.substring(0, closingMatch.index) 
    + '\n    </Layout>'
    + finalContent.substring(closingMatch.index);
  console.log('✅ Layout wrapper added around main return.');
} else {
  // Alternate: ends with "\n};\n" or "\n}\n"
  const altClosing = /(\n\}[\s]*)$/;
  const altMatch = altClosing.exec(finalContent);
  if (altMatch) {
    // Find the last occurrence of </div> or </> before closing brace and add </Layout> after it
    const lastDivClose = finalContent.lastIndexOf('</div>');
    const lastFragClose = finalContent.lastIndexOf('</>');
    const lastClose = Math.max(lastDivClose, lastFragClose);
    
    if (lastClose !== -1) {
      const closeTag = lastDivClose > lastFragClose ? '</div>' : '</>';
      result = finalContent.substring(0, lastClose + closeTag.length)
        + '\n    </Layout>'
        + finalContent.substring(lastClose + closeTag.length);
      console.log('✅ Layout wrapper added (alt method).');
    } else {
      console.error('❌ Could not find closing tag. Manual edit required.');
      process.exit(1);
    }
  } else {
    console.error('❌ Could not find file closing. Manual edit required.');
    process.exit(1);
  }
}

// ── STEP 3: Save backup + write ──
fs.copyFileSync(filePath, filePath + '.bak');
console.log('💾 Backup saved: index.tsx.bak');

fs.writeFileSync(filePath, result, 'utf8');
console.log('✅ pages/dashboard/index.tsx patched successfully!');
console.log('');
console.log('Next step: npm run dev — check localhost:3000/dashboard');
