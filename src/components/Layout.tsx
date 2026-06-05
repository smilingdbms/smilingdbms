import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { applyTheme, getSavedTheme, saveTheme, THEME_LIST } from './theme';

// ═══════════════════════════════════════════════════════════
// Layout.tsx v4.3 — RecruitBase Pro
// Clean sectioned sidebar + 6-theme picker at bottom (theme.ts).
// v4.3: + Placements (Recruitment); Account Owner ka Dashboard
//       /dashboard/ao (AO workspace) pe khulta hai.
// ═══════════════════════════════════════════════════════════

type SubMenu = { name: string; path: string; roles?: string[] };
type Menu = {
  id: string; icon: string; title: string; roles: string[];
  section?: string;
  path?: string;
  submenus?: SubMenu[];
};

const ALL    = ['super_admin','platform_admin','platform_manager','account_owner','team_manager','team_leader','sr_recruiter','recruiter','individual_recruiter','bd','job_seeker'];
const STAFF  = ['super_admin','platform_admin','platform_manager','account_owner','team_manager','team_leader','sr_recruiter','recruiter','individual_recruiter','bd'];
const HIRING = ['super_admin','platform_admin','platform_manager','account_owner','team_manager','team_leader','sr_recruiter','recruiter','individual_recruiter'];
const LEADS  = ['super_admin','platform_admin','platform_manager','account_owner','team_manager','team_leader'];
const ADMIN  = ['super_admin','platform_admin','platform_manager','account_owner'];
const SA_ONLY = ['super_admin','platform_admin','platform_manager'];
const BD_TEAM = ['super_admin','platform_admin','platform_manager','account_owner','team_manager','team_leader','bd'];

const menuData: Menu[] = [
  // ── WORKSPACE ──
  { id:'dash',   icon:'🏠', title:'Dashboard',      roles: STAFF, section:'Workspace', path:'/dashboard' },
  { id:'notif',  icon:'🔔', title:'Notifications',  roles: STAFF, path:'/dashboard/notifications' },

  // ── RECRUITMENT ──
  { id:'cand',   icon:'👥', title:'Candidates',     roles: HIRING, section:'Recruitment', submenus:[
      { name:'All Candidates', path:'/dashboard/master' },
      { name:'Add Candidate',  path:'/dashboard/add-profile' },
      { name:'Bulk Import',    path:'/dashboard/import', roles: ADMIN },
  ]},
  { id:'jobs',   icon:'💼', title:'Jobs',           roles: STAFF,  path:'/dashboard/jobs' },
  { id:'apps',   icon:'📋', title:'Applications',   roles: HIRING, path:'/dashboard/applications' },
  { id:'int',    icon:'📅', title:'Interviews',     roles: HIRING, path:'/dashboard/interviews' },
  { id:'place',  icon:'🎯', title:'Placements',     roles: HIRING, path:'/dashboard/placements' },

  // ── BUSINESS ──
  { id:'bd',     icon:'🤝', title:'Clients & BD',   roles: BD_TEAM, section:'Business', submenus:[
      { name:'All Clients',  path:'/dashboard/bd' },
      { name:'Stakeholders', path:'/dashboard/stakeholders', roles: ADMIN },
  ]},
  { id:'analytics', icon:'📊', title:'Analytics',   roles: LEADS,  path:'/dashboard/analytics' },
  { id:'comms',  icon:'📨', title:'Communications', roles: STAFF,  path:'/dashboard/communications' },
  { id:'ai',     icon:'🤖', title:'AI Tools',       roles: ALL,    path:'/dashboard/ai' },

  // ── ADMINISTRATION ──
  { id:'team',   icon:'👤', title:'Team & Access',  roles: ADMIN, section:'Administration', submenus:[
      { name:'Team & Invites',       path:'/dashboard/invite' },
      { name:'Employee Permissions', path:'/dashboard/permissions' },
      { name:'Role Permissions',     path:'/dashboard/company-permissions' },
  ]},
  { id:'admin',  icon:'🛡️', title:'Admin Center',   roles: ADMIN, path:'/dashboard/admin' },
  { id:'billing',icon:'💳', title:'Billing & Plan', roles: ADMIN, path:'/dashboard/billing' },
  { id:'company',icon:'🏢', title:'Company Profile',roles: ADMIN, path:'/dashboard/company' },

  // ── PLATFORM ──
  { id:'overview', icon:'🌐', title:'Platform Overview', roles: SA_ONLY, section:'Platform', path:'/dashboard/overview' },
  { id:'platform', icon:'🏢', title:'Companies & Plans', roles: SA_ONLY, path:'/dashboard/companies' },

  // ── SUPPORT ──
  { id:'settings', icon:'⚙️', title:'Settings', roles: ALL, section:'Support', path:'/dashboard/settings' },
  { id:'feedback', icon:'💬', title:'Feedback', roles: ALL, path:'/dashboard/feedback' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    try { const s = localStorage.getItem('rbp_logo'); if (s) setBrandLogo(s); } catch {}
  }, []);

  useEffect(() => { try { setTheme(getSavedTheme()); } catch {} }, []);

  useEffect(() => {
    if (!showThemePicker) return;
    const close = () => setShowThemePicker(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showThemePicker]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      const { data } = await supabase.from('app_users').select('full_name, role').eq('id', user.id).single();
      if (data) {
        if (data.role === 'job_seeker') { router.replace('/jobseeker'); return; }
        setUserName(data.full_name || user.email || '');
        setUserRole(data.role || '');
      }
    };
    fetchUser();
  }, []);

  useEffect(() => { setIsMobileOpen(false); }, [router.pathname]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { const b = reader.result as string; setBrandLogo(b); try { localStorage.setItem('rbp_logo', b); } catch {} };
      reader.readAsDataURL(file);
    }
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
  const handleAccordion = (menuId: string) => {
    if (isCollapsed && !isMobileOpen) { setIsCollapsed(false); setTimeout(() => setOpenMenu(openMenu === menuId ? null : menuId), 150); }
    else { setOpenMenu(openMenu === menuId ? null : menuId); }
  };
  const handleLogout = async () => { setLoggingOut(true); await supabase.auth.signOut(); router.push('/'); };

  const changeTheme = (id: string) => { setTheme(id); applyTheme(id); saveTheme(id); setShowThemePicker(false); };
  const handleThemeClick = () => {
    if (isCollapsed && !isMobileOpen) { setIsCollapsed(false); setTimeout(() => setShowThemePicker(true), 150); }
    else { setShowThemePicker(v => !v); }
  };
  const cur = THEME_LIST.find(t => t.id === theme) || THEME_LIST[0];

  const roleLabel = userRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const visibleMenus = menuData.filter(m => m.roles.includes(userRole));
  const getVisibleSubmenus = (menu: Menu) => (menu.submenus || []).filter(s => !s.roles || s.roles.includes(userRole));

  // Account Owner ka Dashboard -> AO workspace
  const dashPath = userRole === 'account_owner' ? '/dashboard/ao' : '/dashboard';
  const hrefFor = (menu: Menu) => (menu.id === 'dash' ? dashPath : (menu.path || '#'));

  const isDirectActive = (menu: Menu) => {
    if (menu.id === 'dash') return router.pathname === '/dashboard' || router.pathname === '/dashboard/ao';
    return !!menu.path && router.pathname === menu.path;
  };
  const isAccordionActive = (menu: Menu) => (menu.submenus || []).some(s => {
    const b = s.path.split('#')[0].split('?')[0];
    return router.pathname === b || router.asPath.startsWith(b + '#') || router.asPath.startsWith(b + '?');
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        .os-layout { font-family: var(--fn, 'Outfit', sans-serif); background: var(--bg); color: var(--tx); display: flex; height: 100vh; overflow: hidden; }
        .os-sidebar-scroll { flex: 1; overflow-y: auto; padding: 6px 0 12px; }
        .os-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .os-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .os-sidebar-scroll::-webkit-scrollbar-thumb { background: var(--bd2); border-radius: 4px; }
        .os-section { font-size: 9.5px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: var(--mu2, var(--mu)); padding: 14px 18px 5px; opacity: 0.65; }
        .os-menu-item { padding: 11px 18px; display: flex; align-items: center; cursor: pointer; color: var(--mu); border-left: 3px solid transparent; white-space: nowrap; overflow: hidden; transition: background 0.15s, color 0.15s; text-decoration: none; }
        .os-menu-item:hover { background: var(--acbg); color: var(--tx); }
        .os-menu-item.active { background: var(--acbg); color: var(--ac); border-left-color: var(--ac); }
        .os-submenu-item { text-decoration: none; display: block; padding: 9px 18px 9px 58px; font-size: 12.5px; color: var(--mu); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.15s, background 0.15s, padding-left 0.15s; }
        .os-submenu-item:hover { color: var(--ac); background: var(--acbg); padding-left: 63px; }
        .os-submenu-item.active { color: var(--ac); font-weight: 600; }
        .os-platform-item { background: var(--pubg, var(--acbg)) !important; border-left-color: #7C3AED !important; color: var(--pu, var(--ac)) !important; }
        .os-footer { border-top: 1px solid var(--bd); flex-shrink: 0; }
        .os-theme-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 18px; background: none; border: none; color: var(--mu); font-family: inherit; font-size: 13px; cursor: pointer; transition: background 0.15s, color 0.15s; }
        .os-theme-btn:hover { background: var(--acbg); color: var(--tx); }
        .os-theme-opt { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
        .os-theme-opt:hover { background: var(--acbg); }
        .os-user-bar { padding: 12px 16px; display: flex; align-items: center; gap: 10px; }
        .os-logout-btn { background: var(--rdbg); border: 1px solid var(--rd); color: var(--rd); border-radius: 7px; padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s; width: 100%; margin-top: 6px; }
        .os-logout-btn:hover { background: var(--rd); }
        .os-mobile-header { display: none; align-items: center; justify-content: space-between; padding: 0 20px; height: 58px; background: var(--nb); border-bottom: 1px solid var(--bd); position: fixed; top: 0; left: 0; right: 0; z-index: 50; }
        @media (max-width: 768px) { .os-mobile-header { display: flex; } .os-desktop-toggle { display: none !important; } .os-main-content { padding-top: 78px !important; } }
        @media (min-width: 769px) { .os-mobile-only { display: none !important; } }
      `}} />

      <div className="os-mobile-header">
        <div style={{ fontWeight: 900, fontSize: '18px', color: 'var(--ac)', letterSpacing: '0.5px' }}>RecruitBase Pro</div>
        <button onClick={toggleMobileSidebar} style={{ background: 'none', border: 'none', color: 'var(--ac)', fontSize: '24px', cursor: 'pointer' }}>☰</button>
      </div>

      {isMobileOpen && <div className="os-mobile-only" onClick={toggleMobileSidebar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 98 }} />}

      <div className="os-layout">
        <div style={{ width: isCollapsed ? '68px' : '280px', background: 'var(--nb)', borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', zIndex: 99, flexShrink: 0, height: '100vh', position: isMobile ? 'fixed' : 'relative', transform: isMobile && !isMobileOpen ? 'translateX(-100%)' : 'translateX(0)', transition: 'width 0.28s ease, transform 0.28s ease', overflow: 'hidden' }}>

          {/* Brand / logo */}
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', padding: isCollapsed ? '0 10px' : '0 16px', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" style={{ display: 'none' }} />
            {!isCollapsed && (
              <div onClick={() => fileInputRef.current?.click()} title="Click to upload your logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', overflow: 'hidden' }}>
                {brandLogo ? <img src={brandLogo} alt="Logo" style={{ height: '28px', maxWidth: '140px', objectFit: 'contain' }} /> : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--acbg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ac)', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>R</div>
                    <div><div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--tx)', lineHeight: 1.2 }}>RecruitBase Pro</div><div style={{ fontSize: '9px', color: 'var(--mu)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{roleLabel || 'Dashboard'}</div></div>
                  </div>
                )}
              </div>
            )}
            <button className="os-desktop-toggle" onClick={toggleSidebar} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} style={{ background: 'none', border: 'none', color: 'var(--ac)', fontSize: '20px', cursor: 'pointer', flexShrink: 0, padding: '4px' }}>{isCollapsed ? '☰' : '✖'}</button>
          </div>

          {/* Menu */}
          <div className="os-sidebar-scroll">
            {visibleMenus.map((menu) => {
              const isPlatform = menu.id === 'platform';
              const isDirect = !!menu.path && (!menu.submenus || menu.submenus.length === 0);

              if (isDirect) {
                const active = isDirectActive(menu);
                return (
                  <div key={menu.id}>
                    {menu.section && !isCollapsed && <div className="os-section">{menu.section}</div>}
                    <Link href={hrefFor(menu)} className={`os-menu-item ${active ? 'active' : ''} ${isPlatform ? 'os-platform-item' : ''}`} title={isCollapsed ? menu.title : undefined} onClick={() => setIsMobileOpen(false)}>
                      <span style={{ fontSize: '18px', minWidth: '28px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{menu.icon}</span>
                      {!isCollapsed && <span style={{ marginLeft: '12px', fontSize: '13.5px', fontWeight: active ? 600 : 500, flex: 1 }}>{menu.title}</span>}
                    </Link>
                  </div>
                );
              }

              const isOpen = openMenu === menu.id;
              const active = isAccordionActive(menu);
              const subs = getVisibleSubmenus(menu);
              return (
                <div key={menu.id}>
                  {menu.section && !isCollapsed && <div className="os-section">{menu.section}</div>}
                  <div className={`os-menu-item ${active ? 'active' : ''}`} onClick={() => handleAccordion(menu.id)} title={isCollapsed ? menu.title : undefined}>
                    <span style={{ fontSize: '18px', minWidth: '28px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{menu.icon}</span>
                    {!isCollapsed && (<><span style={{ marginLeft: '12px', fontSize: '13.5px', fontWeight: active ? 600 : 500, flex: 1 }}>{menu.title}</span><span style={{ fontSize: '11px', color: 'var(--mu)', marginLeft: '4px' }}>{isOpen ? '▼' : '▶'}</span></>)}
                  </div>
                  {isOpen && !isCollapsed && subs.length > 0 && (
                    <div style={{ background: 'var(--nb)', paddingBottom: '4px' }}>
                      {subs.map((sub, idx) => {
                        const bp = sub.path.split('#')[0].split('?')[0];
                        const sa = router.asPath === sub.path || (router.pathname === bp && sub.path === bp);
                        return <Link href={sub.path} key={idx} className={`os-submenu-item ${sa ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>· {sub.name}</Link>;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer: theme picker + user + logout */}
          <div className="os-footer">
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              {showThemePicker && !isCollapsed && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: 12, right: 12, background: 'var(--bg2)', border: '1px solid var(--bd2)', borderRadius: 12, padding: 6, boxShadow: 'var(--shl)', zIndex: 100 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, padding: '6px 10px 8px', color: 'var(--mu)', borderBottom: '1px solid var(--bd)', marginBottom: 4 }}>🎨 Theme</div>
                  {THEME_LIST.map(t => (
                    <div key={t.id} className="os-theme-opt" onClick={() => changeTheme(t.id)} style={{ background: theme === t.id ? 'var(--acbg)' : 'transparent' }}>
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: t.color, flexShrink: 0, outline: theme === t.id ? `2px solid ${t.color}` : 'none', outlineOffset: 2 }} />
                      <span style={{ fontSize: 12, color: theme === t.id ? 'var(--ac)' : 'var(--tx)', fontWeight: theme === t.id ? 600 : 400, flex: 1 }}>{t.emoji} {t.label}</span>
                      {theme === t.id && <span style={{ color: 'var(--ac)', fontSize: 11 }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
              <button className="os-theme-btn" onClick={handleThemeClick} title={isCollapsed ? `Theme: ${cur.label}` : undefined}>
                <span style={{ fontSize: '18px', minWidth: '28px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{cur.emoji}</span>
                {!isCollapsed && <span style={{ flex: 1, textAlign: 'left' }}>{cur.label}</span>}
                {!isCollapsed && <span style={{ fontSize: '11px', color: 'var(--mu)' }}>▴</span>}
              </button>
            </div>

            <div className="os-user-bar" style={{ flexDirection: 'column', alignItems: 'flex-start', borderTop: '1px solid var(--bd)' }}>
              {!isCollapsed && userName && (
                <div style={{ width: '100%', marginBottom: '2px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                  {roleLabel && <div style={{ fontSize: '10px', color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{roleLabel}</div>}
                </div>
              )}
              <button className="os-logout-btn" onClick={handleLogout} disabled={loggingOut} title="Logout">{isCollapsed ? '🚪' : (loggingOut ? 'Logging out...' : '🚪 Logout')}</button>
            </div>
          </div>
        </div>

        <main className="os-main-content" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '32px', paddingLeft: isMobile ? '20px' : '32px' }}>{children}</main>
      </div>
    </>
  );
}
