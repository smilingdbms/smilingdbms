// @ts-nocheck
/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

// --- DATA DICTIONARIES ---
const indianLocations = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada"], "Bihar": ["Patna", "Gaya"], "Delhi": ["New Delhi", "Dwarka", "Rohini"], "Gujarat": ["Ahmedabad", "Surat"], "Haryana": ["Gurugram", "Faridabad"], "Karnataka": ["Bengaluru", "Mysuru"], "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Navi Mumbai"], "Telangana": ["Hyderabad"], "Uttar Pradesh": ["Noida", "Greater Noida", "Lucknow", "Ghaziabad"], "West Bengal": ["Kolkata"], "Others": ["Other"]
};
const allCities = Object.values(indianLocations).flat();
const rolesList = ["Software Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "QA Engineer", "DevOps Engineer", "Data Scientist", "UI/UX Designer", "HR Recruiter", "Sales Manager", "Business Development", "Operations Executive", "Digital Marketing", "Other"];
const industriesList = ["IT Services", "Software Product", "E-commerce", "Finance", "EdTech", "Recruitment", "Healthcare", "Manufacturing", "Logistics", "Other"];
const courseBranchMap = {
  "10th": ["General"], "12th": ["Science", "Commerce", "Arts"], "Diploma": ["Mechanical", "Civil", "Electrical", "CS"], "B.Tech/B.E": ["CS", "IT", "Electronics", "Mechanical", "Civil"], "M.Tech/M.E": ["CS", "VLSI"], "BCA": ["General"], "MCA": ["General"], "B.Sc": ["CS", "IT"], "BBA": ["General"], "MBA/PGDM": ["HR", "Marketing", "Finance", "IT"], "B.Com": ["General"], "CA/CS": ["General"], "Other": ["General"]
};

// --- REUSABLE UI COMPONENTS ---
const SmartPill = ({ label, selected, onClick }) => (
  <button onClick={onClick} type="button" style={{ padding: '6px 14px', borderRadius: '20px', border: selected ? '1px solid #3B82F6' : '1px solid #374151', background: selected ? 'rgba(59, 130, 246, 0.2)' : '#0b0e14', color: selected ? '#60a5fa' : '#9ca3af', fontSize: '12px', cursor: 'pointer', transition: '0.3s' }}>{label}</button>
);

const SectionHeading = ({ title, icon }) => (
  <h2 style={{ background: 'linear-gradient(90deg, #A855F7, #EC4899, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
    <span style={{WebkitTextFillColor: 'initial'}}>{icon}</span> {title}
  </h2>
);

export default function AddProfile() {
  const router = useRouter();
  const [parsing, setParsing] = useState(false);
  const cvInputRef = useRef(null);
  const imgInputRef = useRef(null);

  // --- STATE SCHEMA ---
  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', currentLoc: '', prefLoc: [], gender: '', dob: '', expYears: '0', expMonths: '0', ctcLakhs: '', notice: 'Immediate' });
  const [prof, setProf] = useState({ headline: '', summary: '', skills: [], role: '', industry: '', workMode: 'On-site' });
  const [links, setLinks] = useState({ linkedin: '', other: '' });
  const [employments, setEmployments] = useState([{ company: '', designation: '', start: '', end: '', current: false }]);
  const [educations, setEducations] = useState([{ course: '', branch: '', institute: '', year: '' }]);
  const [profileImg, setProfileImg] = useState(null);
  const [cvUrl, setCvUrl] = useState("");

  const calculateCompletion = () => {
    let s = 0; if (cvUrl) s+=20; if (basic.name) s+=20; if (prof.skills.length > 0) s+=20; if (prof.summary) s+=20; if (basic.currentLoc) s+=20; return s;
  };

  const handleParsing = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setParsing(true);
    const formData = new FormData(); formData.append('file', file);
    try {
      const res = await fetch('/api/parse-resume-ai', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCvUrl(data.cv_url);
      setBasic(prev => ({ ...prev, name: data.name, mobile: data.mobile, email: data.email, currentLoc: data.location, expYears: data.experienceYears?.toString() || '0' }));
      setProf(prev => ({ ...prev, headline: data.headline, summary: data.summary, skills: data.skills?.split(',').map(s=>s.trim()) || [] }));
    } catch (err) { alert("Parser Error: " + err.message); }
    setParsing(false);
  };

  const handleSave = async () => {
    if (!basic.name || !basic.mobile) return alert("Please fill Name and Mobile.");
    const { error } = await supabase.from('placements').insert([{
      candidate_name: basic.name, candidate_mobile: basic.mobile, candidate_email: basic.email, location: basic.currentLoc, pref_location: basic.prefLoc.join(', '), 
      headline: prof.headline, summary: prof.summary, skills: prof.skills.join(', '), employments, educations, resume_url: cvUrl, status: 'New'
    }]);
    if (error) alert(error.message); else router.push('/dashboard');
  };

  // --- STYLING ---
  const cardStyle = { background: '#11182D', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px', position: 'relative' };
  const inputStyle = { width: '100%', background: 'linear-gradient(145deg, #0b0e14, #1a2333)', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' };

  return (
    <Layout>
      <div style={{ background: '#070B1A', minHeight: '100vh', padding: '40px' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h1 style={{ background: 'linear-gradient(90deg, #A855F7, #EC4899, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '24px', fontWeight: '800' }}>Candidate Registration</h1>
            <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => cvInputRef.current.click()} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid #3B82F6', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{parsing ? "AI Parsing..." : "📄 Upload CV"}</button>
                <button onClick={handleSave} style={{ background: 'linear-gradient(90deg, #3DD68C, #10B981)', color: '#000', padding: '10px 30px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>Save Profile</button>
            </div>
        </header>

        <input type="file" ref={cvInputRef} onChange={handleParsing} style={{ display: 'none' }} />
        <input type="file" ref={imgInputRef} onChange={(e) => setProfileImg(URL.createObjectURL(e.target.files[0]))} style={{ display: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '65% 33%', gap: '2%' }}>
          
          {/* LEFT: FORM FIELDS */}
          <div>
            <div style={cardStyle}>
              <SectionHeading title="Personal Details" icon="✨" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Full Name</label><input style={inputStyle} value={basic.name} onChange={e=>setBasic({...basic, name:e.target.value})} /></div>
                <div><label style={labelStyle}>Mobile</label><input style={inputStyle} value={basic.mobile} onChange={e=>setBasic({...basic, mobile:e.target.value})} /></div>
                <div><label style={labelStyle}>Email</label><input style={inputStyle} value={basic.email} onChange={e=>setBasic({...basic, email:e.target.value})} /></div>
                <div>
                  <label style={labelStyle}>Current City</label>
                  <select style={inputStyle} value={basic.currentLoc} onChange={e=>setBasic({...basic, currentLoc:e.target.value})}>
                    <option value="">Select City</option>
                    {Object.keys(indianLocations).map(st => <optgroup key={st} label={st}>{indianLocations[st].map(c => <option key={c} value={c}>{c}</option>)}</optgroup>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Notice Period</label><select style={inputStyle} value={basic.notice} onChange={e=>setBasic({...basic, notice:e.target.value})}><option>Immediate</option><option>15 Days</option><option>30 Days</option></select></div>
              </div>
            </div>

            <div style={cardStyle}>
              <SectionHeading title="Skills & Summary" icon="🚀" />
              <div style={{ display: 'grid', gap: '20px' }}>
                <div><label style={labelStyle}>Professional Headline</label><input style={inputStyle} value={prof.headline} onChange={e=>setProf({...prof, headline:e.target.value})} /></div>
                <div>
                   <label style={labelStyle}>Smart Skills (Select/Tap)</label>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                     {['React', 'Node.js', 'Python', 'SQL', 'Sales', 'CRM', 'Talent Acquisition'].map(s => (
                       <SmartPill key={s} label={s} selected={prof.skills.includes(s)} onClick={() => prof.skills.includes(s) ? setProf({...prof, skills: prof.skills.filter(x=>x!==s)}) : setProf({...prof, skills: [...prof.skills, s]})} />
                     ))}
                   </div>
                </div>
                <div><label style={labelStyle}>AI Profile Summary</label><textarea style={{ ...inputStyle, height: '100px' }} value={prof.summary} onChange={e=>setProf({...prof, summary:e.target.value})} /></div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <SectionHeading title="Work History" icon="🏢" />
                <button onClick={() => setEmployments([...employments, { company:'', designation:'', current:false }])} style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Row</button>
              </div>
              {employments.map((emp, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '15px', background: '#0b0e14', padding: '15px', borderRadius: '10px', marginBottom: '10px' }}>
                  <input style={inputStyle} placeholder="Company" value={emp.company} onChange={e=>{const n=[...employments]; n[i].company=e.target.value; setEmployments(n);}} />
                  <input style={inputStyle} placeholder="Designation" value={emp.designation} onChange={e=>{const n=[...employments]; n[i].designation=e.target.value; setEmployments(n);}} />
                  <label style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" checked={emp.current} onChange={e=>{const n=[...employments]; n[i].current=e.target.checked; setEmployments(n);}} /> Current</label>
                </div>
              ))}
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <SectionHeading title="Education Details" icon="🎓" />
                <button onClick={() => setEducations([...educations, { course:'', branch:'', institute:'', year:'' }])} style={{ color: '#3dd68c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Row</button>
              </div>
              {educations.map((edu, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', background: '#0b0e14', padding: '15px', borderRadius: '10px', marginBottom: '10px' }}>
                  <select style={inputStyle} value={edu.course} onChange={e=>{const n=[...educations]; n[i].course=e.target.value; setEducations(n);}}>
                    <option>Select Course</option>
                    {Object.keys(courseBranchMap).map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select style={inputStyle} value={edu.branch} onChange={e=>{const n=[...educations]; n[i].branch=e.target.value; setEducations(n);}}>
                    <option>Select Branch</option>
                    {(courseBranchMap[edu.course] || []).map(b => <option key={b}>{b}</option>)}
                  </select>
                  <input style={inputStyle} placeholder="Institute" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: SIDEBAR WIDGETS */}
          <div style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ width: '130px', height: '130px', borderRadius: '50%', background: '#0b0e14', border: '2px dashed #c471ed', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {profileImg ? <img src={profileImg} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:'40px' }}>👤</span>}
              </div>
              <button onClick={() => imgInputRef.current.click()} style={{ background: 'rgba(196, 113, 237, 0.1)', color: '#e88bfa', border: '1px solid #c471ed', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Upload Photo</button>
            </div>

            <div style={cardStyle}>
              <h3 style={{ color: '#fff', fontSize: '15px', marginBottom: '15px' }}>🔗 Important Links</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div><label style={labelStyle}>LinkedIn</label><input style={inputStyle} value={links.linkedin} onChange={e=>setLinks({...links, linkedin:e.target.value})} placeholder="https://..." /></div>
                <div><label style={labelStyle}>Portfolio</label><input style={inputStyle} value={links.other} onChange={e=>setLinks({...links, other:e.target.value})} placeholder="https://..." /></div>
              </div>
            </div>

            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '15px' }}>Profile Strength</div>
              <div style={{ fontSize: '42px', fontWeight: '800', color: '#10B981' }}>{calculateCompletion()}%</div>
              <div style={{ width: '100%', height: '8px', background: '#1F2937', borderRadius: '4px', marginTop: '10px' }}>
                <div style={{ width: `${calculateCompletion()}%`, height: '100%', background: '#10B981', borderRadius: '4px', transition: '1s' }}></div>
              </div>
              <div style={{ marginTop: '20px', fontSize: '11px', color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>ATS SCORE: 85/100</div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'grid', gap: '15px' }}>
                <label style={{ fontSize:'13px', display:'flex', alignItems:'center', gap:'10px', color:'#fff', cursor:'pointer' }}><input type="checkbox" defaultChecked style={{ accentColor:'#10B981', width:'18px', height:'18px' }} /> Actively Looking</label>
                <label style={{ fontSize:'13px', display:'flex', alignItems:'center', gap:'10px', color:'#fff', cursor:'pointer' }}><input type="checkbox" defaultChecked style={{ accentColor:'#10B981', width:'18px', height:'18px' }} /> Visible to Search</label>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}