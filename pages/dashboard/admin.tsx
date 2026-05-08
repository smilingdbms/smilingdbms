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
  const [activeTab, setActiveTab] = useState('team'); 
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiMessage, setConfettiMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const bulkInputRef = useRef(null);
  const [broadcastText, setBroadcastText] = useState("");

  // RBAC PERMISSION MODAL STATE
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({
    view_ats: true,
    edit_leads: true,
    export_csv: false,
    delete_records: false,
    access_billing: false,
    manage_team: false
  });

  // MOCK DATA (Will connect to Supabase Profiles/Tenant_users later)
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Pravin', email: 'smilingdbms@gmail.com', role: 'Super Admin', status: 'Always On', count: 65, date: '20/3/2026', isYou: true },
    { id: 2, name: 'AO1', email: 'smilingdbms+owner1@gmail.com', role: 'Account Owner', status: 'Always On', count: 0, date: '20/4/2026' },
    { id: 3, name: 'Sunny Saw', email: 'amrita.jhunnu+owner1@gmail.com', role: 'Account Owner', status: 'Always On', count: 5, date: '22/4/2026' },
    { id: 4, name: 'SunshineMP', email: 'sunshinemanpower123@gmail.com', role: 'Account Owner', status: 'Always On', count: 0, date: '22/4/2026' },
    { id: 5, name: 'Recruiter 1', email: 'smilingdbms+rec1@gmail.com', role: 'Recruiter', status: 'Disable', count: 0, date: '25/4/2026' },
    { id: 6, name: 'Team Manager 1', email: 'lucky1link+tm1@gmail.com', role: 'Team Manager', status: 'Disable', count: 0, date: '25/4/2026' }
  ]);

  const stats = { activeAOs: 142, jobSeekers: 15420, revenue: "₹4.2L", rlsHealth: "100% Secure" };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      setConfettiMessage("Bulk Migration Successful! Agencies Onboarded.");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const handleApproveAO = (name) => {
    setConfettiMessage(`Account Owner ${name} Approved! Company Code Generated.`);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const sendBroadcast = () => {
    if(!broadcastText) return;
    alert(`Global Broadcast Sent to all AOs: ${broadcastText}`);
    setBroadcastText("");
  };

  // OPEN PERMISSION MODAL
  const openPermissionSettings = (user) => {
    setSelectedUser(user);
    // In future, fetch actual permissions from Supabase here
    setUserPermissions({
      view_ats: true,
      edit_leads: user.role !== 'Recruiter', // Example logic
      export_csv: user.role === 'Account Owner' || user.role === 'Super Admin',
      delete_records: user.role === 'Super Admin',
      access_billing: user.role === 'Account Owner' || user.role === 'Super Admin',
      manage_team: user.role !== 'Recruiter'
    });
  };

  // TOGGLE PERMISSION
  const togglePermission = (key) => {
    setUserPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const savePermissions = () => {
    setConfettiMessage(`Permissions Updated for ${selectedUser.name}`);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
    setSelectedUser(null);
  };

  const filteredTeam = teamMembers.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase()));

  const getRoleStyle = (role) => {
    if(role === 'Super Admin') return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid #EF4444' };
    if(role === 'Account Owner') return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid #F59E0B' };
    if(role === 'Team Manager') return { bg: 'rgba(168, 85, 247, 0.1)', color: '#A855F7', border: '1px solid #A855F7' };
    return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid #10B981' }; 
  };

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
        .sidebar { background: #11182D; border-right: 1px solid #1F2937; transition: width 0.3s ease; display: flex; flex-direction: column; }
        .sidebar-item { padding: 15px 20px; display: flex; alignItems: center; gap: 15px; cursor: pointer; transition: 0.2s; color: #9CA3AF; white-space: nowrap; overflow: hidden; border-left: 3px solid transparent; }
        .sidebar-item:hover { background: rgba(59, 130, 246, 0.1); color: #fff; }
        .sidebar-item.active { background: rgba(59, 130, 246, 0.15); color: #60A5FA; border-left-color: #3B82F6; font-weight: bold; }
        .main-content { flex: 1; padding: 30px; overflow-y: auto; background: radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 40%), #050810; }
        .stat-card { background: #11182D; padding: 20px; border-radius: 12px; border: 1px solid #1F2937; flex: 1; min-width: 200px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .admin-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .admin-table th { text-align: left; padding: 15px; color: #9CA3AF; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #1F2937; }
        .admin-table td { padding: 15px; border-bottom: 1px solid #1F2937; font-size: 13px; }
        .admin-table tr:hover { background: rgba(255,255,255,0.02); }
        .action-btn { background: transparent; border: none; cursor: pointer; padding: 5px; color: #9CA3AF; transition: 0.2s; }
        .action-btn:hover { color: #fff; transform: scale(1.1); }
        
        /* TOGGLE SWITCH CSS */
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #374151; transition: .3s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
        input:checked + .slider { background-color: #10B981; }
        input:checked + .slider:before { transform: translateX(20px); }
        input:disabled + .slider { opacity: 0.5; cursor: not-allowed; }
      `}} />

      <div className="admin-layout">
        
        {/* COLLAPSIBLE SIDEBAR */}
        <div className="sidebar" style={{ width: isSidebarOpen ? '260px' : '70px' }}>
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #1F2937' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>☰</button>
            {isSidebarOpen && <span style={{ fontWeight: '800', fontSize: '18px', background: 'linear-gradient(90deg, #A855F7, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>God Mode</span>}
          </div>
          
          <div style={{ flex: 1, paddingTop: '10px' }}>
            <div className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <span style={{ fontSize: '18px' }}>🌐</span> {isSidebarOpen && "Global Analytics"}
            </div>
            <div className={`sidebar-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
              <span style={{ fontSize: '18px' }}>👥</span> {isSidebarOpen && "Team Management"}
            </div>
            <div className={`sidebar-item ${activeTab === 'tenants' ? 'active' : ''}`} onClick={() => setActiveTab('tenants')}>
              <span style={{ fontSize: '18px' }}>🏢</span> {isSidebarOpen && "Tenant / AOs"}
            </div>
            <div className={`sidebar-item ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => setActiveTab('broadcast')}>
              <span style={{ fontSize: '18px' }}>📢</span> {isSidebarOpen && "Global Broadcasts"}
            </div>
          </div>
          
          <div style={{ padding: '20px', borderTop: '1px solid #1F2937' }}>
             <button onClick={() => bulkInputRef.current.click()} style={{ width: '100%', background: '#1F2937', color: '#fff', border: '1px solid #374151', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' }}>
               📁 {isSidebarOpen ? "Bulk Migrations (CSV)" : ""}
             </button>
             <input type="file" hidden ref={bulkInputRef} accept=".csv" onChange={handleCSVImport} />
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="main-content">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
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
                <div className="stat-card">
                  <div style={{ color: '#9CA3AF', fontSize: '12px', textTransform: 'uppercase' }}>RLS & Server Status</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#A855F7', marginTop: '10px' }}>{stats.rlsHealth}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEAM MANAGEMENT */}
          {activeTab === 'team' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '24px' }}>Team Management & Permissions</h1>
                  <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '5px' }}>
                    {teamMembers.length} total <span style={{color:'#F59E0B', marginLeft:'10px'}}>0 pending</span> <span style={{color:'#10B981', marginLeft:'10px'}}>9 active</span> <span style={{color:'#EF4444', marginLeft:'10px'}}>2 disabled</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#11182D', padding: '15px', borderRadius: '12px', border: '1px solid #1F2937', display: 'flex', gap: '15px' }}>
                <input 
                  type="text" 
                  placeholder="Search name or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, background: '#050810', border: '1px solid #374151', color: '#fff', padding: '10px 15px', borderRadius: '8px', outline: 'none' }}
                />
                <select style={{ background: '#050810', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', outline: 'none' }}>
                  <option>All Roles</option><option>Super Admin</option><option>Account Owner</option>
                </select>
                <select style={{ background: '#050810', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', outline: 'none' }}>
                  <option>All Status</option><option>Active</option><option>Disabled</option>
                </select>
              </div>

              <div style={{ marginTop: '30px' }}>
                <table className="admin-table">
                  <tbody>
                    {filteredTeam.map(m => {
                      const roleStyle = getRoleStyle(m.role);
                      return (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 'bold' }}>
                            {m.name} 
                            {m.isYou && <span style={{ background: '#1E3A8A', color: '#60A5FA', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>You</span>}
                          </td>
                          <td style={{ color: '#9CA3AF' }}>{m.email}</td>
                          <td>
                            <span style={{ background: roleStyle.bg, color: roleStyle.color, border: roleStyle.border, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                              {m.role}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: m.status === 'Always On' ? '#10B981' : '#EF4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap:'5px' }}>
                              ● {m.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <a href={`mailto:${m.email}`} className="action-btn" title="Email User">✉️</a>
                            {/* THIS IS THE PERMISSION BUTTON */}
                            <button onClick={() => openPermissionSettings(m)} className="action-btn" title="Modify Permissions">⚙️</button>
                            <button className="action-btn" title="Delete User">🗑️</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3 & 4 (Tenants & Broadcasts remain same) */}
          {activeTab === 'tenants' && (
            <div>
              <h2>Tenant / Consultancy Approvals</h2>
              <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Approve new agencies to auto-generate their Company Code and isolate their ATS database.</p>
              <div style={{ background: '#11182D', borderRadius: '12px', border: '1px solid #1F2937', marginTop: '20px' }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>Agency Name</th><th>Owner</th><th>Requested On</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{fontWeight:'bold'}}>ProHire Solutions</td>
                      <td>Rahul Verma<br/><span style={{fontSize:'11px', color:'#9CA3AF'}}>+91-9876543210</span></td>
                      <td>Today, 10:30 AM</td>
                      <td><span style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>Pending Approval</span></td>
                      <td>
                        <button onClick={() => handleApproveAO('Rahul Verma')} style={{ background: '#10B981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginRight: '10px' }}>Approve</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div style={{ maxWidth: '600px' }}>
              <h2>Global Platform Broadcast</h2>
              <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Push alerts and notifications directly to all Account Owners and Recruiters.</p>
              <div style={{ background: '#11182D', padding: '20px', borderRadius: '12px', border: '1px solid #1F2937', marginTop: '20px' }}>
                <textarea 
                  style={{ width: '100%', background: '#050810', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none', height: '120px', resize: 'vertical' }}
                  placeholder="Type your alert here..."
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                />
                <button onClick={sendBroadcast} style={{ background: '#3B82F6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px', width: '100%' }}>📢 Send Broadcast Now</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 🔥 THE PERMISSION TOGGLES MODAL (DYNAMIC RBAC MATRIX) 🔥 */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#11182D', width: '100%', maxWidth: '500px', borderRadius: '16px', border: '1px solid #374151', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Access Control Matrix</h3>
                <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Modifying permissions for <strong style={{color:'#60A5FA'}}>{selectedUser.name}</strong> ({selectedUser.role})</div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Toggle Item 1 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050810', padding: '15px', borderRadius: '8px', border: '1px solid #1F2937' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>View ATS Pipeline</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Can see candidate database and tracking.</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={userPermissions.view_ats} onChange={() => togglePermission('view_ats')} />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Toggle Item 2 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050810', padding: '15px', borderRadius: '8px', border: '1px solid #1F2937' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Edit Client Leads</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Can add/edit target companies and HR details.</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={userPermissions.edit_leads} onChange={() => togglePermission('edit_leads')} />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Toggle Item 3 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050810', padding: '15px', borderRadius: '8px', border: '1px solid #1F2937' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: userPermissions.export_csv ? '#F59E0B' : '#fff' }}>Export Data (CSV)</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Can download full database. High security risk.</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={userPermissions.export_csv} onChange={() => togglePermission('export_csv')} />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Toggle Item 4 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050810', padding: '15px', borderRadius: '8px', border: '1px solid #1F2937' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: userPermissions.delete_records ? '#EF4444' : '#fff' }}>Delete Records</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Can permanently delete leads, candidates, or feedback.</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={userPermissions.delete_records} onChange={() => togglePermission('delete_records')} />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Toggle Item 5 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050810', padding: '15px', borderRadius: '8px', border: '1px solid #1F2937' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Access Billing & Invoices</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Can view placement revenue and generate invoices.</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={userPermissions.access_billing} onChange={() => togglePermission('access_billing')} />
                  <span className="slider"></span>
                </label>
              </div>

            </div>

            <div style={{ padding: '20px', borderTop: '1px solid #1F2937', background: '#050810', borderRadius: '0 0 16px 16px', display: 'flex', gap: '15px' }}>
              <button onClick={savePermissions} style={{ flex: 1, background: '#10B981', color: '#000', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                Save Access Rules
              </button>
              <button onClick={() => setSelectedUser(null)} style={{ background: '#1F2937', color: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #374151', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
            
          </div>
        </div>
      )}

    </Layout>
  );
}