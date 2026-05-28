// @ts-nocheck
/* eslint-disable */
import React, { useState } from 'react';
import Head from 'next/head';

export default function AccountOwnerDashboard() {
  const [activeTab, setActiveTab] = useState('ats'); // Default tab set to ATS Pipeline
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // DUMMY DATA FOR OVERVIEW
  const stats = [
    { title: "Total Revenue (YTD)", value: "₹ 12,45,000", icon: "💰", color: "#10B981" },
    { title: "Active Mandates", value: "14", icon: "🏢", color: "#3B82F6" },
    { title: "Candidates in Pipeline", value: "86", icon: "👥", color: "#A855F7" },
    { title: "Successful Placements", value: "9", icon: "🏆", color: "#F59E0B" }
  ];

  // DUMMY DATA FOR ATS (From your video)
  const candidates = [
    { id: 1, name: 'Ajay Kant', role: 'Professional', exp: '0.0 Years', ctc: '₹0', location: 'Remote', status: 'New', statusColor: '#10B981' },
    { id: 2, name: 'Rahul', role: 'IT Developer', exp: 'null Years', ctc: '₹10 LPA', location: 'Remote', status: 'Interview Scheduled', statusColor: '#3B82F6' }
  ];

  return (
    <>
      <Head><title>Workspace | RecruitOS</title></Head>
      <style dangerouslySetInnerHTML={{__html: `
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #050810; color: #fff; }
        .ao-layout { display: flex; height: 100vh; overflow: hidden; width: 100%; }
        
        /* UNIFIED SIDEBAR */
        .sidebar { background: #11182D; border-right: 1px solid #1F2937; transition: width 0.3s ease; display: flex; flex-direction: column; z-index: 50; }
        .nav-item { padding: 15px 20px; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.2s; color: #9CA3AF; white-space: nowrap; overflow: hidden; border-left: 3px solid transparent; }
        .nav-item:hover { background: rgba(59, 130, 246, 0.1); color: #fff; }
        .nav-item.active { background: rgba(59, 130, 246, 0.15); color: #60A5FA; border-left-color: #3B82F6; font-weight: bold; }
        
        /* MAIN CONTENT AREA */
        .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #050810; }
        .top-header { background: #11182D; padding: 15px 30px; border-bottom: 1px solid #1F2937; display: flex; justify-content: space-between; align-items: center; }
        .content-area { padding: 30px; overflow-y: auto; flex: 1; }
        
        /* ATS SPECIFIC STYLES (From your video) */
        .mini-stat-box { background: #11182D; border: 1px solid #1F2937; border-radius: 8px; padding: 15px; text-align: center; flex: 1; min-width: 100px; }
        .mini-stat-value { font-size: 24px; font-weight: bold; color: #fff; }
        .mini-stat-label { font-size: 11px; color: #6B7280; text-transform: uppercase; margin-top: 5px; font-weight: bold; }
        .ats-table { width: 100%; border-collapse: collapse; background: #11182D; border-radius: 12px; overflow: hidden; border: 1px solid #1F2937; }
        .ats-table th { background: #1F2937; padding: 15px; text-align: left; font-size: 11px; color: #9CA3AF; text-transform: uppercase; }
        .ats-table td { padding: 15px; border-bottom: 1px solid #1F2937; font-size: 13px; color: #E5E7EB; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050810; }
        ::-webkit-scrollbar-thumb { background: #1F2937; border-radius: 4px; }
      `}} />

      <div className="ao-layout">
        
        {/* THE MASTER SIDEBAR (Architecture Base) */}
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
          </div>
        </div>

        {/* MASTER CONTENT AREA */}
        <div className="main-content">
          
          {/* THE MASTER HEADER */}
          <div className="top-header">
            <h2 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Welcome back, Rahul 👋</h2>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <button style={{ background: '#10B981', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Profile</button>
              <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #F59E0B' }}>Enterprise Plan</span>
              <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>RS</div>
            </div>
          </div>

          {/* DYNAMIC ROUTING (Zero Refresh) */}
          <div className="content-area">
            
            {/* 1. OVERVIEW MODULE */}
            {activeTab === 'overview' && (
              <div>
                <h2 style={{ marginTop: 0 }}>Business Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  {stats.map((s, i) => (
                    <div key={i} style={{ background: '#11182D', padding: '20px', borderRadius: '12px', border: '1px solid #1F2937', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', background: `${s.color}20`, color: s.color }}>{s.icon}</div>
                      <div>
                        <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 'bold' }}>{s.title}</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. ATS PIPELINE MODULE (Imported from your video) */}
            {activeTab === 'ats' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>Job Seekers</h1>
                    <p style={{ margin: 0, color: '#9CA3AF', fontSize: '13px', marginTop: '5px' }}>Master database for all candidates and potential placements.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <input type="text" placeholder="🔍 Quick search name, mobile..." style={{ background: '#11182D', border: '1px solid #374151', padding: '10px 15px', borderRadius: '8px', color: '#fff', width: '250px' }} />
                    <button style={{ background: '#11182D', border: '1px solid #374151', color: '#fff', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>⚡ Smart Filters</button>
                  </div>
                </div>

                {/* Mini Stats Bar */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <div className="mini-stat-box"><div className="mini-stat-value" style={{color: '#60A5FA'}}>2</div><div className="mini-stat-label">Total</div></div>
                  <div className="mini-stat-box"><div className="mini-stat-value" style={{color: '#A855F7'}}>0</div><div className="mini-stat-label">Freshers</div></div>
                  <div className="mini-stat-box"><div className="mini-stat-value" style={{color: '#F59E0B'}}>2</div><div className="mini-stat-label">Experienced</div></div>
                  <div className="mini-stat-box"><div className="mini-stat-value">0</div><div className="mini-stat-label">Team</div></div>
                  <div className="mini-stat-box"><div className="mini-stat-value">1</div><div className="mini-stat-label">Clients</div></div>
                  <div className="mini-stat-box"><div className="mini-stat-value" style={{color: '#10B981'}}>1</div><div className="mini-stat-label">Shortlisted</div></div>
                  <div className="mini-stat-box"><div className="mini-stat-value">0</div><div className="mini-stat-label">Placed</div></div>
                </div>

                {/* Candidates Table */}
                <table className="ats-table">
                  <thead>
                    <tr>
                      <th>Candidate Info</th>
                      <th>Experience & CTC</th>
                      <th>Key Skills</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '35px', height: '35px', background: '#374151', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{c.name.charAt(0)}</div>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c.name}</div>
                              <div style={{ fontSize: '12px', color: '#6B7280' }}>{c.role}</div>
                            </div>
                          </div>
                        </td>
                        <td><div style={{ fontWeight: 'bold' }}>{c.exp}</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>{c.ctc}</div></td>
                        <td><span style={{ background: '#374151', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#D1D5DB' }}>N/A</span></td>
                        <td><span style={{ color: '#EF4444' }}>📍 {c.location}</span></td>
                        <td><span style={{ color: c.statusColor, fontWeight: 'bold', fontSize: '12px' }}>{c.status}</span></td>
                        <td><button style={{ background: '#10B981', color: '#000', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>View CV →</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PLACEHOLDERS FOR CRM & BILLING */}
            {['crm', 'billing'].includes(activeTab) && (
              <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#6B7280', background: '#11182D', borderRadius: '12px', border: '1px solid #1F2937' }}>
                <div style={{ fontSize: '50px', marginBottom: '20px' }}>🚧</div>
                <h2 style={{ margin: 0, color: '#fff' }}>{activeTab.toUpperCase()} Module (Phase 3)</h2>
                <p style={{ marginTop: '10px' }}>This section will be activated in the next development sprint.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}