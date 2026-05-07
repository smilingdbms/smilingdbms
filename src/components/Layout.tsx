import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { applyTheme, THEME_LIST } from './theme'

const NAV = [
  { icon:'👥', label:'Job Seekers', path:'/dashboard', section:'main' },
  { icon:'💼', label:'Jobs', path:'/dashboard/jobs', section:'main' },
  { icon:'👔', label:'BD Pipeline', path:'/dashboard/bd', section:'main' },
  { icon:'📅', label:'Interviews', path:'/dashboard/interviews', section:'main' },
  { icon:'💬', label:'Communications', path:'/dashboard/communications', section:'main' },
  { icon:'🏆', label:'Placements', path:'/dashboard/placements', section:'main' },
  { icon:'🛡️', label:'Team Member', path:'/dashboard/team', section:'main' },
  { icon:'📥', label:'Applications', path:'/dashboard/applications', section:'reports' },
  { icon:'📊', label:'Analytics', path:'/dashboard/analytics', section:'reports' },
  { icon:'🏢', label:'My Company', path:'/dashboard/company', section:'reports' },
  { icon:'🤝', label:'Stakeholders', path:'/dashboard/stakeholders', section:'reports', adminOnly:true },
  { icon:'👑', label:'Admin Panel', path:'/dashboard/admin', section:'system', adminOnly:true },
  { icon:'⚙️', label:'Settings', path:'/dashboard/settings', section:'system' },
  { icon:'🎯', label:'Job Board', path:'/jobs', section:'system' },
]

interface LayoutProps {
  children: React.ReactNode
  appUser?: any
  unreadCount?: number
  onNotificationClick?: () => void
}

export default function Layout({ children, appUser, unreadCount = 0, onNotificationClick }: LayoutProps) {
  const router = useRouter()
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const t = localStorage.getItem('rbp_theme') || 'dark'
    setTheme(t); applyTheme(t)
  }, [])

  function switchTheme(t: string) {
    setTheme(t); applyTheme(t)
    localStorage.setItem('rbp_theme', t)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const adminRoles = ['super_admin','admin','platform_manager','operations_manager','support_manager','account_owner','team_manager']
  const isAdmin = adminRoles.includes(appUser?.role || '')
  const currentPath = router.pathname

  const sectionLabels: Record<string,string> = { main:'MAIN', reports:'REPORTS', system:'SYSTEM' }
  const sections = ['main','reports','system'] as const

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0e14', color: '#e2e8f0', fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        *{box-sizing:border-box;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px;height:4px}
        html,body,#__next{overscroll-behavior:none !important;overscroll-behavior-x:none !important; margin:0; padding:0;}
        body{touch-action:pan-y;}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#374151;border-radius:4px}
      `}</style>

      {/* ── ENTERPRISE SIDEBAR (Master Layout) ── */}
      <aside style={{ width: '260px', backgroundColor: '#121822', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', position: 'fixed', zIndex: 50 }}>
        
        {/* Logo Section */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '20px' }}>R</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', lineHeight: '1' }}>RecruitBase</div>
            <div style={{ fontSize: '10px', color: '#8b949e', letterSpacing: '1px', marginTop: '4px' }}>RECRUITMENT OS</div>
          </div>
        </div>
        
        {/* Profile Section */}
        <div style={{ padding: '0 20px 20px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1e293b', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 'bold', fontSize: '16px' }}>
            {(appUser?.full_name||'P')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {appUser?.full_name || 'Pravin'}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'capitalize' }}>
              {appUser?.role?.replace(/_/g,' ') || 'Super Admin'}
            </div>
            <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700', marginTop:'2px' }}>
              ⭐ {appUser?.points||65} pts
            </div>
          </div>
        </div>
        
        {/* Navigation Menus */}
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {sections.map(section => {
            const items = NAV.filter(n => n.section === section && (!n.adminOnly || isAdmin))
            if (!items.length) return null
            return (
              <div key={section}>
                <div style={{ padding: '15px 20px 5px', fontSize: '11px', fontWeight: '800', color: '#4b5563', letterSpacing: '1.5px' }}>
                  {sectionLabels[section]}
                </div>
                {items.map(item => {
                  const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path))
                  return (
                    <div key={item.label} onClick={() => router.push(item.path)} 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', margin: '2px 10px', 
                        borderRadius: '8px', cursor: 'pointer', 
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent', 
                        color: isActive ? '#60a5fa' : '#9ca3af', 
                        fontWeight: isActive ? '700' : '500', 
                        fontSize: '14px', transition: '0.2s' 
                      }} 
                      onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = '#1f2937'; e.currentTarget.style.color = '#fff'; } }} 
                      onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; } }}>
                      <span style={{ fontSize: '18px' }}>{item.icon}</span> {item.label}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Theme & Logout */}
        <div style={{ padding: '20px', borderTop: '1px solid #1f2937' }}>
          <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: '800', marginBottom: '12px', letterSpacing: '1.5px' }}>THEME</div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {THEME_LIST.map(t=>(
              <div key={t.id} onClick={()=>switchTheme(t.id)} title={t.label}
                style={{ width:'20px', height:'20px', borderRadius:'50%', backgroundColor:t.color, cursor:'pointer', border:theme===t.id?`2px solid #fff`:'none', outline:theme===t.id?`2px solid #3b82f6`:'none', outlineOffset:'2px', transition:'0.2s' }}/>
            ))}
          </div>
          <button onClick={signOut} style={{ width: '100%', backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.2)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)'}>
            <span>🚪</span> Sign Out
          </button>
          <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '11px', color: '#4b5563', fontWeight: '500' }}>v25 · Enterprise Plan</div>
        </div>
      </aside>

      {/* ── CONTENT AREA ── */}
      <main style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

    </div>
  )
}