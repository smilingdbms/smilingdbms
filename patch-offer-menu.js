// patch-offer-menu.js
// Adds Offer Management as 15th menu in Layout.tsx
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Layout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (content.includes("id: 'offer'")) {
  console.log('✅ Offer Management already exists!');
  process.exit(0);
}

const OFFER_MENU = `
    {
      id: 'offer', icon: '✍️', title: 'Offer Management',
      submenus: [
        { name: 'Offers Released', path: '/dashboard/applications#offers-released' },
        { name: 'Pending Offers', path: '/dashboard/applications#pending-offers' },
        { name: 'Accepted Offers', path: '/dashboard/applications#accepted-offers' },
        { name: 'Rejected Offers', path: '/dashboard/applications#rejected-offers' },
        { name: 'Offer Letter Generator', path: '/dashboard/applications#offer-letter' },
        { name: 'Offer Analytics', path: '/dashboard/analytics#offer-analytics' },
        { name: 'Offer History', path: '/dashboard/applications#offer-history' }
      ]
    },`;

// Insert after Placements section closing
const insertAfter = `      ]
    },
    {
      id: 'follow'`;

const replacement = `      ]
    },${OFFER_MENU}
    {
      id: 'follow'`;

if (!content.includes(insertAfter)) {
  console.error('❌ Could not find Placements section. Check Layout.tsx manually.');
  process.exit(1);
}

content = content.replace(insertAfter, replacement);

fs.copyFileSync(filePath, filePath + '.bak');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Offer Management (15th menu) added to Layout.tsx!');
console.log('Done! Refresh browser to see 15 menus.');
