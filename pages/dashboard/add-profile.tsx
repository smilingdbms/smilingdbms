import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

export default function AddProfile() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const cvInputRef = useRef(null);
  const imgInputRef = useRef(null);

  // States for all fields
  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', dob: '', gender: '', currentLoc: '', prefLoc: '', experience: '', ctc: '', expected_ctc: '', notice: '' });
  const [professional, setProfessional] = useState({ headline: '', summary: '', skills: '' });
  const [links, setLinks] = useState({ linkedin: '', github: '' });
  const [profileImg, setProfileImg] = useState(null);
  const [uploadedCVName, setUploadedCVName] = useState("");

  // Modals state
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [employments, setEmployments] = useState([]);
  const [educations, setEducations] = useState([]);

  // Form for Modals
  const [empForm, setEmpForm] = useState({ company: '', designation: '', start: '', end: '', current: false });
  const [eduForm, setEduForm] = useState({ level: '', institute: '', year: '', score: '' });

  const handleSave = async () => {
    if (!basic.name || !basic.mobile) return alert("Candidate Name and Mobile are mandatory!");
    setSaving(true);

    const { error } = await supabase.from('placements').insert([{
      candidate_name: basic.name,
      candidate_mobile: basic.mobile,
      candidate_email: basic.email,
      gender: basic.gender,
      location: basic.currentLoc,
      pref_location: basic.prefLoc,
      dob: basic.dob,
      experience: basic.experience,
      current_ctc: basic.ctc,
      expected_ctc: basic.expected_ctc,
      notice_period: basic.notice,
      headline: professional.headline,
      summary: professional.summary,
      skills: professional.skills,
      linkedin_url: links.linkedin,
      github_url: links.github,
      employments: employments,
      educations: educations,
      status: 'New'
    }]);

    if (error) {
      alert("Database Error: " + error.message);
    } else {
      alert("Profile Created Successfully!");
      router.push('/dashboard');
    }
    setSaving(false);
  };

  const addEmployment = () => {
    setEmployments([...employments, empForm]);
    setEmpForm({ company: '', designation: '', start: '', end: '', current: false });
    setShowEmpModal(false);
  };

  const addEducation = () => {
    setEducations([...educations, eduForm]);
    setEduForm({ level: '', institute: '', year: '', score: '' });
    setShowEduModal(false);
  };

  const inputStyle = { width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' };

  return (
    <Layout>
      <header style={{ padding: '20px 40px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0b0e14' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>New Profile</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => cvInputRef.current.click()} style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
            {uploadedCVName || "📄 Upload CV (Auto-Fill)"}
          </button>
          <button onClick={handleSave} style={{ background: '#3dd68c', color: '#000', border: 'none', padding: '10px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {saving ? "Saving..." : "Save & Build Profile"}
          </button>
        </div>
      </header>

      <input type="file" ref={cvInputRef} style={{ display: 'none' }} onChange={(e) => setUploadedCVName(e.target.files[0].name)} />
      <input type="file" ref={imgInputRef} style={{ display: 'none' }} onChange={(e) => setProfileImg(URL.createObjectURL(e.target.files[0]))} />

      <div style={{ padding: '40px', display: 'flex', gap: '40px' }}>
        <div style={{ flex: 1 }}>
          <section style={{ background: '#111827', padding: '30px', borderRadius: '16px', border: '1px solid #1f2937', marginBottom: '30px' }}>
            <h3 style={{ color: '#fff', marginBottom: '20px', borderBottom: '1px solid #374151', paddingBottom: '10px' }}>Basic Profile Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: '1 / span 2' }}>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} value={basic.name} onChange={e => setBasic({ ...basic, name: e.target.value })} />
              </div>
              <div><label style={labelStyle}>Mobile Number *</label><input style={inputStyle} value={basic.mobile} onChange={e => setBasic({ ...basic, mobile: e.target.value })} /></div>
              <div><label style={labelStyle}>Email ID</label><input style={inputStyle} value={basic.email} onChange={e => setBasic({ ...basic, email: e.target.value })} /></div>
              <div><label style={labelStyle}>Current Location</label><input style={inputStyle} value={basic.currentLoc} onChange={e => setBasic({ ...basic, currentLoc: e.target.value })} /></div>
              <div><label style={labelStyle}>Preferred Location</label><input style={inputStyle} value={basic.prefLoc} onChange={e => setBasic({ ...basic, prefLoc: e.target.value })} /></div>
              <div><label style={labelStyle}>Total Experience</label><input style={inputStyle} value={basic.experience} onChange={e => setBasic({ ...basic, experience: e.target.value })} /></div>
              <div><label style={labelStyle}>Notice Period</label><input style={inputStyle} value={basic.notice} onChange={e => setBasic({ ...basic, notice: e.target.value })} /></div>
            </div>
          </section>

          <section style={{ background: '#111827', padding: '30px', borderRadius: '16px', border: '1px solid #1f2937' }}>
            <h3 style={{ color: '#fff', marginBottom: '20px' }}>Professional Details</h3>
            <label style={labelStyle}>Headline</label>
            <input style={{ ...inputStyle, marginBottom: '20px' }} value={professional.headline} onChange={e => setProfessional({ ...professional, headline: e.target.value })} />
            <label style={labelStyle}>Skills (Comma Separated)</label>
            <textarea style={{ ...inputStyle, minHeight: '100px' }} value={professional.skills} onChange={e => setProfessional({ ...professional, skills: e.target.value })} />
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowEmpModal(true)} style={{ flex: 1, background: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '15px', borderRadius: '10px', cursor: 'pointer' }}>+ Add Employment</button>
              <button onClick={() => setShowEduModal(true)} style={{ flex: 1, background: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '15px', borderRadius: '10px', cursor: 'pointer' }}>+ Add Education</button>
            </div>
          </section>
        </div>

        <div style={{ width: '350px' }}>
          <div style={{ background: '#111827', padding: '30px', borderRadius: '16px', border: '1px solid #1f2937', textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '60px', backgroundColor: '#1f2937', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {profileImg ? <img src={profileImg} style={{ width: '100%' }} /> : <span style={{ fontSize: '40px' }}>👤</span>}
            </div>
            <button onClick={() => imgInputRef.current.click()} style={{ background: 'transparent', color: '#3dd68c', border: '1px solid #3dd68c', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' }}>Upload Photo</button>
          </div>
          
          <div style={{ background: '#111827', padding: '30px', borderRadius: '16px', border: '1px solid #1f2937' }}>
            <label style={labelStyle}>LinkedIn URL</label><input style={{ ...inputStyle, marginBottom: '15px' }} value={links.linkedin} onChange={e => setLinks({ ...links, linkedin: e.target.value })} />
            <label style={labelStyle}>GitHub URL</label><input style={inputStyle} value={links.github} onChange={e => setLinks({ ...links, github: e.target.value })} />
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showEmpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0b0e14', padding: '30px', borderRadius: '16px', width: '400px', border: '1px solid #374151' }}>
            <h2 style={{ color: '#fff', marginBottom: '20px' }}>Add Employment</h2>
            <input placeholder="Company Name" style={{ ...inputStyle, marginBottom: '10px' }} onChange={e => setEmpForm({ ...empForm, company: e.target.value })} />
            <input placeholder="Designation" style={{ ...inputStyle, marginBottom: '10px' }} onChange={e => setEmpForm({ ...empForm, designation: e.target.value })} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowEmpModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={addEmployment} style={{ flex: 1, background: '#3dd68c', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showEduModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0b0e14', padding: '30px', borderRadius: '16px', width: '400px', border: '1px solid #374151' }}>
            <h2 style={{ color: '#fff', marginBottom: '20px' }}>Add Education</h2>
            <input placeholder="Institute Name" style={{ ...inputStyle, marginBottom: '10px' }} onChange={e => setEduForm({ ...eduForm, institute: e.target.value })} />
            <input placeholder="Degree/Course" style={{ ...inputStyle, marginBottom: '10px' }} onChange={e => setEduForm({ ...eduForm, course: e.target.value })} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowEduModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={addEducation} style={{ flex: 1, background: '#3dd68c', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}