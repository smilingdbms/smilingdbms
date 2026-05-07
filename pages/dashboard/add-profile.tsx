import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

export default function AddProfile() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const cvInputRef = useRef(null);
  const imgInputRef = useRef(null);

  // --- ALL STATES BASED ON YOUR EXACT REQUIREMENTS ---
  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', currentLoc: '', prefLoc: '', gender: '', dob: '', expYears: '0', expMonths: '0', ctcLakhs: '', ctcThousand: '', expCtcLakhs: '', expCtcThousand: '', notice: '' });
  const [professional, setProfessional] = useState({ headline: '', skills: '', summary: '' });
  const [preferences, setPreferences] = useState({ role: '', industry: '', empType: '', shift: '', workMode: '' });
  const [links, setLinks] = useState({ linkedin: '', github: '', portfolio: '' });
  const [profileImg, setProfileImg] = useState(null);
  const [uploadedCVName, setUploadedCVName] = useState("");
  const [cvUrl, setCvUrl] = useState("");

  // Lists & Modals
  const [employments, setEmployments] = useState([]);
  const [educations, setEducations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);

  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [showProjModal, setShowProjModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const [empForm, setEmpForm] = useState({ company: '', designation: '', joinDate: '', endDate: '', current: false, description: '', achievements: '' });
  const [eduForm, setEduForm] = useState({ level: '', institute: '', course: '', year: '', score: '' });
  const [projForm, setProjForm] = useState({ title: '', tech: '', description: '', role: '', duration: '' });
  const [certForm, setCertForm] = useState({ name: '', institute: '', date: '' });

  // --- AI CV PARSING LOGIC ---
  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedCVName("Reading with AI & Saving to Drive... ⏳");
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-cv', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setCvUrl(data.cv_url);
      setBasic(prev => ({ 
        ...prev, 
        name: data.name || prev.name, 
        mobile: data.mobile || prev.mobile, 
        email: data.email || prev.email, 
        currentLoc: data.location || prev.currentLoc, 
        expYears: data.experienceYears?.toString() || prev.expYears,
        notice: data.noticePeriod || prev.notice
      }));
      setProfessional(prev => ({ 
        ...prev, 
        headline: data.headline || prev.headline, 
        skills: data.skills || prev.skills,
        summary: data.summary || prev.summary
      }));
      setUploadedCVName("✅ CV Auto-Fill Success!");
    } catch (err) {
      alert("AI Parsing Failed: Check if Google Credentials/Gemini Key are correct in Vercel. Error: " + err.message);
      setUploadedCVName("❌ Parsing Failed");
    }
  };

  // --- REAL DATABASE SAVE LOGIC ---
  const handleSave = async () => {
    if (!basic.name || !basic.mobile) return alert("Please enter at least Full Name and Mobile Number!");
    setSaving(true);

    const currentCtc = (parseInt(basic.ctcLakhs || 0) * 100000) + (parseInt(basic.ctcThousand || 0) * 1000);
    const expectedCtc = (parseInt(basic.expCtcLakhs || 0) * 100000) + (parseInt(basic.expCtcThousand || 0) * 1000);

    const { error } = await supabase.from('placements').insert([{
      candidate_name: basic.name,
      candidate_mobile: basic.mobile,
      candidate_email: basic.email,
      gender: basic.gender,
      location: basic.currentLoc,
      pref_location: basic.prefLoc,
      dob: basic.dob,
      experience: `${basic.expYears}.${basic.expMonths}`,
      current_ctc: currentCtc || null,
      expected_ctc: expectedCtc || null,
      notice_period: basic.notice,
      headline: professional.headline,
      summary: professional.summary,
      skills: professional.skills,
      linkedin_url: links.linkedin,
      github_url: links.github,
      portfolio_url: links.portfolio,
      employments: employments,
      educations: educations,
      projects: projects,
      certifications: certifications,
      preferences: preferences,
      resume_url: cvUrl,
      status: 'New'
    }]);

    if (error) {
      alert("Database Save Error: " + error.message);
    } else {
      alert("Profile Created Successfully!");
      router.push('/dashboard');
    }
    setSaving(false);
  };

  // --- MODAL HANDLERS ---
  const addData = (type) => {
    if(type === 'emp') { setEmployments([...employments, empForm]); setEmpForm({ company: '', designation: '', joinDate: '', endDate: '', current: false, description: '', achievements: '' }); setShowEmpModal(false); }
    if(type === 'edu') { setEducations([...educations, eduForm]); setEduForm({ level: '', institute: '', course: '', year: '', score: '' }); setShowEduModal(false); }
    if(type === 'proj') { setProjects([...projects, projForm]); setProjForm({ title: '', tech: '', description: '', role: '', duration: '' }); setShowProjModal(false); }
    if(type === 'cert') { setCertifications([...certifications, certForm]); setCertForm({ name: '', institute: '', date: '' }); setShowCertModal(false); }
  };

  // --- STYLES ---
  const inputStyle = { width: '100%', backgroundColor: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '14px', borderRadius: '8px', fontSize: '14px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const sectionStyle = { backgroundColor: '#111827', padding: '30px', borderRadius: '16px', border: '1px solid #1f2937', marginBottom: '30px' };
  const headerStyle = { color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '25px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' };

  return (
    <Layout>
      <header style={{ padding: '20px 40px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0b0e14', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ color: '#fff', fontSize: '24px', margin: 0 }}>Create Candidate Profile</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button type="button" onClick={() => cvInputRef.current.click()} style={{ padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', background: '#1f2937', color: '#60a5fa', border: '1px solid #3b82f6', fontWeight: '700' }}>
            {uploadedCVName || "📄 Upload CV (Auto-Fill)"}
          </button>
          <button type="button" onClick={handleSave} disabled={saving} style={{ padding: '12px 30px', borderRadius: '8px', cursor: 'pointer', background: '#3dd68c', color: '#000', border: 'none', fontWeight: '800' }}>
            {saving ? "Saving to Database..." : "Save Profile"}
          </button>
        </div>
      </header>

      <input type="file" ref={cvInputRef} onChange={handleCVUpload} style={{ display: 'none' }} accept=".pdf,.doc,.docx" />
      <input type="file" ref={imgInputRef} onChange={(e) => setProfileImg(URL.createObjectURL(e.target.files[0]))} style={{ display: 'none' }} accept="image/*" />

      <div style={{ padding: '40px', maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px' }}>
        
        {/* LEFT COLUMN - MAIN FORM */}
        <div>
          {/* BASIC INFO */}
          <div style={sectionStyle}>
            <h2 style={headerStyle}>Personal & Basic Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Full Name *</label><input style={inputStyle} value={basic.name} onChange={e=>setBasic({...basic, name: e.target.value})} placeholder="e.g. Pravin Sharma" /></div>
              <div><label style={labelStyle}>Mobile Number *</label><input style={inputStyle} value={basic.mobile} onChange={e=>setBasic({...basic, mobile: e.target.value})} /></div>
              <div><label style={labelStyle}>Email ID</label><input style={inputStyle} value={basic.email} onChange={e=>setBasic({...basic, email: e.target.value})} /></div>
              <div><label style={labelStyle}>Current Location</label><input style={inputStyle} value={basic.currentLoc} onChange={e=>setBasic({...basic, currentLoc: e.target.value})} /></div>
              <div><label style={labelStyle}>Preferred Location(s)</label><input style={inputStyle} value={basic.prefLoc} onChange={e=>setBasic({...basic, prefLoc: e.target.value})} /></div>
              <div><label style={labelStyle}>Gender</label><select style={inputStyle} value={basic.gender} onChange={e=>setBasic({...basic, gender: e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
              <div><label style={labelStyle}>Date of Birth</label><input type="date" style={inputStyle} value={basic.dob} onChange={e=>setBasic({...basic, dob: e.target.value})} /></div>
              <div><label style={labelStyle}>Total Experience</label><div style={{display:'flex', gap:'10px'}}><select style={inputStyle} value={basic.expYears} onChange={e=>setBasic({...basic, expYears: e.target.value})}>{Array.from({length:30},(_,i)=><option key={i} value={i}>{i} Yrs</option>)}</select><select style={inputStyle} value={basic.expMonths} onChange={e=>setBasic({...basic, expMonths: e.target.value})}>{Array.from({length:12},(_,i)=><option key={i} value={i}>{i} Mos</option>)}</select></div></div>
              <div><label style={labelStyle}>Notice Period</label><select style={inputStyle} value={basic.notice} onChange={e=>setBasic({...basic, notice: e.target.value})}><option value="">Select</option><option>Immediate</option><option>15 Days</option><option>30 Days</option><option>60 Days</option><option>90+ Days</option></select></div>
              <div><label style={labelStyle}>Current Salary (CTC)</label><div style={{display:'flex', gap:'10px'}}><input style={inputStyle} placeholder="Lakhs" value={basic.ctcLakhs} onChange={e=>setBasic({...basic, ctcLakhs: e.target.value})}/><input style={inputStyle} placeholder="Thousands" value={basic.ctcThousand} onChange={e=>setBasic({...basic, ctcThousand: e.target.value})}/></div></div>
              <div><label style={labelStyle}>Expected Salary</label><div style={{display:'flex', gap:'10px'}}><input style={inputStyle} placeholder="Lakhs" value={basic.expCtcLakhs} onChange={e=>setBasic({...basic, expCtcLakhs: e.target.value})}/><input style={inputStyle} placeholder="Thousands" value={basic.expCtcThousand} onChange={e=>setBasic({...basic, expCtcThousand: e.target.value})}/></div></div>
            </div>
          </div>

          {/* PROFESSIONAL SUMMARY */}
          <div style={sectionStyle}>
            <h2 style={headerStyle}>Professional Summary</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div><label style={labelStyle}>Headline (Very Important)</label><input style={inputStyle} value={professional.headline} onChange={e=>setProfessional({...professional, headline: e.target.value})} placeholder="e.g. Full Stack Developer | React | Node.js" /></div>
              <div><label style={labelStyle}>Key Skills (10-30 Relevant Skills)</label><textarea style={{...inputStyle, height: '100px'}} value={professional.skills} onChange={e=>setProfessional({...professional, skills: e.target.value})} placeholder="e.g. Lead Generation, Client Acquisition, SQL, React.js" /></div>
              <div><label style={labelStyle}>Profile Summary / About</label><textarea style={{...inputStyle, height: '120px'}} value={professional.summary} onChange={e=>setProfessional({...professional, summary: e.target.value})} placeholder="Write 5-10 lines about experience, achievements, and career goals..." /></div>
            </div>
          </div>

          {/* DYNAMIC LISTS (EMP, EDU, PROJ, CERT) */}
          <div style={sectionStyle}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', margin: 0 }}>Work History & Education</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button type="button" onClick={() => setShowEmpModal(true)} style={{ background: '#1f2937', color: '#60a5fa', border: '1px solid #374151', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>+ Add Employment</button>
                  <button type="button" onClick={() => setShowEduModal(true)} style={{ background: '#1f2937', color: '#3dd68c', border: '1px solid #374151', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>+ Add Education</button>
                </div>
             </div>
             
             {/* Render Added Lists Here briefly */}
             <div style={{ marginBottom: '20px' }}>
                {employments.map((emp, i) => <div key={i} style={{ padding: '15px', background: '#0b0e14', border: '1px solid #374151', borderRadius: '8px', marginBottom: '10px', color: '#fff' }}><strong>{emp.designation}</strong> at {emp.company} ({emp.joinDate} - {emp.current ? 'Present' : emp.endDate})</div>)}
                {educations.map((edu, i) => <div key={i} style={{ padding: '15px', background: '#0b0e14', border: '1px solid #374151', borderRadius: '8px', marginBottom: '10px', color: '#fff' }}><strong>{edu.course} ({edu.level})</strong> from {edu.institute} ({edu.year})</div>)}
             </div>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #1f2937', paddingBottom: '15px', marginTop: '40px' }}>
                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', margin: 0 }}>Projects & Certifications</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button type="button" onClick={() => setShowProjModal(true)} style={{ background: '#1f2937', color: '#a78bfa', border: '1px solid #374151', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>+ Add Project</button>
                  <button type="button" onClick={() => setShowCertModal(true)} style={{ background: '#1f2937', color: '#fb923c', border: '1px solid #374151', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>+ Add Certificate</button>
                </div>
             </div>
             <div>
                {projects.map((proj, i) => <div key={i} style={{ padding: '15px', background: '#0b0e14', border: '1px solid #374151', borderRadius: '8px', marginBottom: '10px', color: '#fff' }}><strong>{proj.title}</strong> - {proj.tech}</div>)}
                {certifications.map((cert, i) => <div key={i} style={{ padding: '15px', background: '#0b0e14', border: '1px solid #374151', borderRadius: '8px', marginBottom: '10px', color: '#fff' }}><strong>{cert.name}</strong> from {cert.institute} ({cert.date})</div>)}
             </div>
          </div>

          {/* PREFERRED JOB DETAILS */}
          <div style={sectionStyle}>
            <h2 style={headerStyle}>Preferred Job Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div><label style={labelStyle}>Desired Role</label><input style={inputStyle} value={preferences.role} onChange={e=>setPreferences({...preferences, role: e.target.value})} placeholder="e.g. Backend Developer" /></div>
              <div><label style={labelStyle}>Preferred Industry</label><input style={inputStyle} value={preferences.industry} onChange={e=>setPreferences({...preferences, industry: e.target.value})} placeholder="e.g. IT Services, Recruitment" /></div>
              <div><label style={labelStyle}>Employment Type</label><select style={inputStyle} value={preferences.empType} onChange={e=>setPreferences({...preferences, empType: e.target.value})}><option value="">Select</option><option>Full Time</option><option>Contract</option><option>Freelance</option></select></div>
              <div><label style={labelStyle}>Work Mode</label><select style={inputStyle} value={preferences.workMode} onChange={e=>setPreferences({...preferences, workMode: e.target.value})}><option value="">Select</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* PHOTO UPLOAD */}
          <div style={{ ...sectionStyle, textAlign: 'center' }}>
            <div style={{ width: '130px', height: '130px', borderRadius: '50%', backgroundColor: '#1f2937', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: profileImg ? 'none' : '2px dashed #4b5563' }}>
              {profileImg ? <img src={profileImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '40px' }}>👤</span>}
            </div>
            <button type="button" onClick={() => imgInputRef.current.click()} style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Upload Profile Photo</button>
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '15px' }}>Formal, clear face, plain background</p>
          </div>

          {/* ONLINE PROFILES */}
          <div style={sectionStyle}>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Online Profiles</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div><label style={labelStyle}>LinkedIn URL</label><input style={inputStyle} value={links.linkedin} onChange={e=>setLinks({...links, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." /></div>
              <div><label style={labelStyle}>GitHub / Behance</label><input style={inputStyle} value={links.github} onChange={e=>setLinks({...links, github: e.target.value})} placeholder="https://github.com/..." /></div>
              <div><label style={labelStyle}>Portfolio Website</label><input style={inputStyle} value={links.portfolio} onChange={e=>setLinks({...links, portfolio: e.target.value})} placeholder="https://yourwebsite.com" /></div>
            </div>
          </div>

          {/* SYSTEM SETTINGS */}
          <div style={sectionStyle}>
             <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Career Profile Settings</h2>
             <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#d1d5db', fontSize: '14px', marginBottom: '15px' }}><input type="checkbox" defaultChecked style={{width: '18px', height: '18px', accentColor: '#3dd68c'}} /> Actively Looking for Job</label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#d1d5db', fontSize: '14px' }}><input type="checkbox" defaultChecked style={{width: '18px', height: '18px', accentColor: '#3dd68c'}} /> Visible to Recruiters</label>
          </div>
        </div>
      </div>

      {/* --- ALL MODALS COMPONENTS --- */}
      
      {showEmpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111827', padding: '30px', borderRadius: '16px', width: '500px', border: '1px solid #374151' }}>
            <h2 style={headerStyle}>Add Employment</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              <input placeholder="Company Name" style={inputStyle} onChange={e=>setEmpForm({...empForm, company: e.target.value})} />
              <input placeholder="Designation" style={inputStyle} onChange={e=>setEmpForm({...empForm, designation: e.target.value})} />
              <div style={{display:'flex', gap:'10px'}}><input type="text" placeholder="Joining Date (e.g. Jan 2020)" style={inputStyle} onChange={e=>setEmpForm({...empForm, joinDate: e.target.value})}/><input type="text" placeholder="End Date" style={inputStyle} disabled={empForm.current} onChange={e=>setEmpForm({...empForm, endDate: e.target.value})}/></div>
              <label style={{color: '#fff', fontSize: '14px'}}><input type="checkbox" onChange={e=>setEmpForm({...empForm, current: e.target.checked})} /> Currently Working Here</label>
              <textarea placeholder="Job Description / Achievements (e.g. Generated 50+ leads)" style={{...inputStyle, height: '80px'}} onChange={e=>setEmpForm({...empForm, achievements: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowEmpModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: '#fff', border: '1px solid #374151' }}>Cancel</button>
              <button type="button" onClick={() => addData('emp')} style={{ flex: 1, background: '#3dd68c', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showEduModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111827', padding: '30px', borderRadius: '16px', width: '500px', border: '1px solid #374151' }}>
            <h2 style={headerStyle}>Add Education</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              <select style={inputStyle} onChange={e=>setEduForm({...eduForm, level: e.target.value})}><option value="">Select Level</option><option>10th</option><option>12th</option><option>Diploma/Graduation</option><option>Post Graduation</option></select>
              <input placeholder="Institute / Board / University Name" style={inputStyle} onChange={e=>setEduForm({...eduForm, institute: e.target.value})} />
              <input placeholder="Course / Degree" style={inputStyle} onChange={e=>setEduForm({...eduForm, course: e.target.value})} />
              <div style={{display:'flex', gap:'10px'}}><input type="text" placeholder="Year" style={inputStyle} onChange={e=>setEduForm({...eduForm, year: e.target.value})}/><input type="text" placeholder="Percentage/CGPA" style={inputStyle} onChange={e=>setEduForm({...eduForm, score: e.target.value})}/></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowEduModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: '#fff', border: '1px solid #374151' }}>Cancel</button>
              <button type="button" onClick={() => addData('edu')} style={{ flex: 1, background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showProjModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111827', padding: '30px', borderRadius: '16px', width: '500px', border: '1px solid #374151' }}>
            <h2 style={headerStyle}>Add Project</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              <input placeholder="Project Title" style={inputStyle} onChange={e=>setProjForm({...projForm, title: e.target.value})} />
              <input placeholder="Technologies Used (e.g. Next.js, SQL)" style={inputStyle} onChange={e=>setProjForm({...projForm, tech: e.target.value})} />
              <textarea placeholder="Description & Your Role" style={{...inputStyle, height: '80px'}} onChange={e=>setProjForm({...projForm, description: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowProjModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: '#fff', border: '1px solid #374151' }}>Cancel</button>
              <button type="button" onClick={() => addData('proj')} style={{ flex: 1, background: '#a78bfa', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showCertModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111827', padding: '30px', borderRadius: '16px', width: '500px', border: '1px solid #374151' }}>
            <h2 style={headerStyle}>Add Certification</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              <input placeholder="Certificate Name" style={inputStyle} onChange={e=>setCertForm({...certForm, name: e.target.value})} />
              <input placeholder="Institute (e.g. Google, Coursera)" style={inputStyle} onChange={e=>setCertForm({...certForm, institute: e.target.value})} />
              <input placeholder="Completion Date" type="month" style={inputStyle} onChange={e=>setCertForm({...certForm, date: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowCertModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: '#fff', border: '1px solid #374151' }}>Cancel</button>
              <button type="button" onClick={() => addData('cert')} style={{ flex: 1, background: '#fb923c', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}