// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

const progressMessages = [
  "Boom! Great progress!", "Moving the needle!", "One step closer to closing!", "Keep that momentum!", 
  "Awesome work!", "You're on fire!", "Pipeline is heating up!", "Crushing those KPIs!", 
  "Next stop: Conversion!", "Stellar update!", "Making waves!", "That's how it's done!"
];

const indianLocations = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada"], "Delhi": ["New Delhi", "Dwarka", "Rohini"], 
  "Gujarat": ["Ahmedabad", "Surat"], "Haryana": ["Gurugram", "Faridabad"], 
  "Karnataka": ["Bengaluru", "Mysuru"], "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Navi Mumbai"],
  "Tamil Nadu": ["Chennai", "Coimbatore"], "Telangana": ["Hyderabad"], 
  "Uttar Pradesh": ["Noida", "Lucknow", "Ghaziabad"], "West Bengal": ["Kolkata"], "Others": ["Other"]
};

const designations = ["HR", "HR Manager", "Talent Acquisition", "Founder", "Director", "Manager", "Team Lead", "Other"];
const industries = ["IT Services", "Software Product", "E-commerce", "Finance", "Banking", "EdTech", "Recruitment", "Manufacturing", "Healthcare", "Real Estate", "Logistics", "Other"];
const leadSources = ["LinkedIn", "Reference", "Cold Calling", "WhatsApp", "Email Campaign", "Website", "Existing Client"];
// Array logic for Confetti progress checking
const leadStatuses = ["New Lead", "Contacted", "Follow-up Pending", "Requirement Received", "Interested", "Negotiation", "Converted to Client", "Closed"];
const requirementStatuses = ["Hiring Now", "Future Hiring", "Just Discussion", "Requirement Shared", "Need Follow-up"];
const teamMembers = ["Pravin", "Rahul Sharma", "Neha Singh", "Amit Kumar", "Priya Desai", "Vikas Tech"]; // Mock team members

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: undefined, height: undefined });
  useEffect(() => {
    function handleResize() { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

const Pill = ({ label, selected, onClick, colorMode = 'default' }) => {
  let background = selected ? 'rgba(59, 130, 246, 0.2)' : '#0b0e14';
  let border = selected ? '1px solid #3B82F6' : '1px solid #374151';
  let color = selected ? '#60a5fa' : '#9ca3af';

  if (colorMode === 'Hot' && selected) { background = 'rgba(239, 68, 68, 0.2)'; border = '1px solid #EF4444'; color = '#f87171'; }
  if (colorMode === 'Warm' && selected) { background = 'rgba(245, 158, 11, 0.2)'; border = '1px solid #F59E0B'; color = '#fbbf24'; }
  if (colorMode === 'Cold' && selected) { background = 'rgba(16, 185, 129, 0.2)'; border = '1px solid #10B981'; color = '#34d399'; }

  return (
    <button type="button" onClick={onClick} style={{ padding: '6px 14px', borderRadius: '20px', border, background, color, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
};

export default function BDPipeline() {
  const { width, height } = useWindowSize();
  const [mandates, setMandates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiMessage, setConfettiMessage] = useState("");

  const CURRENT_USER = "Pravin (AO)";

  const [formData, setFormData] = useState({
    id: null, company_name: '', spoc_name: '', designation: '', spoc_contact: '', spoc_email: '', 
    city: '', requirement_status: '', sector: '', lead_source: '', priority: '', 
    next_followup: '', stage: 'New Lead', notes: '', tags: [], bd_owner: CURRENT_USER, 
    commercial_type: 'Percentage (%)', value: '', agreement_file: '',
    feedbackList: [], newFeedbackText: '', currentTaggedMembers: []
  });

  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef(null);
  const bulkInputRef = useRef(null);
  
  // Mention Logic States
  const feedbackRef = useRef(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  useEffect(() => { fetchMandates(); }, []);

  const parseSafeJSON = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch (e) { return fallback; }
  };

  const fetchMandates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bd_pipeline').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      // Map data to safely parse JSON strings if Supabase returns them as text
      const mapped = data.map(d => ({
        ...d,
        tags: parseSafeJSON(d.tags, []),
        feedbackList: parseSafeJSON(d.feedback, [])
      }));
      setMandates(mapped);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    // Stringify JSON to avoid Supabase text-column crashes
    const payload = {
      company_name: formData.company_name, spoc_name: formData.spoc_name, designation: formData.designation,
      spoc_contact: formData.spoc_contact, spoc_email: formData.spoc_email, city: formData.city, 
      requirement_status: formData.requirement_status, sector: formData.sector, lead_source: formData.lead_source, 
      priority: formData.priority, next_followup: formData.next_followup, stage: formData.stage, 
      notes: formData.notes, bd_owner: formData.bd_owner, commercial_type: formData.commercial_type, 
      value: formData.value, agreement_file: formData.agreement_file,
      tags: JSON.stringify(formData.tags), 
      feedback: JSON.stringify(formData.feedbackList)
    };

    if (modalMode === 'edit' && formData.id) {
      const { error } = await supabase.from('bd_pipeline').update(payload).eq('id', formData.id);
      if (error) return alert("Database Error: " + error.message);
    } else {
      const { error } = await supabase.from('bd_pipeline').insert([payload]);
      if (error) return alert("Database Error: " + error.message);
    }

    setIsModalOpen(false);
    fetchMandates();
  };

  const handleStageChange = async (id, oldStage, newStage) => {
    const { error } = await supabase.from('bd_pipeline').update({ stage: newStage }).eq('id', id);
    if (!error) {
      fetchMandates();
      
      // CONFETTI LOGIC: Only trigger if moving forward
      const oldIndex = leadStatuses.indexOf(oldStage);
      const newIndex = leadStatuses.indexOf(newStage);
      
      if (newIndex > oldIndex) {
        const randomMsg = progressMessages[Math.floor(Math.random() * progressMessages.length)];
        setConfettiMessage(randomMsg);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000); 
      }
    }
  };

  const openModal = (mode, mandate = null) => {
    setModalMode(mode);
    if (mandate) {
      setFormData({ 
        ...mandate, 
        tags: parseSafeJSON(mandate.tags, []),
        feedbackList: parseSafeJSON(mandate.feedback, []),
        newFeedbackText: '', currentTaggedMembers: [],
        bd_owner: mandate.bd_owner || CURRENT_USER 
      });
    } else {
      setFormData({ 
        id: null, company_name: '', spoc_name: '', designation: '', spoc_contact: '', spoc_email: '', 
        city: '', requirement_status: '', sector: '', lead_source: '', priority: '', 
        next_followup: '', stage: 'New Lead', notes: '', tags: [], bd_owner: CURRENT_USER,
        commercial_type: 'Percentage (%)', value: '', agreement_file: '',
        feedbackList: [], newFeedbackText: '', currentTaggedMembers: []
      });
    }
    setIsModalOpen(true);
  };

  // ----- FEEDBACK SYSTEM -----
  const addNewFeedback = () => {
    if (!formData.newFeedbackText.trim()) return;
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB') + " " + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    const newEntry = {
      date: formattedDate,
      author: CURRENT_USER,
      text: formData.newFeedbackText,
      tagged: formData.currentTaggedMembers
    };

    setFormData({
      ...formData,
      feedbackList: [newEntry, ...formData.feedbackList], // Add to top
      newFeedbackText: '',
      currentTaggedMembers: []
    });
  };

  const handleFeedbackChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, newFeedbackText: val });

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      setShowMentionMenu(true);
      setMentionFilter(match[1].toLowerCase());
    } else {
      setShowMentionMenu(false);
    }
  };

  const insertMention = (name) => {
    const cursorPosition = feedbackRef.current?.selectionStart || formData.newFeedbackText.length;
    const textBeforeCursor = formData.newFeedbackText.slice(0, cursorPosition);
    const textAfterCursor = formData.newFeedbackText.slice(cursorPosition);
    const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${name} `);
    
    // Auto-add to tagged array
    const newTags = formData.currentTaggedMembers.includes(name) ? formData.currentTaggedMembers : [...formData.currentTaggedMembers, name];
    
    setFormData({ ...formData, newFeedbackText: newTextBefore + textAfterCursor, currentTaggedMembers: newTags });
    setShowMentionMenu(false);
    feedbackRef.current?.focus();
  };

  const handleDirectTagToggle = (e) => {
    const name = e.target.value;
    if(!name) return;
    const isTagged = formData.currentTaggedMembers.includes(name);
    setFormData({
      ...formData,
      currentTaggedMembers: isTagged ? formData.currentTaggedMembers.filter(t => t !== name) : [...formData.currentTaggedMembers, name]
    });
  };

  // ----- BULK IMPORT CSV LOGIC -----
  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n');
      if (rows.length < 2) return alert("CSV is empty or invalid");

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/ /g, '_'));
      const parsedData = [];

      for (let i = 1; i < rows.length; i++) {
        if(!rows[i].trim()) continue;
        const cols = rows[i].split(',');
        let rowObj = { bd_owner: CURRENT_USER, stage: 'New Lead' }; // Defaults
        
        headers.forEach((header, index) => {
          if (cols[index]) rowObj[header] = cols[index].trim();
        });
        
        // Ensure required fields mapping (basic safe parse)
        if(rowObj.company_name) parsedData.push(rowObj);
      }

      if(parsedData.length > 0) {
        const { error } = await supabase.from('bd_pipeline').insert(parsedData);
        if (error) alert("Bulk Import Database Error: " + error.message);
        else {
          alert(`Successfully imported ${parsedData.length} leads!`);
          fetchMandates();
        }
      }
    };
    reader.readAsText(file);
  };


  const inputStyle = { width: '100%', background: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };

  const filteredTeamMembers = teamMembers.filter(m => m.toLowerCase().includes(mentionFilter));

  return (
    <Layout>
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Confetti width={width} height={height} recycle={false} numberOfPieces={800} gravity={0.15} />
          <div style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)', padding: '20px 40px', borderRadius: '50px', color: '#fff', fontSize: '24px', fontWeight: '800', boxShadow: '0 10px 40px rgba(16,185,129,0.5)', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
            🎉 {confettiMessage}
          </div>
          <style>{`@keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}

      {/* FIXED INVISIBLE CALENDAR ICON AND ADDED PREMIUM BACKGROUND */}
      <style dangerouslySetInnerHTML={{__html: `
        .premium-bg { background: radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 40%), #050810; }
        .pipeline-container { padding: 30px; min-height: 100vh; color: #fff; width: 100%; box-sizing: border-box; }
        .table-wrapper { background: #11182D; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); overflow-x: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .pipeline-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 800px; }
        .pipeline-table th { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #9CA3AF; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        .pipeline-table td { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s; }
        .pipeline-table tr:hover td { background-color: rgba(255,255,255,0.02); }
        
        /* FIX INVISIBLE CALENDAR ICON */
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; opacity: 0.8; transition: 0.2s; }
        input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }

        @media (max-width: 768px) {
          .pipeline-container { padding: 15px; }
          .header-row { flex-direction: column; align-items: flex-start !important; gap: 15px; }
        }
      `}} />

      <div className="pipeline-container premium-bg">
        
        <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', background: 'linear-gradient(90deg, #A855F7, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            BD Lead Pipeline
          </h1>
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* BULK IMPORT BUTTON */}
            <button onClick={() => bulkInputRef.current.click()} style={{ background: '#1F2937', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: '1px solid #374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📁 Bulk Import CSV
            </button>
            <input type="file" hidden ref={bulkInputRef} accept=".csv" onChange={handleCSVImport} />

            <button onClick={() => openModal('add')} style={{ background: 'linear-gradient(90deg, #3DD68C, #10B981)', color: '#000', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', whiteSpace: 'nowrap' }}>
              + New BD Lead
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="pipeline-table">
            <thead>
              <tr>
                <th>Company & Contact</th>
                <th>Location & Priority</th>
                <th>Deal Type</th>
                <th>Lead Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mandates.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{m.company_name}</div>
                    <div style={{ color: '#60A5FA', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>
                      {m.spoc_name || 'No Contact'} <span style={{color: '#6B7280', fontWeight: 'normal'}}>• {m.designation || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#D1D5DB', marginBottom: '6px' }}>{m.city || 'Location N/A'}</div>
                    {m.priority && (
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', background: m.priority==='Hot'?'#ef444422':m.priority==='Warm'?'#f59e0b22':'#10b98122', color: m.priority==='Hot'?'#f87171':m.priority==='Warm'?'#fbbf24':'#34d399' }}>
                        {m.priority}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#F59E0B', fontWeight: 'bold' }}>{m.commercial_type || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{m.commercial_type === 'Percentage (%)' ? `${m.value || 0}%` : `₹${m.value || 0}`}</div>
                  </td>
                  <td>
                    <select 
                      value={m.stage || 'New Lead'} 
                      onChange={(e) => handleStageChange(m.id, m.stage, e.target.value)}
                      style={{ background: '#0b0e14', color: '#fff', border: '1px solid #374151', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', outline: 'none', cursor: 'pointer', fontWeight: '600' }}
                    >
                      {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button onClick={() => openModal('view', m)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>View</button>
                      <button onClick={() => openModal('edit', m)} style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
              {mandates.length === 0 && !loading && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '14px' }}>No leads found. Create or Import to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#11182D', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '16px', border: '1px solid #374151', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            <div style={{ padding: '20px 30px', borderBottom: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ color: '#10B981', margin: 0, fontSize: '20px', fontWeight: '800' }}>
                {modalMode === 'add' ? '✨ New Staffing BD Lead' : modalMode === 'edit' ? '✏️ Edit BD Lead' : '📄 View Lead Details'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
              
              {/* SECTION 1: BASIC INFO */}
              <h3 style={{ color: '#60A5FA', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', borderBottom: '1px solid #1F2937', paddingBottom: '10px' }}>1. Basic Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Company Name</label><input disabled={modalMode === 'view'} style={inputStyle} value={formData.company_name || ''} onChange={e=>setFormData({...formData, company_name: e.target.value})} /></div>
                <div><label style={labelStyle}>Contact Person Name</label><input disabled={modalMode === 'view'} style={inputStyle} value={formData.spoc_name || ''} onChange={e=>setFormData({...formData, spoc_name: e.target.value})} /></div>
                <div><label style={labelStyle}>Designation</label><select disabled={modalMode === 'view'} style={inputStyle} value={formData.designation || ''} onChange={e=>setFormData({...formData, designation: e.target.value})}><option value="">Select</option>{designations.map(d=><option key={d}>{d}</option>)}</select></div>
                <div><label style={labelStyle}>Mobile Number</label><input type="number" disabled={modalMode === 'view'} style={inputStyle} value={formData.spoc_contact || ''} onChange={e=>setFormData({...formData, spoc_contact: e.target.value})} /></div>
                <div><label style={labelStyle}>Official Email ID</label><input type="email" disabled={modalMode === 'view'} style={inputStyle} value={formData.spoc_email || ''} onChange={e=>setFormData({...formData, spoc_email: e.target.value})} /></div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Company Location</label>
                  <select disabled={modalMode === 'view'} style={inputStyle} value={formData.city || ''} onChange={e=>setFormData({...formData, city: e.target.value})}>
                    <option value="">Select City</option>
                    {Object.keys(indianLocations).map(st => <optgroup key={st} label={st} style={{background:'#0b0e14', color:'#A855F7'}}>{indianLocations[st].map(c => <option key={c} value={c} style={{color:'#fff'}}>{c}</option>)}</optgroup>)}
                  </select>
                </div>
                
                {/* RESTORED DEAL TYPE AND VALUE */}
                <div>
                  <label style={labelStyle}>Deal Type</label>
                  <select disabled={modalMode === 'view'} style={inputStyle} value={formData.commercial_type || 'Percentage (%)'} onChange={e=>setFormData({...formData, commercial_type: e.target.value})}>
                    <option>Percentage (%)</option><option>Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Deal Value</label>
                  <input type="number" disabled={modalMode === 'view'} style={inputStyle} placeholder="e.g. 8.33 or 50000" value={formData.value || ''} onChange={e=>setFormData({...formData, value: e.target.value})} />
                </div>
              </div>

              {/* SECTION 2: LEAD INTELLIGENCE */}
              <h3 style={{ color: '#A855F7', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', borderBottom: '1px solid #1F2937', paddingBottom: '10px' }}>2. Lead Intelligence</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Requirement Status</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {requirementStatuses.map(s => <Pill key={s} label={s} selected={formData.requirement_status === s} onClick={() => modalMode !== 'view' && setFormData({...formData, requirement_status: s})} />)}
                  </div>
                </div>
                <div><label style={labelStyle}>Primary Industry</label><select disabled={modalMode === 'view'} style={inputStyle} value={formData.sector || ''} onChange={e=>setFormData({...formData, sector: e.target.value})}><option value="">Select</option>{industries.map(i=><option key={i}>{i}</option>)}</select></div>
                <div><label style={labelStyle}>Lead Source</label><select disabled={modalMode === 'view'} style={inputStyle} value={formData.lead_source || ''} onChange={e=>setFormData({...formData, lead_source: e.target.value})}><option value="">Select</option>{leadSources.map(l=><option key={l}>{l}</option>)}</select></div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Lead Priority</label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <Pill label="🔥 Hot" colorMode="Hot" selected={formData.priority === 'Hot'} onClick={() => modalMode !== 'view' && setFormData({...formData, priority: 'Hot'})} />
                    <Pill label="☀️ Warm" colorMode="Warm" selected={formData.priority === 'Warm'} onClick={() => modalMode !== 'view' && setFormData({...formData, priority: 'Warm'})} />
                    <Pill label="❄️ Cold" colorMode="Cold" selected={formData.priority === 'Cold'} onClick={() => modalMode !== 'view' && setFormData({...formData, priority: 'Cold'})} />
                  </div>
                </div>
                
                <div>
                  <label style={labelStyle}>BD Owner (Auto Recorded)</label>
                  <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.02)', color: '#60A5FA', cursor: 'not-allowed' }}>{formData.bd_owner}</div>
                </div>
                <div><label style={labelStyle}>Lead Status</label><select disabled={modalMode === 'view'} style={inputStyle} value={formData.stage || 'New Lead'} onChange={e=>setFormData({...formData, stage: e.target.value})}>{leadStatuses.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>

              {/* SECTION 3: ACTIONABLES & AGREEMENTS */}
              <h3 style={{ color: '#3DD68C', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', borderBottom: '1px solid #1F2937', paddingBottom: '10px' }}>3. Actionables & Attachments</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                <div><label style={labelStyle}>Next Follow-up Date</label><input type="date" disabled={modalMode === 'view'} style={inputStyle} value={formData.next_followup || ''} onChange={e=>setFormData({...formData, next_followup: e.target.value})} /></div>
                
                {/* AGREEMENT ATTACHMENT */}
                <div>
                  <label style={labelStyle}>Upload Agreement / Document</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="file" hidden ref={fileInputRef} onChange={(e) => setFormData({...formData, agreement_file: e.target.files[0]?.name || ''})} />
                    <button type="button" disabled={modalMode === 'view'} onClick={() => fileInputRef.current.click()} style={{ flex: 1, background: '#1F2937', color: '#fff', border: '1px solid #374151', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                      {formData.agreement_file ? `📄 ${formData.agreement_file}` : '📎 Select File...'}
                    </button>
                    {formData.agreement_file && <button type="button" onClick={() => setFormData({...formData, agreement_file: ''})} style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>✕</button>}
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>General Notes / Discussion Summary</label><textarea disabled={modalMode === 'view'} style={{...inputStyle, height: '80px', resize: 'vertical'}} value={formData.notes || ''} onChange={e=>setFormData({...formData, notes: e.target.value})} placeholder="Detailed summary of requirements..." /></div>
              </div>

              {/* SECTION 4: INTERACTION HISTORY (FEEDBACK) */}
              <h3 style={{ color: '#F59E0B', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', borderBottom: '1px solid #1F2937', paddingBottom: '10px' }}>4. Interaction History (Feedback)</h3>
              <div style={{ background: '#0b0e14', padding: '20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
                
                {/* PREVIOUS FEEDBACKS LIST */}
                <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                  {formData.feedbackList.length === 0 ? <div style={{ color: '#6B7280', fontSize: '12px', fontStyle: 'italic' }}>No feedback recorded yet.</div> : null}
                  {formData.feedbackList.map((fb, idx) => (
                    <div key={idx} style={{ padding: '12px', background: '#11182D', borderRadius: '8px', marginBottom: '10px', borderLeft: '3px solid #3B82F6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <strong style={{ color: '#fff', fontSize: '12px' }}>{fb.author}</strong>
                        <span style={{ color: '#9CA3AF', fontSize: '10px' }}>{fb.date}</span>
                      </div>
                      <div style={{ color: '#D1D5DB', fontSize: '13px' }}>{fb.text}</div>
                      {fb.tagged && fb.tagged.length > 0 && <div style={{ color: '#A855F7', fontSize: '11px', marginTop: '6px', fontWeight: 'bold' }}>Tagged: {fb.tagged.map(t => `@${t}`).join(', ')}</div>}
                    </div>
                  ))}
                </div>

                {/* NEW FEEDBACK INPUT */}
                {modalMode !== 'view' && (
                  <div style={{ borderTop: '1px solid #1F2937', paddingTop: '20px' }}>
                    <div style={{ position: 'relative' }}>
                      <label style={labelStyle}>Add New Feedback (Type @ to tag)</label>
                      <textarea 
                        ref={feedbackRef}
                        style={{...inputStyle, height: '80px', resize: 'vertical', background: '#11182D'}} 
                        value={formData.newFeedbackText} 
                        onChange={handleFeedbackChange} 
                        placeholder="What was the outcome of the last call? Type @ to tag..." 
                      />
                      
                      {/* @ MENTION MENU */}
                      {showMentionMenu && filteredTeamMembers.length > 0 && (
                        <div style={{ position: 'absolute', bottom: '100%', left: 0, background: '#1F2937', border: '1px solid #3B82F6', borderRadius: '8px', overflow: 'hidden', zIndex: 10, width: '250px', boxShadow: '0 -5px 15px rgba(0,0,0,0.8)' }}>
                          {filteredTeamMembers.map(member => (
                            <div key={member} onClick={() => insertMention(member)} style={{ padding: '10px 15px', cursor: 'pointer', color: '#fff', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#3B82F6'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>
                              <span style={{ color: '#60A5FA', marginRight: '5px' }}>@</span>{member}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* DIRECT DROPDOWN TAGGING AS REQUESTED */}
                    <div style={{ display: 'flex', gap: '15px', marginTop: '15px', alignItems: 'center' }}>
                      <select style={{...inputStyle, flex: 1}} onChange={handleDirectTagToggle} value="">
                        <option value="">Select Team Member to Tag...</option>
                        {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      
                      <button type="button" onClick={addNewFeedback} style={{ background: '#3B82F6', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        + Record Feedback
                      </button>
                    </div>

                    {/* SHOW CURRENTLY TAGGED FOR THIS NEW ENTRY */}
                    {formData.currentTaggedMembers.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                        <span style={{color: '#9CA3AF', fontSize: '11px', alignSelf: 'center'}}>To be tagged: </span>
                        {formData.currentTaggedMembers.map(m => <span key={m} style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#A855F7', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>@{m} <span onClick={()=>handleDirectTagToggle({target: {value: m}})} style={{cursor:'pointer'}}>✕</span></span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* ACTION FOOTERS */}
            {modalMode !== 'view' ? (
              <div style={{ padding: '20px 30px', borderTop: '1px solid #1F2937', display: 'flex', gap: '15px', flexShrink: 0, background: '#0b0e14' }}>
                <button onClick={handleSave} style={{ flex: 1, background: 'linear-gradient(90deg, #3DD68C, #10B981)', color: '#000', padding: '14px', borderRadius: '8px', fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>Save BD Lead</button>
                <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: 'transparent', color: '#9CA3AF', border: '1px solid #374151', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <div style={{ padding: '20px 30px', borderTop: '1px solid #1F2937', flexShrink: 0, background: '#0b0e14' }}>
                <button onClick={() => setIsModalOpen(false)} style={{ width: '100%', background: '#1F2937', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Close Window</button>
              </div>
            )}
            
          </div>
        </div>
      )}
    </Layout>
  );
}