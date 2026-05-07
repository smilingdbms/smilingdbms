import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';

export default function RebuiltDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  
  // Basic Filters
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced Filters State & Panel Toggle
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    location: '',
    industry: '',
    education: '',
    gender: 'All',
    designation: '',
    skills: '',
    company: '',
    expMin: '',
    expMax: '',
    ctcMin: '',
    ctcMax: '',
    ageMin: '',
    ageMax: ''
  });

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('placements').select('*').order('created_at', { ascending: false });
      setCandidates(data || []);
    }
    loadData();
  }, []);

  const fallbackData = [
    { id: '1', candidate_name: 'Rahul Sharma', candidate_mobile: '9876543210', designation: 'Frontend Developer', experience: '3.5', expected_ctc: '1200000', status: 'Interview Scheduled', location: 'Delhi', gender: 'Male' },
    { id: '2', candidate_name: 'Priya Singh', candidate_mobile: '8765432109', designation: 'Backend Developer', experience: '5', expected_ctc: '1800000', status: 'Screening', location: 'Mumbai', gender: 'Female' },
    { id: '3', candidate_name: 'Amit Kumar', candidate_mobile: '7654321098', designation: 'UI/UX Designer', experience: '2', expected_ctc: '800000', status: 'New', location: 'Pune', gender: 'Male' }
  ];

  const displayData = candidates.length > 0 ? candidates : fallbackData;

  // Basic Filter Logic (Can be expanded as real DB columns are added)
  const filteredCandidates = displayData.filter(c => {
    const matchesSearch = c.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.candidate_mobile?.includes(searchTerm);
                          
    // Example of how advanced filters will hook in (using gender as test if it exists)
    const matchesGender = advFilters.gender === 'All' ? true : c.gender === advFilters.gender;
    
    return matchesSearch && matchesGender;
  });

  const handleAdvFilterChange = (e) => {
    const { name, value } = e.target;
    setAdvFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearAdvFilters = () => {
    setAdvFilters({ location: '', industry: '', education: '', gender: 'All', designation: '', skills: '', company: '', expMin: '', expMax: '', ctcMin: '', ctcMax: '', ageMin: '', ageMax: '' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0e14', color: '#e2e8f0', fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", overflowX: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#121822', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', position: 'fixed', zIndex: 50 }}>
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
          {['Applications', 'Analytics', 'My Company'].map((name, i) => (
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '35px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Job Seekers</h1>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>Master database for all candidates and potential placements.</p>
            </div>
            {/* COMPACT SEARCH & ADVANCED FILTER TOGGLE */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative', width: '300px' }}>
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Quick search name, role..." 
                  style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '10px 15px 10px 40px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} 
                />
                <span style={{ position: 'absolute', left: '12px', top: '9px', fontSize: '14px' }}>🔍</span>
              </div>
              <button 
                onClick={() => setIsFilterOpen(true)}
                style={{ backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
              >
                <span>⚙️</span> Advanced Filters
              </button>
            </div>
          </div>

          {/* STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px', marginBottom: '40px' }}>
            {[
              { label: 'TOTAL', count: displayData.length, color: '#3dd68c' },
              { label: 'FRESHERS', count: 0, color: '#a855f7' },
              { label: 'EXPERIENCED', count: displayData.length, color: '#f59e0b' },
              { label: 'TEAM', count: 0, color: '#0ea5e9' },
              { label: 'CLIENTS', count: 1, color: '#f43f5e' },
              { label: 'SHORTLISTED', count: displayData.filter(c => c.status === 'Shortlisted').length || 1, color: '#10b981' },
              { label: 'PLACED', count: 0, color: '#3dd68c' }
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '24px 10px', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '900', color: stat.color, marginBottom: '8px' }}>{stat.count}</div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px' }}>{stat.label}</div>
              </div>
            ))}
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
                    <td><span style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>EXPERIENCED</span></td>
                    <td style={{ color: '#d1d5db', fontSize: '14px' }}>{c.designation || 'IT Developer'}</td>
                    <td style={{ color: '#d1d5db', fontSize: '14px' }}>{c.experience || '3.5 Yrs'}</td>
                    <td style={{ fontWeight: '800', color: '#fff', fontSize: '14px' }}>₹{c.expected_ctc || '12L'}</td>
                    <td><span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#3dd68c', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>{c.status || 'New'}</span></td>
                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                      <button style={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>View Detail →</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No candidates found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ADVANCED FILTERS SLIDE-OUT PANEL */}
      {isFilterOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '450px', backgroundColor: '#0b0e14', borderLeft: '1px solid #1f2937', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease-out' }}>
            
            {/* Panel Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>Advanced Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Filter Content */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Professional Section */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#4b5563', letterSpacing: '1px', marginBottom: '12px' }}>PROFESSIONAL DETAILS</div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <input name="designation" value={advFilters.designation} onChange={handleAdvFilterChange} placeholder="Designation (e.g. Developer)" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  <input name="skills" value={advFilters.skills} onChange={handleAdvFilterChange} placeholder="Key Skills (e.g. React, Python)" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  <input name="industry" value={advFilters.industry} onChange={handleAdvFilterChange} placeholder="Industry (e.g. IT, Finance)" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Experience & Salary Range */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#4b5563', letterSpacing: '1px', marginBottom: '12px' }}>EXPERIENCE & CTC</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input name="expMin" type="number" value={advFilters.expMin} onChange={handleAdvFilterChange} placeholder="Min Exp (Yrs)" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  <input name="expMax" type="number" value={advFilters.expMax} onChange={handleAdvFilterChange} placeholder="Max Exp (Yrs)" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input name="ctcMin" type="number" value={advFilters.ctcMin} onChange={handleAdvFilterChange} placeholder="Min CTC (₹)" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  <input name="ctcMax" type="number" value={advFilters.ctcMax} onChange={handleAdvFilterChange} placeholder="Max CTC (₹)" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Demographics & Education */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#4b5563', letterSpacing: '1px', marginBottom: '12px' }}>DEMOGRAPHICS & LOCATION</div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <input name="location" value={advFilters.location} onChange={handleAdvFilterChange} placeholder="Location / City" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  <input name="education" value={advFilters.education} onChange={handleAdvFilterChange} placeholder="Education (e.g. B.Tech, MBA)" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <select name="gender" value={advFilters.gender} onChange={handleAdvFilterChange} style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#9ca3af', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                      <option value="All">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input name="ageMin" type="number" value={advFilters.ageMin} onChange={handleAdvFilterChange} placeholder="Min Age" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                      <input name="ageMax" type="number" value={advFilters.ageMax} onChange={handleAdvFilterChange} placeholder="Max Age" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Company Specific */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#4b5563', letterSpacing: '1px', marginBottom: '12px' }}>BD PIPELINE TARGET</div>
                <input name="company" value={advFilters.company} onChange={handleAdvFilterChange} placeholder="Target Company" style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>

            </div>

            {/* Panel Footer / Actions */}
            <div style={{ padding: '24px', borderTop: '1px solid #1f2937', display: 'flex', gap: '15px' }}>
              <button onClick={clearAdvFilters} style={{ flex: 1, backgroundColor: 'transparent', color: '#f43f5e', border: '1px solid #f43f5e', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Reset All</button>
              <button onClick={() => setIsFilterOpen(false)} style={{ flex: 2, backgroundColor: '#3dd68c', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Apply Filters</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}