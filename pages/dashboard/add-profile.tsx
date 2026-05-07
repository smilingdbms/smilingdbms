import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/Layout';

export default function AddProfile() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // States for 100% Profile Completion
  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', dob: '', gender: '', currentLoc: '', prefLoc: '', exp: '', ctc: '', expCtc: '', notice: '' });
  const [professional, setProfessional] = useState({ headline: '', summary: '', skills: '' });
  const [links, setLinks] = useState({ linkedin: '', github: '', portfolio: '' });
  const [settings, setSettings] = useState({ activeLooking: true, recruiterVis: true });

  const handleSave = () => {
    // Abhi DB error prevent karne ke liye alert lagaya hai.
    // Jab Supabase me columns add ho jayenge, tab yahan DB insert aayega.
    setSaving(true);
    setTimeout(() => {
      alert("Mock Save: Profile data validated! (Add columns in Supabase before final DB connection)");
      setSaving(false);
      router.push('/dashboard');
    }, 1000);
  };

  const inputStyle = { width: '100%', backgroundColor: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' };
  const sectionStyle = { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '30px', marginBottom: '25px' };
  const sectionTitleStyle = { fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' };

  return (
    <Layout>
      {/* TOP HEADER WITH BUTTONS */}
      <header style={{ height: '70px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', backgroundColor: '#0b0e14', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => router.back()} style={{ background: 'transparent', border: '1px solid #374151', color: '#9ca3af', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Create New Profile</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button style={{ backgroundColor: 'transparent', border: '1px solid #3b82f6', color: '#60a5fa', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <div><label style={labelStyle}>Mobile Number *</label><input style={inputStyle} type="tel" placeholder="10-digit number" /></div>
              <div><label style={labelStyle}>Email ID *</label><input style={inputStyle} type="email" placeholder="email@domain.com" /></div>
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

          {/* Professional Summary & Headline */}
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
                <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} placeholder="e.g. React.js, Next.js, B2B Sales, CRM, Node.js..." />
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>Comma separated. Skills heavily affect search ranking.</div>
              </div>
              <div>
                <label style={labelStyle}>Profile Summary / About</label>
                <textarea style={{...inputStyle, minHeight: '120px', resize: 'vertical'}} placeholder="Write 5-10 lines about experience, skills, industry, achievements, and career goals..." />
              </div>
            </div>
          </div>

          {/* Experience & Education Hooks */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Employment Details</div>
              <button style={{ background: 'rgba(61, 214, 140, 0.1)', color: '#3dd68c', border: '1px solid rgba(61, 214, 140, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add Employment</button>
            </div>
            <div style={{ padding: '20px', border: '1px dashed #374151', borderRadius: '8px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
              Click "+ Add Employment" to add Company Name, Designation, Duration, and Achievements.
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Education & Certifications</div>
              <button style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add Education</button>
            </div>
            <div style={{ padding: '20px', border: '1px dashed #374151', borderRadius: '8px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
              Add 10th, 12th, Graduation, and relevant certifications (AWS, Udemy, Google).
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Settings & Uploads */}
        <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '25px', position: 'sticky', top: '95px' }}>
          
          {/* Profile Photo Upload */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#1f2937', margin: '0 auto 15px', border: '2px dashed #4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '30px', cursor: 'pointer' }}>
              📷
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Profile Photo</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '15px' }}>Formal, clear face, plain background</div>
            <button style={{ background: 'var(--bg3)', border: '1px solid #374151', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Upload Image</button>
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
    </Layout>
  );
}