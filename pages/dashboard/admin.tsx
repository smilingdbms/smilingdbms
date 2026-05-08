// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

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

export default function SuperAdminDashboard() {
  const { width, height } = useWindowSize();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('permissions'); // overview, team, tenants, broadcast, permissions
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiMessage, setConfettiMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const bulkInputRef = useRef(null);
  const [broadcastText, setBroadcastText] = useState("");

  // ================= PERMISSION MATRIX STATE =================
  const [permMode, setPermMode] = useState('role'); // 'role' or 'consultant'
  const [selectedRole, setSelectedRole] = useState('Account Owner');
  const [selectedConsultant, setSelectedConsultant] = useState(null);

  const rolesList = [
    'Super Admin', 'Admin', 'Core Team', 
    'Account Owner', 'Recruitment Manager', 'Recruitment TL', 'Recruitment Senior Exec', 'Recruitment Exec', 
    'BD Manager', 'BD TL', 'BD Senior Exec', 'BD Exec', 
    'Freelance Recruiter', 
    'Job Seeker (Free)', 'Job Seeker (Paid)'
  ];

  const consultantsList = [
    { id: 'C1', name: 'Prime Consultancy', owner: 'AO1', code: 'PRIME01', plan: 'Enterprise' },
    { id: 'C2', name: 'Sunshine Manpower', owner: 'Sunny Saw', code: 'SUN02', plan: 'Pro' },
    { id: 'C3', name: 'Global Staffing', owner: 'Test Owner', code: 'GLB03', plan: 'Free' }
  ];

  // Global Mock Permission State (Will be fetched from Supabase DB in production)
  const [permissionsState, setPermissionsState] = useState({});

  const togglePermission = (key) => {
    setPermissionsState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const savePermissions = () => {
    const target = permMode === 'role' ? selectedRole : selectedConsultant?.name;
    setConfettiMessage(`Permissions Locked for ${target}`);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  // Permission Categories & Features (Enterprise Level)
  const staffPermissionGroups = {
    "ATS & Candidate Pipeline": [
      { key: 'ats_view', label: 'View ATS Pipeline', desc: 'Read access to candidates.' },
      { key: 'ats_add', label: 'Add/Upload Candidate', desc: 'Can parse or upload resumes.' },
      { key: 'ats_edit', label: 'Edit Candidate Profile', desc: 'Can modify candidate details.' },
      { key: 'ats_move', label: 'Move Pipeline Stages', desc: 'Can change statuses (L1, L2, Offered).' },
      { key: 'ats_delete', label: 'Delete Candidates', desc: 'Dangerous: Hard delete records.' },
      { key: 'ats_export', label: 'Export Candidates (CSV)', desc: 'Mass data download.' },
      { key: 'ats_blacklist', label: 'Blacklist Candidate', desc: 'Mark candidates as fraudulent.' }
    ],
    "CRM & BD Leads": [
      { key: 'crm_view', label: 'View Leads & Clients', desc: 'Read access to target companies.' },
      { key: 'crm_add', label: 'Onboard New Lead', desc: 'Can add new BD pipelines.' },
      { key: 'crm_edit', label: 'Edit Lead Status', desc: 'Update meeting notes and statuses.' },
      { key: 'crm_delete', label: 'Delete Lead', desc: 'Dangerous: Delete company data.' },
      { key: 'crm_export', label: 'Export Leads (CSV)', desc: 'Download client database.' }
    ],
    "Finance & Billing": [
      { key: 'bill_view', label: 'View Revenue & Invoices', desc: 'Can see deal values and totals.' },
      { key: 'bill_generate', label: 'Generate Invoice', desc: 'Trigger invoice generation.' },
      { key: 'bill_send', label: 'Send Invoice to Client', desc: 'Dispatch via Email/WA.' },
      { key: 'bill_edit', label: 'Edit Deal Value', desc: 'Change % or fixed fee.' }
    ],
    "Team & System Control": [
      { key: 'sys_add_user', label: 'Add Team Members', desc: 'Can invite juniors.' },
      { key: 'sys_edit_role', label: 'Modify Roles', desc: 'Can change junior roles.' },
      { key: 'sys_suspend', label: 'Suspend User', desc: 'Block login access.' },
      { key: 'sys_logs', label: 'View Audit Logs', desc: 'See who did what.' },
      { key: 'sys_broadcast', label: 'Send Broadcast', desc: 'Push global alerts.' }
    ]
  };

  const jobSeekerPermissionGroups = {
    "Basic Profile & Discovery": [
      { key: 'js_profile', label: 'Create Profile', desc: 'Build basic details.' },
      { key: 'js_resume', label: 'Upload Multiple Resumes', desc: 'Store up to 5 resumes.' },
      { key: 'js_apply', label: 'Apply to Jobs', desc: 'One-click application.' },
      { key: 'js_track', label: 'Track Application Status', desc: 'See employer actions.' }
    ],
    "Premium/Paid Features": [
      { key: 'js_salary', label: 'View Job Salary Ranges', desc: 'Unlock hidden CTCs.' },
      { key: 'js_hide', label: 'Incognito Mode', desc: 'Hide profile from current employer.' },
      { key: 'js_badge', label: 'Verified Premium Badge', desc: 'Stand out in ATS search.' },
      { key: 'js_chat', label: 'Direct Chat with Recruiter', desc: 'Bypass standard queue.' },
      { key: 'js_analytics', label: 'Profile View Analytics', desc: 'See who viewed profile.' },
      { key: 'js_support', label: 'Priority Support', desc: '24/7 dedicated help.' }
    ]
  };

  // ================= END PERMISSION STATE =================

  // MOCK DATA (Team)
  const [teamMembers] = useState([
    { id: 1, name: 'Pravin', email: 'smilingdbms@gmail.com', role: 'Super Admin', status: 'Always On', count: 65, date: '20/3/2026', isYou: true },
    { id: 2, name: 'AO1', email: 'smilingdbms+owner1@gmail.com', role: 'Account Owner', status: 'Always On', count: 0, date: '20/4/2026' }
  ]);
  const stats = { activeAOs: 142, jobSeekers: 15420, revenue: "₹4.2L", rlsHealth: "100% Secure" };

  return (
    <Layout>
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Confetti width={width} height={height} recycle={false} numberOfPieces={800} gravity={0.15} />
          <div style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)', padding: '20px 40px', borderRadius: '50px', color: '#fff', fontSize: '24px', fontWeight: '800', boxShadow: '0 10px 40px rgba(16,185,129,0.5)', animation: 'popIn 0.5s forwards' }}>
            🎉 {confettiMessage}
          </div>
          <style>{`@keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .admin-layout { display: flex; height: 100vh; background: #050810; color: #fff; width: 100%; overflow: hidden; }
        .sidebar { background: #11182D; border-right: 1px solid #1F2937; transition: width 0.3s ease; display: flex; flex-direction: column; z-index: 50; }
        .sidebar-item { padding: 15px 20px; display: flex; alignItems: center; gap: 15px; cursor: pointer; transition: 0.2s; color: #9CA3AF; white-space: nowrap; overflow: hidden; border-left: 3px solid transparent; }
        .sidebar-item:hover { background: rgba(59, 130, 246, 0.1); color: #fff; }
        .sidebar-item.active { background: rgba(59, 130, 246, 0.15); color: #60A5FA; border-left-color: #3B82F6; font-weight: bold; }
        .main-content { flex: 1; overflow-y: auto; background: radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 40%), #050810; display: flex; flexDirection: column; }
        
        .stat-card { background: #11182D; padding: 20px; border-radius: 12px; border: 1px solid #1F2937; flex: 1; min-width: 200px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .admin-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .admin-table th { text-align: left; padding: 15px; color: #9CA3AF; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #1F2937; }
        .admin-table td { padding: 15px; border-bottom: 1px solid #1F2937; font-size: 13px; }
        .admin-table tr:hover { background: rgba(255,255,255,0.02); }
        
        /* TOGGLE SWITCH CSS */
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #374151; transition: .3s; border-radius: 24px; border: 1px solid #4B5563; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: #9CA3AF; transition: .3s; border-radius: 50%; }
        input:checked + .slider { background-color: rgba(16, 185, 129, 0.2); border-color: #10B981; }
        input:checked + .slider:before { transform: translateX(20px); background-color: #10B981; box-shadow: 0 0 10px #10B981; }
        
        .sub-sidebar-item { padding: 12px 15px; cursor: pointer; border-radius: 8px; color: #9CA3AF; font-size: 13px; transition: 0.2s; margin-bottom: 5px; }
        .sub-sidebar-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .sub-sidebar-item.active { background: #3B82F6; color: #fff; font-weight: bold; box-shadow: 0 4px 15px rgba(59,130,246,0.4); }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #050810; }
        ::-webkit-scrollbar-thumb { background: #1F2937; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #374151; }
      `}} />

      <div className="admin-layout">
        
        {/* COLLAPSIBLE MAIN SIDEBAR */}
        <div className="sidebar" style={{ width: isSidebarOpen ? '260px' : '70px' }}>
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #1F2937' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>☰</button>
            {isSidebarOpen && <span style={{ fontWeight: '800', fontSize: '18px', background: 'linear-gradient(90deg, #A855F7, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RecruitOS</span>}
          </div>
          
          <div style={{ flex: 1, paddingTop: '10px' }}>
            <div className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <span style={{ fontSize: '18px' }}>🌐</span> {isSidebarOpen && "Global Analytics"}
            </div>
            <div className={`sidebar-item ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>
              <span style={{ fontSize: '18px' }}>🔐</span> {isSidebarOpen && "Access & Roles"}
            </div>
            <div className={`sidebar-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
              <span style={{ fontSize: '18px' }}>👥</span> {isSidebarOpen && "Internal Team"}
            </div>
            <div className={`sidebar-item ${activeTab === 'tenants' ? 'active' : ''}`} onClick={() => setActiveTab('tenants')}>
              <span style={{ fontSize: '18px' }}>🏢</span> {isSidebarOpen && "Consultancies"}
            </div>
            <div className={`sidebar-item ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => setActiveTab('broadcast')}>
              <span style={{ fontSize: '18px' }}>📢</span> {isSidebarOpen && "Broadcasts"}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="main-content">
          
          {/* TAB: PERMISSION MATRIX (THE GOD MODE CONTROLS) */}
          {activeTab === 'permissions' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Top Header & Switcher */}
              <div style={{ padding: '25px 30px', borderBottom: '1px solid #1F2937', background: '#11182D', flexShrink: 0 }}>
                <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>Global Access Control Matrix</h1>
                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '13px' }}>Define what features and data each Role or Specific Consultant can access.</p>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setPermMode('role')} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #3B82F6', fontWeight: 'bold', cursor: 'pointer', background: permMode === 'role' ? 'rgba(59,130,246,0.2)' : 'transparent', color: permMode === 'role' ? '#60A5FA' : '#9CA3AF', transition: '0.2s' }}>
                    👥 Role-Wise Hierarchy
                  </button>
                  <button onClick={() => setPermMode('consultant')} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #F59E0B', fontWeight: 'bold', cursor: 'pointer', background: permMode === 'consultant' ? 'rgba(245,158,11,0.2)' : 'transparent', color: permMode === 'consultant' ? '#F59E0B' : '#9CA3AF', transition: '0.2s' }}>
                    🏢 Consultant-Wise Override
                  </button>
                </div>
              </div>

              {/* Matrix Layout: Sidebar (Roles/Consultants) + Main Toggles */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* Left Sub-Sidebar */}
                <div style={{ width: '280px', background: '#0b0e14', borderRight: '1px solid #1F2937', padding: '20px', overflowY: 'auto' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>
                    {permMode === 'role' ? 'Select Role Tier' : 'Select Consultancy (AO)'}
                  </div>
                  
                  {permMode === 'role' ? (
                    rolesList.map(r => (
                      <div key={r} onClick={() => setSelectedRole(r)} className={`sub-sidebar-item ${selectedRole === r ? 'active' : ''}`}>
                        {r}
                      </div>
                    ))
                  ) : (
                    consultantsList.map(c => (
                      <div key={c.id} onClick={() => setSelectedConsultant(c)} className={`sub-sidebar-item ${selectedConsultant?.id === c.id ? 'active' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 'bold' }}>{c.name}</span>
                        <span style={{ fontSize: '11px', opacity: 0.7 }}>Owner: {c.owner} | {c.plan}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Right Toggles Area */}
                <div style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#050810' }}>
                  
                  {/* Dynamic Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: '#11182D', padding: '20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
                    <div>
                      <h2 style={{ margin: '0 0 5px 0', color: '#fff' }}>
                        Configuring: <span style={{ color: permMode === 'role' ? '#3B82F6' : '#F59E0B' }}>
                          {permMode === 'role' ? selectedRole : selectedConsultant?.name || 'Select a Consultant'}
                        </span>
                      </h2>
                      <p style={{ margin: 0, color: '#9CA3AF', fontSize: '12px' }}>
                        {permMode === 'role' 
                          ? "These toggles define the MAX limits. Account Owners can only assign enabled features to their juniors." 
                          : "Overrides standard AO limits. These settings only apply to this specific agency."}
                      </p>
                    </div>
                    <button onClick={savePermissions} style={{ background: '#10B981', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', whiteSpace: 'nowrap' }}>
                      💾 Save Permissions
                    </button>
                  </div>

                  {/* Render Toggle Groups Based on Role Type */}
                  {(!selectedRole.includes('Job Seeker') || permMode === 'consultant') ? (
                    // STAFF / B2B PERMISSIONS
                    Object.entries(staffPermissionGroups).map(([groupName, features]) => (
                      <div key={groupName} style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: '#A855F7', borderBottom: '1px solid #1F2937', paddingBottom: '10px', marginBottom: '20px' }}>
                          {groupName}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                          {features.map(feat => (
                            <div key={feat.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#11182D', padding: '15px 20px', borderRadius: '10px', border: '1px solid #1F2937', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.borderColor='#374151'} onMouseOut={e=>e.currentTarget.style.borderColor='#1F2937'}>
                              <div style={{ paddingRight: '15px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#E5E7EB', marginBottom: '4px' }}>{feat.label}</div>
                                <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: '1.4' }}>{feat.desc}</div>
                              </div>
                              <label className="toggle-switch">
                                <input type="checkbox" checked={!!permissionsState[feat.key]} onChange={() => togglePermission(feat.key)} />
                                <span className="slider"></span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    // B2C / JOB SEEKER PERMISSIONS
                    Object.entries(jobSeekerPermissionGroups).map(([groupName, features]) => (
                      <div key={groupName} style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: '#3DD68C', borderBottom: '1px solid #1F2937', paddingBottom: '10px', marginBottom: '20px' }}>
                          {groupName} (B2C Features)
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                          {features.map(feat => (
                            <div key={feat.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#11182D', padding: '15px 20px', borderRadius: '10px', border: '1px solid #1F2937' }}>
                              <div style={{ paddingRight: '15px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#E5E7EB', marginBottom: '4px' }}>{feat.label}</div>
                                <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: '1.4' }}>{feat.desc}</div>
                              </div>
                              <label className="toggle-switch">
                                <input type="checkbox" checked={!!permissionsState[feat.key]} onChange={() => togglePermission(feat.key)} />
                                <span className="slider"></span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}

                </div>
              </div>
            </div>
          )}

          {/* OTHER TABS (OVERVIEW, TEAM, BROADCAST) RETAINED FOR INTEGRITY */}
          {activeTab === 'overview' && (
            <div style={{ padding: '30px' }}>
              <h2 style={{ margin: '0 0 20px 0' }}>Platform Health & Revenue</h2>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="stat-card">
                  <div style={{ color: '#9CA3AF', fontSize: '12px', textTransform: 'uppercase' }}>Active Consultancies</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#60A5FA', marginTop: '10px' }}>{stats.activeAOs}</div>
                </div>
                <div className="stat-card">
                  <div style={{ color: '#9CA3AF', fontSize: '12px', textTransform: 'uppercase' }}>Master Job Seekers Pool</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3DD68C', marginTop: '10px' }}>{stats.jobSeekers}</div>
                </div>
                <div className="stat-card">
                  <div style={{ color: '#9CA3AF', fontSize: '12px', textTransform: 'uppercase' }}>SaaS Subscription Revenue</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F59E0B', marginTop: '10px' }}>{stats.revenue}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div style={{ padding: '30px' }}>
              <h2>Internal Team Management</h2>
              <div style={{ background: '#11182D', padding: '15px', borderRadius: '12px', border: '1px solid #1F2937', marginTop: '20px' }}>
                <table className="admin-table">
                  <tbody>
                    {teamMembers.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 'bold' }}>{m.name}</td>
                        <td style={{ color: '#9CA3AF' }}>{m.email}</td>
                        <td><span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>{m.role}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'broadcast' && (
            <div style={{ padding: '30px', maxWidth: '600px' }}>
              <h2>Global Broadcast</h2>
              <div style={{ background: '#11182D', padding: '20px', borderRadius: '12px', border: '1px solid #1F2937', marginTop: '20px' }}>
                <textarea style={{ width: '100%', background: '#050810', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none', height: '120px' }} placeholder="Type your alert here..." />
                <button onClick={() => alert("Broadcast Sent!")} style={{ background: '#3B82F6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px', width: '100%' }}>📢 Send Broadcast</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}