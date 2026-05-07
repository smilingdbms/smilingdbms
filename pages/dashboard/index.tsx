import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';

export default function RebuiltDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('All');

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('placements').select('*').order('created_at', { ascending: false });
      setCandidates(data || []);
    }
    loadData();
  }, []);

  const fallbackData = [
    { id: '1', candidate_name: 'Rahul Sharma', candidate_mobile: '9876543210', designation: 'Frontend Developer', experience: '3.5 Years', expected_ctc: '1200000', status: 'Interview Scheduled' },
    { id: '2', candidate_name: 'Priya Singh', candidate_mobile: '8765432109', designation: 'Backend Developer', experience: '5 Years', expected_ctc: '1800000', status: 'Screening' },
    { id: '3', candidate_name: 'Amit Kumar', candidate_mobile: '7654321098', designation: 'UI/UX Designer', experience: '2 Years', expected_ctc: '800000', status: 'New' }
  ];

  const displayData = candidates.length > 0 ? candidates : fallbackData;

  const filteredCandidates = displayData.filter(c => {
    const matchesSearch = c.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.designation && c.designation.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' ? true : c.status === statusFilter;
    // Assuming segment is derived from experience for demonstration
    const isExperienced = c.experience && !c.experience.toLowerCase().includes('fresher') && !c.experience.toLowerCase().includes('0 ');
    const matchesSegment = segmentFilter === 'All' ? true : 
                           segmentFilter === 'Experienced' ? isExperienced : !isExperienced;
    
    return matchesSearch && matchesStatus && matchesSegment;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0e14', color: '#e2e8f0', fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#121822', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', position: 'fixed' }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#3dd68c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '900', fontSize: '20px' }}>R</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', lineHeight: '1' }}>RecruitBase</div>
            <div style={{ fontSize: '10px', color: '#8b949e', letterSpacing: '1px', marginTop: '4px' }}>RECRUITMENT OS</div>
          </div>
        </div>

        <div style={{ padding: '0 20px 20px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1e293b', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 'bold', fontSize: '16px' }}>P</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Pravin</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Super Admin</div>
            <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700', marginTop: '2px' }}>⭐ 65 pts</div>
          </div>
        </div>

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
            <div key={i} onClick={() => router.push(item.path)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', margin: '2px 10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: item.active ? 'rgba(61, 214, 140, 0.1)' : 'transparent', color: item.active ? '#3dd68c' : '#9ca3af', fontWeight: item.active ? '700' : '500', fontSize: '14px', transition: 'all 0.2s ease' }} onMouseOver={(e) => { if (!item.active) { e.currentTarget.style.backgroundColor = '#1f2937'; e.currentTarget.style.color = '#fff'; } }} onMouseOut={(e) => { if (!item.active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; } }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span> {item.name}
            </div>
          ))}

          <div style={{ padding: '20px 20px 10px 20px', fontSize: '11px', fontWeight: '800', color: '#4b5563', letterSpacing: '1.5px' }}>REPORTS</div>
          {['Applications', 'Analytics', 'My Company', 'Stakeholders'].map((name, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', margin: '0 10px', cursor: 'pointer', color: '#9ca3af', fontSize: '14px', fontWeight: '500', borderRadius: '8px', transition: 'all 0.2s ease' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1f2937'; e.currentTarget.style.color = '#fff'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}>
              <span style={{ fontSize: '16px' }}>📁</span> {name}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        
        {/* TOP HEADER */}
        <header style={{ height: '70px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', backgroundColor: '#0b0e14', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '30px', height: '100%' }}>
            {['Dashboard', 'Jobs', 'Applications', 'Team'].map((tab, i) => (
              <div key={tab} style={{ display: 'flex', alignItems: 'center', color: i === 0 ? '#3dd68c' : '#9ca3af', fontWeight: '600', fontSize: '14px', borderBottom: i === 0 ? '2px solid #3dd68c' : 'none', cursor: 'pointer', padding: '0 5px', transition: 'color 0.2s' }} onMouseOver={(e) => { if (i !== 0) e.currentTarget.style.color = '#fff'; }} onMouseOut={(e) => { if (i !== 0) e.currentTarget.style.color = '#9ca3af'; }}>
                {tab}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button style={{ backgroundColor: 'transparent', border: '1px solid #374151', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1f2937'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Upload CV</button>
            <button style={{ backgroundColor: '#3dd68c', border: 'none', color: '#000', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'} onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>+ Add Profile</button>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div style={{ padding: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Job Seekers</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '30px' }}>Master database for all candidates and potential placements.</p>

          {/* STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px', marginBottom: '35px' }}>
            {[
              { label: 'TOTAL', count: displayData.length, color: '#3dd68c' },
              { label: 'FRESHERS', count: displayData.filter(c => c.experience && c.experience.toLowerCase().includes('0')).length || 0, color: '#a855f7' },
              { label: 'EXPERIENCED', count: displayData.filter(c => c.experience && !c.experience.toLowerCase().includes('0')).length || displayData.length, color: '#f59e0b' },
              { label: 'TEAM', count: 0, color: '#0ea5e9' },
              { label: 'CLIENTS', count: 1, color: '#f43f5e' },
              { label: 'SHORTLISTED', count: displayData.filter(c => c.status === 'Shortlisted' || c.status === 'Interview Scheduled').length, color: '#10b981' },
              { label: 'PLACED', count: displayData.filter(c => c.status === 'Placed').length, color: '#3dd68c' }
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '24px 10px', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '900', color: stat.color, marginBottom: '8px' }}>{stat.count}</div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* BEAUTIFUL FILTERS SECTION */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', backgroundColor: '#111827', padding: '16px', borderRadius: '16px', border: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, role, contact..." 
                style={{ width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff', padding: '12px 15px 12px 40px', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
              />
              <span style={{ position: 'absolute', left: '15px', top: '12px', fontSize: '14px' }}>🔍</span>
            </div>
            <select 
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              style={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '10px', fontSize: '14px', outline: 'none', cursor: 'pointer', minWidth: '150px' }}
            >
              <option value="All">All Segments</option>
              <option value="Fresher">Freshers Only</option>
              <option value="Experienced">Experienced Only</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '10px', fontSize: '14px', outline: 'none', cursor: 'pointer', minWidth: '160px' }}
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Screening">Screening</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Placed">Placed</option>
            </select>
            <button 
              onClick={() => { setSearchTerm(''); setSegmentFilter('All'); setStatusFilter('All'); }}
              style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)'}
            >
              Clear
            </button>
          </div>

          {/* DATA TABLE */}
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
                {filteredCandidates.length > 0 ? filteredCandidates.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1f2937', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.5)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>{c.candidate_name}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#3dd68c' }}>📞</span> {c.candidate_mobile}
                      </div>
                    </td>
                    <td>
                      <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>EXPERIENCED</span>
                    </td>
                    <td style={{ color: '#d1d5db', fontSize: '14px' }}>{c.designation || 'IT Developer'}</td>
                    <td style={{ color: '#d1d5db', fontSize: '14px' }}>{c.experience || '3.5 Years'}</td>
                    <td style={{ fontWeight: '800', color: '#fff', fontSize: '14px' }}>₹{c.expected_ctc || '1000000'}</td>
                    <td>
                      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#3dd68c', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>{c.status || 'New'}</span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                      <button style={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}>
                        View Detail →
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                      No candidates match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </main>
    </div>
  );
}