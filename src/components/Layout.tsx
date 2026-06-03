import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════
// Layout.tsx v3.0 — RecruitBase Pro
// Complete sidebar rewrite: role-based menus, friendly names
// ═══════════════════════════════════════════════════════════

type SubMenu = { name: string; path: string; roles?: string[] };
type Menu = { id: string; icon: string; title: string; roles: string[]; submenus: SubMenu[] };

const ALL = ['super_admin','platform_admin','platform_manager','account_owner','team_manager','team_leader','sr_recruiter','recruiter','individual_recruiter','bd','job_seeker'];
const STAFF = ['super_admin','platform_admin','platform_manager','account_owner','team_manager','team_leader','sr_recruiter','recruiter','individual_recruiter','bd'];
const HIRING = ['super_admin','platform_admin','platform_manager','account_owner','team_manager','team_leader','sr_recruiter','recruiter','individual_recruiter'];
const LEADS = ['super_admin','platform_admin','platform_manager','account_owner','team_manager','team_leader'];
const ADMIN = ['super_admin','platform_admin','platform_manager','account_owner'];
const SA_ONLY = ['super_admin','platform_admin','platform_manager'];
const BD_TEAM = ['super_admin','platform_admin','platform_manager','account_owner','bd'];

const menuData: Menu[] = [
  {
    id: 'platform', icon: '🌐', title: 'Platform Control', roles: SA_ONLY,
    submenus: [
      { name: 'My Workspace', path: '/dashboard/ao' },
      { name: 'All Candidates (Global)', path: '/dashboard/master' },
      { name: 'All Job Seekers', path: '/dashboard/master#job-seekers' },
      { name: 'All Companies', path: '/dashboard/admin#consultancies' },
      { name: 'Packages & Plans', path: '/dashboard/companies' },
      { name: 'Platform Analytics', path: '/dashboard/reports#platform' },
    ]
  },
  {
    id: 'account', icon: '🏢', title: 'Account Control', roles: ['account_owner'],
    submenus: [
      { name: 'My Workspace', path: '/dashboard/ao' },
      { name: 'My Candidates', path: '/dashboard/candidates' },
      { name: 'My Team', path: '/dashboard/admin#team' },
      { name: 'Job Seekers', path: '/dashboard/admin#job-seekers' },
      { name: 'Company Profile', path: '/dashboard/settings#company' },
      { name: 'Account Analytics', path: '/dashboard/reports' },
    ]
  },
  {
    id: 'dash', icon: '🏠', title: 'Dashboard', roles: ALL,
    submenus: [
      { name: 'My Overview', path: '/dashboard' },
      { name: 'Quick Stats', path: '/dashboard#stats', roles: LEADS },
      { name: 'Notifications', path: '/dashboard/notifications' },
    ]
  },
  {
    id: 'cand', icon: '👥', title: 'Candidates', roles: HIRING,
    submenus: [
      { name: 'All Candidates', path: '/dashboard/candidates' },
      { name: 'Add Candidate', path: '/dashboard/candidates?action=add' },
      { name: 'Upload CV (AI Parse)', path: '/dashboard/candidates?action=upload' },
      { name: 'Bulk CV Upload', path: '/dashboard/candidates?action=bulk_upload' },
      { name: 'Bulk Import (CSV)', path: '/dashboard/candidates?action=import', roles: ADMIN },
      { name: 'Blacklisted', path: '/dashboard/candidates#blacklisted', roles: ADMIN },
    ]
  },
  {
    id: 'jobs', icon: '💼', title: 'Jobs & Mandates', roles: ALL,
    submenus: [
      { name: 'All Jobs', path: '/dashboard/jobs' },
      { name: 'Create Job', path: '/dashboard/jobs?action=add', roles: [...ADMIN, 'bd'] },
      { name: 'Active Jobs', path: '/dashboard/jobs#active' },
      { name: 'My Assigned Jobs', path: '/dashboard/jobs#my-jobs', roles: ['team_manager','team_leader','sr_recruiter','recruiter','individual_recruiter'] },
      { name: 'My Applications', path: '/dashboard/jobs#my-applications', roles: ['job_seeker'] },
      { name: 'Closed Jobs', path: '/dashboard/jobs#closed', roles: LEADS },
    ]
  },
  {
    id: 'apps', icon: '📋', title: 'Applications', roles: HIRING,
    submenus: [
      { name: 'All Applications', path: '/dashboard/applications' },
      { name: 'New / Unscreened', path: '/dashboard/applications#new' },
      { name: 'Shortlisted', path: '/dashboard/applications#shortlisted' },
      { name: 'Interview Stage', path: '/dashboard/applications#interview' },
      { name: 'Offer Pipeline', path: '/dashboard/applications#offers', roles: LEADS },
      { name: 'Joined Candidates', path: '/dashboard/applications#joined' },
    ]
  },
  {
    id: 'int', icon: '📅', title: 'Interviews', roles: [...HIRING, 'job_seeker'],
    submenus: [
      { name: 'All Interviews', path: '/dashboard/interviews' },
      { name: "Today's Interviews", path: '/dashboard/interviews#today' },
      { name: 'Upcoming', path: '/dashboard/interviews#upcoming' },
      { name: 'Completed', path: '/dashboard/interviews#completed', roles: HIRING },
      { name: 'Calendar View', path: '/dashboard/interviews#calendar' },
    ]
  },
  {
    id: 'pipe', icon: '🚀', title: 'Pipeline', roles: HIRING,
    submenus: [
      { name: 'Kanban Board', path: '/dashboard/applications#kanban' },
      { name: 'Stage Wise View', path: '/dashboard/applications#stages', roles: LEADS },
    ]
  },
  {
    id: 'clients', icon: '🏢', title: 'Clients & BD', roles: BD_TEAM,
    submenus: [
      { name: 'All Clients', path: '/dashboard/bd' },
      { name: 'Add New Client', path: '/dashboard/bd?action=add' },
      { name: 'Active Clients', path: '/dashboard/bd#active-clients' },
      { name: 'New Leads', path: '/dashboard/bd#leads' },
      { name: 'BD Pipeline', path: '/dashboard/bd#pipeline' },
      { name: 'Client Analytics', path: '/dashboard/bd#analytics', roles: ADMIN },
    ]
  },
  {
    id: 'place', icon: '🎯', title: 'Placements', roles: [...HIRING, 'bd'],
    submenus: [
      { name: 'All Placements', path: '/dashboard/placements' },
      { name: 'Joining Pipeline', path: '/dashboard/placements#joining' },
      { name: 'Completed Placements', path: '/dashboard/placements#completed' },
      { name: 'Revenue Tracker', path: '/dashboard/placements#revenue', roles: [...ADMIN, 'bd'] },
    ]
  },
  {
    id: 'follow', icon: '📞', title: 'Follow Ups', roles: STAFF,
    submenus: [
      { name: "Today's Tasks", path: '/dashboard/follow-ups#today' },
      { name: 'Overdue', path: '/dashboard/follow-ups#overdue' },
      { name: 'Upcoming', path: '/dashboard/follow-ups#upcoming' },
      { name: 'My Reminders', path: '/dashboard/follow-ups#reminders' },
    ]
  },
  {
    id: 'reports', icon: '📊', title: 'Reports', roles: LEADS,
    submenus: [
      { name: 'Performance Dashboard', path: '/dashboard/reports' },
      { name: 'Recruiter Performance', path: '/dashboard/reports#recruiter' },
      { name: 'Placement Reports', path: '/dashboard/reports#placements', roles: ADMIN },
      { name: 'Revenue Reports', path: '/dashboard/reports#revenue', roles: ADMIN },
      { name: 'Pipeline Analytics', path: '/dashboard/reports#pipeline' },
      { name: 'My Performance', path: '/dashboard/reports#my-stats', roles: ['team_manager','team_leader','sr_recruiter','recruiter','individual_recruiter','bd'] },
    ]
  },
  {
    id: 'ai', icon: '🤖', title: 'AI Tools', roles: ALL,
    submenus: [
      { name: 'Talk to AI (Gemini)', path: '/dashboard/ai' },
      { name: 'CV Parser', path: '/dashboard/ai#cv-parser', roles: [...HIRING, 'job_seeker'] },
      { name: 'AI Job Writer', path: '/dashboard/ai#job-writer', roles: [...ADMIN, 'bd'] },
      { name: 'Smart Match', path: '/dashboard/ai#smart-match', roles: HIRING },
      { name: 'Resume Builder', path: '/dashboard/ai#resume-builder', roles: ['job_seeker'] },
    ]
  },
  {
    id: 'admin', icon: '🛡️', title: 'Admin Center', roles: ADMIN,
    submenus: [
      { name: 'My Team', path: '/dashboard/admin#team' },
      { name: 'Pending Approvals', path: '/dashboard/admin#pending' },
      { name: 'Job Seekers', path: '/dashboard/admin#job-seekers' },
      { name: 'Invite User', path: '/dashboard/admin#invite' },
      { name: 'Role Permissions', path: '/dashboard/admin#permissions' },
      { name: 'All Consultancies', path: '/dashboard/admin#consultancies', roles: SA_ONLY },
      { name: 'Audit Logs', path: '/dashboard/admin#audit-logs', roles: SA_ONLY },
      { name: 'Platform Stats', path: '/dashboard/admin#platform', roles: SA_ONLY },
    ]
  },
  {
    id: 'settings', icon: '⚙️', title: 'Settings', roles: ALL,
    submenus: [
      { name: 'My Profile', path: '/dashboard/settings#profile' },
      { name: 'Company Profile', path: '/dashboard/settings#company', roles: ADMIN },
      { name: 'Email Templates', path: '/dashboard/settings#email-templates', roles: ADMIN },
      { name: 'WhatsApp Templates', path: '/dashboard/settings#whatsapp-templates', roles: ADMIN },
      { name: 'Integrations', path: '/dashboard/settings#integrations', roles: ADMIN },
    ]
  },
  {
    id: 'feedback', icon: '💬', title: 'Feedback & Support', roles: ALL,
    submenus: [
      { name: 'Send Feedback', path: '/dashboard/feedback' },
      { name: 'Refer a Friend', path: '/dashboard/feedback#refer' },
      { name: 'Help & FAQ', path: '/dashboard/feedback#help' },
      { name: 'View All Feedback', path: '/dashboard/feedback#all', roles: SA_ONLY },
    ]
  },
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

  const roleLabel = userRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const visibleMenus = menuData.filter(m => m.roles.includes(userRole));
  const isActiveMenu = (menu: Menu) => menu.submenus.some(s => { const b = s.path.split('#')[0].split('?')[0]; return router.pathname === b || router.asPath.startsWith(b + '#') || router.asPath.startsWith(b + '?'); });
  const getVisibleSubmenus = (menu: Menu) => menu.submenus.filter(s => !s.roles || s.roles.includes(userRole));

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        .os-layout { font-family: var(--fn, 'Outfit', sans-serif); background: var(--bg); color: var(--tx); display: flex; height: 100vh; overflow: hidden; }
        .os-sidebar-scroll { flex: 1; overflow-y: auto; padding: 8px 0 12px; }
        .os-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .os-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .os-sidebar-scroll::-webkit-scrollbar-thumb { background: var(--bd2); border-radius: 4px; }
        .os-menu-item { padding: 11px 18px; display: flex; align-items: center; cursor: pointer; color: var(--mu); border-left: 3px solid transparent; white-space: nowrap; overflow: hidden; transition: background 0.15s, color 0.15s; }
        .os-menu-item:hover { background: var(--acbg); color: var(--tx); }
        .os-menu-item.active { background: var(--acbg); color: var(--ac); border-left-color: var(--ac); }
        .os-submenu-item { text-decoration: none; display: block; padding: 9px 18px 9px 58px; font-size: 12.5px; color: var(--mu); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.15s, background 0.15s, padding-left 0.15s; }
        .os-submenu-item:hover { color: var(--ac); background: var(--acbg); padding-left: 63px; }
        .os-submenu-item.active { color: var(--ac); font-weight: 600; }
        .os-user-bar { padding: 12px 16px; border-top: 1px solid var(--bd); display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .os-logout-btn { background: var(--rdbg); border: 1px solid var(--rd); color: var(--rd); border-radius: 7px; padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s; width: 100%; margin-top: 6px; }
        .os-logout-btn:hover { background: var(--rd); }
        .os-platform-item { background: var(--pubg) !important; border-left-color: #7C3AED !important; color: var(--pu) !important; }
        .os-platform-item:hover { background: var(--pubg) !important; }
        .os-section-divider { height: 1px; background: var(--bd); margin: 6px 16px; }
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

          <div className="os-sidebar-scroll">
            {visibleMenus.map((menu) => {
              const isOpen = openMenu === menu.id;
              const isActive = isActiveMenu(menu);
              const isPlatform = menu.id === 'platform' || menu.id === 'account';
              const visibleSubs = getVisibleSubmenus(menu);
              return (
                <div key={menu.id}>
                  <div className={`os-menu-item ${isActive ? 'active' : ''} ${isPlatform ? 'os-platform-item' : ''}`} onClick={() => handleAccordion(menu.id)} title={isCollapsed ? menu.title : undefined}>
                    <span style={{ fontSize: '18px', minWidth: '28px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{menu.icon}</span>
                    {!isCollapsed && (<><span style={{ marginLeft: '12px', fontSize: '13.5px', fontWeight: isActive ? 600 : 500, flex: 1 }}>{menu.title}</span><span style={{ fontSize: '11px', color: 'var(--mu)', marginLeft: '4px' }}>{isOpen ? '▼' : '▶'}</span></>)}
                  </div>
                  {isOpen && !isCollapsed && visibleSubs.length > 0 && (
                    <div style={{ background: 'var(--nb)', paddingBottom: '4px' }}>
                      {visibleSubs.map((sub, idx) => {
                        const bp = sub.path.split('#')[0].split('?')[0];
                        const sa = router.asPath === sub.path || (router.pathname === bp && sub.path === bp);
                        return <Link href={sub.path} key={idx} className={`os-submenu-item ${sa ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>· {sub.name}</Link>;
                      })}
                    </div>
                  )}
                  {isPlatform && !isCollapsed && <div className="os-section-divider" />}
                </div>
              );
            })}
          </div>

          <div className="os-user-bar" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            {!isCollapsed && userName && (
              <div style={{ width: '100%', marginBottom: '2px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                {roleLabel && <div style={{ fontSize: '10px', color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{roleLabel}</div>}
              </div>
            )}
            <button className="os-logout-btn" onClick={handleLogout} disabled={loggingOut} title="Logout">{isCollapsed ? '🚪' : (loggingOut ? 'Logging out...' : '🚪 Logout')}</button>
          </div>
        </div>

        <main className="os-main-content" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '32px', paddingLeft: isMobile ? '20px' : '32px' }}>{children}</main>
      </div>
    </>
  );
}
