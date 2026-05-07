import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

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
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', minHeight: '48px', padding: '6px 10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      {selected.map((tag, idx) => (<span key={idx} style={{ backgroundColor: 'rgba(61, 214, 140, 0.15)', color: '#3dd68c', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>{tag} <span onClick={() => onChange(selected.filter(t => t !== tag))} style={{ cursor: 'pointer', color: '#fff' }}>×</span></span>))}
      <input value={inputValue} onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} onKeyDown={handleKeyDown} placeholder={selected.length === 0 ? placeholder : ''} style={{ flex: 1, minWidth: '150px', background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none', padding: '6px' }} />
      {showDropdown && (inputValue || options.length > 0) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, i) => (<div key={i} onClick={() => handleSelect(opt)} style={{ padding: '12px 15px', color: '#d1d5db', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #374151' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#374151'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>{opt}</div>)) : (<div style={{ padding: '12px 15px', color: '#9ca3af', fontSize: '14px', fontStyle: 'italic' }}>Press Enter to add custom</div>)}
        </div>
      )}
    </div>
  );
};

export default function AddProfile() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const cvInputRef = useRef(null);
  const imgInputRef = useRef(null);

  // Updated States for Better UX
  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', dob: '', gender: '', currentLoc: '', prefLoc: '', expYears: '0', expMonths: '0', ctcLakhs: '', ctcThousand: '', expCtcLakhs: '', expCtcThousand: '', notice: '' });
  const [professional, setProfessional] = useState({ headline: '', summary: '', skills: [] });
  const [links, setLinks] = useState({ linkedin: '', github: '', portfolio: '' });
  const [settings, setSettings] = useState({ activeLooking: true, recruiterVis: true });
  const [profileImg, setProfileImg] = useState(null);
  const [uploadedCVName, setUploadedCVName] = useState("");

  const [employments, setEmployments] = useState([]);
  const [educations, setEducations] = useState([]);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);

  const [empForm, setEmpForm] = useState({ company: '', designation: '', joinDate: '', endDate: '', current: false, achievements: '' });
  const [eduForm, setEduForm] = useState({ level: 'Graduation', institute: '', board: '', course: '', year: '', score: '' });

  const skillOptions = ['React.js', 'Next.js', 'Node.js', 'Python', 'SQL', 'Lead Generation', 'Client Acquisition', 'B2B Sales', 'CRM', 'API Integration'];

  const calcCTC = (lakhs, thousands) => {
    const l = parseInt(lakhs || 0) * 100000;
    const t = parseInt(thousands || 0) * 1000;
    return (l + t) || null; // Returns null if 0, prevents DB numeric errors
  };

  const handleSave = async () => {
    if (!basic.name || !basic.mobile) return alert("Please enter Candidate Name and Mobile Number.");
    setSaving(true);

    const payload = {
      candidate_name: basic.name,
      candidate_mobile: basic.mobile,
      candidate_email: basic.email || null,
      dob: basic.dob || null,
      gender: basic.gender || null,
      location: basic.currentLoc || null,
      pref_location: basic.prefLoc || null,
      experience: `${basic.expYears}.${basic.expMonths}`, 
      current_ctc: calcCTC(basic.ctcLakhs, basic.ctcThousand),
      expected_ctc: calcCTC(basic.expCtcLakhs, basic.expCtcThousand),
      notice_period: basic.notice || null,
      headline: professional.headline || null,
      summary: professional.summary || null,
      skills: professional.skills.length > 0 ? professional.skills.join(', ') : null, 
      linkedin_url: links.linkedin || null,
      github_url: links.github || null,
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
      setUploadedCVName(file.name);
      // Dummy auto-fill for UI testing
      setBasic(prev => ({ ...prev, name: file.name.split('.')[0].replace(/_/g, ' ') }));
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

  // --- STYLES WITH WIDER PADDING AND DARK COLOR SCHEME ---
  const inputStyle = { width: '100%', backgroundColor: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '14px', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', colorScheme: 'dark' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' };
  const sectionStyle = { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '35px', marginBottom: '30px' };

  return (
    <Layout>
      <input type="file" accept="image/*" ref={imgInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
      <input type="file" accept=".pdf,.doc,.docx" ref={cvInputRef} onChange={handleCVUpload} style={{ display: 'none' }} />

      <header style={{ height: '75px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', backgroundColor: '#0b0e14', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => router.back()} style={{ background: '#1f2937', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}>←</button>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>Create Professional Profile</div>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {uploadedCVName && <span style={{ color: '#3dd68c', fontSize: '13px', fontWeight: '600', backgroundColor: 'rgba(61, 214, 140, 0.1)', padding: '8px 16px', borderRadius: '8px' }}>📎 {uploadedCVName} Attached</span>}
          <button onClick={() => cvInputRef.current.click()} style={{ backgroundColor: 'transparent', border: '1px solid #3b82f6', color: '#60a5fa', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><span>📄</span> Upload CV (Auto-Fill)</button>
          <button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#3dd68c', border: 'none', color: '#000', padding: '10px 30px', borderRadius: '8px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving to DB...' : 'Save & Build CV'}</button>
        </div>
      </header>

      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: WIDER FORM */}
        <div style={{ flex: 1 }}>
          <div style={sectionStyle}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '25px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>Basic Profile Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Full Name *</label><input style={inputStyle} value={basic.name} onChange={e=>setBasic({...basic, name:e.target.value})} placeholder="e.g. Ashutosh Kumar Mishra" /></div>
              <div><label style={labelStyle}>Mobile Number *</label><input style={inputStyle} value={basic.mobile} onChange={e=>setBasic({...basic, mobile:e.target.value})} placeholder="10-digit number" /></div>
              <div><label style={labelStyle}>Email ID</label><input style={inputStyle} value={basic.email} onChange={e=>setBasic({...basic, email:e.target.value})} placeholder="email@domain.com" /></div>
              <div><label style={labelStyle}>Current Location</label><input style={inputStyle} value={basic.currentLoc} onChange={e=>setBasic({...basic, currentLoc:e.target.value})} placeholder="City" /></div>
              <div><label style={labelStyle}>Preferred Location(s)</label><input style={inputStyle} value={basic.prefLoc} onChange={e=>setBasic({...basic, prefLoc:e.target.value})} placeholder="e.g. Delhi, Remote" /></div>
              <div><label style={labelStyle}>Gender</label><select style={inputStyle} value={basic.gender} onChange={e=>setBasic({...basic, gender:e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
              <div><label style={labelStyle}>Date of Birth</label><input style={inputStyle} type="date" value={basic.dob} onChange={e=>setBasic({...basic, dob:e.target.value})} /></div>
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '25px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Total Experience</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select style={inputStyle} value={basic.expYears} onChange={e=>setBasic({...basic, expYears:e.target.value})}>{Array.from({length: 31}, (_, i) => <option key={i} value={i}>{i} Years</option>)}</select>
                    <select style={inputStyle} value={basic.expMonths} onChange={e=>setBasic({...basic, expMonths:e.target.value})}>{Array.from({length: 12}, (_, i) => <option key={i} value={i}>{i} Months</option>)}</select>
                  </div>
                </div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Notice Period</label><select style={inputStyle} value={basic.notice} onChange={e=>setBasic({...basic, notice:e.target.value})}><option value="">Select</option><option>Immediate</option><option>15 Days</option><option>30 Days</option><option>60 Days</option><option>90+ Days</option></select></div>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '25px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Current CTC (Per Year)</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input style={inputStyle} type="number" placeholder="Lakhs (e.g. 10)" value={basic.ctcLakhs} onChange={e=>setBasic({...basic, ctcLakhs:e.target.value})} />
                    <input style={inputStyle} type="number" placeholder="Thousands (e.g. 50)" value={basic.ctcThousand} onChange={e=>setBasic({...basic, ctcThousand:e.target.value})} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Expected CTC (Per Year)</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input style={inputStyle} type="number" placeholder="Lakhs (e.g. 15)" value={basic.expCtcLakhs} onChange={e=>setBasic({...basic, expCtcLakhs:e.target.value})} />
                    <input style={inputStyle} type="number" placeholder="Thousands (e.g. 0)" value={basic.expCtcThousand} onChange={e=>setBasic({...basic, expCtcThousand:e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '25px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>Professional Headline & Summary</div>
            <div style={{ display: 'grid', gap: '25px' }}>
              <div><label style={labelStyle}>Headline (Very Important) *</label><input style={inputStyle} placeholder="e.g. Full Stack Developer | React | Node.js" value={professional.headline} onChange={e=>setProfessional({...professional, headline:e.target.value})} /></div>
              <div><label style={labelStyle}>Key Skills (10-30 Recommended) *</label><SmartMultiSelect options={skillOptions} selected={professional.skills} onChange={(v) => setProfessional({...professional, skills: v})} placeholder="Type skill & press Enter..." /></div>
              <div><label style={labelStyle}>Profile Summary / About</label><textarea style={{...inputStyle, minHeight: '150px'}} placeholder="Write a solid summary..." value={professional.summary} onChange={e=>setProfessional({...professional, summary:e.target.value})} /></div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>Employment Details</div>
              <button onClick={() => setShowEmpModal(true)} style={{ background: 'rgba(61, 214, 140, 0.1)', color: '#3dd68c', border: '1px solid rgba(61, 214, 140, 0.2)', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ Add Employment</button>
            </div>
            {employments.length === 0 ? <div style={{ padding: '30px', border: '1px dashed #374151', borderRadius: '12px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Click "+ Add Employment" to add history.</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>{employments.map((emp, i) => (<div key={i} style={{ backgroundColor: '#0b0e14', border: '1px solid #374151', padding: '20px', borderRadius: '12px' }}><div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{emp.designation} <span style={{ color: '#9ca3af', fontWeight: '500' }}>at {emp.company}</span></div><div style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>{emp.joinDate} to {emp.current ? 'Present' : emp.endDate}</div></div>))}</div>}
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>Education & Certifications</div>
              <button onClick={() => setShowEduModal(true)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ Add Education</button>
            </div>
            {educations.length === 0 ? <div style={{ padding: '30px', border: '1px dashed #374151', borderRadius: '12px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Add education and certifications.</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>{educations.map((edu, i) => (<div key={i} style={{ backgroundColor: '#0b0e14', border: '1px solid #374151', padding: '20px', borderRadius: '12px' }}><div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{edu.course} ({edu.level})</div><div style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>{edu.institute} • {edu.year} • Score: {edu.score}</div></div>))}</div>}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '30px', position: 'sticky', top: '95px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '30px', textAlign: 'center' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#1f2937', margin: '0 auto 20px', border: profileImg ? 'none' : '2px dashed #4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '35px', cursor: 'pointer', overflow: 'hidden' }}>{profileImg ? <img src={profileImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>Profile Photo</div>
            <button onClick={() => imgInputRef.current.click()} style={{ background: 'var(--bg3)', border: '1px solid #374151', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' }}>Upload Image</button>
          </div>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '30px' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>Online Profiles</div>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div><label style={labelStyle}>LinkedIn URL</label><input style={inputStyle} value={links.linkedin} onChange={e=>setLinks({...links, linkedin:e.target.value})} /></div>
              <div><label style={labelStyle}>GitHub / Portfolio</label><input style={inputStyle} value={links.github} onChange={e=>setLinks({...links, github:e.target.value})} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- EMPLOYMENT MODAL (FIXED HEIGHT/SCROLL/DARK ICONS) --- */}
      {showEmpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '25px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>Add Employment</div>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div><label style={labelStyle}>Company Name *</label><input style={inputStyle} value={empForm.company} onChange={e=>setEmpForm({...empForm, company: e.target.value})} /></div>
              <div><label style={labelStyle}>Designation *</label><input style={inputStyle} value={empForm.designation} onChange={e=>setEmpForm({...empForm, designation: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: '20px' }}><div style={{ flex: 1 }}><label style={labelStyle}>Start Date</label><input type="month" style={inputStyle} value={empForm.joinDate} onChange={e=>setEmpForm({...empForm, joinDate: e.target.value})} /></div><div style={{ flex: 1 }}><label style={labelStyle}>End Date</label><input type="month" style={inputStyle} value={empForm.endDate} disabled={empForm.current} onChange={e=>setEmpForm({...empForm, endDate: e.target.value})} /></div></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#d1d5db', fontSize: '14px', cursor: 'pointer' }}><input type="checkbox" checked={empForm.current} onChange={e=>setEmpForm({...empForm, current: e.target.checked})} style={{width: '18px', height: '18px', accentColor: '#3dd68c'}} /> Currently working here</label>
              <div><label style={labelStyle}>Achievements / Impact</label><textarea style={{...inputStyle, minHeight: '120px'}} value={empForm.achievements} onChange={e=>setEmpForm({...empForm, achievements: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '30px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEmpModal(false)} style={{ background: 'transparent', color: '#9ca3af', border: '1px solid #374151', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button onClick={addEmployment} style={{ background: '#3dd68c', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Save Employment</button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDUCATION MODAL (FIXED ICONS & MONTH TYPE) --- */}
      {showEduModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '700px' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '25px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>Add Education</div>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div><label style={labelStyle}>Level *</label><select style={inputStyle} value={eduForm.level} onChange={e=>setEduForm({...eduForm, level: e.target.value})}><option>10th</option><option>12th</option><option>Graduation</option><option>Post Graduation</option><option>Certification</option></select></div>
              <div><label style={labelStyle}>Institute / University *</label><input style={inputStyle} value={eduForm.institute} onChange={e=>setEduForm({...eduForm, institute: e.target.value})} /></div>
              <div><label style={labelStyle}>Course / Degree *</label><input style={inputStyle} value={eduForm.course} onChange={e=>setEduForm({...eduForm, course: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: '20px' }}><div style={{ flex: 1 }}><label style={labelStyle}>Passing Year & Month</label><input type="month" style={inputStyle} value={eduForm.year} onChange={e=>setEduForm({...eduForm, year: e.target.value})} /></div><div style={{ flex: 1 }}><label style={labelStyle}>Percentage / CGPA</label><input style={inputStyle} value={eduForm.score} onChange={e=>setEduForm({...eduForm, score: e.target.value})} /></div></div>
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '30px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEduModal(false)} style={{ background: 'transparent', color: '#9ca3af', border: '1px solid #374151', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button onClick={addEducation} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Save Education</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}