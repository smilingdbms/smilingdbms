// fix-fragments.js
// After Layout removal, pages need <> </> wrapper around their JSX
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, 'pages', 'dashboard');

const pages = fs.readdirSync(DIR).filter(f => f.endsWith('.tsx'));
let fixed = 0;

pages.forEach(page => {
  const filePath = path.join(DIR, page);
  let c = fs.readFileSync(filePath, 'utf8');

  // Find the main return( and check if root element is missing
  // Pattern: return (\n\n  {/* or return (\n\n  <style> — these need a <> wrapper
  const returnMatch = c.match(/\n  return \(\n(\s*)\n(\s*)([^<\s]|{\/\*|<style)/);
  
  if (returnMatch) {
    // return ( followed by empty line then content without a root element
    // Need to add <> after return ( and </> before );
    
    fs.copyFileSync(filePath, filePath + '.bak4');
    
    // Add <> right after the main return (
    // Find last "return (" in the component (not in helper functions)
    const exportIdx = c.lastIndexOf('export default function');
    const returnIdx = c.indexOf('\n  return (', exportIdx);
    
    if (returnIdx !== -1) {
      // Insert <> after return (
      const insertAfterReturn = returnIdx + '\n  return ('.length;
      c = c.substring(0, insertAfterReturn) + '\n    <>' + c.substring(insertAfterReturn);
      
      // Insert </> before the last ); of the function
      const lastBrace = c.lastIndexOf('\n}');
      const lastParen = c.lastIndexOf('\n  );', lastBrace);
      if (lastParen !== -1) {
        c = c.substring(0, lastParen) + '\n    </>' + c.substring(lastParen);
      }
      
      fs.writeFileSync(filePath, c, 'utf8');
      console.log(`✅ Fixed fragment: ${page}`);
      fixed++;
    }
  } else {
    // Also check: return (\n    {/* — no opening tag
    const noRootMatch = /\n  return \(\n\s*\{\/\*/.test(c) || 
                        /\n  return \(\n\s*<style\>/.test(c) ||
                        /\n  return \(\n\n\s*<style\>/.test(c);
    
    if (noRootMatch) {
      fs.copyFileSync(filePath, filePath + '.bak4');
      const exportIdx = c.lastIndexOf('export default function');
      const returnIdx = c.indexOf('\n  return (', exportIdx);
      
      if (returnIdx !== -1) {
        const insertPos = returnIdx + '\n  return ('.length;
        c = c.substring(0, insertPos) + '\n    <>' + c.substring(insertPos);
        const lastBrace = c.lastIndexOf('\n}');
        const lastParen = c.lastIndexOf('\n  );', lastBrace);
        if (lastParen !== -1) {
          c = c.substring(0, lastParen) + '\n    </>' + c.substring(lastParen);
        }
        fs.writeFileSync(filePath, c, 'utf8');
        console.log(`✅ Fixed fragment: ${page}`);
        fixed++;
      }
    }
  }
});

// Specifically fix add-profile.tsx if still broken
const addProfilePath = path.join(DIR, 'add-profile.tsx');
let ap = fs.readFileSync(addProfilePath, 'utf8');
if (ap.includes('return (\n\n      {/*') || ap.includes('return (\n\n    {/*')) {
  ap = ap.replace(/(\n  return \()\n(\s*)(\n\s*\{)/, '$1\n    <>\n$2$3');
  const lastBrace = ap.lastIndexOf('\n}');
  const lastParen = ap.lastIndexOf('\n  );', lastBrace);
  if (lastParen !== -1 && !ap.includes('</>\n  );')) {
    ap = ap.substring(0, lastParen) + '\n    </>' + ap.substring(lastParen);
  }
  fs.writeFileSync(addProfilePath, ap, 'utf8');
  console.log('✅ add-profile.tsx fragment fixed');
}

console.log(`\n✅ Done! ${fixed} files fixed. Run: npm run build`);
