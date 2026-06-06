// src/components/theme.ts
// ═══════════════════════════════════════════════════════
// SINGLE SOURCE OF TRUTH — All theme tokens defined here
// Used by: _app.tsx (global), globals.css ([data-theme] mirrors these)
// Never import this in individual pages — only _app.tsx
// ═══════════════════════════════════════════════════════

export const THEMES: Record<string, Record<string, string>> = {

  dark: {
    '--bg':    '#0a0d14',
    '--bg2':   '#111827',
    '--bg3':   '#1f2937',
    '--bg4':   '#374151',
    '--tx':    '#f9fafb',
    '--mu':    '#9ca3af',
    '--mu2':   '#6b7280',
    '--bd':    'rgba(255,255,255,0.08)',
    '--bd2':   'rgba(255,255,255,0.14)',
    '--hv':    'rgba(255,255,255,0.06)',
    '--ac':    '#10b981',
    '--acbg':  'rgba(16,185,129,0.15)',
    '--nb':    '#060913',
    '--nbr':   'rgba(255,255,255,0.05)',
    '--gn':    '#4ade80',
    '--gnbg':  'rgba(74,222,128,0.10)',
    '--rd':    '#f87171',
    '--rdbg':  'rgba(248,113,113,0.10)',
    '--gd':    '#fbbf24',
    '--gdbg':  'rgba(251,191,36,0.10)',
    '--or':    '#fb923c',
    '--orbg':  'rgba(251,146,60,0.10)',
    '--pu':    '#c084fc',
    '--pubg':  'rgba(192,132,252,0.10)',
    '--tl':    '#22d3ee',
    '--tlbg':  'rgba(34,211,238,0.10)',
    '--sh':    '0 2px 12px rgba(0,0,0,0.4)',
    '--shl':   '0 8px 40px rgba(0,0,0,0.5)',
  },

  light: {
    '--bg':    '#f4f2ec',
    '--bg2':   '#fdfcf9',
    '--bg3':   '#eceae3',
    '--bg4':   '#e1ded5',
    '--tx':    '#1a1a1a',
    '--mu':    '#4a4a4a',
    '--mu2':   '#6b6b6b',
    '--bd':    'rgba(0,0,0,0.16)',
    '--bd2':   'rgba(0,0,0,0.26)',
    '--hv':    'rgba(0,0,0,0.05)',
    '--ac':    '#059669',
    '--acbg':  'rgba(5,150,105,0.12)',
    '--nb':    '#eceae3',
    '--nbr':   'rgba(0,0,0,0.12)',
    '--gn':    '#15803d',
    '--gnbg':  'rgba(21,128,61,0.12)',
    '--rd':    '#dc2626',
    '--rdbg':  'rgba(220,38,38,0.10)',
    '--gd':    '#b45309',
    '--gdbg':  'rgba(180,83,9,0.10)',
    '--or':    '#c2410c',
    '--orbg':  'rgba(194,65,12,0.10)',
    '--pu':    '#6d28d9',
    '--pubg':  'rgba(109,40,217,0.10)',
    '--tl':    '#0e7490',
    '--tlbg':  'rgba(14,116,144,0.10)',
    '--sh':    '0 2px 12px rgba(0,0,0,0.10)',
    '--shl':   '0 8px 40px rgba(0,0,0,0.16)',
  },

  gradient: {
    '--bg':    '#060918',
    '--bg2':   '#0d1229',
    '--bg3':   '#131a3a',
    '--bg4':   '#1a2248',
    '--tx':    '#e8eeff',
    '--mu':    '#8899cc',
    '--mu2':   '#5566aa',
    '--bd':    'rgba(130,150,255,0.15)',
    '--bd2':   'rgba(130,150,255,0.28)',
    '--hv':    'rgba(130,150,255,0.10)',
    '--ac':    '#10b981',
    '--acbg':  'rgba(16,185,129,0.16)',
    '--nb':    '#040712',
    '--nbr':   'rgba(130,150,255,0.08)',
    '--gn':    '#34d399',
    '--gnbg':  'rgba(52,211,153,0.12)',
    '--rd':    '#f87171',
    '--rdbg':  'rgba(248,113,113,0.12)',
    '--gd':    '#fde68a',
    '--gdbg':  'rgba(253,230,138,0.12)',
    '--or':    '#fb923c',
    '--orbg':  'rgba(251,146,60,0.12)',
    '--pu':    '#e879f9',
    '--pubg':  'rgba(232,121,249,0.12)',
    '--tl':    '#67e8f9',
    '--tlbg':  'rgba(103,232,249,0.12)',
    '--sh':    '0 4px 20px rgba(0,0,80,0.5)',
    '--shl':   '0 12px 48px rgba(0,0,80,0.7)',
  },

  glass: {
    '--bg':    '#0f1117',
    '--bg2':   'rgba(255,255,255,0.07)',
    '--bg3':   'rgba(255,255,255,0.10)',
    '--bg4':   'rgba(255,255,255,0.15)',
    '--tx':    '#f1f5f9',
    '--mu':    '#94a3b8',
    '--mu2':   '#64748b',
    '--bd':    'rgba(255,255,255,0.12)',
    '--bd2':   'rgba(255,255,255,0.22)',
    '--hv':    'rgba(255,255,255,0.08)',
    '--ac':    '#10b981',
    '--acbg':  'rgba(16,185,129,0.14)',
    '--nb':    'rgba(255,255,255,0.04)',
    '--nbr':   'rgba(255,255,255,0.08)',
    '--gn':    '#4ade80',
    '--gnbg':  'rgba(74,222,128,0.10)',
    '--rd':    '#f87171',
    '--rdbg':  'rgba(248,113,113,0.10)',
    '--gd':    '#fbbf24',
    '--gdbg':  'rgba(251,191,36,0.10)',
    '--or':    '#fb923c',
    '--orbg':  'rgba(251,146,60,0.10)',
    '--pu':    '#c084fc',
    '--pubg':  'rgba(192,132,252,0.10)',
    '--tl':    '#22d3ee',
    '--tlbg':  'rgba(34,211,238,0.10)',
    '--sh':    '0 4px 24px rgba(0,0,0,0.25)',
    '--shl':   '0 8px 48px rgba(0,0,0,0.35)',
  },

  neon: {
    '--bg':    '#020204',
    '--bg2':   '#06060e',
    '--bg3':   '#0a0a18',
    '--bg4':   '#0f0f22',
    '--tx':    '#e0e0ff',
    '--mu':    '#6060c0',
    '--mu2':   '#404080',
    '--bd':    'rgba(0,212,255,0.15)',
    '--bd2':   'rgba(0,212,255,0.30)',
    '--hv':    'rgba(0,212,255,0.10)',
    '--ac':    '#10b981',
    '--acbg':  'rgba(16,185,129,0.12)',
    '--nb':    '#030308',
    '--nbr':   'rgba(0,212,255,0.06)',
    '--gn':    '#39ff14',
    '--gnbg':  'rgba(57,255,20,0.08)',
    '--rd':    '#ff073a',
    '--rdbg':  'rgba(255,7,58,0.10)',
    '--gd':    '#fff700',
    '--gdbg':  'rgba(255,247,0,0.08)',
    '--or':    '#ff6600',
    '--orbg':  'rgba(255,102,0,0.10)',
    '--pu':    '#bf00ff',
    '--pubg':  'rgba(191,0,255,0.10)',
    '--tl':    '#00ffcc',
    '--tlbg':  'rgba(0,255,204,0.08)',
    '--sh':    '0 0 20px rgba(0,212,255,0.20)',
    '--shl':   '0 0 40px rgba(0,212,255,0.35)',
  },

  aurora: {
    '--bg':    '#030b1a',
    '--bg2':   '#05122a',
    '--bg3':   '#081835',
    '--bg4':   '#0b1e40',
    '--tx':    '#e8f4f8',
    '--mu':    '#7ab5cc',
    '--mu2':   '#4a7a99',
    '--bd':    'rgba(0,229,255,0.12)',
    '--bd2':   'rgba(0,229,255,0.22)',
    '--hv':    'rgba(0,229,255,0.10)',
    '--ac':    '#10b981',
    '--acbg':  'rgba(16,185,129,0.12)',
    '--nb':    '#020810',
    '--nbr':   'rgba(0,229,255,0.06)',
    '--gn':    '#00ff88',
    '--gnbg':  'rgba(0,255,136,0.08)',
    '--rd':    '#ff4466',
    '--rdbg':  'rgba(255,68,102,0.10)',
    '--gd':    '#ffe066',
    '--gdbg':  'rgba(255,224,102,0.08)',
    '--or':    '#ff9f43',
    '--orbg':  'rgba(255,159,67,0.10)',
    '--pu':    '#cc44ff',
    '--pubg':  'rgba(204,68,255,0.10)',
    '--tl':    '#00ffdd',
    '--tlbg':  'rgba(0,255,221,0.08)',
    '--sh':    '0 4px 20px rgba(0,30,60,0.5)',
    '--shl':   '0 8px 48px rgba(0,30,60,0.7)',
  },
}

export const THEME_LIST = [
  { id: 'dark',     color: '#818cf8', label: 'Dark',         emoji: '🌑' },
  { id: 'light',    color: '#4338ca', label: 'Light',        emoji: '☀️' },
  { id: 'gradient', color: '#a78bfa', label: 'Gradient Pro', emoji: '🌟' },
  { id: 'glass',    color: '#38bdf8', label: 'Glass',        emoji: '💎' },
  { id: 'neon',     color: '#00d4ff', label: 'Neon Dark',    emoji: '🔥' },
  { id: 'aurora',   color: '#00e5ff', label: 'Aurora',       emoji: '⚡' },
]

// Apply theme: sets CSS vars on <html> AND data-theme attribute
export function applyTheme(themeId: string): void {
  const vars = THEMES[themeId] || THEMES.dark
  if (typeof document === 'undefined') return
  const root = document.documentElement
  // Set data-theme for CSS [data-theme] selectors in globals.css
  root.setAttribute('data-theme', themeId)
  // Set CSS variables via inline style (higher specificity — wins over stylesheet)
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

export function getSavedTheme(): string {
  if (typeof localStorage === 'undefined') return 'dark'
  return localStorage.getItem('rbp_theme') || 'dark'
}

export function saveTheme(themeId: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('rbp_theme', themeId)
  }
}
