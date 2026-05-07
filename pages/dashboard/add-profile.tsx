// @ts-nocheck
/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

// --- DATA ---
const indianLocations = { "Delhi": ["New Delhi", "Rohini"], "Maharashtra": ["Mumbai", "Pune"], "Karnataka": ["Bengaluru"], "Others": ["Other"] };
const allCities = Object.values(indianLocations).flat();

export default function AddProfile() {
  const router = useRouter();
  const [parsing, setParsing] = useState(false);
  const cvInputRef = useRef(null);

  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', currentLoc: '', prefLoc: [], expYears: '0', notice: '' });
  const [prof, setProf] = useState({ headline: '', skills: [] });
  const [summary, setSummary] = useState("");
  const [cvUrl, setCvUrl] = useState("");

  const calculateCompletion = () => {
    let s = 0;
    if (cvUrl) s += 20;
    if (basic.name) s += 20;
    if (prof.skills.length > 0) s += 20;
    if (summary) s += 20;
    if (basic.currentLoc) s += 20;
    return s;
  };

  const handleParsing = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParsing(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      // Calling the NEW Cache-Killer Endpoint
      const res = await fetch('/api/parse-resume-ai', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setCvUrl(data.cv_url);
      setBasic(prev => ({ ...prev, name: data.name, mobile: data.mobile, email: data.email, currentLoc: data.location, expYears: data.experienceYears?.toString() }));
      setProf(prev => ({ ...prev, headline: data.headline, skills: data.skills?.split(',').map(s=>s.trim()) || [] }));
      setSummary(data.summary || "");
    } catch (err) { alert(err.message); }
    setParsing(false);
  };

  const cardStyle = { background: '#11182D', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px' };
  const inputStyle = { width: '100%', background: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none', fontSize: '13px' };

  return (
    <Layout>
      <div style={{ background: '#070B1A', minHeight: '100vh', padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            <h1 style={{ background: 'linear-gradient(90deg, #A855F7, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '24px', fontWeight: '800' }}>Smart Profile Builder</h1>
            <button onClick={() => cvInputRef.current.click()} style={{ background: '#3B82F6', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                {parsing ? "AI is Analyzing..." : "📄 Upload Resume"}
            </button>
        </header>

        <input type="file" ref={cvInputRef} onChange={handleParsing} style={{ display: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '65% 33%', gap: '2%' }}>
          {/* LEFT COLUMN */}
          <div>
            <div style={cardStyle}>
              <h3 style={{ color: '#60a5fa', marginBottom: '20px' }}>Personal Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <input style={inputStyle} placeholder="Full Name" value={basic.name} onChange={e=>setBasic({...basic, name: e.target.value})} />
                <input style={inputStyle} placeholder="Mobile" value={basic.mobile} onChange={e=>setBasic({...basic, mobile: e.target.value})} />
                <select style={inputStyle} value={basic.currentLoc} onChange={e=>setBasic({...basic, currentLoc: e.target.value})}>
                    <option>Select City</option>
                    {allCities.map(c => <option key={c}>{c}</option>)}
                </select>
                <input style={inputStyle} placeholder="Notice Period" value={basic.notice} onChange={e=>setBasic({...basic, notice: e.target.value})} />
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ color: '#A855F7', marginBottom: '20px' }}>Professional Summary</h3>
              <textarea style={{ ...inputStyle, height: '120px' }} value={summary} onChange={e=>setSummary(e.target.value)} placeholder="AI will generate this..." />
            </div>
          </div>

          {/* RIGHT COLUMN (Sticky Sidebar) */}
          <div style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '15px' }}>Profile Completion</div>
              <div style={{ fontSize: '40px', fontWeight: '800', color: '#3DD68C' }}>{calculateCompletion()}%</div>
              <div style={{ width: '100%', height: '8px', background: '#1F2937', borderRadius: '4px', marginTop: '10px' }}>
                <div style={{ width: `${calculateCompletion()}%`, height: '100%', background: '#3DD68C', borderRadius: '4px', transition: '0.5s' }}></div>
              </div>
              <div style={{ marginTop: '20px', fontSize: '12px', color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '10px', borderRadius: '8px' }}>
                ATS Score: 85/100
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}