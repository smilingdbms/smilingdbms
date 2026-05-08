// @ts-nocheck
/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

// --- MASSIVE TAXONOMY DATA ---

const indianLocations = {
  "Andaman & Nicobar": ["Port Blair"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  "Chandigarh": ["Chandigarh"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur"],
  "Dadra & Nagar Haveli and Daman & Diu": ["Daman", "Diu", "Silvassa"],
  "Delhi": ["New Delhi", "Central Delhi", "South Delhi", "Dwarka", "Rohini"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Manali"],
  "Jammu & Kashmir": ["Srinagar", "Jammu"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Navi Mumbai", "Thane", "Aurangabad"],
  "Manipur": ["Imphal"],
  "Meghalaya": ["Shillong"],
  "Mizoram": ["Aizawl"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri"],
  "Puducherry": ["Puducherry"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
  "Sikkim": ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
  "Tripura": ["Agartala"],
  "Uttar Pradesh": ["Noida", "Greater Noida", "Lucknow", "Kanpur", "Ghaziabad", "Varanasi", "Agra", "Prayagraj"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Rishikesh"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"]
};
const allCities = Object.values(indianLocations).flat();

const courseBranchMap = {
  "10th": ["General"],
  "12th": ["PCM", "PCB", "Commerce", "Arts", "Humanities"],
  "Diploma": ["Mechanical", "Civil", "Electrical", "Electronics", "Computer Science", "IT", "Automobile", "Architecture"],
  "B.Tech/B.E": ["Computer Science (CSE)", "Information Technology (IT)", "Electronics & Comm. (ECE)", "Mechanical", "Civil", "Electrical (EEE)", "Chemical", "Aerospace", "Biotechnology", "AI & Data Science"],
  "BCA": ["General", "Cloud Computing", "Data Science", "Cyber Security"],
  "B.Sc": ["Computer Science", "IT", "Physics", "Chemistry", "Mathematics", "Biology", "Zoology", "Botany", "Biotechnology", "Agriculture", "Nursing"],
  "BBA": ["General", "HR", "Finance", "Marketing", "International Business", "Aviation Management"],
  "B.Com": ["General", "Honours", "Accounting & Finance", "Taxation", "Corporate Secretaryship"],
  "B.A": ["English", "History", "Political Science", "Economics", "Sociology", "Psychology", "Philosophy", "Fine Arts"],
  "MBBS": ["General Medicine"],
  "BDS": ["Dentistry"],
  "B.Pharm": ["General", "Ayurveda"],
  "B.Arch": ["Architecture", "Interior Design"],
  "B.Des": ["Fashion Design", "Interior Design", "Graphic Design", "Product Design"],
  "LLB": ["General", "Corporate Law", "Criminal Law", "IPR"],
  "M.Tech/M.E": ["Computer Science", "VLSI Design", "Structural Engineering", "Thermal Engineering", "Power Systems", "Machine Learning", "Embedded Systems"],
  "MCA": ["General", "Artificial Intelligence", "Cloud Computing", "Data Analytics"],
  "M.Sc": ["Computer Science", "IT", "Data Science", "Physics", "Chemistry", "Mathematics", "Microbiology", "Biochemistry"],
  "MBA/PGDM": ["HR", "Marketing", "Finance", "Operations", "Information Technology", "Supply Chain", "International Business", "Healthcare Management"],
  "M.Com": ["General", "Finance", "Accounting"],
  "M.A": ["English", "Economics", "History", "Political Science", "Psychology", "Sociology"],
  "MD": ["General Medicine", "Pediatrics", "Radiology", "Dermatology", "Psychiatry", "Anesthesiology", "Pathology"],
  "MS": ["General Surgery", "Orthopedics", "Ophthalmology", "ENT", "Obstetrics & Gynecology"],
  "MCh": ["Cardiothoracic", "Neurosurgery", "Plastic Surgery", "Urology", "Pediatric Surgery"],
  "MDS": ["Orthodontics", "Oral Surgery", "Prosthodontics"],
  "M.Pharm": ["Pharmaceutics", "Pharmacology", "Pharmaceutical Chemistry"],
  "LLM": ["Corporate Law", "Human Rights", "International Law", "Cyber Law"],
  "Ph.D": ["Engineering", "Science", "Management", "Arts", "Commerce", "Law", "Medicine"],
  "M.Phil": ["Arts", "Science", "Commerce"],
  "CA/CS/CMA": ["General"],
  "Other": ["General"]
};

const rolesList = ["Software Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "QA Engineer", "DevOps Engineer", "Data Scientist", "UI/UX Designer", "HR Recruiter", "IT Recruiter", "Business Development Executive", "Sales Manager", "Marketing Executive", "Digital Marketing", "Financial Analyst", "Accountant", "Operations Manager", "Customer Support", "System Admin", "Other"];
const industriesList = ["IT Services", "Software Product", "E-commerce", "Finance", "Banking", "EdTech", "Recruitment", "Manufacturing", "Healthcare", "Pharmaceuticals", "Real Estate", "Logistics", "Media & Entertainment", "Consulting", "Other"];

// --- SMART CHIPS COMPONENT ---
const SmartMultiSelect = ({ options, selected, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const filtered = options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()) && !selected.includes(opt));
  const handleSelect = (val) => { onChange([...selected, val]); setInputValue(''); setShowDropdown(false); };
  
  useEffect(() => {
    function handleClickOutside(event) { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setShowDropdown(false); }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', background: 'linear-gradient(145deg, #0b0e14, #1a2333)', border: '1px solid #374151', borderRadius: '8px', minHeight: '48px', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      {selected.map((tag, idx) => (<span key={idx} style={{ background: 'rgba(196, 113, 237, 0.15)', color: '#e88bfa', border: '1px solid #c471ed', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>{tag} <span onClick={() => onChange(selected.filter(t => t !== tag))} style={{ cursor: 'pointer', color: '#fff' }}>×</span></span>))}
      <input value={inputValue} onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }} placeholder={selected.length === 0 ? placeholder : ''} style={{ flex: 1, minWidth: '150px', background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', outline: 'none' }} />
      {showDropdown && (inputValue || filtered.length > 0) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', marginTop: '4px', maxHeight: '250px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 10px 25px #000' }}>
          {filtered.map((opt, i) => (<div key={i} onClick={() => handleSelect(opt)} style={{ padding: '10px 15px', color: '#fff', cursor: 'pointer', borderBottom: '1px solid #374151' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#374151'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>{opt}</div>))}
        </div>
      )}
    </div>
  );
};

export default function AddProfile() {
  const router = useRouter();
  const [parsing, setParsing] = useState(false);
  const cvInputRef = useRef(null);
  const imgInputRef = useRef(null);

  // --- FULL STATE SCHEMA RESTORED ---
  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', currentLoc: '', prefLoc: [], gender: '', dob: '', expYears: '0', expMonths: '0', ctcLakhs: '0', ctcThousand: '0', expCtcLakhs: '0', expCtcThousand: '0', notice: '' });
  const [prof, setProf] = useState({ headline: '', summary: '', skills: [], role: '', industry: '', empType: '', workMode: '' });
  const [links, setLinks] = useState({ linkedin: '', other: '' });
  const [employments, setEmployments] = useState([{ company: '', designation: '', start: '', end: '', current: false }]);
  const [educations, setEducations] = useState([{ course: '', branch: '', institute: '', year: '' }]);
  const [profileImg, setProfileImg] = useState(null);
  const [cvUrl, setCvUrl] = useState("");

  const calculateCompletion = () => {
    let s = 0; if (cvUrl) s+=15; if (basic.name && basic.mobile) s+=15; if (prof.skills.length > 0) s+=15; if (prof.summary) s+=10; if (basic.currentLoc) s+=10; if (employments[0].company) s+=15; if (educations[0].course) s+=20; return s;
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
      setBasic(prev => ({ ...prev, name: data.name || prev.name, mobile: data.mobile || prev.mobile, email: data.email || prev.email, currentLoc: data.location || prev.currentLoc, expYears: data.experienceYears?.toString() || prev.expYears }));
      setProf(prev => ({ ...prev, headline: data.headline || prev.headline, summary: data.summary || prev.summary, skills: data.skills?.split(',').map(s=>s.trim()) || prev.skills }));
    } catch (err) { alert("Parsing error: " + err.message); }
    setParsing(false);
  };

  const handleSave = async () => {
    if (!basic.name || !basic.mobile) return alert("Full Name and Mobile are required.");
    const { error } = await supabase.from('placements').insert([{
      candidate_name: basic.name, candidate_mobile: basic.mobile, candidate_email: basic.email, location: basic.currentLoc, pref_location: basic.prefLoc.join(', '), 
      dob: basic.dob, gender: basic.gender, experience: `${basic.expYears}.${basic.expMonths}`,
      current_ctc: (parseInt(basic.ctcLakhs)*100000 + parseInt(basic.ctcThousand)*1000) || 0,
      expected_ctc: (parseInt(basic.expCtcLakhs)*100000 + parseInt(basic.expCtcThousand)*1000) || 0,
      notice_period: basic.notice, headline: prof.headline, summary: prof.summary, skills: prof.skills.join(', '), 
      employments, educations, resume_url: cvUrl, status: 'New'
    }]);
    if (error) alert(error.message); else router.push('/dashboard');
  };

  const cardStyle = { background: '#11182D', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' };
  const inputStyle = { width: '100%', background: 'linear-gradient(145deg, #0b0e14, #1a2333)', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' };
  const gradientHeader = { background: 'linear-gradient(90deg, #A855F7, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '18px', fontWeight: '800', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '10px' };

  return (
    <Layout>
      {/* CSS Injection to FIX Optgroup Visibility & Scrollbars */}
      <style>{`
        optgroup { background-color: #0b0e14; color: #A855F7; font-weight: 800; font-style: normal; padding: 5px; }
        option { background-color: #11182d; color: #ffffff; font-weight: normal; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0b0e14; }
        ::-webkit-scrollbar-thumb { background: #3B82F6; border-radius: 4px; }
      `}</style>

      {/* RICH AMBIENT BACKGROUND */}
      <div style={{ background: 'radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 40%), #070B1A', minHeight: '100vh', padding: '40px' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(7,11,26,0.85)', backdropFilter: 'blur(12px)', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h1 style={{ background: 'linear-gradient(90deg, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '26px', fontWeight: '800' }}>Candidate Registration</h1>
            <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => cvInputRef.current.click()} style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid #3B82F6', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>{parsing ? "Parsing AI... ⏳" : "📄 Upload CV"}</button>
                <button onClick={handleSave} style={{ background: 'linear-gradient(90deg, #3DD68C, #10B981)', color: '#000', padding: '10px 32px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>Save Profile</button>
            </div>
        </header>

        <input type="file" ref={cvInputRef} onChange={handleParsing} style={{ display: 'none' }} />
        <input type="file" ref={imgInputRef} onChange={(e) => setProfileImg(URL.createObjectURL(e.target.files[0]))} style={{ display: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '65% 33%', gap: '2%' }}>
          
          {/* ================= LEFT COLUMN ================= */}
          <div>
            
            {/* 1. PERSONAL DETAILS */}
            <div style={cardStyle}>
              <div style={{ height: '4px', background: 'linear-gradient(90deg, #c471ed, #f64f59)', position: 'absolute', top: 0, left: 0, right: 0 }}></div>
              <h2 style={gradientHeader}>✨ Personal Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Full Name</label><input style={inputStyle} value={basic.name} onChange={e=>setBasic({...basic, name:e.target.value})} /></div>
                <div><label style={labelStyle}>Mobile Number</label><input style={inputStyle} value={basic.mobile} onChange={e=>setBasic({...basic, mobile:e.target.value})} /></div>
                <div><label style={labelStyle}>Email ID</label><input style={inputStyle} value={basic.email} onChange={e=>setBasic({...basic, email:e.target.value})} /></div>
                
                {/* LOCATION DROPDOWN (ALL STATES) */}
                <div><label style={labelStyle}>Current Location</label>
                  <select style={inputStyle} value={basic.currentLoc} onChange={e=>setBasic({...basic, currentLoc:e.target.value})}>
                    <option value="">Select City</option>
                    {Object.keys(indianLocations).map(st => <optgroup key={st} label={st}>{indianLocations[st].map(c => <option key={c} value={c}>{c}</option>)}</optgroup>)}
                  </select>
                </div>
                
                <div><label style={labelStyle}>Gender</label><select style={inputStyle} value={basic.gender} onChange={e=>setBasic({...basic, gender:e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Preferred Cities (Multi-Select)</label><SmartMultiSelect options={allCities} selected={basic.prefLoc} onChange={v=>setBasic({...basic, prefLoc:v})} placeholder="Type & select multiple cities..." /></div>
                
                {/* RESTORED FIELDS */}
                <div><label style={labelStyle}>Date of Birth</label><input type="date" style={inputStyle} value={basic.dob} onChange={e=>setBasic({...basic, dob:e.target.value})} /></div>
                <div><label style={labelStyle}>Notice Period</label><select style={inputStyle} value={basic.notice} onChange={e=>setBasic({...basic, notice:e.target.value})}><option value="">Select</option><option>Immediate</option><option>15 Days</option><option>30 Days</option><option>45 Days</option><option>60 Days</option><option>90 Days</option><option>90+ Days</option></select></div>
                
                <div><label style={labelStyle}>Total Experience</label><div style={{display:'flex', gap:'10px'}}><select style={inputStyle} value={basic.expYears} onChange={e=>setBasic({...basic, expYears:e.target.value})}><option value="0">0 Yrs</option>{Array.from({length:30},(_,i)=><option key={i+1} value={i+1}>{i+1} Yrs</option>)}</select><select style={inputStyle} value={basic.expMonths} onChange={e=>setBasic({...basic, expMonths:e.target.value})}><option value="0">0 Mos</option>{Array.from({length:11},(_,i)=><option key={i+1} value={i+1}>{i+1} Mos</option>)}</select></div></div>
                <div></div> {/* Empty spacer to align next row correctly */}

                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div><label style={labelStyle}>Current Salary (Per Year)</label><div style={{display:'flex', gap:'10px'}}><select style={inputStyle} value={basic.ctcLakhs} onChange={e=>setBasic({...basic, ctcLakhs:e.target.value})}><option value="0">Lakhs</option>{Array.from({length:100},(_,i)=><option key={i+1} value={i+1}>{i+1} L</option>)}</select><select style={inputStyle} value={basic.ctcThousand} onChange={e=>setBasic({...basic, ctcThousand:e.target.value})}><option value="0">Thousands</option>{Array.from({length:20},(_,i)=><option key={(i+1)*5} value={(i+1)*5}>{(i+1)*5} K</option>)}</select></div></div>
                  <div><label style={labelStyle}>Expected Salary (Per Year)</label><div style={{display:'flex', gap:'10px'}}><select style={inputStyle} value={basic.expCtcLakhs} onChange={e=>setBasic({...basic, expCtcLakhs:e.target.value})}><option value="0">Lakhs</option>{Array.from({length:100},(_,i)=><option key={i+1} value={i+1}>{i+1} L</option>)}</select><select style={inputStyle} value={basic.expCtcThousand} onChange={e=>setBasic({...basic, expCtcThousand:e.target.value})}><option value="0">Thousands</option>{Array.from({length:20},(_,i)=><option key={(i+1)*5} value={(i+1)*5}>{(i+1)*5} K</option>)}</select></div></div>
                </div>

              </div>
            </div>

            {/* 2. PROFESSIONAL DETAILS */}
            <div style={cardStyle}>
              <div style={{ height: '4px', background: 'linear-gradient(90deg, #60a5fa, #a855f7)', position: 'absolute', top: 0, left: 0, right: 0 }}></div>
              <h2 style={gradientHeader}>🚀 Professional Details & Preferences</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Headline</label><input style={inputStyle} value={prof.headline} onChange={e=>setProf({...prof, headline:e.target.value})} placeholder="e.g. Senior Backend Engineer | Node.js" /></div>
                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Smart Key Skills</label><SmartMultiSelect options={['React.js','Node.js','Python','SQL','Java','Sales','CRM','Lead Generation']} selected={prof.skills} onChange={v=>setProf({...prof, skills:v})} placeholder="Type skill and press Enter..." /></div>
                
                <div><label style={labelStyle}>Desired Role</label><select style={inputStyle} value={prof.role} onChange={e=>setProf({...prof, role:e.target.value})}><option value="">Select</option>{rolesList.map(r=><option key={r}>{r}</option>)}</select></div>
                <div><label style={labelStyle}>Preferred Industry</label><select style={inputStyle} value={prof.industry} onChange={e=>setProf({...prof, industry:e.target.value})}><option value="">Select</option>{industriesList.map(i=><option key={i}>{i}</option>)}</select></div>
                <div><label style={labelStyle}>Employment Type</label><select style={inputStyle} value={prof.empType} onChange={e=>setProf({...prof, empType:e.target.value})}><option value="">Select</option><option>Full Time</option><option>Contract</option><option>Freelance</option></select></div>
                <div><label style={labelStyle}>Work Mode</label><select style={inputStyle} value={prof.workMode} onChange={e=>setProf({...prof, workMode:e.target.value})}><option value="">Select</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></div>
                
                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Profile Summary</label><textarea style={{ ...inputStyle, height: '120px' }} value={prof.summary} onChange={e=>setProf({...prof, summary:e.target.value})} placeholder="AI will extract summary from CV..." /></div>
              </div>
            </div>

            {/* 3. EMPLOYMENT HISTORY */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '10px' }}>
                <h2 style={{ ...gradientHeader, borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>🏢 Employment History</h2>
                <button onClick={() => setEmployments([...employments, { company:'', designation:'', start:'', end:'', current:false }])} style={{ color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid #3B82F6', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Row</button>
              </div>
              {employments.map((emp, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', background: '#0b0e14', padding: '20px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #1F2937', position: 'relative' }}>
                  {employments.length > 1 && <button onClick={() => setEmployments(employments.filter((_, idx) => idx !== i))} style={{position: 'absolute', top: '10px', right: '10px', background: '#ef444422', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', padding: '2px 8px'}}>✖</button>}
                  <div><label style={labelStyle}>Company</label><input style={inputStyle} value={emp.company} onChange={e=>{const n=[...employments]; n[i].company=e.target.value; setEmployments(n);}} /></div>
                  <div><label style={labelStyle}>Designation</label><input style={inputStyle} value={emp.designation} onChange={e=>{const n=[...employments]; n[i].designation=e.target.value; setEmployments(n);}} /></div>
                  <div><label style={labelStyle}>Start Date</label><input type="month" style={inputStyle} value={emp.start} onChange={e=>{const n=[...employments]; n[i].start=e.target.value; setEmployments(n);}} /></div>
                  <div><label style={labelStyle}>End Date</label><input type="month" style={inputStyle} value={emp.end} disabled={emp.current} onChange={e=>{const n=[...employments]; n[i].end=e.target.value; setEmployments(n);}} /></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#d1d5db', cursor: 'pointer' }}><input type="checkbox" checked={emp.current} onChange={e=>{const n=[...employments]; n[i].current=e.target.checked; setEmployments(n);}} style={{ accentColor: '#3B82F6', width: '16px', height: '16px' }} /> Currently Working Here</label></div>
                </div>
              ))}
            </div>

            {/* 4. EDUCATION TAXONOMY */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '10px' }}>
                <h2 style={{ ...gradientHeader, borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>🎓 Education</h2>
                <button onClick={() => setEducations([...educations, { course:'', branch:'', institute:'', year:'' }])} style={{ color: '#3dd68c', background: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Row</button>
              </div>
              {educations.map((edu, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#0b0e14', padding: '20px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #1F2937', position: 'relative' }}>
                  {educations.length > 1 && <button onClick={() => setEducations(educations.filter((_, idx) => idx !== i))} style={{position: 'absolute', top: '10px', right: '10px', background: '#ef444422', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', padding: '2px 8px'}}>✖</button>}
                  <div><label style={labelStyle}>Course</label>
                    <select style={inputStyle} value={edu.course} onChange={e=>{const n=[...educations]; n[i].course=e.target.value; n[i].branch=''; setEducations(n);}}>
                      <option value="">Select Course</option>
                      {Object.keys(courseBranchMap).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Branch / Specialization</label>
                    <select style={inputStyle} value={edu.branch} disabled={!edu.course} onChange={e=>{const n=[...educations]; n[i].branch=e.target.value; setEducations(n);}}>
                      <option value="">Select Branch</option>
                      {(courseBranchMap[edu.course] || []).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Institute / University</label><input style={inputStyle} value={edu.institute} onChange={e=>{const n=[...educations]; n[i].institute=e.target.value; setEducations(n);}} /></div>
                  <div><label style={labelStyle}>Year of Passing</label><input style={inputStyle} placeholder="YYYY" type="number" value={edu.year} onChange={e=>{const n=[...educations]; n[i].year=e.target.value; setEducations(n);}} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= RIGHT COLUMN (SIDEBAR) ================= */}
          <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
            
            {/* PHOTO UPLOAD */}
            <div style={{ ...cardStyle, textAlign: 'center' }}>
               <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: '#0b0e14', border: '2px dashed #c471ed', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 0 20px rgba(196, 113, 237, 0.2)' }}>
                 {profileImg ? <img src={profileImg} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:'50px', color: '#c471ed' }}>👤</span>}
               </div>
               <button onClick={() => imgInputRef.current.click()} style={{ background: 'rgba(196, 113, 237, 0.15)', color: '#e88bfa', border: '1px solid #c471ed', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%', transition: '0.3s' }}>Upload Profile Photo</button>
            </div>

            {/* LINKS */}
            <div style={cardStyle}>
              <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '15px', fontWeight: '800' }}>🔗 Important Links</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div><label style={labelStyle}>LinkedIn URL</label><input style={inputStyle} value={links.linkedin} onChange={e=>setLinks({...links, linkedin:e.target.value})} placeholder="https://linkedin.com/in/..." /></div>
                <div><label style={labelStyle}>Portfolio / GitHub</label><input style={inputStyle} value={links.other} onChange={e=>setLinks({...links, other:e.target.value})} placeholder="https://..." /></div>
              </div>
            </div>

            {/* PROGRESS METER */}
            <div style={{ ...cardStyle, textAlign: 'center' }}>
               <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '15px', fontWeight: '800', textTransform: 'uppercase' }}>Profile Strength</div>
               <div style={{ fontSize: '48px', fontWeight: '800', color: '#10B981', textShadow: '0 0 10px rgba(16,185,129,0.3)' }}>{calculateCompletion()}%</div>
               <div style={{ width: '100%', height: '8px', background: '#1F2937', borderRadius: '4px', marginTop: '15px', overflow: 'hidden' }}>
                 <div style={{ width: `${calculateCompletion()}%`, height: '100%', background: 'linear-gradient(90deg, #3DD68C, #10B981)', borderRadius: '4px', transition: '1s ease-in-out' }}></div>
               </div>
               <div style={{ marginTop: '20px', fontSize: '12px', color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', fontWeight: 'bold' }}>ATS SCORE: 85/100</div>
            </div>

            {/* TOGGLES */}
            <div style={cardStyle}>
              <div style={{ display: 'grid', gap: '15px' }}>
                <label style={{ fontSize:'14px', display:'flex', alignItems:'center', gap:'12px', color:'#fff', cursor:'pointer', fontWeight: 'bold' }}><input type="checkbox" defaultChecked style={{ accentColor:'#10B981', width:'20px', height:'20px' }} /> Actively Looking</label>
                <label style={{ fontSize:'14px', display:'flex', alignItems:'center', gap:'12px', color:'#fff', cursor:'pointer', fontWeight: 'bold' }}><input type="checkbox" style={{ accentColor:'#10B981', width:'20px', height:'20px' }} /> Can Relocate</label>
                <label style={{ fontSize:'14px', display:'flex', alignItems:'center', gap:'12px', color:'#fff', cursor:'pointer', fontWeight: 'bold' }}><input type="checkbox" defaultChecked style={{ accentColor:'#10B981', width:'20px', height:'20px' }} /> Visible to Search</label>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}