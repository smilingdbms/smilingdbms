import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

const SmartMultiSelect = ({ options, selected, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()) && !selected.includes(opt));

  useEffect(() => {
    function handleClickOutside(event) { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setShowDropdown(false); }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => { onChange([...selected, val]); setInputValue(''); setShowDropdown(false); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      const match = filteredOptions.find(o => o.toLowerCase() === inputValue.toLowerCase());
      if (match) handleSelect(match); else handleSelect(inputValue.trim());
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', backgroundColor: '#0b0e14', border: '1px solid #374151', borderRadius: '8px', minHeight: '48px', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      {selected.map((tag, idx) => (<span key={idx} style={{ backgroundColor: 'rgba(61, 214, 140, 0.15)', color: '#3dd68c', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>{tag} <span onClick={() => onChange(selected.filter(t => t !== tag))} style={{ cursor: 'pointer', color: '#fff' }}>×</span></span>))}
      <input value={inputValue} onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} onKeyDown={handleKeyDown} placeholder={selected.length === 0 ? placeholder : ''} style={{ flex: 1, minWidth: '150px', background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none', padding: '4px' }} />
      {showDropdown && (inputValue || options.length > 0) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, i) => (<div key={i} onClick={() => handleSelect(opt)} style={{ padding: '12px 15px', color: '#d1d5db', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #374151' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#374151'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>{opt}</div>)) : (<div style={{ padding: '12px 15px', color: '#9ca3af', fontSize: '14px', fontStyle: 'italic' }}>Press Enter to add custom skill</div>)}
        </div>
      )}
    </div>
  );
};

export default function AddProfile() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const cvInputRef = useRef(null);

  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', currentLoc: '', prefLoc: '', gender: '', dob: '', expYears: '0', expMonths: '0', ctcLakhs: '', ctcThousand: '', expCtcLakhs: '', expCtcThousand: '', notice: '' });
  const [professional, setProfessional] = useState({ headline: '', summary: '', skills: [] });
  const [preferences, setPreferences] = useState({ role: '', industry: '', empType: '', shift: '', workMode: '' });
  const [uploadedCVName, setUploadedCVName] = useState("");
  const [cvUrl, setCvUrl] = useState("");

  const suggestedSkills = ['React.js', 'Next.js', 'TypeScript', 'SQL', 'Node.js', 'Python', 'Lead Generation', 'Client Acquisition', 'Cold Calling', 'B2B Sales', 'CRM', 'LinkedIn Outreach'];

  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedCVName("Reading with AI & Saving to Drive... ⏳");
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Targeting the new cache-bypassing endpoint
      const res = await fetch('/api/process-resume', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCvUrl(data.cv_url);
      setBasic(prev => ({ ...prev, name: data.name || prev.name, mobile: data.mobile || prev.mobile, email: data.email || prev.email, currentLoc: data.location || prev.currentLoc, expYears: data.experienceYears?.toString() || prev.expYears, notice: data.noticePeriod || prev.notice }));
      setProfessional(prev => ({ ...prev, headline: data.headline || prev.headline, summary: data.summary || prev.summary, skills: data.skills ? data.skills.split(',').map(s=>s.trim()) : prev.skills }));
      setUploadedCVName("✅ CV Auto-Fill Success!");
    } catch (err) { 
      alert("Parsing Failed: " + err.message); 
      setUploadedCVName("❌ Parsing Failed"); 
    }
  };

  const inputStyle = { width: '100%', backgroundColor: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '14px', borderRadius: '8px', fontSize: '14px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' };
  const sectionStyle = { backgroundColor: '#111827', padding: '30px', borderRadius: '16px', border: '1px solid #1f2937', marginBottom: '30px' };

  return (
    <Layout>
      <header style={{ padding: '20px 40px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0b0e14' }}>
        <h1 style={{ color: '#fff', fontSize: '24px', margin: 0 }}>Create Candidate Profile</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button type="button" onClick={() => cvInputRef.current.click()} style={{ padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', background: '#1f2937', color: '#60a5fa', border: '1px solid #3b82f6', fontWeight: '700' }}>{uploadedCVName || "📄 Upload CV (Auto-Fill)"}</button>
        </div>
      </header>

      <input type="file" ref={cvInputRef} onChange={handleCVUpload} style={{ display: 'none' }} accept=".pdf,.doc,.docx" />

      <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={sectionStyle}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '25px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>Personal Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Full Name</label><input style={inputStyle} value={basic.name} onChange={e=>setBasic({...basic, name: e.target.value})} /></div>
            <div><label style={labelStyle}>Mobile Number</label><input style={inputStyle} value={basic.mobile} onChange={e=>setBasic({...basic, mobile: e.target.value})} /></div>
            <div><label style={labelStyle}>Email ID</label><input style={inputStyle} value={basic.email} onChange={e=>setBasic({...basic, email: e.target.value})} /></div>
            <div><label style={labelStyle}>Gender</label><select style={inputStyle} value={basic.gender} onChange={e=>setBasic({...basic, gender: e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div><label style={labelStyle}>Notice Period</label><select style={inputStyle} value={basic.notice} onChange={e=>setBasic({...basic, notice: e.target.value})}><option value="">Select</option><option>Immediate</option><option>15 Days</option><option>30 Days</option><option>60 Days</option><option>90+ Days</option></select></div>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '25px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>Professional Details</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div><label style={labelStyle}>Headline</label><input style={inputStyle} value={professional.headline} onChange={e=>setProfessional({...professional, headline: e.target.value})} /></div>
            <div><label style={labelStyle}>Key Skills (Multi-Select)</label><SmartMultiSelect options={suggestedSkills} selected={professional.skills} onChange={(val) => setProfessional({...professional, skills: val})} placeholder="Type skill and press Enter..." /></div>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '25px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>Preferred Job Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div><label style={labelStyle}>Employment Type</label><select style={inputStyle} value={preferences.empType} onChange={e=>setPreferences({...preferences, empType: e.target.value})}><option value="">Select</option><option>Full Time</option><option>Contract</option><option>Freelance</option></select></div>
            <div><label style={labelStyle}>Shift Preference</label><select style={inputStyle} value={preferences.shift} onChange={e=>setPreferences({...preferences, shift: e.target.value})}><option value="">Select</option><option>Day Shift</option><option>Night Shift</option><option>Flexible</option></select></div>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Work Mode</label><select style={inputStyle} value={preferences.workMode} onChange={e=>setPreferences({...preferences, workMode: e.target.value})}><option value="">Select</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}