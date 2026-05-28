// fix-addprofile.js — Direct targeted fix for add-profile.tsx
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'pages', 'dashboard', 'add-profile.tsx');

let c = fs.readFileSync(filePath, 'utf8');
fs.copyFileSync(filePath, filePath + '.bak5');

// The problem: return ( followed by empty line then {/* comment */} — no root element
// Line 166: return (
// Line 167: (empty)
// Line 168:     {/* CSS Injection */}

// Fix: replace "return (\n\n      {/*" with "return (\n    <>\n      {/*"
// And find last ); to add </>

// Step 1: Find the export default function
const exportIdx = c.lastIndexOf('export default function');
if (exportIdx === -1) {
  console.error('❌ Could not find export default function');
  process.exit(1);
}

// Step 2: Find the return ( after export default
const returnIdx = c.indexOf('\n  return (', exportIdx);
if (returnIdx === -1) {
  console.error('❌ Could not find return (');
  process.exit(1);
}

// Step 3: Check what comes after return (
const afterReturn = c.substring(returnIdx + '\n  return ('.length);

// If it starts with \n\n (empty line then content without JSX root)
if (/^\n\n/.test(afterReturn) || /^\n\s*\{/.test(afterReturn) || /^\n\s*\n\s*\{/.test(afterReturn)) {
  // Insert <> right after return (
  c = c.substring(0, returnIdx + '\n  return ('.length) 
    + '\n    <>'
    + c.substring(returnIdx + '\n  return ('.length);
  
  // Find the last ); before closing }
  const lastBrace = c.lastIndexOf('\n}');
  const lastParen = c.lastIndexOf('\n  );', lastBrace);
  
  if (lastParen !== -1) {
    // Check if </> already there
    const beforeParen = c.substring(lastParen - 10, lastParen);
    if (!beforeParen.includes('</>')) {
      c = c.substring(0, lastParen) + '\n    </>' + c.substring(lastParen);
    }
  }
  
  fs.writeFileSync(filePath, c, 'utf8');
  console.log('✅ add-profile.tsx fixed — <> </> wrapper added');
} else {
  console.log('ℹ️  add-profile.tsx may already have a root element or different structure');
  // Show what comes after return for debugging
  console.log('After return(:', JSON.stringify(afterReturn.substring(0, 100)));
}
