// fix-admin-tabs-final.js
const fs = require('fs');

const adminPath = 'pages/dashboard/admin.tsx';
let content = fs.readFileSync(adminPath, 'utf8');
fs.copyFileSync(adminPath, adminPath + '.bak3');

// Lines 436-440: Replace the 5 hardcoded tabs with conditional rendering
const oldTabs = `          <div className={\`rbac-menu-item \${activeSubMenu === 'role_wise' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('role_wise'); window.location.hash = 'role_wise'; }}>Role Wise Permissions <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'job_seeker' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('job_seeker'); window.location.hash = 'job_seeker'; }}>Job Seeker Access <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'audit_logs' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('audit_logs'); window.location.hash = 'audit_logs'; }}>Security Audit Logs <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'tenants' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('tenants'); window.location.hash = 'tenants'; }}>🏢 Consultancies <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'team' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('team'); window.location.hash = 'team'; }}>👥 Internal Team <span>→</span></div>`;

const newTabs = `          {/* Super Admin ONLY tabs */}
          {isSuperAdmin && (<>
          <div className={\`rbac-menu-item \${activeSubMenu === 'role_wise' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('role_wise'); window.location.hash = 'role_wise'; }}>🔐 Role Wise Permissions <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'job_seeker' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('job_seeker'); window.location.hash = 'job_seeker'; }}>🎯 Job Seeker Access <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'audit_logs' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('audit_logs'); window.location.hash = 'audit_logs'; }}>🔍 Audit Logs <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'tenants' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('tenants'); window.location.hash = 'tenants'; }}>🏢 Consultancies <span>→</span></div>
          </>)}
          {/* Both Super Admin and Account Owner */}
          <div className={\`rbac-menu-item \${activeSubMenu === 'team' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('team'); window.location.hash = 'team'; }}>👥 {isSuperAdmin ? 'All Users' : 'My Team'} <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'pending' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('pending'); window.location.hash = 'pending'; }}>⏳ Pending Approvals <span>→</span></div>`;

if (content.includes(oldTabs)) {
  content = content.replace(oldTabs, newTabs);
  fs.writeFileSync(adminPath, content);
  console.log('✅ Admin tabs fixed!');
  console.log('   Super Admin sees: Role Wise, Job Seeker, Audit Logs, Consultancies, All Users, Pending');
  console.log('   Account Owner sees: My Team, Pending Approvals ONLY');
} else {
  console.log('❌ Pattern not found. Showing lines 433-442 for manual check:');
  const lines = content.split('\n');
  lines.slice(432, 442).forEach((l, i) => console.log(`${433+i}: ${l}`));
}
