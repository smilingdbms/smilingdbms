import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

// ══════════════════════════════════════════════════════════
// JobSeeker Sidebar v1.0 — Production Grade
// Mobile: hamburger menu overlay
// Desktop: top nav bar
// Features: back, logout, night mode, nav links
// ══════════════════════════════════════════════════════════

interface SidebarProps {
  userName?: string
  xp?: number
  streak?: number
  vibeMode?: 'fun' | 'professional' | 'focus'
  onVibeChange?: (v: 'fun' | 'professional' | 'focus') => void
  nightMode?: boolean
  onNightModeChange?: (v: boolean) => void
}

const NAV_ITEMS = [
  { path: '/jobseeker', label: 'Browse Jobs', icon: '🔍' },
  { path: '/jobseeker/applications', label: 'Applications', icon: '📋' },
  { path: '/jobseeker/profile', label: 'My Profile', icon: '👤' },
]

const VIBE_OPTIONS: { value: 'fun' | 'professional' | 'focus'; icon: string; label: string }[] = [
  { value: 'fun', icon: '🎮', label: 'Fun' },
  { value: 'professional', icon: '💼', label: 'Pro' },
  { value: 'focus', icon: '🎯', label: 'Focus' },
]

export default function JobSeekerSidebar({
  userName = '',
  xp = 0,
  streak = 0,
  vibeMode = 'fun',
  onVibeChange,
  nightMode = false,
  onNightModeChange,
}: SidebarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const currentPath = router.pathname

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [currentPath])

  // Close menu on escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Prevent body scroll when menu open on mobile
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/jobseeker')
    }
  }

  const isActive = (path: string) => currentPath === path

  return (
    <>
      <style>{`
        .js-nav{background:#161921;border-bottom:1px solid rgba(255,255,255,0.06);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;gap:8px}
        .js-logo{display:flex;align-items:center;gap:8px;cursor:pointer}
        .js-logo-icon{width:32px;height:32px;border-radius:10px;background:rgba(108,140,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:800;color:#6c8cff;font-size:15px}
        .js-logo-text{font-weight:700;font-size:15px;line-height:1.2}
        .js-logo-sub{font-size:9px;color:#505468;letter-spacing:1.5px;text-transform:uppercase}
        .js-nav-links{display:flex;gap:4px;align-items:center}
        .js-nav-btn{background:transparent;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:8px 14px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;color:#7a7f90;transition:all 0.15s;white-space:nowrap}
        .js-nav-btn:hover{background:rgba(108,140,255,0.08);color:#6c8cff;border-color:rgba(108,140,255,0.2)}
        .js-nav-btn.active{background:rgba(108,140,255,0.12);color:#6c8cff;border-color:rgba(108,140,255,0.25)}
        .js-back-btn{background:none;border:none;color:#7a7f90;cursor:pointer;font-size:18px;padding:6px;border-radius:8px;display:flex;align-items:center;transition:all 0.15s}
        .js-back-btn:hover{background:rgba(255,255,255,0.06);color:#e8eaf0}
        .js-hamburger{display:none;background:none;border:1px solid rgba(255,255,255,0.08);color:#e8eaf0;cursor:pointer;font-size:20px;padding:6px 10px;border-radius:8px}
        .js-vibe-toggle{display:flex;background:rgba(255,255,255,0.04);border-radius:10px;padding:2px;border:1px solid rgba(255,255,255,0.06)}
        .js-vibe-btn{padding:5px 8px;border-radius:8px;border:none;cursor:pointer;font-size:13px;background:transparent;color:#505468;font-family:inherit;transition:all 0.15s}
        .js-vibe-btn.active{background:rgba(108,140,255,0.2);color:#6c8cff}
        .js-night-btn{background:none;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:5px 10px;cursor:pointer;font-size:14px;transition:all 0.15s}
        .js-night-btn:hover{background:rgba(255,255,255,0.06)}
        .js-logout-btn{background:rgba(255,107,107,0.08);border:1px solid rgba(255,107,107,0.15);border-radius:10px;padding:8px 14px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;color:#ff6b6b;transition:all 0.15s;white-space:nowrap}
        .js-logout-btn:hover{background:rgba(255,107,107,0.15)}
        .js-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:200}
        .js-overlay.open{display:block}
        .js-drawer{position:fixed;top:0;right:-280px;width:280px;height:100vh;background:#161921;border-left:1px solid rgba(255,255,255,0.08);z-index:201;transition:right 0.25s ease;padding:20px 16px;display:flex;flex-direction:column;overflow-y:auto}
        .js-drawer.open{right:0}
        .js-drawer-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .js-drawer-close{background:none;border:none;color:#7a7f90;cursor:pointer;font-size:22px;padding:4px}
        .js-drawer-nav{display:flex;flex-direction:column;gap:4px;margin-bottom:20px}
        .js-drawer-link{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;color:#7a7f90;transition:all 0.15s;border:none;background:none;width:100%;text-align:left;font-family:inherit}
        .js-drawer-link:hover{background:rgba(108,140,255,0.08);color:#6c8cff}
        .js-drawer-link.active{background:rgba(108,140,255,0.12);color:#6c8cff}
        .js-drawer-section{font-size:11px;font-weight:600;color:#505468;text-transform:uppercase;letter-spacing:1px;padding:8px 14px;margin-top:8px}
        .js-drawer-divider{height:1px;background:rgba(255,255,255,0.06);margin:8px 0}
        .js-stats{display:flex;gap:8px;padding:0 14px;margin-bottom:16px}
        .js-stat{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:8px 12px;font-size:12px;flex:1;text-align:center}
        @media(max-width:768px){
          .js-nav-links{display:none}
          .js-hamburger{display:flex}
          .js-vibe-toggle-desktop{display:none}
          .js-nav{padding:8px 12px}
        }
      `}</style>

      {/* ── TOP NAV BAR ── */}
      <nav className="js-nav">
        {/* Back button */}
        {currentPath !== '/jobseeker' && (
          <button className="js-back-btn" onClick={handleBack} title="Back">
            ←
          </button>
        )}

        {/* Logo */}
        <div className="js-logo" onClick={() => router.push('/jobseeker')}>
          <div className="js-logo-icon">R</div>
          <div>
            <div className="js-logo-text">RecruitBase</div>
            <div className="js-logo-sub">Job Portal</div>
          </div>
        </div>

        {/* Desktop: Vibe Toggle */}
        <div className="js-vibe-toggle js-vibe-toggle-desktop">
          {VIBE_OPTIONS.map(v => (
            <button
              key={v.value}
              className={`js-vibe-btn ${vibeMode === v.value ? 'active' : ''}`}
              onClick={() => onVibeChange?.(v.value)}
              title={v.label}
            >
              {v.icon}
            </button>
          ))}
        </div>

        {/* Desktop: Nav Links */}
        <div className="js-nav-links">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`js-nav-btn ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => router.push(item.path)}
            >
              {item.label}
            </button>
          ))}
          <button
            className="js-night-btn"
            onClick={() => onNightModeChange?.(!nightMode)}
            title={nightMode ? 'Light mode' : 'Dark mode'}
          >
            {nightMode ? '☀️' : '🌙'}
          </button>
          <button
            className="js-logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? '...' : 'Logout'}
          </button>
        </div>

        {/* Mobile: Hamburger */}
        <button className="js-hamburger" onClick={() => setMenuOpen(true)}>
          ☰
        </button>
      </nav>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      <div className={`js-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      {/* ── MOBILE DRAWER ── */}
      <div className={`js-drawer ${menuOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="js-drawer-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#e8eaf0' }}>
              {userName || 'Menu'}
            </div>
            <div style={{ fontSize: 12, color: '#505468' }}>Job Seeker</div>
          </div>
          <button className="js-drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        {/* Stats */}
        {vibeMode === 'fun' && (
          <div className="js-stats">
            <div className="js-stat" style={{ color: '#ff9f43' }}>🔥 {streak}d</div>
            <div className="js-stat" style={{ color: '#6c8cff' }}>⭐ {xp} XP</div>
          </div>
        )}

        {/* Navigation */}
        <div className="js-drawer-section">Navigation</div>
        <div className="js-drawer-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`js-drawer-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => { router.push(item.path); setMenuOpen(false) }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="js-drawer-divider" />

        {/* Feed Style */}
        <div className="js-drawer-section">Feed Style</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 8px', marginBottom: 12 }}>
          {VIBE_OPTIONS.map(v => (
            <button
              key={v.value}
              className={`js-drawer-link ${vibeMode === v.value ? 'active' : ''}`}
              onClick={() => { onVibeChange?.(v.value); }}
              style={{ padding: '10px 14px' }}
            >
              <span>{v.icon}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>

        <div className="js-drawer-divider" />

        {/* Settings */}
        <div className="js-drawer-section">Settings</div>
        <button
          className="js-drawer-link"
          onClick={() => onNightModeChange?.(!nightMode)}
        >
          <span>{nightMode ? '☀️' : '🌙'}</span>
          <span>{nightMode ? 'Light Mode' : 'Night Mode'}</span>
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Logout */}
        <button
          className="js-logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{ width: '100%', marginTop: 16, padding: '12px', borderRadius: 12, fontSize: 14 }}
        >
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </>
  )
}
