// @ts-nocheck
/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

// --- DATA CONSTANTS ---
const indianLocations = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore"], "Assam": ["Guwahati", "Silchar"], "Bihar": ["Patna", "Gaya"], "Chandigarh": ["Chandigarh"], "Delhi": ["New Delhi", "Dwarka", "Rohini"], "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"], "Haryana": ["Gurugram", "Faridabad", "Panipat"], "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru"], "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode"], "Madhya Pradesh": ["Indore", "Bhopal", "Gwalior"], "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Navi Mumbai"], "Odisha": ["Bhubaneswar", "Cuttack"], "Punjab": ["Ludhiana", "Amritsar", "Jalandhar"], "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur"], "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"], "Telangana": ["Hyderabad", "Warangal"], "Uttar Pradesh": ["Noida", "Greater Noida", "Ghaziabad", "Lucknow", "Kanpur"], "West Bengal": ["Kolkata", "Howrah"], "Others": ["Other"]
};
const allCities = Object.values(indianLocations).flat();

const rolesList = ["Software Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer", "QA Engineer", "DevOps Engineer", "Cloud Architect", "Data Scientist", "Data Analyst", "Machine Learning Engineer", "Product Manager", "Project Manager", "Scrum Master", "Business Analyst", "UI/UX Designer", "HR Executive", "HR Manager", "Talent Acquisition", "IT Recruiter", "Non-IT Recruiter", "Business Development Executive", "Business Development Manager", "Sales Executive", "Sales Manager", "Marketing Executive", "Digital Marketing", "SEO Specialist", "Content Writer", "Financial Analyst", "Accountant", "Operations Executive", "Supply Chain Manager", "Customer Support", "Technical Support", "System Admin", "Network Engineer"];
const industriesList = ["Information Technology (IT)", "Software Services", "Hardware & Networking", "Internet/E-commerce", "Recruitment/Staffing", "Human Resources", "BPO/KPO/ITES", "Telecommunications", "E-Learning/EdTech", "Education/Training", "Financial Services", "Banking", "Insurance", "Accounting/Auditing", "Retail", "FMCG", "Manufacturing", "Automobile", "Healthcare/Hospitals", "Pharmaceuticals", "Real Estate", "Construction/Engineering", "Logistics/Supply Chain", "Travel/Tourism", "Media/Entertainment", "Advertising/PR", "Agriculture/Dairy", "Energy/Power", "Consulting", "Legal"];
const courseBranchMap = { "B.Tech/B.E": ["Computer Science", "IT", "Electronics", "Electrical", "Mechanical", "Civil", "Chemical", "Automobile", "Biotech"], "M.Tech/M.E": ["Computer Science", "VLSI", "Embedded", "Structural", "Thermal"], "BCA": ["General", "Cloud Computing", "AI"], "MCA": ["General", "Software Engineering"], "B.Sc": ["Computer Science", "IT", "Maths", "Physics", "Chemistry", "Biology", "Nursing", "Agriculture"], "M.Sc": ["Computer Science", "IT", "Data Science", "Maths"], "BBA": ["General", "HR", "Finance", "Marketing"], "MBA/PGDM": ["HR", "Marketing", "Finance", "Operations", "IT", "Supply Chain"], "B.Com": ["General", "Honours", "Accounting"], "M.Com": ["General", "Finance"], "BA": ["English", "History", "Economics", "Pol Science"], "MA": ["English", "History", "Economics"], "Diploma": ["Mechanical", "Civil", "Electrical", "CS"], "CA": ["General"], "CS": ["General"], "LLB": ["General", "Corporate"], "MBBS": ["General Medicine"], "B.Pharm": ["General"], "B.Des": ["Fashion", "Interior", "Graphic"], "B.Arch": ["Architecture"], "Other": ["General"] };

const SmartMultiSelect = ({ options, selected, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()) && !selected.includes(opt));

  useEffect(() => {
    function handleClickOutside(event) { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setShowDropdown(false); }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => { onChange([...selected, val]); setInputValue(''); setShowDropdown(false); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      const match = filteredOptions.find(o => o.toLowerCase() === inputValue.toLowerCase());
      if (match) handleSelect(match); else handleSelect(inputValue.trim());
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', background: 'linear-gradient(145deg, #0b0e14, #1f2937)', border: '1px solid #374151', borderRadius: '8px', minHeight: '48px', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      {selected.map((tag, idx) => (<span key={idx} style={{ background: 'linear-gradient(135deg, #3b82f622, #8b5cf622)', color: '#8b5cf6', border: '1px solid #8b5cf655', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>{tag} <span onClick={() => onChange(selected.filter(t => t !== tag))} style={{ cursor: 'pointer', color: '#fff' }}>×</span></span>))}
      <input value={inputValue} onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} onKeyDown={handleKeyDown} placeholder={selected.length === 0 ? placeholder : ''} style={{ flex: 1, minWidth: '150px', background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none', padding: '4px' }} />
      {showDropdown && (inputValue || options.length > 0) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, i) => (<div key={i} onClick={() => handleSelect(opt)} style={{ padding: '10px 15px', color: '#fff', cursor: 'pointer', borderBottom: '1px solid #374151' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#374151'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>{opt}</div>)) : (<div style={{ padding: '10px 15px', color: '#9ca3af', fontStyle: 'italic' }}>Press Enter to add custom</div>)}
        </div>
      )}
    </div>
  );
};

export default function AddProfile() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const cvInputRef = useRef(null);
  const imgInputRef = useRef(null);

  const [basic, setBasic] = useState({ name: '', mobile: '', email: '', currentLoc: '', prefLoc: [], gender: '', dob: '', expYears: '0', expMonths: '0', ctcLakhs: '', ctcThousand: '', expCtcLakhs: '', expCtcThousand: '', notice: '' });
  const [professional, setProfessional] = useState({ headline: '', summary: '', skills: [] });
  const [preferences, setPreferences] = useState({ role: '', industry: '', empType: '', workMode: '' });
  const [links, setLinks] = useState({ linkedin: '', otherLink: '' });
  const [settings, setSettings] = useState({ activelyLooking: true, canRelocate: false, visibleToRecruiters: true });
  
  const [employments, setEmployments] = useState([{ company: '', designation: '', start: '', end: '', current: false }]);
  const [educations, setEducations] = useState([{ course: '', branch: '', institute: '', year: '' }]);
  
  const [uploadedCVName, setUploadedCVName] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [profileImg, setProfileImg] = useState(null);

  const suggestedSkills = ['React.js', 'Next.js', 'TypeScript', 'SQL', 'Node.js', 'Python', 'Java', 'Lead Generation', 'Client Acquisition', 'B2B Sales', 'CRM', 'Cold Calling', 'Negotiation'];

  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedCVName("Analyzing & Parsing... ⏳");
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-resume-ai', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Unknown Server Error");

      setCvUrl(data.cv_url);
      setBasic(prev => ({ ...prev, name: data.name || prev.name, mobile: data.mobile || prev.mobile, email: data.email || prev.email, currentLoc: data.location || prev.currentLoc, expYears: data.experienceYears?.toString() || prev.expYears, ctcLakhs: data.ctcLakhs?.toString() || prev.ctcLakhs, notice: data.noticePeriod || prev.notice }));
      setProfessional(prev => ({ ...prev, headline: data.headline || prev.headline, summary: data.summary || prev.summary, skills: data.skills ? data.skills.split(',').map(s=>s.trim()) : prev.skills }));
      setUploadedCVName("✅ AI Parse Successful");
    } catch (err) { 
      alert("Error Details: " + err.message); 
      setUploadedCVName("❌ Parsing Failed"); 
    }
  };

  const handleSave = async () => {
    if (!basic.name || !basic.mobile) return alert("Full Name and Mobile Number are required.");
    setSaving(true);
    const cleanEmp = employments.filter(e => e.company !== '' || e.designation !== '');
    const cleanEdu = educations.filter(e => e.course !== '' || e.institute !== '');

    const { error } = await supabase.from('placements').insert([{
      candidate_name: basic.name, candidate_mobile: basic.mobile, candidate_email: basic.email, gender: basic.gender, location: basic.currentLoc, pref_location: basic.prefLoc.join(', '), dob: basic.dob, experience: `${basic.expYears}.${basic.expMonths}`,
      current_ctc: (parseInt(basic.ctcLakhs || 0)*100000 + parseInt(basic.ctcThousand || 0)*1000) || null, expected_ctc: (parseInt(basic.expCtcLakhs || 0)*100000 + parseInt(basic.expCtcThousand || 0)*1000) || null, notice_period: basic.notice,
      headline: professional.headline, summary: professional.summary, skills: professional.skills.join(', '), linkedin_url: links.linkedin, portfolio_url: links.otherLink,
      employments: cleanEmp, educations: cleanEdu, preferences: { ...preferences, settings }, resume_url: cvUrl, status: 'New'
    }]);
    
    if (error) alert("Database Save Error: " + error.message); else router.push('/dashboard');
    setSaving(false);
  };

  const updateEmp = (idx, field, val) => { const newEmp = [...employments]; newEmp[idx][field] = val; setEmployments(newEmp); };
  const updateEdu = (idx, field, val) => { const newEdu = [...educations]; newEdu[idx][field] = val; setEducations(newEdu); };

  // Gradient Input Style
  const inputStyle = { 
    width: '100%', 
    background: 'linear-gradient(145deg, #0b0e14, #1a2333)', 
    border: '1px solid #374151', 
    color: '#fff', 
    padding: '12px', 
    borderRadius: '8px', 
    fontSize: '14px', 
    outline: 'none', 
    boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.1)' 
  };
  
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const sectionStyle = { backgroundColor: '#111827', padding: '30px', borderRadius: '16px', border: '1px solid #1f2937', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' };
  const gradientHeader = { background: 'linear-gradient(90deg, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '20px', fontWeight: '800', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '10px' };

  return (
    <Layout>
      <header style={{ padding: '20px 40px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0b0e14', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ color: '#fff', fontSize: '24px', margin: 0, fontWeight: '800' }}>Add Candidate Profile</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button type="button" onClick={() => cvInputRef.current.click()} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: 'linear-gradient(90deg, #1f2937, #111827)', color: '#60a5fa', border: '1px solid #3b82f6', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{fontSize: '16px'}}>📄</span> {uploadedCVName || "Upload CV & Auto-Parse"}
          </button>
          <button type="button" onClick={handleSave} disabled={saving} style={{ padding: '10px 30px', borderRadius: '8px', cursor: 'pointer', background: 'linear-gradient(90deg, #3dd68c, #10b981)', color: '#000', border: 'none', fontWeight: 'bold' }}>{saving ? "Saving..." : "Save Profile"}</button>
        </div>
      </header>

      <input type="file" ref={cvInputRef} onChange={handleCVUpload} style={{ display: 'none' }} accept=".pdf,.doc,.docx" />
      <input type="file" ref={imgInputRef} onChange={(e) => setProfileImg(URL.createObjectURL(e.target.files[0]))} style={{ display: 'none' }} accept="image/*" />

      {/* 65% - 35% GRID LAYOUT */}
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '65% 33%', gap: '2%' }}>
        
        {/* LEFT COLUMN: 65% FOR DETAIL INPUTS */}
        <div>
          <div style={sectionStyle}>
            <h2 style={gradientHeader}>Personal Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Full Name</label><input style={inputStyle} value={basic.name} onChange={e=>setBasic({...basic, name: e.target.value})} /></div>
              <div><label style={labelStyle}>Mobile Number</label><input style={inputStyle} value={basic.mobile} onChange={e=>setBasic({...basic, mobile: e.target.value})} /></div>
              <div><label style={labelStyle}>Email ID</label><input style={inputStyle} value={basic.email} onChange={e=>setBasic({...basic, email: e.target.value})} /></div>
              
              <div><label style={labelStyle}>Current Location</label>
                <select style={inputStyle} value={basic.currentLoc} onChange={e=>setBasic({...basic, currentLoc: e.target.value})}>
                  <option value="">Select Location</option>
                  {Object.keys(indianLocations).map(state => (<optgroup key={state} label={state}>{indianLocations[state].map(city => <option key={city} value={city}>{city}</option>)}</optgroup>))}
                </select>
              </div>
              <div><label style={labelStyle}>Gender</label><select style={inputStyle} value={basic.gender} onChange={e=>setBasic({...basic, gender: e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
              
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Preferred Cities (Multi-Select)</label><SmartMultiSelect options={allCities} selected={basic.prefLoc} onChange={(val) => setBasic({...basic, prefLoc: val})} placeholder="Type & select multiple cities..." /></div>
              
              <div><label style={labelStyle}>Date of Birth</label><input type="date" style={inputStyle} value={basic.dob} onChange={e=>setBasic({...basic, dob: e.target.value})} /></div>
              <div><label style={labelStyle}>Notice Period</label><select style={inputStyle} value={basic.notice} onChange={e=>setBasic({...basic, notice: e.target.value})}><option value="">Select</option><option>Immediate</option><option>15 Days</option><option>30 Days</option><option>60 Days</option><option>90+ Days</option></select></div>
              
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Total Experience</label><div style={{display:'flex', gap:'10px'}}><select style={inputStyle} value={basic.expYears} onChange={e=>setBasic({...basic, expYears: e.target.value})}>{Array.from({length:30},(_,i)=><option key={i} value={i}>{i} Yrs</option>)}</select><select style={inputStyle} value={basic.expMonths} onChange={e=>setBasic({...basic, expMonths: e.target.value})}>{Array.from({length:12},(_,i)=><option key={i} value={i}>{i} Mos</option>)}</select></div></div>
              
              <div><label style={labelStyle}>Current Salary (Per Year)</label><div style={{display:'flex', gap:'10px'}}>
                <select style={inputStyle} value={basic.ctcLakhs} onChange={e=>setBasic({...basic, ctcLakhs: e.target.value})}><option value="">Lakhs</option>{Array.from({length:100},(_,i)=><option key={i} value={i}>{i} L</option>)}</select>
                <select style={inputStyle} value={basic.ctcThousand} onChange={e=>setBasic({...basic, ctcThousand: e.target.value})}><option value="">Thousands</option>{Array.from({length:20},(_,i)=><option key={i*5} value={i*5}>{i*5} K</option>)}</select>
              </div></div>
              <div><label style={labelStyle}>Expected Salary (Per Year)</label><div style={{display:'flex', gap:'10px'}}>
                <select style={inputStyle} value={basic.expCtcLakhs} onChange={e=>setBasic({...basic, expCtcLakhs: e.target.value})}><option value="">Lakhs</option>{Array.from({length:100},(_,i)=><option key={i} value={i}>{i} L</option>)}</select>
                <select style={inputStyle} value={basic.expCtcThousand} onChange={e=>setBasic({...basic, expCtcThousand: e.target.value})}><option value="">Thousands</option>{Array.from({length:20},(_,i)=><option key={i*5} value={i*5}>{i*5} K</option>)}</select>
              </div></div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={gradientHeader}>Professional Details & Preferences</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Headline</label><input style={inputStyle} value={professional.headline} onChange={e=>setProfessional({...professional, headline: e.target.value})} placeholder="e.g. Senior Backend Engineer | Node.js" /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Smart Key Skills</label><SmartMultiSelect options={suggestedSkills} selected={professional.skills} onChange={(val) => setProfessional({...professional, skills: val})} placeholder="Type skill and press Enter..." /></div>
              <div><label style={labelStyle}>Desired Role</label><select style={inputStyle} value={preferences.role} onChange={e=>setPreferences({...preferences, role: e.target.value})}><option value="">Select</option>{rolesList.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
              <div><label style={labelStyle}>Preferred Industry</label><select style={inputStyle} value={preferences.industry} onChange={e=>setPreferences({...preferences, industry: e.target.value})}><option value="">Select</option>{industriesList.map(i=><option key={i} value={i}>{i}</option>)}</select></div>
              <div><label style={labelStyle}>Employment Type</label><select style={inputStyle} value={preferences.empType} onChange={e=>setPreferences({...preferences, empType: e.target.value})}><option value="">Select</option><option>Full Time</option><option>Contract</option><option>Freelance</option></select></div>
              <div><label style={labelStyle}>Work Mode</label><select style={inputStyle} value={preferences.workMode} onChange={e=>setPreferences({...preferences, workMode: e.target.value})}><option value="">Select</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '10px' }}>
              <h2 style={gradientHeader}>Employment History</h2>
              <button type="button" onClick={() => setEmployments([...employments, { company: '', designation: '', start: '', end: '', current: false }])} style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Row</button>
            </div>
            {employments.map((emp, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px', background: '#0b0e14', padding: '20px', borderRadius: '10px', border: '1px solid #1f2937', position: 'relative' }}>
                {employments.length > 1 && <button onClick={() => setEmployments(employments.filter((_, i) => i !== idx))} style={{position: 'absolute', top: '10px', right: '10px', background: '#ef444422', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', padding: '2px 8px'}}>✖</button>}
                <div style={{gridColumn: 'span 2'}}><label style={labelStyle}>Company</label><input style={inputStyle} value={emp.company} onChange={e=>updateEmp(idx, 'company', e.target.value)} /></div>
                <div style={{gridColumn: 'span 2'}}><label style={labelStyle}>Designation</label><input style={inputStyle} value={emp.designation} onChange={e=>updateEmp(idx, 'designation', e.target.value)} /></div>
                <div style={{gridColumn: 'span 2'}}><label style={labelStyle}>Start Date</label><input type="month" style={inputStyle} value={emp.start} onChange={e=>updateEmp(idx, 'start', e.target.value)} /></div>
                <div style={{gridColumn: 'span 2'}}><label style={labelStyle}>End Date</label><input type="month" style={inputStyle} value={emp.end} disabled={emp.current} onChange={e=>updateEmp(idx, 'end', e.target.value)} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={{color: '#d1d5db', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'}}><input type="checkbox" checked={emp.current} onChange={e=>updateEmp(idx, 'current', e.target.checked)} style={{accentColor: '#8b5cf6', width: '16px', height: '16px'}} /> Currently Working Here</label></div>
              </div>
            ))}
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '10px' }}>
              <h2 style={gradientHeader}>Education</h2>
              <button type="button" onClick={() => setEducations([...educations, { course: '', branch: '', institute: '', year: '' }])} style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Row</button>
            </div>
            {educations.map((edu, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', background: '#0b0e14', padding: '20px', borderRadius: '10px', border: '1px solid #1f2937', position: 'relative' }}>
                {educations.length > 1 && <button onClick={() => setEducations(educations.filter((_, i) => i !== idx))} style={{position: 'absolute', top: '10px', right: '10px', background: '#ef444422', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', padding: '2px 8px'}}>✖</button>}
                <div><label style={labelStyle}>Course</label>
                  <select style={inputStyle} value={edu.course} onChange={e=>{updateEdu(idx, 'course', e.target.value); updateEdu(idx, 'branch', '');}}>
                    <option value="">Select</option>
                    {Object.keys(courseBranchMap).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Branch</label>
                  <select style={inputStyle} value={edu.branch} disabled={!edu.course} onChange={e=>updateEdu(idx, 'branch', e.target.value)}>
                    <option value="">Select</option>
                    {(courseBranchMap[edu.course] || []).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Institute</label><input style={inputStyle} value={edu.institute} onChange={e=>updateEdu(idx, 'institute', e.target.value)} /></div>
                <div><label style={labelStyle}>Year</label><input style={inputStyle} type="number" placeholder="YYYY" value={edu.year} onChange={e=>updateEdu(idx, 'year', e.target.value)} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: 35% FOR PHOTO & LINKS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* PHOTO UPLOAD */}
          <div style={{ ...sectionStyle, textAlign: 'center' }}>
            <h2 style={gradientHeader}>Profile Photo</h2>
            <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'linear-gradient(135deg, #1f2937, #111827)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: profileImg ? 'none' : '2px dashed #60a5fa', boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)' }}>
              {profileImg ? <img src={profileImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '60px', color: '#60a5fa' }}>👤</span>}
            </div>
            <button type="button" onClick={() => imgInputRef.current.click()} style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', border: '1px solid #3b82f6', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Upload Photo</button>
          </div>

          {/* SOCIAL LINKS */}
          <div style={sectionStyle}>
            <h2 style={gradientHeader}>Important Links</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div><label style={labelStyle}>LinkedIn URL</label><input style={inputStyle} value={links.linkedin} onChange={e=>setLinks({...links, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." /></div>
              <div><label style={labelStyle}>Other Link (GitHub/Portfolio)</label><input style={inputStyle} value={links.otherLink} onChange={e=>setLinks({...links, otherLink: e.target.value})} placeholder="https://..." /></div>
            </div>
          </div>
        </div>

      </div>

      {/* FULL WIDTH BOTTOM SECTION FOR CHECKBOXES */}
      <div style={{ padding: '0 40px 40px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ ...sectionStyle, display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
            <input type="checkbox" checked={settings.activelyLooking} onChange={e=>setSettings({...settings, activelyLooking: e.target.checked})} style={{width: '20px', height: '20px', accentColor: '#3dd68c'}} /> Actively Looking for Job
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
            <input type="checkbox" checked={settings.canRelocate} onChange={e=>setSettings({...settings, canRelocate: e.target.checked})} style={{width: '20px', height: '20px', accentColor: '#3dd68c'}} /> Can Relocate to other Cities
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
            <input type="checkbox" checked={settings.visibleToRecruiters} onChange={e=>setSettings({...settings, visibleToRecruiters: e.target.checked})} style={{width: '20px', height: '20px', accentColor: '#3dd68c'}} /> Visible to Recruiters
          </label>
        </div>
      </div>
    </Layout>
  );
}