const fs = require('fs');

const PRJ = String.raw`C:\Users\Pravin\OneDrive\Desktop\DBMS Folder\smilingdbms_project\smilingdbms`;
const ADMIN = PRJ + String.raw`\pages\dashboard\admin.tsx`;

console.log('='.repeat(56));
console.log(' RecruitBase Pro — Admin Pending/Approve Fix');
console.log('='.repeat(56));

if (!fs.existsSync(ADMIN)) { console.log('ERROR: admin.tsx not found!'); process.exit(1); }
fs.copyFileSync(ADMIN, ADMIN + '.bak_pending_' + Date.now());
let code = fs.readFileSync(ADMIN, 'utf8');
let changes = 0;

// ═══════════════════════════════════════
// FIX 1: Add approveUser function
// ═══════════════════════════════════════
if (!code.includes('approveUser')) {
  // Find a good insertion point — before the filtered variable
  const insertBefore = '  const filtered = ';
  if (code.includes(insertBefore)) {
    const approveFn = `  async function approveUser(userId: string) {
    const { error } = await supabase.from('app_users').update({ status: 'active' }).eq('id', userId)
    if (error) { showToast('Failed to approve: ' + error.message, 'error'); return }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u))
    showToast('User approved and activated!')
  }

  `;
    code = code.replace(insertBefore, approveFn + insertBefore);
    changes++;
    console.log('OK 1. Added approveUser() function');
  }
}

// ═══════════════════════════════════════
// FIX 2: Update Active/Disable column to show Pending + Approve button
// ═══════════════════════════════════════

// Find the toggle/active column rendering
// Look for patterns like: status === 'active' or isMe (Always On)

// Pattern: The Active/Disable column shows a toggle
// We need to add: if status === 'pending', show "Pending" badge + Approve button

// Find the Active/Disable cell
const pendingPatterns = [
  // Pattern 1: Toggle with "On"/"Off" text
  "Active/Disable",
  "ACTIVE / DISABLE",
  "Active / Disable",
];

let foundToggle = false;
for (const p of pendingPatterns) {
  if (code.includes(p)) {
    foundToggle = true;
    console.log('Found toggle column header: ' + p);
    break;
  }
}

// Search for the toggle rendering — usually something like:
// isMe ? '• Always On' : <toggle>
// We need to add before toggle: if pending, show approve button

// Find the toggle component by looking for status-related rendering
const togglePattern = /isMe\s*\?\s*[\s\S]*?Always On[\s\S]*?:/;
const match = code.match(togglePattern);

if (match) {
  const fullMatch = match[0];
  const insertAfterAlwaysOn = fullMatch;
  
  // After the "Always On" part and the : (else), add pending check
  // Find the position after this match
  const matchIdx = code.indexOf(fullMatch);
  const afterMatch = code.substring(matchIdx + fullMatch.length, matchIdx + fullMatch.length + 500);
  
  // Look for the toggle/button that handles active/disabled
  // Add pending check right after the isMe ternary starts the else branch
  
  // Simpler approach: add pending status display in the status cell
  // Find where u.status or toggle is rendered
}

// Alternative approach: find where the toggle ON/OFF is rendered and add pending handling
// Let's look for the disable/enable toggle function
if (code.includes('toggleActive') || code.includes('toggleStatus') || code.includes('handleToggle')) {
  const toggleFnNames = ['toggleActive', 'toggleStatus', 'handleToggle', 'handleDisable', 'handleEnable'];
  for (const fn of toggleFnNames) {
    if (code.includes(fn)) {
      console.log('Found toggle function: ' + fn);
      break;
    }
  }
}

// Most reliable: search for the actual status column cell rendering
// and inject pending handling
const lines = code.split('\n');
let statusCellStart = -1;
let toggleFnLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  // Find where On/Off or Always On is rendered
  if (line.includes('Always On') && !line.includes('approveUser')) {
    statusCellStart = i;
    console.log('Found status cell at line ' + (i+1) + ': ' + line.substring(0, 80));
  }
}

// If we can't reliably patch the toggle, add a separate "Status" column approach
// Add a small pending indicator after the toggle

// Search for the exact pattern where the toggle or status text is rendered
// Most admin pages render: isMe ? "Always On" : <toggle onClick={...}>
// We'll add: u.status === 'pending' ? <Approve button> : <existing toggle>

// Find the td/cell that contains the toggle
const alwaysOnIdx = code.indexOf("Always On");
if (alwaysOnIdx > 0) {
  // Go backwards to find the start of this td
  let tdStart = code.lastIndexOf('<td', alwaysOnIdx);
  // Go forward to find the end of this td
  let tdEnd = code.indexOf('</td>', alwaysOnIdx);
  
  if (tdStart > 0 && tdEnd > 0) {
    const originalCell = code.substring(tdStart, tdEnd + 5);
    console.log('Found status cell (' + originalCell.length + ' chars)');
    
    // Check if pending handling already exists
    if (!originalCell.includes('pending') && !originalCell.includes('Approve')) {
      // Wrap the existing cell content with pending check
      // Find the isMe check
      const isInCell = originalCell.includes('isMe');
      
      if (isInCell) {
        // Add pending check before the existing isMe ternary
        // Replace the cell content to add pending handling
        const newCell = originalCell.replace(
          /(\{isMe\s*\?)/,
          '{u.status === \'pending\' ? (\n' +
          '                          <div style={{display:"flex",alignItems:"center",gap:8}}>\n' +
          '                            <span style={{fontSize:11,background:"rgba(255,159,67,0.15)",color:"#ff9f43",padding:"3px 10px",borderRadius:6,fontWeight:700}}>Pending</span>\n' +
          '                            <button onClick={() => approveUser(u.id)} style={{fontSize:11,background:"rgba(61,214,140,0.15)",color:"#3dd68c",border:"1px solid rgba(61,214,140,0.3)",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>✅ Approve</button>\n' +
          '                          </div>\n' +
          '                        ) : $1'
        );
        
        code = code.replace(originalCell, newCell);
        changes++;
        console.log('OK 2. Added Pending badge + Approve button in status column');
      }
    }
  }
}

// ═══════════════════════════════════════
// FIX 3: Make sure "All Status" filter includes Pending
// ═══════════════════════════════════════
if (code.includes("value=\"disabled\"") && !code.includes("value=\"pending\"")) {
  code = code.replace(
    '<option value="disabled">Disabled</option>',
    '<option value="disabled">Disabled</option>\n              <option value="pending">Pending Approval</option>'
  );
  changes++;
  console.log('OK 3. Added Pending filter option in status dropdown');
}

// ═══════════════════════════════════════
// FIX 4: Update counter to show pending count
// ═══════════════════════════════════════
if (code.includes('disabled') && code.includes('total')) {
  // Find the counter line: "X total · Y active · Z disabled"
  const counterPattern = /(\d+|users\.length|filtered\.length)\s*total[\s\S]*?disabled/;
  const counterMatch = code.match(counterPattern);
  if (counterMatch) {
    console.log('Found counter — will need manual update for pending count');
  }
  
  // Add pending count display
  if (code.includes("'.disabled'") || code.includes("status === 'disabled'")) {
    // Search for the exact counter rendering
    const counterLineIdx = code.indexOf('disabled');
    if (counterLineIdx > 0) {
      const nearbyCode = code.substring(Math.max(0, counterLineIdx - 200), counterLineIdx + 100);
      // If there's a disabled count display, add pending after it
      if (nearbyCode.includes('active') && nearbyCode.includes('disabled')) {
        // Add pending count after disabled count
        code = code.replace(
          /(disabled)<\/span>/,
          '$1</span>\n            {users.filter(u => u.status === \'pending\').length > 0 && <span style={{color:"#ff9f43"}}> · {users.filter(u => u.status === \'pending\').length} pending</span>}'
        );
        changes++;
        console.log('OK 4. Added pending count in header');
      }
    }
  }
}

if (changes > 0) {
  fs.writeFileSync(ADMIN, code, 'utf8');
  console.log('\n' + changes + ' fixes applied to admin.tsx');
} else {
  console.log('\nNo pattern matches — admin page structure may be different');
  console.log('Saving diagnostic info...');
  
  // Dump relevant sections for debugging
  const lines = code.split('\n');
  console.log('\n--- Lines containing "Always On" ---');
  lines.forEach((l, i) => { if (l.includes('Always On')) console.log('L' + (i+1) + ': ' + l.trim().substring(0, 100)); });
  console.log('\n--- Lines containing "toggle" or "Toggle" ---');
  lines.forEach((l, i) => { if (l.toLowerCase().includes('toggle')) console.log('L' + (i+1) + ': ' + l.trim().substring(0, 100)); });
  console.log('\n--- Lines containing "disable" ---');
  lines.forEach((l, i) => { if (l.toLowerCase().includes('disable')) console.log('L' + (i+1) + ': ' + l.trim().substring(0, 100)); });
}
