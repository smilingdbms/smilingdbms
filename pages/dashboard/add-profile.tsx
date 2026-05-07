import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

export default function AddProfile() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const cvInputRef = useRef(null);
  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', dob: '', gender: '', currentLoc: '', prefLoc: '', expYears: '0', expMonths: '0', ctcLakhs: '', ctcThousand: '', expCtcLakhs: '', expCtcThousand: '', notice: '' });
  const [professional, setProfessional] = useState({ headline: '', summary: '', skills: [] });
  const [uploadedCVName, setUploadedCVName] = useState("");
  const [cvUrl, setCvUrl] = useState("");

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
      setBasic(prev => ({ ...prev, name: data.name, mobile: data.mobile, email: data.email, currentLoc: data.location, expYears: data.experienceYears?.toString(), expMonths: data.experienceMonths?.toString(), ctcLakhs: data.ctcLakhs?.toString(), ctcThousand: data.ctcThousands?.toString(), notice: data.noticePeriod }));
      setProfessional(prev => ({ ...prev, headline: data.headline, summary: data.summary, skills: data.skills ? data.skills.split(',') : [] }));
      setUploadedCVName("✅ Auto-Fill Complete!");
    } catch (err) {
      alert("AI Error: " + err.message);
    } finally { setSaving(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('placements').insert([{
      candidate_name: basic.name, candidate_mobile: basic.mobile, candidate_email: basic.email,
      experience: `${basic.expYears}.${basic.expMonths}`, current_ctc: (parseInt(basic.ctcLakhs)*100000 + parseInt(basic.ctcThousand || 0)*1000),
      resume_url: cvUrl, status: 'New'
    }]);
    if (error) alert(error.message); else router.push('/dashboard');
    setSaving(false);
  };

  return (
    <Layout>
      <header style={{ padding: '20px 40px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', backgroundColor: '#0b0e14' }}>
        <h2 style={{ color: '#fff' }}>Add New Candidate</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => cvInputRef.current.click()} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: '#3b82f6', color: '#fff', border: 'none' }}>{uploadedCVName || "Upload CV"}</button>
          <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: '#3dd68c', border: 'none' }}>{saving ? "Processing..." : "Save Profile"}</button>
        </div>
      </header>
      <input type="file" ref={cvInputRef} onChange={handleCVUpload} style={{ display: 'none' }} />
      <div style={{ padding: '40px', maxWidth: '800px', color: '#fff' }}>
        <label>Full Name</label>
        <input style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#111827', border: '1px solid #374151', color: '#fff' }} value={basic.name} onChange={e => setBasic({ ...basic, name: e.target.value })} />
        <label>Mobile</label>
        <input style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#111827', border: '1px solid #374151', color: '#fff' }} value={basic.mobile} onChange={e => setBasic({ ...basic, mobile: e.target.value })} />
      </div>
    </Layout>
  );
}