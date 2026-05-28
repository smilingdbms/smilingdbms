// ════════════════════════════════════════════════════════════════
// PATCH: Point "+ Add Profile" button to the new dedicated page
// Run from project root:  node patch-add-profile-button.js
// Safe: backs up master.tsx first, verifies before & after.
// ════════════════════════════════════════════════════════════════
const fs = require('fs')
const path = 'pages/dashboard/master.tsx'

const OLD = `onClick={()=>{setForm({...EMPTY_PROFILE,segment:activeSegment==='all'?'experienced':activeSegment});setShowAdd(true);setShowProfile(null);setWizardStep(1)}}`
const NEW = `onClick={()=>router.push('/dashboard/add-profile')}`

try {
  if (!fs.existsSync(path)) { console.error('❌ Could not find', path, '\n   Run this from the project root folder.'); process.exit(1) }

  let src = fs.readFileSync(path, 'utf8')
  const count = src.split(OLD).length - 1

  if (count === 0) {
    if (src.includes(NEW)) { console.log('✅ Already patched. The button already opens /dashboard/add-profile. Nothing to do.'); process.exit(0) }
    console.error('❌ Could not find the Add Profile button code. The file may have changed.\n   No changes made.'); process.exit(1)
  }
  if (count > 1) { console.error('❌ Found the button code', count, 'times (expected 1). Stopping to be safe. No changes made.'); process.exit(1) }

  // Backup
  const backup = path + '.before-addbtn-' + Date.now() + '.bak'
  fs.writeFileSync(backup, src)
  console.log('🛟 Backup saved:', backup)

  // Replace
  src = src.replace(OLD, NEW)
  fs.writeFileSync(path, src)

  console.log('✅ Done! The "+ Add Profile" button now opens the dedicated page (/dashboard/add-profile).')
  console.log('   If anything looks wrong, restore from the backup file above.')
} catch (e) {
  console.error('❌ Error:', e.message, '\n   No changes were saved.')
  process.exit(1)
}
