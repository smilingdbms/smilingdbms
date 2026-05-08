// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AccountOwnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Dummy data for immediate visual feedback (Later will come from Supabase based on Tenant ID)
  const stats = [
    { title: "Total Revenue (YTD)", value: "₹ 12,45,000", icon: "💰", color: "#10B981" },
    { title: "Active Mandates", value: "14", icon: "🏢", color: "#3B82F6" },
    { title: "Candidates in Pipeline", value: "86", icon: "👥", color: "#A855F7" },
    { title: "Successful Placements", value: "9", icon: "🏆", color: "#F59E0B" }
  ];

  return (
    <>
      <Head><title>Workspace | RecruitOS</title></Head>
      <style dangerouslySetInnerHTML={{__html: `
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #F3F4F6; }
        .ao-layout { display: flex; height: 100vh; overflow: hidden; }
        .sidebar { background: #11182D; color: #9CA3AF; transition: 0.3s; display: flex; flex-direction: column; }
        .nav-item { padding: 15px 20px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-left: 3px solid transparent; transition: 0.2s; white-space: nowrap; }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .nav-item.active { background: rgba(59, 130, 246, 0.1); color: #60A5FA; border-left-color: #3B82F6; font-weight: bold; }
        .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #F9FAFB; }
        .top-header { background: #fff; padding: 15px 30px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center; }
        .content-area { padding: 30px; overflow-y: auto; flex: 1; }
        
        /* Dashboard Cards */
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); display: flex; align-items: center; gap: 15px; }
        .stat-icon { width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        
        /* Generic Table */
        .data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; }
        .data-table th { background: #F3F4F6; padding: 15px; text-align: left; font-size: 12px; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; }
        .data-table td { padding: 15px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #374151; }
      `}} />

      <div className="ao-layout">
        {/* SIDEBAR */}
        <div className="sidebar" style={{ width: isSidebarOpen ? '250px' : '70px' }}>
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #1F2937' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>☰</button>
            {isSidebarOpen && <span style={{ fontWeight: '800', fontSize: '18px', color: '#fff' }}>Naukri Cottage</span>}
          </div>
          
          <div style={{ flex: 1, padding: '10px 0' }}>
            <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <span style={{ fontSize: '18px' }}>📊</span> {isSidebarOpen && "Dashboard"}
            </div>
            <div className={`nav-item ${activeTab === 'ats' ? 'active' : ''}`} onClick={() => setActiveTab('ats')}>
              <span style={{ fontSize: '18px' }}>👩‍💼</span> {isSidebarOpen && "ATS Pipeline"}
            </div>
            <div className={`nav-item ${activeTab === 'crm' ? 'active' : ''}`} onClick={() => setActiveTab('crm')}>
              <span style={{ fontSize: '18px' }}>🏢</span> {isSidebarOpen && "Client CRM"}
            </div>
            <div className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
              <span style={{ fontSize: '18px' }}>🧾</span> {isSidebarOpen && "Billing & Invoices"}
            </div>
            <div className={`nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
              <span style={{ fontSize: '18px' }}>👥</span> {isSidebarOpen && "My Team"}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">
          {/* HEADER */}
          <div className="top-header">
            <h2 style={{ margin: 0, fontSize: '20px', color: '#11182D' }}>Welcome back, Rahul 👋</h2>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span style={{ background: '#FEF3C7', color: '#D97706', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Enterprise Plan</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>RS</div>
            </div>
          </div>

          {/* DYNAMIC TAB CONTENT */}
          <div className="content-area">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <>
                <div className="stat-grid">
                  {stats.map((s, i) => (
                    <div key={i} className="stat-card">
                      <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
                      <div>
                        <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 'bold' }}>{s.title}</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#11182D' }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 2, background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
                    <h3 style={{ marginTop: 0, color: '#11182D' }}>Recent Placements</h3>
                    <table className="data-table">
                      <thead><tr><th>Candidate</th><th>Client (Company)</th><th>CTC</th><th>Status</th></tr></thead>
                      <tbody>
                        <tr>
                          <td><div><strong>Priya Singh</strong></div><div style={{fontSize:'12px', color:'#6B7280'}}>React Developer</div></td>
                          <td>TechNova IT</td>
                          <td>₹ 14.5 LPA</td>
                          <td><span style={{ color: '#10B981', background: '#D1FAE5', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Joined</span></td>
                        </tr>
                        <tr>
                          <td><div><strong>Amit Kumar</strong></div><div style={{fontSize:'12px', color:'#6B7280'}}>Sales Manager</div></td>
                          <td>Apex Growth</td>
                          <td>₹ 8.0 LPA</td>
                          <td><span style={{ color: '#3B82F6', background: '#DBEAFE', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Offered</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div style={{ flex: 1, background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
                    <h3 style={{ marginTop: 0, color: '#11182D' }}>Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button style={{ padding: '12px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>➕ Add New Candidate</button>
                      <button style={{ padding: '12px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>🏢 Onboard Client</button>
                      <button style={{ padding: '12px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>🧾 Generate Invoice</button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* PLACEHOLDERS FOR OTHER TABS */}
            {['ats', 'crm', 'billing', 'team'].includes(activeTab) && (
              <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#6B7280', background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '50px', marginBottom: '20px' }}>🚧</div>
                <h2 style={{ margin: 0, color: '#11182D' }}>{activeTab.toUpperCase()} Module (Phase 3)</h2>
                <p style={{ marginTop: '10px' }}>This section will be activated in the next development sprint.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}