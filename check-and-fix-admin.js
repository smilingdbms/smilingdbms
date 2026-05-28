// check-and-fix-admin.js
const fs = require('fs');

const adminPath = 'pages/dashboard/admin.tsx';
const content = fs.readFileSync(adminPath, 'utf8');

// Show lines with menu/tab related content
console.log('=== Searching for menu/tab patterns ===');
const lines = content.split('\n');
lines.forEach((line, i) => {
  const l = line.toLowerCase();
  if (l.includes('menu') || l.includes('tab') || l.includes('consultanc') || 
      l.includes('audit') || l.includes('job_seeker') || l.includes('role_wise') ||
      l.includes('issuperadmin') || l.includes('tenants') || l.includes('team')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
});

console.log('\n=== Total lines:', lines.length);
console.log('Has isSuperAdmin:', content.includes('isSuperAdmin'));
console.log('Has Consultancies:', content.includes('Consultancies'));
console.log('Has rbac-menu-item:', content.includes('rbac-menu-item'));
