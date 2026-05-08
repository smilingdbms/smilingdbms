// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });
const AuditLogs = dynamic(() => import('../../src/components/AuditLogs'), { ssr: false });
const TeamManager = dynamic(() => import('../../src/components/TeamManager'), { ssr: false });
const TenantManager = dynamic(() => import('../../src/components/TenantManager'), { ssr: false }); // <-- NAYA MODULE IMPORT

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

const staffPermissionGroups = {
  "ATS Toggles (Pipeline)": [
    { key: 'ats_view', label: 'View Candidates', desc: 'Read access to applicant tracking.' },
    { key: 'ats_add', label: 'Add Candidate', desc: 'Manual entry or parsing.' },
    { key: 'ats_edit', label: 'Edit Candidate', desc: 'Modify details.' },
    { key: 'ats_delete', label: 'Delete Candidate', desc: 'Hard delete from DB.' },
    { key: 'ats_export', label: 'Export Candidates', desc: 'Mass CSV download.' },
    { key: 'ats_import', label: 'Bulk Import', desc: 'Upload CSV of candidates.' },
    { key: 'ats_parse', label: 'Resume Parsing', desc: 'Use AI to extract data.' },
    { key: 'ats_share', label: 'Candidate Sharing', desc: 'Send profile to clients.' },
    { key: 'ats_schedule', label: 'Interview Scheduling', desc: 'Set up calendar events.' },
    { key: 'ats_placement', label: 'Placement Management', desc: 'Mark as Joined.' },
    { key: 'ats_blacklist', label: 'Blacklist Candidate', desc: 'Mark as fraud globally.' },
    { key: 'ats_verify', label: 'Offer Verification', desc: 'Validate offer letters.' }
  ],
  "Job Toggles (Mandates)": [
    { key: 'job_create', label: 'Create Job', desc: 'Post new requirements.' },
    { key: 'job_edit', label: 'Edit Job', desc: 'Update JD or salary.' },
    { key: 'job_delete', label: 'Delete Job', desc: 'Remove mandate permanently.' },
    { key: 'job_assign', label: 'Assign Job', desc: 'Allocate to recruiter.' },
    { key: 'job_close', label: 'Close Job', desc: 'Mark requirement fulfilled.' },
    { key: 'job_publish', label: 'Publish to Portal', desc: 'Make visible to seekers.' },
    { key: 'job_revenue', label: 'View Revenue', desc: 'See deal value of job.' }
  ],
  "Team Toggles (HRMS)": [
    { key: 'team_add', label: 'Add Employee', desc: 'Onboard new staff.' },
    { key: 'team_edit', label: 'Edit Employee', desc: 'Update details.' },
    { key: 'team_delete', label: 'Delete Employee', desc: 'Remove staff.' },
    { key: 'team_role', label: 'Change Role', desc: 'Promote/Demote.' },
    { key: 'team_attend', label: 'Attendance Access', desc: 'View punch-ins.' },
    { key: 'team_payroll', label: 'Payroll Access', desc: 'View/process salaries.' },
    { key: 'team_logout', label: 'Force Logout', desc: 'Kick user out of session.' }
  ],
  "CRM Toggles (BD)": [
    { key: 'crm_add', label: 'Add Client', desc: 'Onboard new company.' },
    { key: 'crm_edit', label: 'Edit Client', desc: 'Update SPOC/Details.' },
    { key: 'crm_delete', label: 'Delete Client', desc: 'Remove company data.' },
    { key: 'crm_view', label: 'View Clients', desc: 'Read access.' },
    { key: 'crm_export', label: 'Lead Export', desc: 'Download BD pipeline.' },
    { key: 'crm_proposal', label: 'Proposal Access', desc: 'Send commercial docs.' },
    { key: 'crm_revenue', label: 'Revenue Access', desc: 'View CRM deal size.' }
  ],
  "Billing Toggles (Finance)": [
    { key: 'bill_view', label: 'View Invoice', desc: 'Read invoices.' },
    { key: 'bill_create', label: 'Create Invoice', desc: 'Generate PDF.' },
    { key: 'bill_approve', label: 'Approve Payments', desc: 'Mark invoice paid.' },
    { key: 'bill_subs', label: 'Subscription Access', desc: 'Manage SaaS plan.' },
    { key: 'bill_wallet', label: 'Wallet Access', desc: 'View freelancer funds.' },
    { key: 'bill_payout', label: 'Process Payouts', desc: 'Send money to recruiters.' },
    { key: 'bill_refund', label: 'Process Refunds', desc: 'Handle dispute money.' }
  ],
  "System Toggles (Admin)": [
    { key: 'sys_logs', label: 'View Logs', desc: 'System activity.' },
    { key: 'sys_audit', label: 'View Audit', desc: 'Who changed what.' },
    { key: 'sys_settings', label: 'Access Settings', desc: 'Global config.' },
    { key: 'sys_perms', label: 'Manage Permissions', desc: 'Access this RBAC matrix.' },
    { key: 'sys_broadcast', label: 'Access Broadcasts', desc: 'Send global alerts.' },
    { key: 'sys_reports', label: 'Export Reports', desc: 'Analytics download.' },
    { key: 'sys_rls', label: 'RLS Monitor', desc: 'Database security view.' },
    { key: 'sys_api', label: 'API Access', desc: 'Generate dev keys.' }
  ]
};

const jobSeekerPermissionGroups = {
  "Job Seeker Core Features": [
    { key: 'js_apply', label: 'Apply Jobs', desc: 'One-click application.' },
    { key: 'js_save', label: 'Save Jobs', desc: 'Bookmark for later.' },
    { key: 'js_builder', label: 'Resume Builder', desc: 'Use internal tool.' },
    { key: 'js_ai_rev', label: 'AI Resume Review', desc: 'Automated feedback.' },
    { key: 'js_priority', label: 'Priority Apply', desc: 'Jump to top of list.' },
    { key: 'js_chat', label: 'Direct HR Chat', desc: 'Message recruiter directly.' },
    { key: 'js_wa', label: 'WhatsApp Alerts', desc: 'Get updates on phone.' },
    { key: 'js_boost', label: 'Profile Boost', desc: 'Rank higher in search.' },
    { key: 'js_skill', label: 'Skill Tests', desc: 'Take assessment exams.' },
    { key: 'js_video', label: 'Video Resume', desc: 'Upload 1-min intro.' },
    { key: 'js_dl_res', label: 'Download Resume', desc: 'Export PDF.' },
    { key: 'js_view_rec', label: 'View Recruiter', desc: 'See who posted the job.' },
    { key: 'js_track', label: 'Track Application', desc: 'See pipeline status.' },
    { key: 'js_remind', label: 'Interview Reminders', desc: 'Calendar sync.' },
    { key: 'js_ai_match', label: 'AI Job Match', desc: 'Smart recommendations.' },
    { key: 'js_incognito', label: 'Incognito Mode', desc: 'Hide from current HR.' },
    { key: 'js_salary', label: 'Salary Insights', desc: 'View market averages.' },
    { key: 'js_badge', label: 'Verified Badge', desc: 'Trust marker on profile.' },
    { key: 'js_analytics', label: 'View Analytics', desc: 'See who viewed profile.' },
    { key: 'js_support', label: 'Priority Support', desc: '24/7 helpdesk.' },
    { key: 'js_export', label: 'Export Data (GDPR)', desc: 'Download personal data.' }
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
  const [activeModule, setActiveModule] = useState('tenants'); // Changed default view
  const [activeSubMenu, setActiveSubMenu] = useState('role_wise'); 
  const [selectedRole, setSelectedRole] = useState('Account Owner');
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiMessage, setConfettiMessage] = useState("");
  const [rolePermissions, setRolePermissions] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPermissions(); }, [selectedRole]);

  async function fetchPermissions() {
    const { data } = await supabase.from('roles').select('permissions_json').eq('role_name', selectedRole).single();
    setRolePermissions(prev => ({ ...prev, [selectedRole]: data?.permissions_json || {} }));
  }

  const handleRoleToggle = (featureKey) => {
    setRolePermissions(prev => ({
      ...prev, [selectedRole]: { ...(prev[selectedRole] || {}), [featureKey]: !(prev[selectedRole]?.[featureKey] || false) }
    }));
  };

  const toggleAllInGroup = (features, forceState) => {
    const updates = {};
    features.forEach(f => { updates[f.key] = forceState; });
    setRolePermissions(prev => ({ ...prev, [selectedRole]: { ...(prev[selectedRole] || {}), ...updates } }));
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    const currentPerms = rolePermissions[selectedRole] || {};
    try {
      const { data: existingRole } = await supabase.from('roles').select('id').eq('role_name', selectedRole).single();
      let roleError;
      if (existingRole) {
        const { error } = await supabase.from('roles').update({ permissions_json: currentPerms }).eq('id', existingRole.id);
        roleError = error;
      } else {
        const { error } = await supabase.from('roles').insert([{ role_name: selectedRole, permissions_json: currentPerms, is_system_role: true }]);
        roleError = error;
      }
      if (roleError) throw roleError;

      const userRes = await supabase.auth.getUser();
      if (userRes.data?.user) {
        await supabase.from('audit_logs').insert([{ user_id: userRes.data.user.id, action: 'PERMISSION_UPDATE', details: `God Mode secured permissions for ${selectedRole}` }]);
      }
      setConfettiMessage(`Enterprise Security Locked for ${selectedRole}`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (error) {
      alert("Error saving to database: " + error.message);
    }
    setSaving(false);
  };

  return (
    <Layout>
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Confetti width={width} height={height} recycle={false} numberOfPieces={800} gravity={0.15} />
          <div style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)', padding: '20px 40px', borderRadius: '50px', color: '#fff', fontSize: '24px', fontWeight: '800', boxShadow: '0 10px 40px rgba(16,185,129,0.5)', animation: 'popIn 0.5s forwards' }}>🎉 {confettiMessage}</div>
          <style>{`@keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
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
        .rbac-menu-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .rbac-menu-item.active { background: #3B82F6; color: #fff; border-left: 4px solid #60A5FA; }
        .main-content { flex: 1; display: flex; flexDirection: column; overflow: hidden; background: radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 40%), #050810; }
        .selection-list-item { padding: 15px; border-bottom: 1px solid #1F2937; cursor: pointer; transition: 0.2s; }
        .selection-list-item:hover { background: rgba(59, 130, 246, 0.05); }
        .selection-list-item.active { background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3B82F6; }
        .toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #374151; transition: .3s; border-radius: 24px; border: 1px solid #4B5563; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: #9CA3AF; transition: .3s; border-radius: 50%; }
        input:checked + .slider { background-color: rgba(16, 185, 129, 0.2); border-color: #10B981; }
        input:checked + .slider:before { transform: translateX(18px); background-color: #10B981; box-shadow: 0 0 10px #10B981; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #050810; } ::-webkit-scrollbar-thumb { background: #1F2937; border-radius: 4px; }
      `}} />

      <div className="admin-layout">
        {/* GLOBAL SIDEBAR */}
        <div className="sidebar" style={{ width: isSidebarOpen ? '240px' : '70px' }}>
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #1F2937' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>☰</button>
            {isSidebarOpen && <span style={{ fontWeight: '800', fontSize: '18px', background: 'linear-gradient(90deg, #A855F7, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RecruitOS</span>}
          </div>
          <div style={{ flex: 1, paddingTop: '10px' }}>
            <div className={`sidebar-item ${activeModule === 'overview' ? 'active' : ''}`} onClick={() => setActiveModule('overview')}>
              <span style={{ fontSize: '18px' }}>🌐</span> {isSidebarOpen && "Global Analytics"}
            </div>
            <div className={`sidebar-item ${activeModule === 'rbac' ? 'active' : ''}`} onClick={() => setActiveModule('rbac')}>
              <span style={{ fontSize: '18px' }}>🛡️</span> {isSidebarOpen && "Control Center"}
            </div>
            <div className={`sidebar-item ${activeModule === 'team' ? 'active' : ''}`} onClick={() => setActiveModule('team')}>
              <span style={{ fontSize: '18px' }}>👥</span> {isSidebarOpen && "Internal Team"}
            </div>
            <div className={`sidebar-item ${activeModule === 'tenants' ? 'active' : ''}`} onClick={() => setActiveModule('tenants')}>
              <span style={{ fontSize: '18px' }}>🏢</span> {isSidebarOpen && "Consultancies"}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        {activeModule === 'rbac' ? (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* RBAC SUB-MENU */}
            <div className="rbac-sidebar">
              <div style={{ padding: '20px', color: '#fff', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', borderBottom: '1px solid #1F2937' }}>Permission Center</div>
              <div className={`rbac-menu-item ${activeSubMenu === 'role_wise' ? 'active' : ''}`} onClick={() => setActiveSubMenu('role_wise')}>Role Wise Permissions <span>→</span></div>
              <div className={`rbac-menu-item ${activeSubMenu === 'consultant_wise' ? 'active' : ''}`} onClick={() => setActiveSubMenu('consultant_wise')}>Consultancy Wise <span>→</span></div>
              <div className={`rbac-menu-item ${activeSubMenu === 'dept_wise' ? 'active' : ''}`} onClick={() => setActiveSubMenu('dept_wise')}>Department Wise <span>→</span></div>
              <div className={`rbac-menu-item ${activeSubMenu === 'job_seeker' ? 'active' : ''}`} onClick={() => setActiveSubMenu('job_seeker')}>Job Seeker Access <span>→</span></div>
              <div className={`rbac-menu-item ${activeSubMenu === 'feature_matrix' ? 'active' : ''}`} onClick={() => setActiveSubMenu('feature_matrix')}>Feature Matrix <span>→</span></div>
              <div className={`rbac-menu-item ${activeSubMenu === 'approvals' ? 'active' : ''}`} onClick={() => setActiveSubMenu('approvals')}>Approval Workflows <span>→</span></div>
              <div className={`rbac-menu-item ${activeSubMenu === 'audit_logs' ? 'active' : ''}`} onClick={() => setActiveSubMenu('audit_logs')}>Security Audit Logs <span>→</span></div>
              <div className={`rbac-menu-item ${activeSubMenu === 'templates' ? 'active' : ''}`} onClick={() => setActiveSubMenu('templates')}>Permission Templates <span>→</span></div>
              <div className={`rbac-menu-item ${activeSubMenu === 'custom_role' ? 'active' : ''}`} onClick={() => setActiveSubMenu('custom_role')}>Custom Role Builder <span>→</span></div>
              <div className={`rbac-menu-item ${activeSubMenu === 'hierarchy' ? 'active' : ''}`} onClick={() => setActiveSubMenu('hierarchy')}>Role Hierarchy Map <span>→</span></div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {(activeSubMenu === 'role_wise' || activeSubMenu === 'job_seeker') && (
                <div style={{ width: '300px', borderRight: '1px solid #1F2937', background: '#080C16', overflowY: 'auto' }}>
                  {ROLES_LIST.filter(r => activeSubMenu === 'job_seeker' ? r.includes('Job Seeker') : !r.includes('Job Seeker')).map(role => (
                    <div key={role} onClick={() => setSelectedRole(role)} className={`selection-list-item ${selectedRole === role ? 'active' : ''}`}>
                      <div style={{ fontWeight: 'bold', color: selectedRole === role ? '#60A5FA' : '#E5E7EB', fontSize: '14px' }}>{role}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>{Object.keys(rolePermissions[role] || {}).filter(k => rolePermissions[role][k]).length} active permissions</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: '#11182D', padding: '20px', borderRadius: '12px', border: '1px solid #1F2937', position: 'sticky', top: 0, zIndex: 10 }}>
                  <div>
                    <h2 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '20px' }}>Configuring Access for: <span style={{ color: '#3B82F6' }}>{selectedRole}</span></h2>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Inheritance Rule: Lower roles can NEVER exceed the permissions granted to their parent role here.</div>
                  </div>
                  <button onClick={handleSaveMatrix} disabled={saving} style={{ background: '#10B981', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', whiteSpace: 'nowrap', opacity: saving ? 0.7 : 1 }}>
                    {saving ? '⏳ Saving to DB...' : '💾 Save Policy'}
                  </button>
                </div>

                {(activeSubMenu === 'role_wise' && !selectedRole.includes('Job Seeker')) && 
                  Object.entries(staffPermissionGroups).map(([groupName, features]) => (
                    <div key={groupName} style={{ marginBottom: '40px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1F2937', paddingBottom: '10px', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', color: '#A855F7', margin: 0 }}>{groupName}</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={()=>toggleAllInGroup(features, true)} style={{ background:'transparent', border:'1px solid #374151', color:'#10B981', fontSize:'11px', padding:'4px 8px', borderRadius:'4px', cursor:'pointer' }}>Enable All</button>
                          <button onClick={()=>toggleAllInGroup(features, false)} style={{ background:'transparent', border:'1px solid #374151', color:'#EF4444', fontSize:'11px', padding:'4px 8px', borderRadius:'4px', cursor:'pointer' }}>Disable All</button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                        {features.map(feat => (
                          <div key={feat.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#11182D', padding: '15px', borderRadius: '10px', border: '1px solid #1F2937' }}>
                            <div style={{ paddingRight: '15px' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {feat.label} {selectedRole === 'Super Admin' && <span title="Super Admin Override Lock" style={{ fontSize: '10px', background: '#374151', padding: '2px 4px', borderRadius: '4px' }}>🔒</span>}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>{feat.desc}</div>
                            </div>
                            <label className="toggle-switch"><input type="checkbox" checked={!!rolePermissions[selectedRole]?.[feat.key]} onChange={() => handleRoleToggle(feat.key)} /><span className="slider"></span></label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                }

                {(activeSubMenu === 'job_seeker' || selectedRole.includes('Job Seeker')) && 
                  Object.entries(jobSeekerPermissionGroups).map(([groupName, features]) => (
                    <div key={groupName} style={{ marginBottom: '40px' }}>
                      <h3 style={{ fontSize: '16px', color: '#3DD68C', borderBottom: '1px solid #1F2937', paddingBottom: '10px', marginBottom: '20px' }}>{groupName}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                        {features.map(feat => (
                          <div key={feat.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#11182D', padding: '15px', borderRadius: '10px', border: '1px solid #1F2937' }}>
                            <div style={{ paddingRight: '15px' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#E5E7EB' }}>{feat.label}</div>
                              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>{feat.desc}</div>
                            </div>
                            <label className="toggle-switch"><input type="checkbox" checked={!!rolePermissions[selectedRole]?.[feat.key]} onChange={() => handleRoleToggle(feat.key)} /><span className="slider"></span></label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                }
                
                {activeSubMenu === 'audit_logs' && <AuditLogs />}
                {['consultant_wise', 'dept_wise', 'feature_matrix', 'approvals', 'templates', 'custom_role', 'hierarchy'].includes(activeSubMenu) && (
                  <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#6B7280' }}>
                    <div style={{ fontSize: '40px', marginBottom: '20px' }}>🛠️</div>
                    <h3 style={{ margin: 0, color: '#9CA3AF' }}>{activeSubMenu.replace('_', ' ').toUpperCase()} MODULE</h3>
                    <p style={{ fontSize: '13px', marginTop: '10px' }}>This section is locked in Phase 2 architecture building.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {activeModule === 'overview' && <h1>Global Analytics Dashboard (Coming Soon)</h1>}
            {activeModule === 'team' && <><h1 style={{marginBottom:'20px'}}>Internal Team</h1><TeamManager /></>}
            {/* 🏢 YAHAN HUMNE TENANT MANAGER ADD KIYA HAI */}
            {activeModule === 'tenants' && <TenantManager />}
          </div>
        )}
      </div>
    </Layout>
  );
}