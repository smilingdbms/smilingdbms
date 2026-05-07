import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';

// --- CUSTOM SMART MULTI-SELECT COMPONENT ---
const SmartMultiSelect = ({ options, selected, onChange, placeholder, allowCustom = true }) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const filteredOptions = options.filter(
    (opt) => opt.toLowerCase().includes(inputValue.toLowerCase()) && !selected.includes(opt)
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setShowDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange([...selected, val]);
    setInputValue('');
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      const match = filteredOptions.find(o => o.toLowerCase() === inputValue.toLowerCase());
      if (match) handleSelect(match);
      else if (allowCustom) handleSelect(inputValue.trim());
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(selected.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', minHeight: '44px', padding: '4px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
      {selected.map((tag, idx) => (
        <span key={idx} style={{ backgroundColor: 'rgba(61, 214, 140, 0.15)', color: '#3dd68c', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {tag} <span onClick={() => removeTag(tag)} style={{ cursor: 'pointer', color: '#fff' }}>×</span>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={selected.length === 0 ? placeholder : ''}
        style={{ flex: 1, minWidth: '120px', background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', outline: 'none', padding: '6px' }}
      />
      {showDropdown && (inputValue || options.length > 0) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, i) => (
            <div key={i} onClick={() => handleSelect(opt)} style={{ padding: '10px 15px', color: '#d1d5db', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #374151' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              {opt}
            </div>
          )) : (
            <div style={{ padding: '10px 15px', color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>
              {allowCustom ? 'Press Enter to add this new option' : 'No matches found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
export default function RebuiltDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [advFilters, setAdvFilters] = useState({
    locations: [], designations: [], skills: [], industries: [], gender: 'All', expMin: 'All', expMax: 'All', ctcMin: 'All', ctcMax: 'All', education: []
  });

  const cityOptions = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Bhubaneswar', 'Noida', 'Gurgaon', 'Indore', 'Chandigarh'];
  const skillOptions = ['React', 'Node.js', 'Python', 'Java', 'SQL', 'Sales', 'Business Development', 'Marketing', 'Figma', 'AWS'];
  const desigOptions = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'HR Manager', 'Sales Executive', 'Project Manager'];
  const indOptions = ['IT / Software', 'Banking / Finance', 'Healthcare', 'Manufacturing', 'EdTech', 'E-Commerce'];
  const eduOptions = ['B.Tech / B.E.', 'MBA / PGDM', 'MCA', 'BCA', 'B.Sc', 'B.Com', 'Any Graduate'];
  const expRanges = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '15', '20+'];
  const ctcRanges = ['1L', '3L', '5L', '8L', '10L', '15L', '20L', '30L', '50L+'];

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('placements').select('*').order('created_at', { ascending: false });
      setCandidates(data || []);
    }
    loadData();
  }, []);

  const fallbackData = [
    { id: '1', candidate_name: 'Rahul Sharma', candidate_mobile: '9876543210', designation: 'Frontend Developer', experience: '3', expected_ctc: '1200000', status: 'Interview Scheduled', location: 'Delhi', skills: 'React, Node.js, Next.js' },
    { id: '2', candidate_name: 'Priya Singh', candidate_mobile: '8765432109', designation: 'Backend Developer', experience: '5', expected_ctc: '1800000', status: 'Screening', location: 'Mumbai', skills: 'Python, AWS, SQL' },
    { id: '3', candidate_name: 'Amit Kumar', candidate_mobile: '7654321098', designation: 'Sales Executive', experience: '0', expected_ctc: '400000', status: 'New', location: 'Bhubaneswar', skills: 'Sales, Marketing, Lead Gen' }
  ];

  const displayData = candidates.length > 0 ? candidates : fallbackData;

  const filteredCandidates = displayData.filter(c => {
    return c.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.candidate_mobile?.includes(searchTerm);
  });

  const updateMultiFilter = (key, valArray) => setAdvFilters(prev => ({ ...prev, [key]: valArray }));
  const updateFilter = (key, val) => setAdvFilters(prev => ({ ...prev, [key]: val }));
  const clearAdvFilters = () => setAdvFilters({ locations: [], designations: [], skills: [], industries: [], education: [], gender: 'All', expMin: 'All', expMax: 'All', ctcMin: 'All', ctcMax: 'All' });

  // Helpers for standardizing Look
  const maskPhone = (phone) => {
    if (!phone || phone.length < 5) return 'N/A';
    return '+91 ••••• ••' + phone.slice(-3);
  };

  const formatCTC = (ctcStr) => {
    if (!ctcStr) return 'N/A';
    const num = parseInt(ctcStr.toString().replace(/[^0-9]/g, ''));
    if (isNaN(num)) return ctcStr;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1).replace('.0', '')} LPA`;
    return `₹${num}`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0e14', color: '#e2e8f0', fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", overflowX: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#121822', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', position: 'fixed', zIndex: 50 }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#3dd68c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '900', fontSize: '20px' }}>R</div>
          <div><div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', lineHeight: '1' }}>RecruitBase</div><div style={{ fontSize: '10px', color: '#8b949e', letterSpacing: '1px', marginTop: '4px' }}>RECRUITMENT OS</div></div>
        </div>
        <div style={{ padding: '0 20px 20px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1e293b', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 'bold', fontSize: '16px' }}>P</div>
          <div><div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Pravin</div><div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700' }}>⭐ 65 pts</div></div>
        </div>
        <nav style={{ flex: 1, padding: '10px 0' }}>
          <div style={{ padding: '10px 20px', fontSize: '11px', fontWeight: '800', color: '#4b5563', letterSpacing: '1.5px' }}>MAIN MENU</div>
          {[
            { name: 'Dashboard', icon: '📊', path: '/dashboard', active: true },
            { name: 'Job Seekers', icon: '👥', path: '/dashboard' },
            { name: 'BD Pipeline', icon: '👔', path: '/dashboard/bd' },
            { name: 'Interviews', icon: '📅', path: '/dashboard/interviews' },
            { name: 'Placements', icon: '🏆', path: '/dashboard/placements' },
          ].map((item, i) => (
            <div key={i} onClick={() => router.push(item.path)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', margin: '2px 10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: item.active ? 'rgba(61, 214, 140, 0.1)' : 'transparent', color: item.active ? '#3dd68c' : '#9ca3af', fontWeight: item.active ? '700' : '500', fontSize: '14px', transition: '0.2s' }} onMouseOver={(e) => { if (!item.active) { e.currentTarget.style.backgroundColor = '#1f2937'; e.currentTarget.style.color = '#fff'; } }} onMouseOut={(e) => { if (!item.active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; } }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span> {item.name}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        
        <header style={{ height: '70px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', backgroundColor: '#0b0e14', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '30px', height: '100%' }}>
            {['Dashboard', 'Jobs', 'Applications', 'Team'].map((tab, i) => (
              <div key={tab} style={{ display: 'flex', alignItems: 'center', color: i === 0 ? '#3dd68c' : '#9ca3af', fontWeight: '600', fontSize: '14px', borderBottom: i === 0 ? '2px solid #3dd68c' : 'none', cursor: 'pointer', padding: '0 5px' }}>{tab}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button style={{ backgroundColor: 'transparent', border: '1px solid #374151', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Upload CV</button>
            <button style={{ backgroundColor: '#3dd68c', border: 'none', color: '#000', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>+ Add Profile</button>
          </div>
        </header>

        <div style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '35px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Job Seekers</h1>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>Master database for all candidates and potential placements.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative', width: '300px' }}>
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Quick search name, mobile..." style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '10px 15px 10px 40px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                <span style={{ position: 'absolute', left: '12px', top: '9px', fontSize: '14px' }}>🔍</span>
              </div>
              <button onClick={() => setIsFilterOpen(true)} style={{ backgroundColor: '#1f2937', color: '#3dd68c', border: '1px solid #3dd68c', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚡</span> Smart Filters
              </button>
            </div>
          </div>

          {/* STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px', marginBottom: '30px' }}>
            {[
              { label: 'TOTAL', count: displayData.length, color: '#3dd68c' },
              { label: 'FRESHERS', count: displayData.filter(c => c.experience === '0' || c.experience === '0 Yrs').length, color: '#a855f7' },
              { label: 'EXPERIENCED', count: displayData.filter(c => c.experience !== '0' && c.experience !== '0 Yrs').length, color: '#f59e0b' },
              { label: 'TEAM', count: 0, color: '#0ea5e9' },
              { label: 'CLIENTS', count: 1, color: '#f43f5e' },
              { label: 'SHORTLISTED', count: displayData.filter(c => c.status === 'Shortlisted' || c.status === 'Interview Scheduled').length, color: '#10b981' },
              { label: 'PLACED', count: 0, color: '#3dd68c' }
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '24px 10px', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '900', color: stat.color, marginBottom: '8px' }}>{stat.count}</div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* DETAILED STANDARD ATS TABLE */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#1a2230', color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <tr>
                  <th style={{ padding: '20px 24px' }}>CANDIDATE INFO</th>
                  <th>EXPERIENCE & CTC</th>
                  <th>KEY SKILLS</th>
                  <th>LOCATION</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((c) => {
                  const isFresher = c.experience === '0' || c.experience === '0 Yrs' || c.experience === 'Fresher';
                  const skillArr = c.skills ? c.skills.split(',').map(s => s.trim()) : ['N/A'];
                  
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #1f2937', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.5)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      
                      {/* Candidate Name & Masked Phone */}
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>{c.candidate_name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#9ca3af' }}>🔒</span> {maskPhone(c.candidate_mobile)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{c.designation || 'Professional'}</div>
                      </td>
                      
                      {/* Experience & CTC Formatting */}
                      <td>
                        <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '600' }}>
                          {isFresher ? <span style={{ color: '#a855f7' }}>Fresher</span> : `${c.experience} Years`}
                        </div>
                        <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
                          {formatCTC(c.expected_ctc)}
                        </div>
                      </td>

                      {/* Key Skills Tags */}
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {skillArr.slice(0, 2).map((skill, i) => (
                            <span key={i} style={{ backgroundColor: '#1f2937', color: '#d1d5db', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', border: '1px solid #374151' }}>
                              {skill}
                            </span>
                          ))}
                          {skillArr.length > 2 && (
                            <span style={{ color: '#6b7280', fontSize: '11px', alignSelf: 'center' }}>+{skillArr.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{ color: '#d1d5db', fontSize: '13px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📍 {c.location || 'Remote'}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#3dd68c', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                          {c.status || 'New'}
                        </span>
                      </td>

                      {/* Auto-CV Action */}
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <button style={{ backgroundColor: '#3dd68c', border: 'none', color: '#000', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(61, 214, 140, 0.2)' }}>
                          View CV →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* SMART ADVANCED FILTERS PANEL (Keep as is) */}
      {isFilterOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '480px', backgroundColor: '#0b0e14', borderLeft: '1px solid #1f2937', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><span>⚡</span> Smart Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div><div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px', marginBottom: '8px' }}>LOCATIONS</div><SmartMultiSelect options={cityOptions} selected={advFilters.locations} onChange={(v) => updateMultiFilter('locations', v)} placeholder="Type city..." /></div>
              <div><div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px', marginBottom: '8px' }}>KEY SKILLS</div><SmartMultiSelect options={skillOptions} selected={advFilters.skills} onChange={(v) => updateMultiFilter('skills', v)} placeholder="Type skill & press Enter" /></div>
              <div><div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px', marginBottom: '8px' }}>DESIGNATIONS</div><SmartMultiSelect options={desigOptions} selected={advFilters.designations} onChange={(v) => updateMultiFilter('designations', v)} placeholder="Type role..." /></div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px', marginBottom: '8px' }}>EXPERIENCE (YRS)</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={advFilters.expMin} onChange={(e) => updateFilter('expMin', e.target.value)} style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}><option value="All">Min</option>{expRanges.map(r => <option key={r} value={r}>{r}</option>)}</select>
                    <select value={advFilters.expMax} onChange={(e) => updateFilter('expMax', e.target.value)} style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}><option value="All">Max</option>{expRanges.map(r => <option key={r} value={r}>{r}</option>)}</select>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px', marginBottom: '8px' }}>CTC (LPA)</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={advFilters.ctcMin} onChange={(e) => updateFilter('ctcMin', e.target.value)} style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}><option value="All">Min</option>{ctcRanges.map(r => <option key={r} value={r}>{r}</option>)}</select>
                    <select value={advFilters.ctcMax} onChange={(e) => updateFilter('ctcMax', e.target.value)} style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}><option value="All">Max</option>{ctcRanges.map(r => <option key={r} value={r}>{r}</option>)}</select>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px', marginBottom: '8px' }}>EDUCATION & INDUSTRY</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <SmartMultiSelect options={eduOptions} selected={advFilters.education} onChange={(v) => updateMultiFilter('education', v)} placeholder="Select Education..." />
                  <SmartMultiSelect options={indOptions} selected={advFilters.industries} onChange={(v) => updateMultiFilter('industries', v)} placeholder="Select Industry..." />
                </div>
              </div>
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid #1f2937', display: 'flex', gap: '15px' }}>
              <button onClick={clearAdvFilters} style={{ flex: 1, backgroundColor: 'transparent', color: '#f43f5e', border: '1px solid #f43f5e', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Clear All</button>
              <button onClick={() => setIsFilterOpen(false)} style={{ flex: 2, backgroundColor: '#3dd68c', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Apply Smart Filters</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}