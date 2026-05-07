import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase'; // Make sure this path is correct

export default function RebuiltDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);

  // Fetch data (keeps your table alive)
  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('placements').select('*').order('created_at', { ascending: false });
      setCandidates(data || []);
    }
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0e14', color: '#e2e8f0', fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>
      
      {/* ========================================== */}
      {/* 1. EXACT SIDEBAR FROM SCREENSHOT e09036    */}
      {/* ========================================== */}
      <aside style={{ width: '260px', backgroundColor: '#121822', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', position: 'fixed' }}>
        
        {/* LOGO AREA */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#3dd68c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '900', fontSize: '20px' }}>R</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', lineHeight: '1' }}>RecruitBase</div>
            <div style={{ fontSize: '10px', color: '#8b949e', letterSpacing: '1px', marginTop: '4px' }}>RECRUITMENT OS</div>
          </div>
        </div>

        {/* PROFILE AREA */}
        <div style={{ padding: '0 20px 20px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1e293b', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 'bold', fontSize: '16px' }}>P</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Pravin</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Super Admin</div>
            <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700', marginTop: '2px' }}>⭐ 65 pts</div>
          </div>
        </div>

        {/* NAVIGATION MENUS */}
        <nav style={{ flex: 1, padding: '10px 0' }}>
          
          <div style={{ padding: '10px 20px', fontSize: '11px', fontWeight: '800', color: '#4b5563', letterSpacing: '1.5px' }}>MAIN MENU</div>
          {[
            { name: 'Dashboard', icon: '📊', path: '/dashboard', active: true },
            { name: 'Job Seekers', icon: '👥', path: '/dashboard/candidates' },
            { name: 'Jobs', icon: '💼', path: '/dashboard/jobs' },
            { name: 'BD Pipeline', icon: '👔', path: '/dashboard/bd' },
            { name: 'Interviews', icon: '📅', path: '/dashboard/interviews' },
            { name: 'Communications', icon: '💬', path: '/dashboard/communications' },
            { name: 'Placements', icon: '🏆', path: '/dashboard/placements' },
            { name: 'Team Member', icon: '🛡️', path: '/dashboard/team' },
          ].map((item, i) => (
            <div key={i} onClick={() => router.push(item.path)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', margin: '2px 10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: item.active ? 'rgba(61, 214, 140, 0.1)' : 'transparent', color: item.active ? '#3dd68c' : '#9ca3af', fontWeight: item.active ? '700' : '500', fontSize: '14px', transition: '0.2s' }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span> {item.name}
            </div>
          ))}

          <div style={{ padding: '20px 20px 10px 20px', fontSize: '11px', fontWeight: '800', color: '#4b5563', letterSpacing: '1.5px' }}>REPORTS</div>
          {[
            { name: 'Applications', icon: '📁' },
            { name: 'Analytics', icon: '📉' },
            { name: 'My Company', icon: '🏢' },
            { name: 'Stakeholders', icon: '🤝' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', margin: '0 10px', cursor: 'pointer', color: '#9ca3af', fontSize: '14px', fontWeight: '500' }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span> {item.name}
            </div>
          ))}

          <div style={{ padding: '20px 20px 10px 20px', fontSize: '11px', fontWeight: '800', color: '#4b5563', letterSpacing: '1.5px' }}>SYSTEM</div>
          {[
            { name: 'Admin Panel', icon: '👑' },
            { name: 'Settings', icon: '⚙️' },
            { name: 'Job Board', icon: '🎯' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', margin: '0 10px', cursor: 'pointer', color: '#9ca3af', fontSize: '14px', fontWeight: '500' }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span> {item.name}
            </div>
          ))}
        </nav>
      </aside>

      {/* ========================================== */}
      {/* 2. MAIN CONTENT AREA FROM SCREENSHOT e08c7d */}
      {/* ========================================== */}
      <main style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        
        {/* TOP HEADER */}
        <header style={{ height: '70px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', backgroundColor: '#0b0e14', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '30px', height: '100%' }}>
            {['Dashboard', 'Jobs', 'Applications', 'Team'].map((tab, i) => (
              <div key={tab} style={{ display: 'flex', alignItems: 'center', color: i === 0 ? '#3dd68c' : '#9ca3af', fontWeight: '600', fontSize: '14px', borderBottom: i === 0 ? '2px solid #3dd68c' : 'none', cursor: 'pointer', padding: '0 5px' }}>
                {tab}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button style={{ backgroundColor: 'transparent', border: '1px solid #374151', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Upload CV</button>
            <button style={{ backgroundColor: '#3dd68c', border: 'none', color: '#000', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>+ Add Profile</button>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div style={{ padding: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Job Seekers</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '35px' }}>Master database for all candidates and potential placements.</p>

          {/* 7 STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px', marginBottom: '40px' }}>
            {[
              { label: 'TOTAL', count: candidates.length || 1, color: '#3dd68c' },
              { label: 'FRESHERS', count: 0, color: '#a855f7' },
              { label: 'EXPERIENCED', count: candidates.length || 1, color: '#f59e0b' },
              { label: 'TEAM', count: 0, color: '#0ea5e9' },
              { label: 'CLIENTS', count: 1, color: '#f43f5e' },
              { label: 'SHORTLISTED', count: 1, color: '#10b981' },
              { label: 'PLACED', count: 0, color: '#3dd68c' }
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '24px 10px', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '900', color: stat.color, marginBottom: '8px' }}>{stat.count}</div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* DATA TABLE SECTION */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#1f2937', color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <tr>
                  <th style={{ padding: '20px 24px' }}>NAME / CONTACT</th>
                  <th>SEGMENT</th>
                  <th>ROLE</th>
                  <th>EXP</th>
                  <th>CTC</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {/*