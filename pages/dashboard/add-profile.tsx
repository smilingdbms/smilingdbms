import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

export default function AddProfile() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const cvInputRef = useRef(null);

  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', dob: '', gender: '', currentLoc: '', prefLoc: '', expYears: '0', expMonths: '0', ctcLakhs: '', ctcThousand: '', expCtcLakhs: '', expCtcThousand: '', notice: '' });
  const [professional, setProfessional] = useState({ headline: '', summary: '', skills: '' });
  const [uploadedCVName, setUploadedCVName] = useState("");
  const [cvUrl, setCvUrl] = useState("");

  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedCVName("AI is reading CV & Saving to Drive... ⏳");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-cv', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCvUrl(data.cv_url);
      setBasic(prev => ({ ...prev, name: data.name, mobile: data.mobile, email: data.email, currentLoc: data.location, expYears: data.experienceYears?.toString(), expMonths: data.experienceMonths?.toString(), ctcLakhs: data.ctcLakhs?.toString(), ctcThousand: data.ctcThousands?.toString(), notice: data.noticePeriod }));
      setProfessional(prev => ({ ...prev, headline: data.headline, summary: data.summary, skills: data.skills }));
      setUploadedCVName("✅ CV Auto-Fill Success!");
    } catch (err) { alert("AI Error: " + err.message); setUploadedCVName("❌ Parsing Failed");
    } finally { setSaving(false); }
  };

  const handleSave = async () => {
    if(!basic.name || !basic.mobile) return alert("Name/Mobile required!");
    setSaving(true);
    const { error } = await supabase.from('placements').insert([{
      candidate_name: basic.name, candidate_mobile: basic.mobile, candidate_email: basic.email,
      location: basic.currentLoc, experience: `${basic.expYears}.${basic.expMonths}`,
      current_ctc: (parseInt(basic.ctcLakhs || 0)*100000 + parseInt(basic.ctcThousand || 0)*1000),
      resume_url: cvUrl, status: 'New', headline: professional.headline, summary: professional.summary, skills: professional.skills
    }]);
    if (error) alert(error.message); else router.push('/dashboard');
    setSaving(false);
  };

  const inputStyle = { width: '100%', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', padding: '15px', borderRadius: '10px', fontSize: '14px', outline: 'none', colorScheme: 'dark' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '10px', letterSpacing: '1px' };

  return (
    <Layout>
      <header style={{ padding: '25px 40px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0b0e14', position: 'sticky', top: 0, zIndex: 100 }}>
        <div><h1 style={{ color: '#fff', fontSize: '24px', margin: 0 }}>Add New Profile</h1><p style={{color: '#6b7280', fontSize: '12px', marginTop: '4px'}}>AI will automatically extract data from uploaded PDF.</p></div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => cvInputRef.current.click()} style={{ padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', background: '#1f2937', color: '#3b82f6', border: '1px solid #3b82f6', fontWeight: '700' }}>{uploadedCVName || "📄 Upload CV (AI Fill)"}</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 35px', borderRadius: '10px', cursor: 'pointer', background: '#3dd68c', color: '#000', border: 'none', fontWeight: '800' }}>{saving ? "Processing..." : "Save Candidate"}</button>
        </div>
      </header>

      <input type="file" ref={cvInputRef} onChange={handleCVUpload} style={{ display: 'none' }} />

      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        <div style={{ backgroundColor: '#111827', padding: '40px', borderRadius: '20px', border: '1px solid #1f2937' }}>
          <h3 style={{color: '#fff', marginBottom: '30px', borderBottom: '1px solid #1f2937', paddingBottom: '15px'}}>Basic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>FULL NAME *</label><input style={inputStyle} value={basic.name} onChange={e=>setBasic({...basic, name: e.target.value})} /></div>
            <div><label style={labelStyle}>MOBILE NUMBER *</label><input style={inputStyle} value={basic.mobile} onChange={e=>setBasic({...basic, mobile: e.target.value})} /></div>
            <div><label style={labelStyle}>EMAIL ID</label><input style={inputStyle} value={basic.email} onChange={e=>setBasic({...basic, email: e.target.value})} /></div>
            <div><label style={labelStyle}>EXPERIENCE (YEARS & MONTHS)</label><div style={{display: 'flex', gap: '10px'}}><select style={inputStyle} value={basic.expYears} onChange={e=>setBasic({...basic, expYears: e.target.value})}>{Array.from({length: 25}, (_, i) => <option key={i} value={i}>{i} Yrs</option>)}</select><select style={inputStyle} value={basic.expMonths} onChange={e=>setBasic({...basic, expMonths: e.target.value})}>{Array.from({length: 12}, (_, i) => <option key={i} value={i}>{i} Mos</option>)}</select></div></div>
            <div><label style={labelStyle}>NOTICE PERIOD</label><select style={inputStyle} value={basic.notice} onChange={e=>setBasic({...basic, notice: e.target.value})}><option value="">Select</option><option>Immediate</option><option>15 Days</option><option>30 Days</option><option>90 Days</option></select></div>
            <div><label style={labelStyle}>CURRENT CTC (LAKHS / THOUSANDS)</label><div style={{display: 'flex', gap: '10px'}}><input style={inputStyle} placeholder="Lakhs" value={basic.ctcLakhs} onChange={e=>setBasic({...basic, ctcLakhs: e.target.value})} /><input style={inputStyle} placeholder="Thousands" value={basic.ctcThousand} onChange={e=>setBasic({...basic, ctcThousand: e.target.value})} /></div></div>
            <div><label style={labelStyle}>DATE OF BIRTH</label><input type="date" style={inputStyle} value={basic.dob} onChange={e=>setBasic({...basic, dob: e.target.value})} /></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ backgroundColor: '#111827', padding: '30px', borderRadius: '20px', border: '1px solid #1f2937', textAlign: 'center' }}>
            <div style={{width: '100px', height: '100px', borderRadius: '50%', background: '#1f2937', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px'}}>👤</div>
            <button style={{background: 'transparent', border: '1px solid #374151', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer'}}>Upload Photo</button>
          </div>
          <div style={{ backgroundColor: '#111827', padding: '30px', borderRadius: '20px', border: '1px solid #1f2937' }}>
            <label style={labelStyle}>HEADLINE</label>
            <textarea style={{...inputStyle, height: '80px', resize: 'none'}} value={professional.headline} onChange={e=>setProfessional({...professional, headline: e.target.value})} />
            <label style={labelStyle}>SKILLS</label>
            <textarea style={{...inputStyle, height: '120px', resize: 'none'}} value={professional.skills} onChange={e=>setProfessional({...professional, skills: e.target.value})} />
          </div>
        </div>
      </div>
    </Layout>
  );
}