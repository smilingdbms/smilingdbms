// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Reusable Link Component (Moved OUTSIDE to prevent Vercel SWC compilation errors)
const MenuItem = ({ href, icon, label, isActive }) => (
  <Link href={href} style={{ textDecoration: 'none' }}>
    <div className={`menu-item ${isActive ? 'active' : ''}`}>
      <span className="menu-icon">{icon}</span>
      <span className="menu-label">{label}</span>
    </div>
  </Link>
);

export default function Layout({ children }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="layout-container">
      
      {/* GLOBAL CSS - NATIVE APP STYLING */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --bg-dark: #070B1A;
          --panel-dark: #0b0e14;
          --border-color: rgba(255,255,255,0.05);
          --accent: #3B82F6;
          --accent-glow: rgba(59,130,246,0.1);
          --text-main: #ffffff;
          --text-muted: #9CA3AF;
        }

        body { margin: 0; background: var(--bg-dark); color: var(--text-main); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        
        .layout-container { display: flex; min-height: 100vh; position: relative; }

        /* ================= DESKTOP SIDEBAR ================= */
        .desktop-sidebar { 
          width: 280px; background: var(--panel-dark); border-right: 1px solid var(--border-color); 
          display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; z-index: 1000; 
        }
        .desktop-sidebar::-webkit-scrollbar { width: 4px; }
        .desktop-sidebar::-webkit-scrollbar-thumb { background: #1F2937; border-radius: 10px; }

        .menu-item {
          display: flex; align-items: center; gap: 15px; padding: 12px 20px; margin: 4px 15px; border-radius: 10px; 
          cursor: pointer; background: transparent; border-left: 3px solid transparent; transition: all 0.2s ease; color: var(--text-muted);
        }
        .menu-item.active { background: linear-gradient(90deg, var(--accent-glow), transparent); border-left: 3px solid var(--accent); color: var(--text-main); }
        .menu-item .menu-icon { font-size: 18px; filter: grayscale(100%) opacity(70%); }
        .menu-item.active .menu-icon { filter: none; }
        .menu-item .menu-label { font-size: 14px; font-weight: 500; }
        .menu-item.active .menu-label { font-weight: 600; }

        /* ================= MAIN CONTENT ================= */
        .main-content { flex: 1; width: calc(100% - 280px); min-height: 100vh; }

        /* ================= MOBILE UI (HIDDEN ON DESKTOP) ================= */
        .mobile-bottom-nav { display: none; }
        .mobile-full-menu { display: none; }

        /* ================= RESPONSIVE RULES (MOBILE/TABLET) ================= */
        @media (max-width: 1024px) {
          .desktop-sidebar { display: none; } /* Hide desktop sidebar completely */
          
          /* Add padding to bottom of content so bottom nav doesn't hide text */
          .main-content { width: 100%; padding-bottom: 80px; } 

          /* NATIVE BOTTOM NAVIGATION BAR */
          .mobile-bottom-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; height: 70px;
            background: rgba(11, 14, 20, 0.95); backdrop-filter: blur(10px);
            border-top: 1px solid var(--border-color); z-index: 2000;
            justify-content: space-around; align-items: center; padding: 0 10px;
            box-shadow: 0 -5px 20px rgba(0,0,0,0.5);
          }
          
          .bottom-nav-item {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: var(--text-muted); text-decoration: none; gap: 5px; flex: 1;
            transition: 0.2s; background: none; border: none; outline: none;
          }
          .bottom-nav-item.active { color: var(--accent); }
          .bottom-nav-item span.icon { font-size: 22px; }
          .bottom-nav-item span.label { font-size: 10px; font-weight: 600; }

          /* SLIDE-UP MOBILE MENU (NAUKRI STYLE) */
          .mobile-full-menu {
            display: flex; flex-direction: column; position: fixed; top: 0; left: 0; right: 0; bottom: 70px;
            background: var(--bg-dark); z-index: 1999; transform: translateY(100%); opacity: 0;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); overflow-y: auto; padding-bottom: 20px;
          }
          .mobile-full-menu.open { transform: translateY(0); opacity: 1; }
        }
      `}} />

      {/* ================= 1. DESKTOP SIDEBAR ================= */}
      <aside className="desktop-sidebar">
        {/* Branding */}
        <div style={{ padding: '25px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', background: '#3B82F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>R</div>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: '800' }}>RecruitBase</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#1F2937', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A855F7', border: '1px solid #374151' }}>P</div>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>Pravin</div>
              <div style={{ color: '#9CA3AF', fontSize: '11px' }}>Super Admin • <span style={{color: '#F59E0B'}}>⭐ 65 pts</span></div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div style={{ padding: '20px 0', flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#6B7280', letterSpacing: '1px', margin: '0 20px 10px', textTransform: 'uppercase' }}>Main</div>
          <MenuItem href="/dashboard/candidates" icon="👥" label="Job Seekers" isActive={router.pathname.includes('/candidates')} />
          <MenuItem href="/dashboard/jobs" icon="💼" label="Jobs" isActive={router.pathname.includes('/jobs')} />
          <MenuItem href="/dashboard/bd" icon="👔" label="BD Pipeline" isActive={router.pathname.includes('/bd')} />
          <MenuItem href="/dashboard/interviews" icon="📅" label="Interviews" isActive={router.pathname.includes('/interviews')} />
          <MenuItem href="/dashboard/communications" icon="💬" label="Communications" isActive={router.pathname.includes('/communications')} />
          <MenuItem href="/dashboard/placements" icon="🏆" label="Placements" isActive={router.pathname.includes('/placements')} />
          <MenuItem href="/dashboard/add-profile" icon="✨" label="Add Candidate" isActive={router.pathname.includes('/add-profile')} />
          <MenuItem href="/dashboard/team" icon="🛡️" label="Team Member" isActive={router.pathname.includes('/team')} />

          <div style={{ fontSize: '10px', fontWeight: '800', color: '#6B7280', letterSpacing: '1px', margin: '30px 20px 10px', textTransform: 'uppercase' }}>Reports</div>
          <MenuItem href="/dashboard/applications" icon="📄" label="Applications" isActive={router.pathname.includes('/applications')} />
          <MenuItem href="/dashboard/analytics" icon="📊" label="Analytics" isActive={router.pathname.includes('/analytics')} />
          <MenuItem href="/dashboard/company" icon="🏢" label="My Company" isActive={router.pathname.includes('/company')} />

          <div style={{ fontSize: '10px', fontWeight: '800', color: '#6B7280', letterSpacing: '1px', margin: '30px 20px 10px', textTransform: 'uppercase' }}>System</div>
          <MenuItem href="/settings" icon="⚙️" label="Settings" isActive={router.pathname.includes('/settings')} />
          <MenuItem href="/job-board" icon="🎯" label="Job Board" isActive={router.pathname.includes('/job-board')} />
        </div>
      </aside>

      {/* ================= 2. MAIN CONTENT ================= */}
      <main className="main-content">
        {children}
      </main>

      {/* ================= 3. MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="mobile-bottom-nav">
        <Link href="/dashboard" style={{textDecoration: 'none'}}>
          <div className={`bottom-nav-item ${router.pathname === '/dashboard' ? 'active' : ''}`}>
            <span className="icon">🏠</span><span className="label">Home</span>
          </div>
        </Link>
        
        <Link href="/dashboard/candidates" style={{textDecoration: 'none'}}>
          <div className={`bottom-nav-item ${router.pathname.includes('/candidates') ? 'active' : ''}`}>
            <span className="icon">👥</span><span className="label">Seekers</span>
          </div>
        </Link>

        <Link href="/dashboard/add-profile" style={{textDecoration: 'none'}}>
          <div className={`bottom-nav-item ${router.pathname.includes('/add-profile') ? 'active' : ''}`} style={{ transform: 'translateY(-10px)' }}>
            <div style={{ background: 'linear-gradient(135deg, #3B82F6, #A855F7)', borderRadius: '50%', padding: '12px', boxShadow: '0 4px 15px rgba(59,130,246,0.4)', color: 'white' }}>
              <span className="icon" style={{fontSize: '24px'}}>✨</span>
            </div>
            <span className="label" style={{marginTop: '5px'}}>Add</span>
          </div>
        </Link>

        <Link href="/dashboard/analytics" style={{textDecoration: 'none'}}>
          <div className={`bottom-nav-item ${router.pathname.includes('/analytics') ? 'active' : ''}`}>
            <span className="icon">📊</span><span className="label">Stats</span>
          </div>
        </Link>

        {/* Hamburger Menu Trigger */}
        <button className={`bottom-nav-item ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <span className="icon">{isMobileMenuOpen ? '✖' : '☰'}</span>
          <span className="label">Menu</span>
        </button>
      </nav>

      {/* ================= 4. MOBILE SLIDE-UP MENU ================= */}
      <div className={`mobile-full-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '25px 20px', background: '#0b0e14', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '50px', height: '50px', background: '#1F2937', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A855F7', fontSize: '20px', border: '1px solid #374151' }}>P</div>
            <div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>Pravin Kumar</div>
              <div style={{ color: '#3B82F6', fontSize: '13px', fontWeight: '600' }}>Super Admin Account</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '15px 0' }}>
          <MenuItem href="/dashboard/bd" icon="👔" label="BD Pipeline" isActive={router.pathname.includes('/bd')} />
          <MenuItem href="/dashboard/jobs" icon="💼" label="Manage Jobs" isActive={router.pathname.includes('/jobs')} />
          <MenuItem href="/dashboard/interviews" icon="📅" label="Interviews" isActive={router.pathname.includes('/interviews')} />
          <MenuItem href="/dashboard/placements" icon="🏆" label="Placements" isActive={router.pathname.includes('/placements')} />
          <MenuItem href="/dashboard/communications" icon="💬" label="Communications" isActive={router.pathname.includes('/communications')} />
          <MenuItem href="/dashboard/team" icon="🛡️" label="Team Members" isActive={router.pathname.includes('/team')} />
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '15px 20px' }}></div>
          
          <MenuItem href="/dashboard/company" icon="🏢" label="My Company" isActive={router.pathname.includes('/company')} />
          <MenuItem href="/settings" icon="⚙️" label="Settings" isActive={router.pathname.includes('/settings')} />
          <MenuItem href="/job-board" icon="🎯" label="Job Board" isActive={router.pathname.includes('/job-board')} />
        </div>
      </div>

    </div>
  );
}