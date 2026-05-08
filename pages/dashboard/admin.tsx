// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';
import dynamic from 'next/dynamic';

// DYNAMIC IMPORTS: Modules ko alag files se load kar rahe hain for stability
const Confetti = dynamic(() => import('react-confetti'), { ssr: false });
const AuditLogs = dynamic(() => import('../../src/components/AuditLogs'), { ssr: false });
const TeamManager = dynamic(() => import('../../src/components/TeamManager'), { ssr: false });

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: undefined, height: undefined });
  useEffect(() => {
    function handleResize() { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

// PERMISSION GROUPS DEFINITION
const staffPermissionGroups = {
  "ATS Toggles (Pipeline)": [
    { key: 'ats_view', label: 'View Candidates', desc: 'Read access to applicant tracking.' },
    { key: 'ats_add', label: 'Add Candidate', desc: 'Manual entry or parsing.' },
    { key: 'ats_edit', label: 'Edit Candidate', desc: 'Modify details.' },
    { key: 'ats_delete', label: 'Delete Candidate', desc: 'Hard delete from DB.' },
    { key: 'ats_export', label: 'Export Candidates', desc: 'Mass CSV download.' },
    { key: 'ats_import', label: 'Bulk Import', desc: 'Upload CSV of candidates.' }
  ],
  "CRM & Finance Toggles": [
    { key: 'crm_view', label: 'View Clients', desc: 'Read access to company database.' },
    { key: 'crm_add', label: 'Add Client', desc: 'Onboard new company.' },
    { key: 'bill_view', label: 'View Invoice', desc: 'Read invoices.' },
    { key: 'bill_create', label: 'Create Invoice', desc: 'Generate PDF.' }
  ]
};

const jobSeekerPermissionGroups = {
  "Job Seeker Premium": [
    { key: 'js_apply', label: 'Apply Jobs', desc: 'One-click application.' },
    { key: 'js_chat', label: 'Direct HR Chat', desc: 'Message recruiter directly.' },
    { key: 'js_priority', label: 'Priority Apply', desc: 'Jump to top of list.' }
  ]
};

const ROLES_LIST = [
  'Super Admin', 'Admin', 'Core Team', 'Tech Admin', 'Billing Admin', 'Support Admin',
  'Account Owner', 'Recruitment Manager', 'Recruitment TL', 'Recruitment Senior Executive', 'Recruitment Executive',
  'BD Manager', 'BD TL', 'BD Senior Executive', 'BD Executive',
  'Freelance Recruiter', 'Freelance Account Owner',
  'Job Seeker (Free)', 'Job Seeker (Paid)'
];

export default function SuperAdminDashboard() {
  const { width, height } = useWindowSize();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState('rbac'); 
  const [activeSubMenu, setActiveSubMenu] = useState('role_wise'); 
  const [selectedRole, setSelectedRole] = useState('Account Owner');
  const [selectedConsultant, setSelectedConsultant] = useState(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiMessage, setConfettiMessage] = useState("");
  const [rolePermissions, setRolePermissions] = useState({});

  const handleRoleToggle = (featureKey) => {
    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...(prev[selectedRole] || {}),
        [featureKey]: !(prev[selectedRole]?.[featureKey] || false)
      }
    }));
  };

  const handleSaveMatrix = () => {
    setConfettiMessage(`Enterprise Security Matrix Locked for ${selectedRole}`);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  return (
    <Layout>
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Confetti width={width} height={height} recycle={false} numberOfPieces={800} gravity={0.15} />
          <div style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)', padding: '20px 40px', borderRadius: '50px', color: '#fff', fontSize: '24px', fontWeight: '800', boxShadow: '0 10px 40px rgba(16,185,129,0.5)' }}>
            🎉 {confettiMessage}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .admin-layout { display: flex; height: 100vh; background: #050810; color: #fff; width: 100%; overflow: hidden; }
        .sidebar { background: #11182D; border-right: 1px solid #1F2937; transition: width 0.3s ease; display: flex; flex-direction: column; z-index: 50; }
        .sidebar-item { padding: 15px 20px; display: flex; alignItems: center; gap: 15px; cursor: pointer; transition: 0.2s; color: #9CA3AF; white-space: nowrap; overflow: hidden; border-left: 3px solid transparent; }
        .sidebar-item:hover { background: rgba(59, 130, 246, 0.1); color: #fff; }
        .sidebar-item.active { background: rgba(59, 130, 246, 0.15); color: #60A5FA; border-left-color: #3B82F6; font-weight: bold; }
        .rbac-sidebar { width: 260px; background: #0b0e14; border-right: 1px solid #1F2937; display: flex; flex-direction: column; overflow-y: auto; flex-shrink: 0; }
        .rbac-menu-item { padding: 12px 20px; cursor: pointer; color: #9CA3AF; font-size: 13px; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.02); transition: 0.2s; display: flex; justify-content: space-between; alignItems: center; }
        .rbac-menu-item.active { background: #3B82F6; color: #fff; border-left: 4px solid #60A5FA; }
        .main-content { flex: 1; display: flex; flexDirection: column; overflow: hidden; background: #050810; }
        .selection-list-item { padding: 15px; border-bottom: 1px solid #1F2937; cursor: pointer; transition: 0.2s; }
        .selection-list-item.active { background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3B82F6; }
        .toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #374151; transition: .3s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: #9CA3AF; transition: .3s; border-radius: 50%; }
        input:checked + .slider { background-color: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; }
        input:checked + .slider:before { transform: translateX(18px); background-color: #10B981; }
      `}} />

      <div className="admin-layout">
        <div className="sidebar" style={{ width: isSidebarOpen ? '240px' : '70px' }}>
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #1F2937' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>☰</button>
            {isSidebarOpen && <span style={{ fontWeight: '800', fontSize: '18px', color: '#60A5FA' }}>RecruitOS</span>}
          </div>
          <div style={{ flex: 1, paddingTop: '10px' }}>
            <div className={`sidebar-item ${activeModule === 'rbac' ? 'active' : ''}`} onClick={() => setActiveModule('rbac')}>
              <span>🛡️</span> {isSidebarOpen && "Control Center"}
            </div>
            <div className={`sidebar-item ${activeModule === 'team' ? 'active' : ''}`} onClick={() => setActiveModule('team')}>
              <span>👥</span> {isSidebarOpen && "Internal Team"}
            </div>
            <div className={`sidebar-item ${activeModule === 'tenants' ? 'active' : ''}`} onClick={() => setActiveModule('tenants')}>
              <span>🏢</span> {isSidebarOpen && "Consultancies"}
            </div>
          </div>
        </div>

        <div className="main-content">
          
          {/* CONTROL CENTER (RBAC) */}
          {activeModule === 'rbac' && (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div className="rbac-sidebar">
                <div style={{ padding: '20px', color: '#fff', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid #1F2937' }}>RBAC Menu</div>
                <div className={`rbac-menu-item ${activeSubMenu === 'role_wise' ? 'active' : ''}`} onClick={() => setActiveSubMenu('role_wise')}>Role Wise Permissions</div>
                <div className={`rbac-menu-item ${activeSubMenu === 'audit_logs' ? 'active' : ''}`} onClick={() => setActiveSubMenu('audit_logs')}>Security Audit Logs</div>
              </div>

              <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                {activeSubMenu === 'role_wise' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                      <h2>Role Matrix: {selectedRole}</h2>
                      <button onClick={handleSaveMatrix} style={{ background: '#10B981', color: '#000', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}>Save Policy</button>
                    </div>
                    {Object.entries(staffPermissionGroups).map(([group, features]) => (
                      <div key={group} style={{ marginBottom: '30px' }}>
                        <h4 style={{ color: '#A855F7', borderBottom: '1px solid #1F2937', paddingBottom: '10px' }}>{group}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                          {features.map(f => (
                            <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#11182D', padding: '15px', borderRadius: '10px' }}>
                              <div><div style={{ fontWeight: 'bold', fontSize: '13px' }}>{f.label}</div><div style={{ fontSize: '11px', color: '#6B7280' }}>{f.desc}</div></div>
                              <label className="toggle-switch"><input type="checkbox" checked={!!rolePermissions[selectedRole]?.[f.key]} onChange={() => handleRoleToggle(f.key)} /><span className="slider"></span></label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeSubMenu === 'audit_logs' && <AuditLogs />}
              </div>
            </div>
          )}

          {/* INTERNAL TEAM MODULE */}
          {activeModule === 'team' && (
            <div style={{ padding: '30px' }}>
              <h1 style={{ marginBottom: '20px' }}>Core Team Management</h1>
              <TeamManager />
            </div>
          )}

          {/* CONSULTANCIES PLACEHOLDER */}
          {activeModule === 'tenants' && (
            <div style={{ padding: '30px' }}>
              <h1>Consultancy Onboarding</h1>
              <p style={{ color: '#9CA3AF' }}>Approve new agencies and assign Company Codes here.</p>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}