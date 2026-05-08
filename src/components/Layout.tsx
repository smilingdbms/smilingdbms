import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close the mobile menu automatically when the route changes (user clicks a link)
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const MenuItem = ({ href, icon, label, isActive }) => (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 20px', margin: '4px 15px', borderRadius: '10px', cursor: 'pointer', background: isActive ? 'linear-gradient(90deg, rgba(59,130,246,0.1), transparent)' : 'transparent', borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent', transition: 'all 0.3s ease', color: isActive ? '#fff' : '#9CA3AF' }}>
        <span style={{ fontSize: '18px', filter: isActive ? 'none' : 'grayscale(100%) opacity(70%)' }}>{icon}</span>
        <span style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500' }}>{label}</span>
      </div>
    </Link>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070B1A', position: 'relative' }}>
      
      {/* GLOBAL CSS INJECTION FOR RESPONSIVE HAMBURGER LOGIC */}
      <style dangerouslySetInnerHTML={{__html: `
        .sidebar { width: 280px; background: #0b0e14; border-right: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; transition: transform 0.3s ease; position: sticky; top: 0; height: 100vh; overflow-y: auto; z-index: 1000; }
        .main-content { flex: 1; width: calc(100% - 280px); transition: 0.3s ease; }
        .hamburger-btn { display: none; position: fixed; bottom: 20px; right: 20px; z-index: 1001; background: linear-gradient(135deg, #3B82F6, #A855F7); color: white; border: none; border-radius: 50%; width: 60px; height: 60px; font-size: 24px; box-shadow: 0 4px 20px rgba(59,130,246,0.4); cursor: pointer; align-items: center; justify-content: center; }
        .mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 999; }
        
        /* SCROLLBAR STYLING FOR SIDEBAR */
        .sidebar::-webkit-scrollbar { width: 6px; }
        .sidebar::-webkit-scrollbar-thumb { background: #1F2937; border-radius: 10px; }

        @media (max-width: 1024px) {
          .sidebar { position: fixed; transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); box-shadow: 10px 0 30px rgba(0,0,0,0.5); }
          .main-content { width: 100%; }
          .hamburger-btn { display: flex; }
          .mobile-overlay.open { display: block; }
        }
      `}} />

      {/* MOBILE OVERLAY (Closes menu when clicking outside) */}
      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>

      {/* LEFT NAVIGATION SIDEBAR */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        
        {/* BRANDING & USER PROFILE */}
        <div style={{ padding: '25px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', background: '#3B82F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>R</div>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px' }}>RecruitBase</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#1F2937', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A855F7', border: '1px solid #374151' }}>P</div>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>Pravin</div>
              <div style={{ color: '#9CA3AF', fontSize: '11px' }}>Super Admin • <span style={{color: '#F59E0B'}}>⭐ 65 pts</span></div>
            </div>
          </div>
        </div>

        {/* MENU LINKS (Preserved Exactly from your Screenshot) */}
        <div style={{ padding: '20px 0', flex: 1 }}>
          
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#6B7280', letterSpacing: '1px', margin: '0 20px 10px', textTransform: 'uppercase' }}>Main</div>
          <MenuItem href="/dashboard/job-seekers" icon="👥" label="Job Seekers" isActive={router.pathname.includes('/job-seekers')} />
          <MenuItem href="/dashboard/jobs" icon="💼" label="Jobs" isActive={router.pathname.includes('/jobs')} />
          <MenuItem href="/dashboard/bd-pipeline" icon="👔" label="BD Pipeline" isActive={router.pathname.includes('/bd-pipeline')} />
          <MenuItem href="/dashboard/interviews" icon="📅" label="Interviews" isActive={router.pathname.includes('/interviews')} />
          <MenuItem href="/dashboard/communications" icon="💬" label="Communications" isActive={router.pathname.includes('/communications')} />
          <MenuItem href="/dashboard/placements" icon="🏆" label="Placements" isActive={router.pathname.includes('/placements')} />
          
          {/* Your Add Profile link (keeping it active for this page) */}
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

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {children}
      </main>

      {/* FLOATING HAMBURGER BUTTON (Visible ONLY on Mobile/Tablet) */}
      <button 
        className="hamburger-btn" 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle Menu"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

    </div>
  );
}