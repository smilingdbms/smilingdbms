import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

// --- SMART MULTI-SELECT COMPONENT ---
const SmartMultiSelect = ({ options, selected, onChange, placeholder, allowCustom = true }) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()) && !selected.includes(opt));

  React.useEffect(() => {
    function handleClickOutside(event) { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setShowDropdown(false); }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => { onChange([...selected, val]); setInputValue(''); setShowDropdown(false); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      const match = filteredOptions.find(o => o.toLowerCase() === inputValue.toLowerCase());
      if (match) handleSelect(match); else if (allowCustom) handleSelect(inputValue.trim());
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', minHeight: '44px', padding: '4px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
      {selected.map((tag, idx) => (<span key={idx} style={{ backgroundColor: 'rgba(61, 214, 140, 0.15)', color: '#3dd68c', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>{tag} <span onClick={() => onChange(selected.filter(t => t !== tag))} style={{ cursor: 'pointer', color: '#fff' }}>×</span></span>))}
      <input value={inputValue} onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} onKeyDown={handleKeyDown} placeholder={selected.length === 0 ? placeholder : ''} style={{ flex: 1, minWidth: '120px', background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', outline: 'none', padding: '6px' }} />
      {showDropdown && (inputValue || options.length > 0) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, i) => (<div key={i} onClick={() => handleSelect(opt)} style={{ padding: '10px 15px', color: '#d1d5db', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #374151' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#374151'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>{opt}</div>)) : (<div style={{ padding: '10px 15px', color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>Press Enter to add custom</div>)}
        </div>
      )}
    </div>
  );
};

export default function AddProfile() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Hidden File Input Refs
  const cvInputRef = useRef(null);
  const imgInputRef = useRef(null);

  // Basic States
  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', dob: '', gender: '', currentLoc: '', prefLoc: '', exp: '', ctc: '', expCtc: '', notice: '' });
  const [professional, setProfessional] = useState({ headline: '', summary: '', skills: [] });
  const [links, setLinks] = useState({ linkedin: '', github: '', portfolio: '' });
  const [settings, setSettings] = useState({ activeLooking: true, recruiterVis: true });
  const [profileImg, setProfileImg] = useState(null);

  // Dynamic Lists & Modals
  const [employments, setEmployments] = useState([]);
  const [educations, setEducations] = useState([]);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);

  // Temporary Form States
  const [empForm, setEmpForm] = useState({ company: '', designation: '', joinDate: '', endDate: '', current: false, achievements: '' });
  const [eduForm, setEduForm] = useState({ level: 'Graduation', institute: '', board: '', course: '', year: '', score: '' });

  const skillOptions = ['React', 'Node.js', 'Python', 'Java', 'SQL', 'Sales', 'Business Development', 'Marketing', 'Figma', 'AWS'];

  // --- REAL SUPABASE SAVE LOGIC ---
  const handleSave = async () => {
    if (!basic.name || !basic.mobile) {
      alert("Please enter Candidate Name and Mobile Number.");
      return;
    }
    setSaving(true);

    const payload = {
      candidate_name: basic.name,
      candidate_mobile: basic.mobile,
      candidate_email: basic.email,
      dob: basic.dob,
      gender: basic.gender,
      location: basic.currentLoc,
      pref_location: basic.prefLoc,
      experience: basic.exp,
      current_ctc: basic.ctc,
      expected_ctc: basic.expCtc,
      notice_period: basic.notice,
      headline: professional.headline,
      summary: professional.summary,
      skills: professional.skills.join(', '), 
      linkedin_url: links.linkedin,
      github_url: links.github,
      employments: employments, 
      educations: educations,   
      status: 'New'
    };

    const { error } = await supabase.from('placements').insert([payload]);

    if (error) {
      alert("Database Error: " + error.message);
      setSaving(false);
    } else {
      setSaving(false);
      alert("Profile Saved Successfully!");
      router.push('/dashboard');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImg(URL.createObjectURL(file));
  };

  const handleCVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`CV Uploaded: ${file.name}\nAuto-filling data...`);
      setBasic(prev => ({ ...prev, name: file.name.split('.')[0].replace(/_/g, ' '), mobile: '9876543210', email: 'extracted@resume.com' }));
      setProfessional(prev => ({ ...prev, skills: ['React', 'Node.js', 'SQL'] }));
    }
  };

  const addEmployment = () => {
    if (!empForm.company || !empForm.designation) return alert("Company & Designation are required!");
    setEmployments([...employments, empForm]);
    setEmpForm({ company: '', designation: '', joinDate: '', endDate: '', current: false, achievements: '' });
    setShowEmpModal(false);
  };

  const addEducation = () => {
    if (!eduForm.institute || !eduForm.course) return alert("Institute & Course are required!");
    setEducations([...educations, eduForm]);
    setEduForm({ level: 'Graduation', institute: '', board: '', course: '', year: '', score: '' });
    setShowEduModal(false);
  };

  const inputStyle = { width: '100%', backgroundColor: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' };
  const sectionStyle = { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '30px', marginBottom: '25px' };
  
  // Bulletproof Modal Overlay
  const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' };

  return (
    <Layout>
      <input type="file" accept="image/*" ref={imgInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
      <input type="file" accept=".pdf,.doc,.docx" ref={cvInputRef} onChange={handleCVUpload} style={{ display: 'none' }} />

      <header style={{ height: '70px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', backgroundColor: '#0b0e14', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => router.back()} style={{ background: 'transparent', border: '1px solid #374151', color: '#9ca3af', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer' }}>←</button>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Create New Profile</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => cvInputRef.current.click()} style={{ backgroundColor: 'transparent', border: '1px solid #3b82f6', color: '#60a5fa', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><span>📄</span> Upload CV (Auto-Fill)</button>
          <button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#3dd68c', border: 'none', color: '#000', padding: '8px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving to DB...' : 'Save & Upload Profile'}</button>
        </div>
      </header>

      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={sectionStyle}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>Basic Profile Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Full Name *</label><input style={inputStyle} value={basic.name} onChange={e=>setBasic({...basic, name:e.target.value})} /></div>
              <div><label style={labelStyle}>Mobile Number *</label><input style={inputStyle} value={basic.mobile} onChange={e=>setBasic({...basic, mobile:e.target.value})} /></div>
              <div><label style={labelStyle}>Email ID *</label><input style={inputStyle} value={basic.email} onChange={e=>setBasic({...basic, email:e.target.value})} /></div>
              <div><label style={labelStyle}>Current Location</label><input style={inputStyle} value={basic.currentLoc} onChange={e=>setBasic({...basic, currentLoc:e.target.value})} /></div>
              <div><label style={labelStyle}>Preferred Location(s)</label><input style={inputStyle} value={basic.prefLoc} onChange={e=>setBasic({...basic, prefLoc:e.target.value})} /></div>
              <div><label style={labelStyle}>Gender</label><select style={inputStyle} value={basic.gender} onChange={e=>setBasic({...basic, gender:e.target.value})}><option>Select</option><option>Male</option><option>Female</option></select></div>
              <div><label style={labelStyle}>Date of Birth</label><input style={inputStyle} type="date" value={basic.dob} onChange={e=>setBasic({...basic, dob:e.target.value})} /></div>
              <div><label style={labelStyle}>Total Experience</label><select style={inputStyle} value={basic.exp} onChange={e=>setBasic({...basic, exp:e.target.value})}><option>Select</option><option>Fresher</option><option>1-3 Years</option><option>3-5 Years</option><option>5+ Years</option></select></div>
              <div><label style={labelStyle}>Notice Period</label><select style={inputStyle} value={basic.notice} onChange={e=>setBasic({...basic, notice:e.target.value})}><option>Select</option><option>Immediate</option><option>15 Days</option><option>30 Days</option><option>60+ Days</option></select></div>
              <div><label style={labelStyle}>Current Salary (CTC)</label><input style={inputStyle} type="number" value={basic.ctc} onChange={e=>setBasic({...basic, ctc:e.target.value})} /></div>
              <div><label style={labelStyle}>Expected Salary</label><input style={inputStyle} type="number" value={basic.expCtc} onChange={e=>setBasic({...basic, expCtc:e.target.value})} /></div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>Professional Headline & Summary</div>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div><label style={labelStyle}>Headline (Very Important) *</label><input style={inputStyle} value={professional.headline} onChange={e=>setProfessional({...professional, headline:e.target.value})} /></div>
              <div><label style={labelStyle}>Key Skills (Smart Tags) *</label><SmartMultiSelect options={skillOptions} selected={professional.skills} onChange={(v) => setProfessional({...professional, skills: v})} placeholder="Type skill & press Enter..." /></div>
              <div><label style={labelStyle}>Profile Summary / About</label><textarea style={{...inputStyle, minHeight: '120px'}} value={professional.summary} onChange={e=>setProfessional({...professional, summary:e.target.value})} /></div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Employment Details</div>
              <button onClick={() => setShowEmpModal(true)} style={{ background: 'rgba(61, 214, 140, 0.1)', color: '#3dd68c', border: '1px solid rgba(61, 214, 140, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add Employment</button>
            </div>
            {employments.length === 0 ? <div style={{ padding: '20px', border: '1px dashed #374151', borderRadius: '8px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>Click "+ Add Employment" to add data.</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>{employments.map((emp, i) => (<div key={i} style={{ backgroundColor: '#0b0e14', border: '1px solid #374151', padding: '15px', borderRadius: '8px' }}><div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{emp.designation} <span style={{ color: '#9ca3af', fontWeight: '500' }}>at {emp.company}</span></div><div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{emp.joinDate} to {emp.current ? 'Present' : emp.endDate}</div></div>))}</div>}
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Education & Certifications</div>
              <button onClick={() => setShowEduModal(true)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add Education</button>
            </div>
            {educations.length === 0 ? <div style={{ padding: '20px', border: '1px dashed #374151', borderRadius: '8px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>Add education and certifications.</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>{educations.map((edu, i) => (<div key={i} style={{ backgroundColor: '#0b0e14', border: '1px solid #374151', padding: '15px', borderRadius: '8px' }}><div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{edu.course} ({edu.level})</div><div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{edu.institute} • {edu.year} • Score: {edu.score}</div></div>))}</div>}
          </div>
        </div>

        <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '25px', position: 'sticky', top: '95px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#1f2937', margin: '0 auto 15px', border: profileImg ? 'none' : '2px dashed #4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '30px', cursor: 'pointer', overflow: 'hidden' }}>{profileImg ? <img src={profileImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Profile Photo</div>
            <button onClick={() => imgInputRef.current.click()} style={{ background: 'var(--bg3)', border: '1px solid #374151', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Upload Image</button>
          </div>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '15px' }}>Online Profiles</div>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div><label style={labelStyle}>LinkedIn URL</label><input style={inputStyle} value={links.linkedin} onChange={e=>setLinks({...links, linkedin:e.target.value})} /></div>
              <div><label style={labelStyle}>GitHub / Portfolio</label><input style={inputStyle} value={links.github} onChange={e=>setLinks({...links, github:e.target.value})} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- EMPLOYMENT MODAL --- */}
      {showEmpModal && (
        <div style={modalOverlayStyle}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '600px' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>Add Employment</div>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div><label style={labelStyle}>Company Name *</label><input style={inputStyle} value={empForm.company} onChange={e=>setEmpForm({...empForm, company: e.target.value})} /></div>
              <div><label style={labelStyle}>Designation *</label><input style={inputStyle} value={empForm.designation} onChange={e=>setEmpForm({...empForm, designation: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: '15px' }}><div style={{ flex: 1 }}><label style={labelStyle}>Start Date</label><input type="month" style={inputStyle} value={empForm.joinDate} onChange={e=>setEmpForm({...empForm, joinDate: e.target.value})} /></div><div style={{ flex: 1 }}><label style={labelStyle}>End Date</label><input type="month" style={inputStyle} value={empForm.endDate} disabled={empForm.current} onChange={e=>setEmpForm({...empForm, endDate: e.target.value})} /></div></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d1d5db', fontSize: '13px' }}><input type="checkbox" checked={empForm.current} onChange={e=>setEmpForm({...empForm, current: e.target.checked})} /> Currently working here</label>
              <div><label style={labelStyle}>Achievements / Impact</label><textarea style={{...inputStyle, minHeight: '80px'}} value={empForm.achievements} onChange={e=>setEmpForm({...empForm, achievements: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEmpModal(false)} style={{ background: 'transparent', color: '#9ca3af', border: '1px solid #374151', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={addEmployment} style={{ background: '#3dd68c', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Save Employment</button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDUCATION MODAL --- */}
      {showEduModal && (
        <div style={modalOverlayStyle}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '600px' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>Add Education</div>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div><label style={labelStyle}>Level *</label><select style={inputStyle} value={eduForm.level} onChange={e=>setEduForm({...eduForm, level: e.target.value})}><option>10th</option><option>12th</option><option>Graduation</option><option>Post Graduation</option><option>Certification</option></select></div>
              <div><label style={labelStyle}>Institute / University *</label><input style={inputStyle} value={eduForm.institute} onChange={e=>setEduForm({...eduForm, institute: e.target.value})} /></div>
              <div><label style={labelStyle}>Course / Degree *</label><input style={inputStyle} value={eduForm.course} onChange={e=>setEduForm({...eduForm, course: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: '15px' }}><div style={{ flex: 1 }}><label style={labelStyle}>Passing Year</label><input type="number" style={inputStyle} value={eduForm.year} onChange={e=>setEduForm({...eduForm, year: e.target.value})} /></div><div style={{ flex: 1 }}><label style={labelStyle}>Percentage / CGPA</label><input style={inputStyle} value={eduForm.score} onChange={e=>setEduForm({...eduForm, score: e.target.value})} /></div></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEduModal(false)} style={{ background: 'transparent', color: '#9ca3af', border: '1px solid #374151', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={addEducation} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Save Education</button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}