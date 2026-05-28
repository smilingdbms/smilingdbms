import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

// ══════════════════════════════════════════════════════════
// DashboardNav v1.0 — For ALL company/dashboard pages
// Desktop: top nav with links + logout
// Mobile: hamburger → slide-in drawer with full navigation
// Theme toggle: dark/light mode
// ══════════════════════════════════════════════════════════

interface DashboardNavProps {
  userName?: string
  userRole?: string
  companyName?: string
}

const NAV_SECTIONS = [
  { label: 'Main', items: [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/dashboard/jobs', label: 'Jobs', icon: '💼' },
    { path: '/dashboard/applications', label: 'Applications', icon: '📋' },
  ]},
  { label: 'Team', items: [
    { path: '/dashboard/admin', label: 'Team Management', icon: '👥' },
    { path: '/dashboard/invite', label: 'Invite Members', icon: '📨' },
    { path: '/dashboard/permissions', label: 'Permissions', icon: '🔐' },
  ]},
  { label: 'Business', items: [
    { path: '/dashboard/bd', label: 'BD Pipeline', icon: '🤝' },
    { path: '/dashboard/interviews', label: 'Interviews', icon: '🎤' },
    { path: '/dashboard/stakeholders', label: 'Stakeholders', icon: '🏢' },
  ]},
  { label: 'More', items: [
    { path: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
    { path: '/dashboard/communications', label: 'Messages', icon: '💬' },
    { path: '/dashboard/import', label: 'Import', icon: '📤' },
    { path: '/dashboard/company', label: 'Company', icon: '⚙️' },
    { path: '/dashboard/settings', label: 'Settings', icon: '🔧' },
  ]},
]

const TOP_NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/dashboard/jobs', label: 'Jobs' },
  { path: '/dashboard/applications', label: 'Applications' },
  { path: '/dashboard/admin', label: 'Team' },
  { path: '/dashboard/bd', label: 'BD' },
  { path: '/dashboard/interviews', label: 'Interviews' },
  { path: '/dashboard/analytics', label: 'Analytics' },
]

export default function DashboardNav({ userName = '', userRole = '', companyName = '' }: DashboardNavProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const currentPath = router.pathname

  // Init theme
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('rb_theme')
      if (stored === 'light') { setDarkMode(false); applyTheme(false) }
      else applyTheme(true)
    } catch { applyTheme(true) }
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [currentPath])

  // Escape key closes menu
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  function applyTheme(dark: boolean) {
    const root = document.documentElement
    if (dark) {
      root.style.setProperty('--bg', 'var(--bg)')
      root.style.setProperty('--bg2', 'var(--bg2)')
      root.style.setProperty('--bg3', 'var(--bg2)')
      root.style.setProperty('--bg4', 'var(--bg3)')
      root.style.setProperty('--tx', 'var(--tx)')
      root.style.setProperty('--tx2', 'var(--tx)')
      root.style.setProperty('--mu', 'var(--mu)')
      root.style.setProperty('--mu2', 'var(--mu2)')
      root.style.setProperty('--bd', 'rgba(255,255,255,0.06)')
      root.style.setProperty('--bd2', 'rgba(255,255,255,0.1)')
      root.style.setProperty('--ac', '#6c8cff')
      root.style.setProperty('--acbg', 'rgba(108,140,255,0.12)')
      root.style.setProperty('--gn', '#3dd68c')
      root.style.setProperty('--rd', '#ff6b6b')
    } else {
      root.style.setProperty('--bg', '#f5f6f8')
      root.style.setProperty('--bg2', '#ffffff')
      root.style.setProperty('--bg3', '#eef0f4')
      root.style.setProperty('--bg4', '#e2e5ea')
      root.style.setProperty('--tx', 'var(--bg2)')
      root.style.setProperty('--tx2', 'var(--bg4)')
      root.style.setProperty('--mu', 'var(--mu2)')
      root.style.setProperty('--mu2', 'var(--mu)')
      root.style.setProperty('--bd', 'rgba(0,0,0,0.08)')
      root.style.setProperty('--bd2', 'rgba(0,0,0,0.12)')
      root.style.setProperty('--ac', '#4f6df5')
      root.style.setProperty('--acbg', 'rgba(79,109,245,0.1)')
      root.style.setProperty('--gn', '#16a34a')
      root.style.setProperty('--rd', '#dc2626')
    }
  }

  function toggleTheme() {
    const next = !darkMode
    setDarkMode(next)
    applyTheme(next)
    try { sessionStorage.setItem('rb_theme', next ? 'dark' : 'light') } catch {}
  }

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleBack() {
    if (currentPath === '/dashboard') return
    if (window.history.length > 1) router.back()
    else router.push('/dashboard')
  }

  const isActive = (path: string) => currentPath === path
  const roleLabel = (userRole || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <>
      <style>{`
.dn-nav{background:var(--bg2);border-bottom:1px solid var(--bd);padding:8px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;gap:6px}
.dn-logo{display:flex;align-items:center;gap:8px;cursor:pointer;flex-shrink:0}
.dn-logo-icon{width:32px;height:32px;border-radius:10px;background:var(--acbg);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--ac);font-size:15px}
.dn-logo-text{font-weight:700;font-size:14px;color:var(--tx);line-height:1.2}
.dn-logo-sub{font-size:9px;color:var(--mu);letter-spacing:1.5px;text-transform:uppercase}
.dn-links{display:flex;gap:2px;align-items:center;overflow-x:auto;-ms-overflow-style:none;scrollbar-width:none}
.dn-links::-webkit-scrollbar{display:none}
.dn-link{background:transparent;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;color:var(--mu);transition:all 0.15s;white-space:nowrap}
.dn-link:hover{background:var(--acbg);color:var(--ac)}
.dn-link.on{background:var(--acbg);color:var(--ac);font-weight:600}
.dn-right{display:flex;gap:6px;align-items:center;flex-shrink:0}
.dn-icon-btn{background:var(--bg3);border:1px solid var(--bd);border-radius:8px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:var(--mu);transition:all 0.15s}
.dn-icon-btn:hover{background:var(--acbg);color:var(--ac);border-color:var(--ac)}
.dn-logout{background:rgba(255,107,107,0.08);border:1px solid rgba(255,107,107,0.15);border-radius:8px;padding:7px 14px;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;color:var(--rd);transition:all 0.15s;white-space:nowrap}
.dn-logout:hover{background:rgba(255,107,107,0.15)}
.dn-back{background:none;border:none;color:var(--mu);cursor:pointer;font-size:18px;padding:6px;border-radius:8px;display:flex;align-items:center;transition:all 0.15s;flex-shrink:0}
.dn-back:hover{background:var(--bg3);color:var(--tx)}
.dn-hamburger{display:none;background:var(--bg3);border:1px solid var(--bd);color:var(--tx);cursor:pointer;font-size:18px;padding:6px 10px;border-radius:8px}
.dn-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200}
.dn-overlay.open{display:block}
.dn-drawer{position:fixed;top:0;right:-300px;width:300px;height:100vh;background:var(--bg2);border-left:1px solid var(--bd);z-index:201;transition:right 0.25s ease;padding:16px;display:flex;flex-direction:column;overflow-y:auto}
.dn-drawer.open{right:0}
.dn-drawer-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--bd);margin-bottom:12px}
.dn-drawer-close{background:none;border:none;color:var(--mu);cursor:pointer;font-size:20px;padding:4px}
.dn-drawer-section{font-size:10px;font-weight:600;color:var(--mu2);text-transform:uppercase;letter-spacing:1px;padding:8px 12px;margin-top:6px}
.dn-drawer-link{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:500;color:var(--mu);transition:all 0.15s;border:none;background:none;width:100%;text-align:left;font-family:inherit}
.dn-drawer-link:hover{background:var(--acbg);color:var(--ac)}
.dn-drawer-link.on{background:var(--acbg);color:var(--ac);font-weight:600}
.dn-divider{height:1px;background:var(--bd);margin:8px 0}
@media(max-width:900px){.dn-links{display:none}.dn-hamburger{display:flex}.dn-right .dn-logout{display:none}}
@media(max-width:480px){.dn-logo-text{font-size:13px}.dn-logo-sub{display:none}}
      `}</style>

      {/* TOP NAV */}
      <nav className="dn-nav">
        {currentPath !== '/dashboard' && (
          <button className="dn-back" onClick={handleBack} title="Back">←</button>
        )}

        <div className="dn-logo" onClick={() => router.push('/dashboard')}>
          <div className="dn-logo-icon">R</div>
          <div>
            <div className="dn-logo-text">{companyName || 'RecruitBase'}</div>
            <div className="dn-logo-sub">{roleLabel || 'Dashboard'}</div>
          </div>
        </div>

        <div className="dn-links">
          {TOP_NAV_ITEMS.map(item => (
            <button key={item.path} className={`dn-link ${isActive(item.path) ? 'on' : ''}`}
              onClick={() => router.push(item.path)}>{item.label}</button>
          ))}
        </div>

        <div className="dn-right">
          <button className="dn-icon-btn" onClick={toggleTheme} title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="dn-logout" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? '...' : 'Logout'}
          </button>
          <button className="dn-hamburger" onClick={() => setMenuOpen(true)}>☰</button>
        </div>
      </nav>

      {/* OVERLAY */}
      <div className={`dn-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      {/* DRAWER */}
      <div className={`dn-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="dn-drawer-head">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--tx)' }}>{userName || 'Menu'}</div>
            <div style={{ fontSize: 11, color: 'var(--mu)' }}>{roleLabel}{companyName ? ` · ${companyName}` : ''}</div>
          </div>
          <button className="dn-drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <div className="dn-drawer-section">{section.label}</div>
            {section.items.map(item => (
              <button key={item.path} className={`dn-drawer-link ${isActive(item.path) ? 'on' : ''}`}
                onClick={() => { router.push(item.path); setMenuOpen(false) }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}

        <div className="dn-divider" />

        <button className="dn-drawer-link" onClick={toggleTheme}>
          <span>{darkMode ? '☀️' : '🌙'}</span>
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div style={{ flex: 1 }} />

        <button className="dn-logout" onClick={handleLogout} disabled={loggingOut}
          style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 12, fontSize: 14, textAlign: 'center' }}>
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </>
  )
}
