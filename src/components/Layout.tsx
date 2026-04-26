import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { applyTheme, THEME_LIST } from './theme'

const NAV = [
  { icon:'👥', label:'Job Seekers', path:'/dashboard', section:'main' },
  { icon:'📋', label:'Jobs', path:'/dashboard/jobs', section:'main' },
  { icon:'💼', label:'BD Pipeline', path:'/dashboard/bd', section:'main' },
  { icon:'📅', label:'Interviews', path:'/dashboard/interviews', section:'main' },
  { icon:'📨', label:'Communications', path:'/dashboard/communications', section:'main' },
  { icon:'📩', label:'Applications', path:'/dashboard/applications', section:'reports' },
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
  const [collapsed, setCollapsed] = useState(false)

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

  const sectionLabels: Record<string,string> = { main:'Main', reports:'Reports', system:'System' }
  const sections = ['main','reports','system'] as const

  const W = collapsed ? 58 : 220

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)', color:'var(--tx)', fontFamily:"'Outfit',Inter,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        select option{background:var(--bg3,#22262f);}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .nav-item:hover{background:var(--bg3)!important;color:var(--tx)!important;}
        .nav-item.active{background:var(--acbg)!important;color:var(--ac)!important;border-left:2px solid var(--ac)!important;}
        input:focus,select:focus,textarea:focus{border-color:var(--ac)!important;box-shadow:0 0 0 3px var(--acbg);outline:none;}
        ::-webkit-scrollbar{width:4px;height:4px}
        html,body,#__next{overscroll-behavior:none !important;overscroll-behavior-x:none !important;}
        body{touch-action:pan-y;}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:4px}
        .rh:hover td{background:var(--bg3)!important;}
        .card-hover:hover{border-color:var(--ac)!important;transform:translateY(-2px);}
        .btn-primary{background:var(--ac);color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
        .btn-primary:hover{opacity:0.88;}
        .btn-ghost{background:var(--acbg);color:var(--ac);border:1px solid var(--bd2);border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
        .chip{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--bd);background:var(--bg3);color:var(--mu);transition:all .15s;font-family:inherit;}
        .chip:hover,.chip.on{background:var(--acbg);color:var(--ac);border-color:var(--ac);}
        .filter-select{background:var(--bg3);border:1px solid var(--bd);border-radius:8px;padding:7px 12px;color:var(--tx);font-size:12px;outline:none;font-family:inherit;cursor:pointer;}
        @media(max-width:900px){.sb-full{display:none!important;}.mobile-topbar{display:flex!important;}}
        @media(min-width:901px){.mobile-topbar{display:none!important;}}
      `}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <div className="sb-full" style={{ width:W, background:'var(--bg2)', borderRight:'1px solid var(--bd)', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto', zIndex:40, transition:'width .2s' }}>

        {/* Logo */}
        <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', flex:1 }} onClick={()=>router.push('/dashboard')}>
              <div style={{ width:32, height:32, borderRadius:8, background:'var(--acbg)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'var(--ac)', fontSize:16, border:'1px solid var(--ac)', flexShrink:0 }}>R</div>
              <div>
                <div style={{ fontSize:14, fontWeight:800, letterSpacing:'-0.4px' }}>Recruit<span style={{color:'var(--ac)'}}>Base</span></div>
                <div style={{ fontSize:8, color:'var(--mu)', letterSpacing:'2px', textTransform:'uppercase' }}>Recruitment OS</div>
              </div>
            </div>
          )}
          {collapsed && <div style={{ width:32, height:32, borderRadius:8, background:'var(--acbg)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'var(--ac)', fontSize:16, cursor:'pointer', margin:'0 auto' }} onClick={()=>router.push('/dashboard')}>R</div>}
          <button onClick={()=>setCollapsed(c=>!c)} style={{ background:'none', border:'none', color:'var(--mu)', cursor:'pointer', fontSize:16, padding:2, flexShrink:0, marginLeft:collapsed?0:4 }}>{collapsed?'→':'←'}</button>
        </div>

        {/* User */}
        {!collapsed && appUser && (
          <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--acbg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'var(--ac)', flexShrink:0, border:'1.5px solid var(--ac)' }}>
              {(appUser?.full_name||'U')[0].toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{appUser?.full_name}</div>
              <div style={{ fontSize:10, color:'var(--mu)', textTransform:'capitalize' }}>{appUser?.role?.replace(/_/g,' ')}</div>
              <div style={{ fontSize:11, color:'#ffd60a', fontWeight:600 }}>⭐ {appUser?.points||0} pts</div>
            </div>
          </div>
        )}

        {/* Nav items */}
        {sections.map(section => {
          const items = NAV.filter(n => n.section === section && (!n.adminOnly || isAdmin))
          if (!items.length) return null
          return (
            <div key={section}>
              {!collapsed && <div style={{ padding:'10px 14px 3px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', color:'var(--mu2)' }}>{sectionLabels[section]}</div>}
              {collapsed && <div style={{ height:8 }}/>}
              {items.map(item => {
                const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path))
                return (
                  <div key={item.label}
                    className={`nav-item${isActive?' active':''}`}
                    onClick={()=>router.push(item.path)}
                    title={collapsed ? item.label : undefined}
                    style={{ display:'flex', alignItems:'center', gap:10, padding: collapsed ? '10px 0' : '9px 14px', cursor:'pointer', fontSize:13, fontWeight:isActive?600:400, color:isActive?'var(--ac)':'var(--mu)', borderLeft:`2px solid ${isActive?'var(--ac)':'transparent'}`, transition:'all .15s', margin:'1px 0', justifyContent:collapsed?'center':'flex-start' }}>
                    <span style={{ fontSize:15, width:18, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                    {!collapsed && <span style={{ flex:1 }}>{item.label}</span>}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Bottom */}
        <div style={{ marginTop:'auto', padding:'12px 14px', borderTop:'1px solid var(--bd)' }}>
          {!collapsed && <div style={{ fontSize:10, color:'var(--mu)', marginBottom:7, fontWeight:600, textTransform:'uppercase', letterSpacing:'1px' }}>Theme</div>}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10, justifyContent:collapsed?'center':'flex-start' }}>
            {THEME_LIST.map(t=>(
              <div key={t.id} onClick={()=>switchTheme(t.id)} title={t.label}
                style={{ width:18, height:18, borderRadius:'50%', background:t.color, cursor:'pointer', border:theme===t.id?`2.5px solid var(--tx)`:'2px solid transparent', transition:'all .15s', transform:theme===t.id?'scale(1.25)':'scale(1)' }}/>
            ))}
          </div>
          <div onClick={signOut}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, cursor:'pointer', fontSize:12, color:'#ff6b6b', background:'rgba(255,107,107,0.08)', justifyContent:collapsed?'center':'flex-start' }}
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,107,107,0.15)')}
            onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,107,107,0.08)')}>
            <span>🚪</span>{!collapsed && <span>Sign Out</span>}
          </div>
          {!collapsed && <div style={{ fontSize:9, color:'var(--mu2)', marginTop:8, textAlign:'center' }}>v25 · Enterprise Plan</div>}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {children}
      </div>
    </div>
  )
}
