// pages/_app.tsx v2.1 — Fixed: /jobseeker no longer wrapped with staff Layout
import type { AppProps } from 'next/app'
import '../src/styles/globals.css'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../src/components/Layout'
import { applyTheme, getSavedTheme, saveTheme, THEME_LIST } from '../src/components/theme'

// ✅ FIXED: /jobseeker removed — it has its OWN sidebar (JobSeekerSidebar)
const DASHBOARD_PATHS = ['/dashboard']

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [theme, setTheme] = useState('dark')
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    const saved = getSavedTheme()
    setTheme(saved)
    applyTheme(saved)
  }, [])

  const handleThemeChange = useCallback((id: string) => {
    setTheme(id)
    applyTheme(id)
    saveTheme(id)
    setShowPicker(false)
  }, [])

  useEffect(() => {
    if (!showPicker) return
    const close = () => setShowPicker(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showPicker])

  const isDashboard = DASHBOARD_PATHS.some(p => router.pathname.startsWith(p))
  const isLogin = router.pathname === '/'
  const cur = THEME_LIST.find(t => t.id === theme) || THEME_LIST[0]

  return (
    <>
      <style jsx global>{`
        /* ===== GLOBAL MOBILE-FRIENDLY LAYER (all pages) ===== */
        @media (max-width: 640px) {
          input, select, textarea {
            font-size: 16px !important;   /* prevents iOS zoom */
            min-height: 44px;
            max-width: 100%;
          }
          textarea { min-height: 72px; }
          button { min-height: 40px; touch-action: manipulation; }
          /* tables never overflow the screen */
          table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; }
          /* kill horizontal page scroll */
          html, body { overflow-x: hidden; max-width: 100vw; }
          /* leaflet maps shrink on phones */
          .leaflet-container { height: 260px !important; }
        }
        @media (max-width: 420px) {
          input, select, textarea { min-height: 42px; }
        }
      `}</style>

      {isDashboard ? (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        <Component {...pageProps} />
      )}

      {/* Theme Picker — visible everywhere except login */}
      {!isLogin && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }} onClick={e => e.stopPropagation()}>
          {showPicker && (
            <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, background: 'var(--bg2)', border: '1px solid var(--bd2)', borderRadius: 14, padding: 6, boxShadow: 'var(--shl)', minWidth: 170 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, padding: '6px 10px 8px', color: 'var(--mu)', borderBottom: '1px solid var(--bd)', marginBottom: 4 }}>🎨 Theme</div>
              {THEME_LIST.map(t => (
                <div key={t.id} onClick={() => handleThemeChange(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: theme === t.id ? 'var(--acbg)' : 'transparent', transition: 'background 0.15s' }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: t.color, flexShrink: 0, outline: theme === t.id ? `2px solid ${t.color}` : 'none', outlineOffset: 2 }} />
                  <span style={{ fontSize: 12, color: theme === t.id ? 'var(--ac)' : 'var(--tx)', fontWeight: theme === t.id ? 600 : 400, flex: 1 }}>{t.emoji} {t.label}</span>
                  {theme === t.id && <span style={{ color: 'var(--ac)', fontSize: 11 }}>✓</span>}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowPicker(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 20, background: 'var(--bg2)', border: '1px solid var(--bd2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: 'var(--tx)', boxShadow: 'var(--sh)', transition: 'all 0.15s' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: cur.color, display: 'inline-block' }} />
            {cur.emoji} {cur.label} ▾
          </button>
        </div>
      )}
    </>
  )
}
