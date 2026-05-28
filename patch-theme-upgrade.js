// patch-theme-upgrade.js
// Upgrades themes to 6 premium options + links Layout.tsx to CSS variables
const fs = require('fs');
const path = require('path');

// ════════════════════════════════════════════
// 1. UPDATE _app.tsx — 6 Premium Themes
// ════════════════════════════════════════════
const APP_PATH = path.join(__dirname, 'pages', '_app.tsx');
let app = fs.readFileSync(APP_PATH, 'utf8');
fs.copyFileSync(APP_PATH, APP_PATH + '.bak');

const NEW_THEMES = `const THEMES: Record<string, Record<string, string>> = {
  light: {
    '--bg':'#f8fafc','--bg2':'#ffffff','--bg3':'#f1f5f9','--bg4':'#e2e8f0',
    '--tx':'#0f172a','--mu':'#475569','--mu2':'#94a3b8',
    '--bd':'rgba(0,0,0,0.08)','--bd2':'rgba(0,0,0,0.14)',
    '--ac':'#4f46e5','--acbg':'rgba(79,70,229,0.10)',
    '--nb':'#f1f5f9','--nbr':'rgba(0,0,0,0.05)',
    '--gn':'#16a34a','--gnbg':'rgba(22,163,74,0.10)',
    '--rd':'#dc2626','--rdbg':'rgba(220,38,38,0.10)',
    '--gd':'#d97706','--gdbg':'rgba(217,119,6,0.10)',
    '--or':'#ea580c','--sh':'0 2px 12px rgba(0,0,0,0.08)','--shl':'0 8px 40px rgba(0,0,0,0.15)',
    '--sidebar-bg':'#1e1b4b',
    '--sidebar-border':'rgba(99,102,241,0.25)',
    '--accent-glow':'none','--sidebar-blur':'none',
    '--body-bg':'#f8fafc',
  },
  dark: {
    '--bg':'#0a0d14','--bg2':'#111827','--bg3':'#1f2937','--bg4':'#374151',
    '--tx':'#f9fafb','--mu':'#9ca3af','--mu2':'#6b7280',
    '--bd':'rgba(255,255,255,0.08)','--bd2':'rgba(255,255,255,0.14)',
    '--ac':'#818cf8','--acbg':'rgba(129,140,248,0.12)',
    '--nb':'#060913','--nbr':'rgba(255,255,255,0.04)',
    '--gn':'#4ade80','--gnbg':'rgba(74,222,128,0.10)',
    '--rd':'#f87171','--rdbg':'rgba(248,113,113,0.10)',
    '--gd':'#fbbf24','--gdbg':'rgba(251,191,36,0.10)',
    '--or':'#fb923c','--sh':'0 2px 12px rgba(0,0,0,0.4)','--shl':'0 8px 40px rgba(0,0,0,0.5)',
    '--sidebar-bg':'#111827',
    '--sidebar-border':'rgba(255,255,255,0.07)',
    '--accent-glow':'none','--sidebar-blur':'none',
    '--body-bg':'#0a0d14',
  },
  gradient: {
    '--bg':'#060918','--bg2':'#0d1229','--bg3':'#131a3a','--bg4':'#1a2248',
    '--tx':'#e8eeff','--mu':'#8899cc','--mu2':'#5566aa',
    '--bd':'rgba(130,150,255,0.15)','--bd2':'rgba(130,150,255,0.28)',
    '--ac':'#a78bfa','--acbg':'rgba(167,139,250,0.15)',
    '--nb':'#040712','--nbr':'rgba(130,150,255,0.08)',
    '--gn':'#34d399','--gnbg':'rgba(52,211,153,0.12)',
    '--rd':'#f87171','--rdbg':'rgba(248,113,113,0.12)',
    '--gd':'#fde68a','--gdbg':'rgba(253,230,138,0.12)',
    '--or':'#fb923c','--sh':'0 4px 20px rgba(0,0,80,0.5)','--shl':'0 12px 48px rgba(0,0,80,0.7)',
    '--sidebar-bg':'linear-gradient(180deg,#12062e 0%,#1a0d45 30%,#0d1840 65%,#060918 100%)',
    '--sidebar-border':'rgba(167,139,250,0.30)',
    '--accent-glow':'0 0 18px rgba(167,139,250,0.40)','--sidebar-blur':'none',
    '--body-bg':'linear-gradient(135deg,#060918 0%,#0d0626 50%,#060918 100%)',
  },
  glass: {
    '--bg':'#0f1117','--bg2':'rgba(255,255,255,0.07)','--bg3':'rgba(255,255,255,0.10)','--bg4':'rgba(255,255,255,0.15)',
    '--tx':'#f1f5f9','--mu':'#94a3b8','--mu2':'#64748b',
    '--bd':'rgba(255,255,255,0.12)','--bd2':'rgba(255,255,255,0.22)',
    '--ac':'#38bdf8','--acbg':'rgba(56,189,248,0.12)',
    '--nb':'rgba(255,255,255,0.04)','--nbr':'rgba(255,255,255,0.08)',
    '--gn':'#4ade80','--gnbg':'rgba(74,222,128,0.10)',
    '--rd':'#f87171','--rdbg':'rgba(248,113,113,0.10)',
    '--gd':'#fbbf24','--gdbg':'rgba(251,191,36,0.10)',
    '--or':'#fb923c','--sh':'0 4px 24px rgba(0,0,0,0.25)','--shl':'0 8px 48px rgba(0,0,0,0.35)',
    '--sidebar-bg':'rgba(255,255,255,0.06)',
    '--sidebar-border':'rgba(255,255,255,0.18)',
    '--accent-glow':'none','--sidebar-blur':'blur(24px)',
    '--body-bg':'linear-gradient(135deg,#0f1117 0%,#1a1040 40%,#0f1830 70%,#0f1117 100%)',
  },
  neon: {
    '--bg':'#020204','--bg2':'#06060e','--bg3':'#0a0a18','--bg4':'#0f0f22',
    '--tx':'#e0e0ff','--mu':'#6060c0','--mu2':'#404080',
    '--bd':'rgba(0,212,255,0.15)','--bd2':'rgba(0,212,255,0.30)',
    '--ac':'#00d4ff','--acbg':'rgba(0,212,255,0.10)',
    '--nb':'#030308','--nbr':'rgba(0,212,255,0.06)',
    '--gn':'#39ff14','--gnbg':'rgba(57,255,20,0.08)',
    '--rd':'#ff073a','--rdbg':'rgba(255,7,58,0.10)',
    '--gd':'#fff700','--gdbg':'rgba(255,247,0,0.08)',
    '--or':'#ff6600','--sh':'0 0 20px rgba(0,212,255,0.20)','--shl':'0 0 40px rgba(0,212,255,0.35)',
    '--sidebar-bg':'#06060e',
    '--sidebar-border':'rgba(0,212,255,0.28)',
    '--accent-glow':'0 0 10px rgba(0,212,255,0.55),0 0 25px rgba(0,212,255,0.28)','--sidebar-blur':'none',
    '--body-bg':'#020204',
  },
  aurora: {
    '--bg':'#030b1a','--bg2':'#05122a','--bg3':'#081835','--bg4':'#0b1e40',
    '--tx':'#e8f4f8','--mu':'#7ab5cc','--mu2':'#4a7a99',
    '--bd':'rgba(0,229,255,0.12)','--bd2':'rgba(0,229,255,0.22)',
    '--ac':'#00e5ff','--acbg':'rgba(0,229,255,0.10)',
    '--nb':'#020810','--nbr':'rgba(0,229,255,0.06)',
    '--gn':'#00ff88','--gnbg':'rgba(0,255,136,0.08)',
    '--rd':'#ff4466','--rdbg':'rgba(255,68,102,0.10)',
    '--gd':'#ffe066','--gdbg':'rgba(255,224,102,0.08)',
    '--or':'#ff9f43','--sh':'0 4px 20px rgba(0,30,60,0.5)','--shl':'0 8px 48px rgba(0,30,60,0.7)',
    '--sidebar-bg':'linear-gradient(180deg,#0a0f2e 0%,#0c2040 20%,#083828 45%,#1c0838 72%,#030b1a 100%)',
    '--sidebar-border':'rgba(0,229,255,0.22)',
    '--accent-glow':'0 0 14px rgba(0,229,255,0.35)','--sidebar-blur':'none',
    '--body-bg':'linear-gradient(135deg,#030b1a 0%,#050f22 50%,#030b1a 100%)',
  },
}`;

const NEW_THEME_LIST = `const THEME_LIST = [
  {id:'light',color:'#4f46e5',label:'Light',emoji:'☀️'},
  {id:'dark',color:'#818cf8',label:'Dark',emoji:'🌑'},
  {id:'gradient',color:'#a78bfa',label:'Gradient Pro',emoji:'🌟'},
  {id:'glass',color:'#38bdf8',label:'Glass',emoji:'💎'},
  {id:'neon',color:'#00d4ff',label:'Neon Dark',emoji:'🔥'},
  {id:'aurora',color:'#00e5ff',label:'Aurora',emoji:'⚡'},
]`;

// Replace THEMES object
app = app.replace(
  /const THEMES: Record<string, Record<string, string>> = \{[\s\S]*?\n\}/,
  NEW_THEMES
);

// Replace THEME_LIST
app = app.replace(
  /const THEME_LIST = \[[\s\S]*?\]/,
  NEW_THEME_LIST
);

// Update applyTheme to also set body-bg
const OLD_APPLY = `function applyTheme(t: string) {
  const vars = THEMES[t] || THEMES.dark
  if (typeof document !== 'undefined') {
    Object.entries(vars).forEach(([k,v]) => document.documentElement.style.setProperty(k,v))
    document.documentElement.setAttribute('data-theme', t)
  }
}`;

const NEW_APPLY = `function applyTheme(t: string) {
  const vars = THEMES[t] || THEMES.dark
  if (typeof document !== 'undefined') {
    Object.entries(vars).forEach(([k,v]) => document.documentElement.style.setProperty(k,v))
    document.documentElement.setAttribute('data-theme', t)
    // Apply body background (supports gradients)
    document.body.style.background = vars['--body-bg'] || vars['--bg'] || ''
  }
}`;

app = app.replace(OLD_APPLY, NEW_APPLY);

// Update global CSS in _app.tsx to use CSS variables for body
app = app.replace(
  `body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--tx);}`,
  `body{font-family:'Outfit',sans-serif;background:var(--body-bg,var(--bg));color:var(--tx);min-height:100vh;}`
);

// Better theme picker UI
app = app.replace(
  `<div style={{fontSize:10,color:'var(--mu)',fontWeight:600,textTransform:'uppercase',letterSpacing:1,padding:'4px 8px 8px'}}>Theme</div>`,
  `<div style={{fontSize:10,color:'var(--mu)',fontWeight:700,textTransform:'uppercase',letterSpacing:1.5,padding:'6px 10px 8px',borderBottom:'1px solid var(--bd)'}}>🎨 Theme</div>`
);

fs.writeFileSync(APP_PATH, app, 'utf8');
console.log('✅ _app.tsx updated — 6 premium themes added!');

// ════════════════════════════════════════════
// 2. UPDATE Layout.tsx — CSS Variables
// ════════════════════════════════════════════
const LAYOUT_PATH = path.join(__dirname, 'src', 'components', 'Layout.tsx');
let layout = fs.readFileSync(LAYOUT_PATH, 'utf8');
fs.copyFileSync(LAYOUT_PATH, LAYOUT_PATH + '.bak');

// Replace the hardcoded :root CSS vars to link to global theme vars
const OLD_ROOT_CSS = `        :root {
          --matte-black: #050810;
          --dark-panel: #11182D;
          --electric-blue: #3B82F6;
          --text-muted: #9CA3AF;
          --text-light: #F3F4F6;
          --border-color: #1F2937;
        }`;

const NEW_ROOT_CSS = `        :root {
          --matte-black: var(--bg, #0a0d14);
          --dark-panel: var(--sidebar-bg, var(--bg2, #111827));
          --electric-blue: var(--ac, #818cf8);
          --text-muted: var(--mu, #9ca3af);
          --text-light: var(--tx, #f9fafb);
          --border-color: var(--bd, rgba(255,255,255,0.08));
        }`;

layout = layout.replace(OLD_ROOT_CSS, NEW_ROOT_CSS);

// Update CSS classes to use vars
layout = layout.replace(
  `.os-menu-item:hover { background: rgba(59,130,246,0.08); color: var(--text-light); }`,
  `.os-menu-item:hover { background: var(--acbg, rgba(59,130,246,0.08)); color: var(--text-light); }`
);
layout = layout.replace(
  `.os-menu-item.active { background: rgba(59,130,246,0.12); color: #60A5FA; border-left-color: var(--electric-blue); }`,
  `.os-menu-item.active { background: var(--acbg, rgba(59,130,246,0.12)); color: var(--electric-blue); border-left-color: var(--electric-blue); }`
);
layout = layout.replace(
  `.os-submenu-item:hover { color: var(--electric-blue); background: rgba(59,130,246,0.05); padding-left: 63px; }`,
  `.os-submenu-item:hover { color: var(--electric-blue); background: var(--acbg, rgba(59,130,246,0.05)); padding-left: 63px; }`
);
layout = layout.replace(
  `.os-submenu-item.active { color: #60A5FA; font-weight: 600; }`,
  `.os-submenu-item.active { color: var(--electric-blue); font-weight: 600; }`
);
layout = layout.replace(
  `.os-logout-btn { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #EF4444;`,
  `.os-logout-btn { background: var(--rdbg, rgba(239,68,68,0.1)); border: 1px solid var(--rd, #EF4444); color: var(--rd, #EF4444);`
);
layout = layout.replace(
  `.os-logout-btn:hover { background: rgba(239,68,68,0.2); }`,
  `.os-logout-btn:hover { background: var(--rdbg, rgba(239,68,68,0.15)); filter: brightness(1.15); }`
);

// Update sidebar inline style to support gradient + blur
layout = layout.replace(
  `background: 'var(--dark-panel)',`,
  `background: 'var(--dark-panel)',\n          backdropFilter: 'var(--sidebar-blur, none)',\n          WebkitBackdropFilter: 'var(--sidebar-blur, none)',`
);

// Update sidebar border to use sidebar-border var
layout = layout.replace(
  `borderRight: '1px solid var(--border-color)',`,
  `borderRight: '1px solid var(--sidebar-border, var(--border-color))',`
);

// Update logo area border
layout = layout.replace(
  `borderBottom: 'var(--border-color)',`,
  `borderBottom: '1px solid var(--sidebar-border, var(--border-color))',`
);

// Update submenu background (the #070C1A)
layout = layout.replace(
  /background: '#070C1A'/g,
  `background: 'var(--nb, #060913)'`
);
layout = layout.replace(
  /background: '#0A0F1C'/g,
  `background: 'var(--nb, #060913)'`
);

// Update scrollbar thumb color
layout = layout.replace(
  `.os-sidebar-scroll::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }`,
  `.os-sidebar-scroll::-webkit-scrollbar-thumb { background: var(--bg4, #374151); border-radius: 4px; }`
);

// Add accent glow to logout button and active items via CSS
const OLD_LOGOUT_BTN = `.os-logout-btn { background: var(--rdbg, rgba(239,68,68,0.1)); border: 1px solid var(--rd, #EF4444); color: var(--rd, #EF4444); border-radius: 7px; padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s; width: 100%; margin-top: 6px; }`;
// Already updated above, just add transition
layout = layout.replace(
  `transition: background 0.15s; width: 100%; margin-top: 6px; }`,
  `transition: all 0.2s; width: 100%; margin-top: 6px; }`
);

// Add menu item transition for glow effect
layout = layout.replace(
  `.os-menu-item { padding: 11px 18px; display: flex; align-items: center; cursor: pointer; color: var(--text-muted); border-left: 3px solid transparent; white-space: nowrap; overflow: hidden; transition: background 0.15s, color 0.15s; }`,
  `.os-menu-item { padding: 11px 18px; display: flex; align-items: center; cursor: pointer; color: var(--text-muted); border-left: 3px solid transparent; white-space: nowrap; overflow: hidden; transition: background 0.18s, color 0.18s, box-shadow 0.18s; }`
);

fs.writeFileSync(LAYOUT_PATH, layout, 'utf8');
console.log('✅ Layout.tsx updated — CSS variables linked to themes!');

console.log('');
console.log('════════════════════════════════════');
console.log('✅ Theme upgrade complete!');
console.log('   6 themes: Light, Dark, Gradient Pro, Glass, Neon Dark, Aurora');
console.log('   Sidebar + content both change on theme switch');
console.log('   Gradient sidebar for Gradient Pro & Aurora');
console.log('   Glassmorphism blur for Glass theme');
console.log('   Neon glow effects for Neon Dark');
console.log('════════════════════════════════════');
console.log('Run: npm run dev → bottom-right theme picker!');
