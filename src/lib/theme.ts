// Shared theme system for RecruitBase Pro
// Import this in every page

export const THEMES: Record<string, Record<string, string>> = {
  light:   {'--bg':'#f0f2f8','--bg2':'#ffffff','--bg3':'#e8eaf0','--bg4':'#dde0ea','--tx':'#1a1d24','--mu':'#6b7280','--mu2':'#9ca3af','--bd':'rgba(0,0,0,0.08)','--bd2':'rgba(0,0,0,0.12)','--ac':'#4c6ef5','--acbg':'rgba(76,110,245,0.1)','--nb':'#f8f9fc','--nbr':'rgba(0,0,0,0.06)','--gn':'#2da44e','--gnbg':'rgba(45,164,78,0.1)','--rd':'#ff6b6b','--rdbg':'rgba(255,107,107,0.1)','--gd':'#d4a017','--gdbg':'rgba(212,160,23,0.1)','--or':'#e67e22'},
  dark:    {'--bg':'#111318','--bg2':'#1a1d24','--bg3':'#22262f','--bg4':'#2a2e38','--tx':'#e8eaf0','--mu':'#7a7f90','--mu2':'#505468','--bd':'rgba(255,255,255,0.08)','--bd2':'rgba(255,255,255,0.13)','--ac':'#6c8cff','--acbg':'rgba(108,140,255,0.12)','--nb':'#0d0f14','--nbr':'rgba(255,255,255,0.05)','--gn':'#3dd68c','--gnbg':'rgba(61,214,140,0.1)','--rd':'#ff6b6b','--rdbg':'rgba(255,107,107,0.1)','--gd':'#ffd60a','--gdbg':'rgba(255,214,10,0.1)','--or':'#ff9f43'},
  ocean:   {'--bg':'#0a1628','--bg2':'#0d1f38','--bg3':'#112347','--bg4':'#152a54','--tx':'#e8eaf0','--mu':'#5b8db8','--mu2':'#3a6a90','--bd':'rgba(72,202,228,0.15)','--bd2':'rgba(72,202,228,0.25)','--ac':'#48cae4','--acbg':'rgba(72,202,228,0.12)','--nb':'#060f1e','--nbr':'rgba(72,202,228,0.08)','--gn':'#34d399','--gnbg':'rgba(52,211,153,0.1)','--rd':'#f87171','--rdbg':'rgba(248,113,113,0.1)','--gd':'#fde68a','--gdbg':'rgba(253,230,138,0.1)','--or':'#fbbf24'},
  forest:  {'--bg':'#0c1a0f','--bg2':'#122018','--bg3':'#182a1e','--bg4':'#1e3426','--tx':'#d4f0dc','--mu':'#5a8a68','--mu2':'#3a6048','--bd':'rgba(80,180,100,0.1)','--bd2':'rgba(80,180,100,0.2)','--ac':'#4ade80','--acbg':'rgba(74,222,128,0.1)','--nb':'#080f0a','--nbr':'rgba(74,222,128,0.08)','--gn':'#4ade80','--gnbg':'rgba(74,222,128,0.1)','--rd':'#f87171','--rdbg':'rgba(248,113,113,0.1)','--gd':'#fcd34d','--gdbg':'rgba(252,211,77,0.1)','--or':'#fb923c'},
  crimson: {'--bg':'#160a0a','--bg2':'#1e0f0f','--bg3':'#281414','--bg4':'#341a1a','--tx':'#f5dada','--mu':'#8a5050','--mu2':'#603838','--bd':'rgba(220,80,80,0.1)','--bd2':'rgba(220,80,80,0.2)','--ac':'#f87171','--acbg':'rgba(248,113,113,0.1)','--nb':'#0e0606','--nbr':'rgba(248,113,113,0.08)','--gn':'#86efac','--gnbg':'rgba(134,239,172,0.1)','--rd':'#ff4444','--rdbg':'rgba(255,68,68,0.15)','--gd':'#fde68a','--gdbg':'rgba(253,230,138,0.1)','--or':'#fbbf24'},
  purple:  {'--bg':'#0f0a1a','--bg2':'#180d24','--bg3':'#20112f','--bg4':'#28143a','--tx':'#e8eaf0','--mu':'#7a5a9a','--mu2':'#5a3a7a','--bd':'rgba(199,125,255,0.15)','--bd2':'rgba(199,125,255,0.25)','--ac':'#c77dff','--acbg':'rgba(199,125,255,0.12)','--nb':'#090614','--nbr':'rgba(199,125,255,0.08)','--gn':'#a78bfa','--gnbg':'rgba(167,139,250,0.1)','--rd':'#f87171','--rdbg':'rgba(248,113,113,0.1)','--gd':'#fde68a','--gdbg':'rgba(253,230,138,0.1)','--or':'#fb923c'},
}

export const THEME_LIST = [
  {id:'light', color:'#4c6ef5', label:'Light', emoji:'☀️'},
  {id:'dark',  color:'#6c8cff', label:'Dark',  emoji:'🌑'},
  {id:'ocean', color:'#48cae4', label:'Ocean', emoji:'🌊'},
  {id:'forest',color:'#4ade80', label:'Forest',emoji:'🌿'},
  {id:'crimson',color:'#f87171',label:'Crimson',emoji:'🔴'},
  {id:'purple',color:'#c77dff', label:'Purple',emoji:'💜'},
]

export function applyTheme(t: string) {
  const vars = THEMES[t] || THEMES.dark
  if (typeof document !== 'undefined') {
    Object.entries(vars).forEach(([k,v]) => document.documentElement.style.setProperty(k,v))
  }
}

export function getSavedTheme(): string {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('rbp_theme') || 'dark'
  }
  return 'dark'
}

export function getThemeColors(t: string) {
  return THEMES[t] || THEMES.dark
}
