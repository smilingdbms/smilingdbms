// fix-layout-master-menu.js
const fs = require('fs');

const layoutPath = 'src/components/Layout.tsx';
let content = fs.readFileSync(layoutPath, 'utf8');
fs.copyFileSync(layoutPath, layoutPath + '.bak_v3');

// Fix 1: Add isSuperAdmin after roleLabel
const oldRoleLabel = `const roleLabel = userRole.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());`;
const newRoleLabel = `const roleLabel = userRole.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());
  const isSuperAdmin = ['super_admin', 'platform_admin', 'platform_manager'].includes(userRole);`;

if (content.includes(oldRoleLabel)) {
  content = content.replace(oldRoleLabel, newRoleLabel);
  console.log('✅ Fix 1: isSuperAdmin added');
} else {
  console.log('⚠️  roleLabel pattern not found');
}

// Fix 2: Add Master DB to menuData at beginning
const oldMenuDataStart = `  const menuData = [
    {
      id: 'dash',`;

const newMenuDataStart = `  const menuData = [
    {
      id: 'master', icon: '🌐', title: 'Master DB', superAdminOnly: true,
      submenus: [
        { name: '⚡ All Job Seekers', path: '/dashboard/master' },
        { name: '🏢 All Companies', path: '/dashboard/master' },
        { name: '📊 Platform Analytics', path: '/dashboard/master' },
        { name: '💰 Revenue Dashboard', path: '/dashboard/master' },
      ]
    },
    {
      id: 'dash',`;

if (content.includes(oldMenuDataStart)) {
  content = content.replace(oldMenuDataStart, newMenuDataStart);
  console.log('✅ Fix 2: Master DB menu added');
} else {
  console.log('⚠️  menuData start not found');
}

// Fix 3: Rename Team Management to Admin Center
content = content.replace(
  `{ name: 'Team Management', path: '/dashboard/admin' },`,
  `{ name: '🛡️ Admin Center', path: '/dashboard/admin' },`
);
console.log('✅ Fix 3: Admin Center renamed');

// Fix 4: Filter superAdminOnly in render
const oldMap = `{menuData.map((menu) => {`;
const newMap = `{menuData.filter(menu => !menu.superAdminOnly || isSuperAdmin).map((menu) => {`;

if (content.includes(oldMap)) {
  content = content.replace(oldMap, newMap);
  console.log('✅ Fix 4: superAdminOnly filter added');
} else {
  console.log('⚠️  menuData.map not found');
}

// Fix 5: Add special purple styling for Master DB
const oldCSS = `.os-logout-btn:hover { background: rgba(239,68,68,0.2); }`;
const newCSS = `.os-logout-btn:hover { background: rgba(239,68,68,0.2); }
        .master-menu-item { background: rgba(124,58,237,0.1) !important; border-left-color: #7C3AED !important; color: #A78BFA !important; }
        .master-menu-item:hover { background: rgba(124,58,237,0.18) !important; }`;

if (content.includes(oldCSS)) {
  content = content.replace(oldCSS, newCSS);
  console.log('✅ Fix 5: Master menu CSS added');
}

// Fix 6: Apply master-menu-item class
const oldMenuItemClass = `className={\`os-menu-item \${isActive ? 'active' : ''}\`}`;
const newMenuItemClass = `className={\`os-menu-item \${isActive ? 'active' : ''} \${menu.id === 'master' ? 'master-menu-item' : ''}\`}`;

if (content.includes(oldMenuItemClass)) {
  content = content.replace(oldMenuItemClass, newMenuItemClass);
  console.log('✅ Fix 6: Master menu class applied');
} else {
  console.log('⚠️  menu item class pattern not found');
}

fs.writeFileSync(layoutPath, content);
console.log('\n✅ All done! Run: npm run build');
