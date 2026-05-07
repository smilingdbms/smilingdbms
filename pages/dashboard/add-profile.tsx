import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/Layout';

export default function AddProfile() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Hidden File Input Refs
  const cvInputRef = useRef(null);
  const imgInputRef = useRef(null);

  // Basic States
  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', dob: '', gender: '', currentLoc: '', prefLoc: '', exp: '', ctc: '', expCtc: '', notice: '' });
  const [professional, setProfessional] = useState({ headline: '', summary: '', skills: '' });
  const [links, setLinks] = useState({ linkedin: '', github: '', portfolio: '' });
  const [settings, setSettings] = useState({ activeLooking: true, recruiterVis: true });
  const [profileImg, setProfileImg] = useState(null);

  // Dynamic Lists & Modals
  const [employments, setEmployments] = useState([]);
  const [educations, setEducations] = useState([]);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);

  // Temporary Form States for Modals
  const [empForm, setEmpForm] = useState({ company: '', designation: '', joinDate: '', endDate: '', current: false, description: '', achievements: '' });
  const [eduForm, setEduForm] = useState({ level: 'Graduation', institute: '', board: '', course: '', year: '', score: '' });

  // --- HANDLERS ---
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      alert("Mock Save: Profile Data, Employments, and Educations Validated! \n(Next Step: Add these columns to Supabase to save permanently)");
      setSaving(false);
      router.push('/dashboard');
    }, 1000);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImg(URL.createObjectURL(file)); // Show preview
    }
  };

  const handleCVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Mock Auto-Fill Logic
      alert(`Analyzing CV: ${file.name}...\n(In a real backend, AI would extract text here)`);
      setBasic(prev => ({ ...prev, name: file.name.split('.')[0].replace(/_/g, ' '), mobile: '9876543210', email: 'candidate@email.com' }));
      setProfessional(prev => ({ ...prev, skills: 'React, Node.js, SQL, API Integration' }));
    }
  };

  const addEmployment = () => {
    if (!empForm.company || !empForm.designation) return alert("Company & Designation required");
    setEmployments([...employments, empForm]);
    setEmpForm({ company: '', designation: '', joinDate: '', endDate: '', current: false, description: '', achievements: '' });
    setShowEmpModal(false);
  };

  const addEducation = () => {
    if (!eduForm.institute || !eduForm.course) return alert("Institute & Course required");
    setEducations([...educations, eduForm]);
    setEduForm({ level: 'Graduation', institute: '', board: '', course: '', year: '', score: '' });
    setShowEduModal(false);
  };

  // --- STYLES ---
  const inputStyle = { width: '100%', backgroundColor: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' };
  const sectionStyle = { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '30px', marginBottom: '25px' };
  const sectionTitleStyle = { fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' };
  const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' };
  const modalBoxStyle = { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' };

  return (
    <Layout>
      {/* Hidden File Inputs */}
      <input type="file" accept="image/*" ref={imgInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
      <input type="file" accept=".pdf,.doc,.docx" ref={cvInputRef} onChange={handleCVUpload} style={{ display: 'none' }} />

      {/* TOP HEADER */}
      <header style={{ height: '70px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', backgroundColor: '#0b0e14', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => router.back()} style={{ background: 'transparent', border: '1px solid #374151', color: '#9ca3af', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Create New Profile</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => cvInputRef.current.click()} style={{ backgroundColor: 'transparent', border: '1px solid #3b82f6', color: '#60a5fa', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='rgba(59, 130, 246, 0.1)'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>
            <span>📄</span> Upload CV (Auto-Fill)
          </button>
          <button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#3dd68c', border: 'none', color: '#000', padding: '8px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save & Upload Profile'}
          </button>
        </div>
      </header>

      {/* FORM CONTENT */}
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: Main Form Engine */}
        <div style={{ flex: 1 }}>
          
          {/* Basic Profile Information */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Basic Profile Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Full Name *</label><input style={inputStyle} placeholder="e.g. Pravin Sharma" value={basic.name} onChange={e=>setBasic({...basic, name:e.target.value})} /></div>
              <div><label style={labelStyle}>Mobile Number *</label><input style={inputStyle} type="tel" placeholder="10-digit number" value={basic.mobile} onChange={e=>setBasic({...basic, mobile:e.target.value})} /></div>
              <div><label style={labelStyle}>Email ID *</label><input style={inputStyle} type="email" placeholder="email@domain.com" value={basic.email} onChange={e=>setBasic({...basic, email:e.target.value})} /></div>
              <div><label style={labelStyle}>Current Location</label><input style={inputStyle} placeholder="e.g. Mumbai" /></div>
              <div><label style={labelStyle}>Preferred Location(s)</label><input style={inputStyle} placeholder="e.g. Pune, Bangalore, Remote" /></div>
              <div>
                <label style={labelStyle}>Gender</label>
                <select style={inputStyle}><option>Select</option><option>Male</option><option>Female</option><option>Other</option></select>
              </div>
              <div><label style={labelStyle}>Date of Birth</label><input style={inputStyle} type="date" /></div>
              <div>
                <label style={labelStyle}>Total Experience</label>
                <select style={inputStyle}><option>Select Experience</option><option>Fresher</option><option>1-3 Years</option><option>3-5 Years</option><option>5-10 Years</option><option>10+ Years</option></select>
              </div>
              <div>
                <label style={labelStyle}>Notice Period</label>
                <select style={inputStyle}><option>Select</option><option>Immediate</option><option>15 Days</option><option>30 Days</option><option>60+ Days</option></select>
              </div>
              <div><label style={labelStyle}>Current Salary (CTC)</label><input style={inputStyle} placeholder="e.g. 800000" type="number" /></div>
              <div><label style={labelStyle}>Expected Salary</label><input style={inputStyle} placeholder="e.g. 1200000" type="number" /></div>
            </div>
          </div>

          {/* Professional Summary */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Professional Headline & Summary</div>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Headline (Very Important) *</label>
                <input style={inputStyle} placeholder="e.g. Business Development Executive | Lead Generation | Client Acquisition" />
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>Use keywords recruiters search for. Avoid generic terms like "Looking for Job".</div>
              </div>
              <div>
                <label style={labelStyle}>Key Skills (10-30 Recommended) *</label>
                <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} placeholder="e.g. React.js, Next.js, B2B Sales, CRM, Node.js..." value={professional.skills} onChange={e=>setProfessional({...professional, skills:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Profile Summary / About</label>
                <textarea style={{...inputStyle, minHeight: '120px', resize: 'vertical'}} placeholder="Write 5-10 lines about experience, skills, industry, achievements..." />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Employment Details</div>
              <button onClick={() => setShowEmpModal(true)} style={{ background: 'rgba(61, 214, 140, 0.1)', color: '#3dd68c', border: '1px solid rgba(61, 214, 140, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add Employment</button>
            </div>
            
            {employments.length === 0 ? (
              <div style={{ padding: '20px', border: '1px dashed #374151', borderRadius: '8px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                Click "+ Add Employment" to add Company Name, Designation, Duration, and Achievements.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {employments.map((emp, i) => (
                  <div key={i} style={{ backgroundColor: '#0b0e14', border: '1px solid #374151', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{emp.designation} <span style={{ color: '#9ca3af', fontWeight: '500' }}>at {emp.company}</span></div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{emp.joinDate} to {emp.current ? 'Present' : emp.endDate}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education Details */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Education & Certifications</div>
              <button onClick={() => setShowEduModal(true)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add Education</button>
            </div>
            
            {educations.length === 0 ? (
              <div style={{ padding: '20px', border: '1px dashed #374151', borderRadius: '8px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                Add 10th, 12th, Graduation, and relevant certifications.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {educations.map((edu, i) => (
                  <div key={i} style={{ backgroundColor: '#0b0e14', border: '1px solid #374151', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{edu.course} ({edu.level})</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{edu.institute} • {edu.year} • Score: {edu.score}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Settings & Uploads */}
        <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '25px', position: 'sticky', top: '95px' }}>
          
          {/* Profile Photo Upload */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#1f2937', margin: '0 auto 15px', border: profileImg ? 'none' : '2px dashed #4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '30px', cursor: 'pointer', overflow: 'hidden' }}>
              {profileImg ? <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Profile Photo</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '15px' }}>Formal, clear face, plain background</div>
            <button onClick={() => imgInputRef.current.click()} style={{ background: 'var(--bg3)', border: '1px solid #374151', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#374151'} onMouseOut={e=>e.currentTarget.style.backgroundColor='var(--bg3)'}>
              Upload Image
            </button>
          </div>

          {/* Online Profiles */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '15px' }}>Online Profiles</div>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div><label style={labelStyle}>LinkedIn URL</label><input style={inputStyle} placeholder="https://linkedin.com/in/..." /></div>
              <div><label style={labelStyle}>GitHub / Portfolio</label><input style={inputStyle} placeholder="https://..." /></div>
            </div>
          </div>

          {/* Career Settings */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '15px' }}>Career Profile Settings</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}>
              <input type="checkbox" checked={settings.activeLooking} onChange={e=>setSettings({...settings, activeLooking:e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#3dd68c' }} />
              <div style={{ fontSize: '13px', color: '#d1d5db', fontWeight: '500' }}>Actively Looking for Job</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.recruiterVis} onChange={e=>setSettings({...settings, recruiterVis:e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#3dd68c' }} />
              <div style={{ fontSize: '13px', color: '#d1d5db', fontWeight: '500' }}>Visible to Recruiters</div>
            </label>
          </div>

        </div>
      </div>

      {/* --- EMPLOYMENT MODAL --- */}
      {showEmpModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>Add Employment</div>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div><label style={labelStyle}>Company Name *</label><input style={inputStyle} value={empForm.company} onChange={e=>setEmpForm({...empForm, company: e.target.value})} /></div>
              <div><label style={labelStyle}>Designation *</label><input style={inputStyle} value={empForm.designation} onChange={e=>setEmpForm({...empForm, designation: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Start Date</label><input type="month" style={inputStyle} value={empForm.joinDate} onChange={e=>setEmpForm({...empForm, joinDate: e.target.value})} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>End Date</label><input type="month" style={inputStyle} value={empForm.endDate} disabled={empForm.current} onChange={e=>setEmpForm({...empForm, endDate: e.target.value})} /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d1d5db', fontSize: '13px' }}><input type="checkbox" checked={empForm.current} onChange={e=>setEmpForm({...empForm, current: e.target.checked})} /> Currently working here</label>
              <div><label style={labelStyle}>Achievements / Impact</label><textarea style={{...inputStyle, minHeight: '80px'}} placeholder="e.g. Generated 50+ leads..." value={empForm.achievements} onChange={e=>setEmpForm({...empForm, achievements: e.target.value})} /></div>
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
          <div style={modalBoxStyle}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>Add Education / Certification</div>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div><label style={labelStyle}>Level *</label><select style={inputStyle} value={eduForm.level} onChange={e=>setEduForm({...eduForm, level: e.target.value})}><option>10th</option><option>12th</option><option>Graduation</option><option>Post Graduation</option><option>Certification</option></select></div>
              <div><label style={labelStyle}>Institute / University *</label><input style={inputStyle} value={eduForm.institute} onChange={e=>setEduForm({...eduForm, institute: e.target.value})} /></div>
              <div><label style={labelStyle}>Course / Degree *</label><input style={inputStyle} placeholder="e.g. B.Tech Computer Science" value={eduForm.course} onChange={e=>setEduForm({...eduForm, course: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Passing Year</label><input type="number" style={inputStyle} placeholder="YYYY" value={eduForm.year} onChange={e=>setEduForm({...eduForm, year: e.target.value})} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Percentage / CGPA</label><input style={inputStyle} value={eduForm.score} onChange={e=>setEduForm({...eduForm, score: e.target.value})} /></div>
              </div>
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