import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

export default function AddProfile() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const cvInputRef = useRef(null);

  // --- ALL STATES RESTORED ---
  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', dob: '', gender: '', currentLoc: '', prefLoc: '', expYears: '0', expMonths: '0', ctcLakhs: '', ctcThousand: '', expCtcLakhs: '', expCtcThousand: '', notice: '' });
  const [professional, setProfessional] = useState({ headline: '', summary: '', skills: [] });
  const [uploadedCVName, setUploadedCVName] = useState("");
  const [cvUrl, setCvUrl] = useState("");

  // --- AI PARSING LOGIC ---
  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedCVName("Reading with AI & Saving to Drive... ⏳");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-cv', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCvUrl(data.cv_url);
      setBasic(prev => ({ 
        ...prev, 
        name: data.name || '', 
        mobile: data.mobile || '', 
        email: data.email || '', 
        currentLoc: data.location || '', 
        expYears: data.experienceYears?.toString() || '0', 
        expMonths: data.experienceMonths?.toString() || '0', 
        ctcLakhs: data.ctcLakhs?.toString() || '', 
        ctcThousand: data.ctcThousands?.toString() || '', 
        notice: data.noticePeriod || '' 
      }));
      setProfessional(prev => ({ 
        ...prev, 
        headline: data.headline || '', 
        summary: data.summary || '', 
        skills: data.skills ? data.skills.split(',').map(s => s.trim()) : [] 
      }));
      setUploadedCVName("✅ AI Auto-Fill Complete!");
    } catch (err) {
      alert("AI Error: " + err.message);
      setUploadedCVName("❌ Error in AI Parsing");
    } finally { setSaving(false); }
  };

  const handleSave = async () => {
    if(!basic.name || !basic.mobile) return alert("Name & Mobile required!");
    setSaving(true);
    const ctcTotal = (parseInt(basic.ctcLakhs || 0) * 100000) + (parseInt(basic.ctcThousand || 0) * 1000);
    const expCtcTotal = (parseInt(basic.expCtcLakhs || 0) * 100000) + (parseInt(basic.expCtcThousand || 0) * 1000);
    
    const { error } = await supabase.from('placements').insert([{
      candidate_name: basic.name,
      candidate_mobile: basic.mobile,
      candidate_email: basic.email,
      location: basic.currentLoc,
      experience: `${basic.expYears}.${basic.expMonths}`,
      current_ctc: ctcTotal || null,
      expected_ctc: expCtcTotal || null,
      notice_period: basic.notice,
      headline: professional.headline,
      summary: professional.summary,
      skills: professional.skills.join(', '),
      resume_url: cvUrl,
      status: 'New'
    }]);

    if (error) alert(error.message); else router.push('/dashboard');
    setSaving(false);
  };

  // --- UI STYLES ---
  const inputStyle = { width: '100%', backgroundColor: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '14px', borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '20px' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' };

  return (
    <Layout>
      <header style={{ padding: '20px 40px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0b0e14', position: 'sticky', top: 0, zIndex: 100 }}>
        <h2 style={{ color: '#fff', margin: 0 }}>Add New Candidate</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => cvInputRef.current.click()} style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: '700' }}>
            {uploadedCVName || "📄 Upload CV (AI Fill)"}
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 30px', borderRadius: '8px', cursor: 'pointer', background: '#3dd68c', color: '#000', border: 'none', fontWeight: '800' }}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </header>

      <input type="file" ref={cvInputRef} onChange={handleCVUpload} style={{ display: 'none' }} />

      <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#111827', padding: '30px', borderRadius: '16px', border: '1px solid #1f2937' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={basic.name} onChange={e => setBasic({ ...basic, name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Mobile Number *</label>
              <input style={inputStyle} value={basic.mobile} onChange={e => setBasic({ ...basic, mobile: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Email ID</label>
              <input style={inputStyle} value={basic.email} onChange={e => setBasic({ ...basic, email: e.target.value })} />
            </div>
            <div>
                <label style={labelStyle}>Current Experience</label>
                <div style={{display: 'flex', gap: '10px'}}>
                    <select style={inputStyle} value={basic.expYears} onChange={e=>setBasic({...basic, expYears: e.target.value})}>
                        {Array.from({length: 21}, (_, i) => <option key={i} value={i}>{i} Years</option>)}
                    </select>
                    <select style={inputStyle} value={basic.expMonths} onChange={e=>setBasic({...basic, expMonths: e.target.value})}>
                        {Array.from({length: 12}, (_, i) => <option key={i} value={i}>{i} Months</option>)}
                    </select>
                </div>
            </div>
            <div>
              <label style={labelStyle}>Notice Period</label>
              <select style={inputStyle} value={basic.notice} onChange={e => setBasic({ ...basic, notice: e.target.value })}>
                <option value="">Select</option>
                <option>Immediate</option>
                <option>15 Days</option>
                <option>30 Days</option>
                <option>90 Days</option>
              </select>
            </div>
            <div style={{gridColumn: '1/-1'}}>
              <label style={labelStyle}>Headline</label>
              <input style={inputStyle} value={professional.headline} onChange={e => setProfessional({ ...professional, headline: e.target.value })} placeholder="e.g. Senior Java Developer with 5 years experience"/>
            </div>
            <div style={{gridColumn: '1/-1'}}>
              <label style={labelStyle}>Skills (Comma Separated)</label>
              <input style={inputStyle} value={professional.skills.join(', ')} onChange={e => setProfessional({ ...professional, skills: e.target.value.split(',') })} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}