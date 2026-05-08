// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';
import dynamic from 'next/dynamic';

// CRITICAL FIX: Dynamically import Confetti to prevent Next.js SSR crashes
const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

// --- MOTIVATIONAL CONFETTI MESSAGES (50+) ---
const progressMessages = [
  "Boom! Great progress!", "Moving the needle!", "One step closer to closing!", "Keep that momentum!", 
  "Awesome work!", "You're on fire!", "Pipeline is heating up!", "Crushing those KPIs!", 
  "Next stop: Conversion!", "Stellar update!", "Making waves!", "That's how it's done!", 
  "Savage BD skills!", "Unstoppable!", "Another one moves up!", "Closing in on the deal!", 
  "Great follow-up!", "Solid traction!", "Lead is warming up!", "Excellent hustle!", 
  "They can't resist your pitch!", "You're a BD machine!", "Level up!", "Big moves!", 
  "Love to see it!", "Target locked!", "Keep pushing!", "Momentum = Money!", "Fantastic update!", 
  "You've got this!", "Sales ninja in action!", "Prospects love you!", "That's a win!", 
  "Progress tastes sweet!", "Right on track!", "Building that empire!", "Step by step to the top!", 
  "Pipeline perfection!", "Masterful execution!", "Smooth operator!", "Deal dynamics improving!", 
  "Incredible hustle!", "Way to drive it forward!", "Turning leads into gold!", "You're crushing it today!", 
  "Phenomenal progress!", "Keep the wins coming!", "That's high-value action!", "Excellent momentum!", "Onwards and upwards!"
];

// --- TAXONOMY DATA ---
const indianLocations = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada"], "Delhi": ["New Delhi", "Dwarka"], "Gujarat": ["Ahmedabad", "Surat"],
  "Haryana": ["Gurugram", "Faridabad"], "Karnataka": ["Bengaluru", "Mysuru"], "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
  "Tamil Nadu": ["Chennai", "Coimbatore"], "Telangana": ["Hyderabad"], "Uttar Pradesh": ["Noida", "Lucknow", "Ghaziabad"],
  "West Bengal": ["Kolkata"], "Others": ["Other"]
};

const designations = ["HR", "HR Manager", "Talent Acquisition", "Founder", "Director", "Manager", "Team Lead", "Other"];
const industries = ["IT Services", "Software Product", "E-commerce", "Finance", "Banking", "EdTech", "Recruitment", "Manufacturing", "Healthcare", "Real Estate", "Logistics", "Other"];
const leadSources = ["LinkedIn", "Reference", "Cold Calling", "WhatsApp", "Email Campaign", "Website", "Existing Client"];
const leadStatuses = ["New Lead", "Contacted", "Follow-up Pending", "Requirement Received", "Interested", "Converted to Client", "Closed"];
const requirementStatuses = ["Hiring Now", "Future Hiring", "Just Discussion", "Requirement Shared", "Need Follow-up"];

// --- CUSTOM HOOK FOR CONFETTI ---
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

// --- UI COMPONENTS ---
const Pill = ({ label, selected, onClick, colorMode = 'default' }) => {
  let bg = selected ? 'rgba(59, 130, 246, 0.2)' : '#0b0e14';
  let border = selected ? '1px solid #3B82F6' : '1px solid #374151';
  let color = selected ? '#60a5fa' : '#9ca3af';

  if (colorMode === 'Hot' && selected) { bg = 'rgba(239, 68, 68, 0.2)'; border = '1px solid #EF4444'; color = '#f87171'; }
  if (colorMode === 'Warm' && selected) { bg = 'rgba(245, 158, 11, 0.2)'; border = '1px solid #F59E0B'; color = '#fbbf24'; }
  if (colorMode === 'Cold' && selected) { bg = 'rgba(16, 185, 129, 0.2)'; border = '1px solid #10B981'; color = '#34d399'; }

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

  const [formData, setFormData] = useState({
    id: null, company_name: '', spoc_name: '', designation: '', spoc_contact: '', spoc_email: '', 
    city: '', state: '', requirement_status: '', sector: '', lead_source: '', priority: '', 
    next_followup: '', stage: 'New Lead', notes: '', feedback: '', tags: [], bd_owner: '', 
    commercial_type: 'Percentage (%)', value: '0'
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => { fetchMandates(); }, []);

  const fetchMandates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bd_mandates').select('*').order('created_at', { ascending: false });
    if (!error && data) setMandates(data);
    setLoading(false);
  };

  const handleSave = async () => {
    const numericValue = parseFloat(formData.value) || 0;
    const safeTags = Array.isArray(formData.tags) ? formData.tags : []; // Safe array parsing
    
    const payload = {
      company_name: formData.company_name, spoc_name: formData.spoc_name, designation: formData.designation,
      spoc_contact: formData.spoc_contact, spoc_email: formData.spoc_email, city: formData.city, 
      state: formData.state, requirement_status: formData.requirement_status, sector: formData.sector, 
      lead_source: formData.lead_source, priority: formData.priority, next_followup: formData.next_followup, 
      stage: formData.stage, notes: formData.notes, feedback: formData.feedback, tags: safeTags, 
      bd_owner: formData.bd_owner, commercial_type: formData.commercial_type, value: numericValue
    };

    if (modalMode === 'edit' && formData.id) {
      const { error } = await supabase.from('bd_mandates').update(payload).eq('id', formData.id);
      if (error) return alert("Error saving: " + error.message);
    } else {
      const { error } = await supabase.from('bd_mandates').insert([payload]);
      if (error) return alert("Error saving: " + error.message);
    }

    setIsModalOpen(false);
    fetchMandates();
  };

  const handleStageChange = async (id, newStage) => {
    const { error } = await supabase.from('bd_mandates').update({ stage: newStage }).eq('id', id);
    if (!error) {
      fetchMandates();
      const randomMsg = progressMessages[Math.floor(Math.random() * progressMessages.length)];
      setConfettiMessage(randomMsg);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const openModal = (mode, mandate = null) => {
    setModalMode(mode);
    if (mandate) {
      // Safe parsing to prevent map() crashes
      const parsedTags = Array.isArray(mandate.tags) ? mandate.tags : (typeof mandate.tags === 'string' ? mandate.tags.split(',') : []);
      setFormData({ ...mandate, tags: parsedTags });
    } else {
      setFormData({ 
        id: null, company_name: '', spoc_name: '', designation: '', spoc_contact: '', spoc_email: '', 
        city: '', state: '', requirement_status: '', sector: '', lead_source: '', priority: '', 
        next_followup: '', stage: 'New Lead', notes: '', feedback: '', tags: [], bd_owner: '', 
        commercial_type: 'Percentage (%)', value: '' 
      });
    }
    setIsModalOpen(true);
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
      if (!currentTags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...currentTags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
    setFormData({ ...formData, tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const inputStyle = { width: '100%', background: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase' };

  // Safe fallback for UI rendering
  const renderTags = Array.isArray(formData.tags) ? formData.tags : [];

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

      <div style={{ padding: '30px', background: '#070B1A', minHeight: '100vh', color: '#fff', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', background: 'linear-gradient(90deg, #A855F7, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            BD Enterprise Pipeline
          </h1>
          <button onClick={() => openModal('add')} style={{ background: 'linear-gradient(90deg, #3DD68C, #10B981)', color: '#000', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
            + New BD Lead
          </button>
        </div>

        <div style={{ background: '#11182D', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '20px' }}>Company & Contact</th>
                <th style={{ padding: '20px' }}>Location & Priority</th>
                <th style={{ padding: '20px' }}>Lead Status</th>
                <th style={{ padding: '20px' }}>Follow-up</th>
                <th style={{ padding: '20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mandates.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.3s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.02)'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>
                  <td style={{ padding: '20px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{m.company_name}</div>
                    <div style={{ color: '#60A5FA', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>{m.spoc_name || 'No Contact'} <span style={{color: '#6B7280', fontWeight: 'normal'}}>• {m.designation}</span></div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#D1D5DB', marginBottom: '6px' }}>{m.city}</div>
                    {m.priority && <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', background: m.priority==='Hot'?'#ef444422':m.priority==='Warm'?'#f59e0b22':'#10b98122', color: m.priority==='Hot'?'#f87171':m.priority==='Warm'?'#fbbf24':'#34d399' }}>{m.priority}</span>}
                  </td>
                  <td style={{ padding: '20px' }}>
                    <select 
                      value={m.stage || 'New Lead'} 
                      onChange={(e) => handleStageChange(m.id, e.target.value)}
                      style={{ background: '#0b0e14', color: '#fff', border: '1px solid #374151', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', outline: 'none', cursor: 'pointer', fontWeight: '600' }}
                    >
                      {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '20px', fontSize: '13px', color: '#D1D5DB' }}>
                    {m.next_followup || 'Not Set'}
                  </td>
                  <td style={{ padding: '20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button onClick={() => openModal('view', m)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>View</button>
                      <button onClick={() => openModal('edit', m)} style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
              {mandates.length === 0 && !loading && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '14px' }}>No leads found. Create one to get started.</td></tr>
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
              
              <h3 style={{ color: '#60A5FA', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', borderBottom: '1px solid #1F2937', paddingBottom: '10px' }}>1. Basic Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>1. Company Name</label><input disabled={modalMode === 'view'} style={inputStyle} value={formData.company_name || ''} onChange={e=>setFormData({...formData, company_name: e.target.value})} /></div>
                <div><label style={labelStyle}>2. Contact Person Name</label><input disabled={modalMode === 'view'} style={inputStyle} value={formData.spoc_name || ''} onChange={e=>setFormData({...formData, spoc_name: e.target.value})} /></div>
                <div><label style={labelStyle}>3. Designation</label><select disabled={modalMode === 'view'} style={inputStyle} value={formData.designation || ''} onChange={e=>setFormData({...formData, designation: e.target.value})}><option value="">Select</option>{designations.map(d=><option key={d}>{d}</option>)}</select></div>
                <div><label style={labelStyle}>4. Mobile Number</label><input type="number" disabled={modalMode === 'view'} style={inputStyle} value={formData.spoc_contact || ''} onChange={e=>setFormData({...formData, spoc_contact: e.target.value})} /></div>
                <div><label style={labelStyle}>5. Official Email ID</label><input type="email" disabled={modalMode === 'view'} style={inputStyle} value={formData.spoc_email || ''} onChange={e=>setFormData({...formData, spoc_email: e.target.value})} /></div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>6. Company Location</label>
                  <select disabled={modalMode === 'view'} style={inputStyle} value={formData.city || ''} onChange={e=>setFormData({...formData, city: e.target.value})}>
                    <option value="">Select City</option>
                    {Object.keys(indianLocations).map(st => <optgroup key={st} label={st} style={{background:'#0b0e14', color:'#A855F7'}}>{indianLocations[st].map(c => <option key={c} value={c} style={{color:'#fff'}}>{c}</option>)}</optgroup>)}
                  </select>
                </div>
              </div>

              <h3 style={{ color: '#A855F7', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', borderBottom: '1px solid #1F2937', paddingBottom: '10px' }}>2. Lead Intelligence</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>7. Requirement Status</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {requirementStatuses.map(s => <Pill key={s} label={s} selected={formData.requirement_status === s} onClick={() => modalMode !== 'view' && setFormData({...formData, requirement_status: s})} />)}
                  </div>
                </div>
                <div><label style={labelStyle}>8. Primary Industry</label><select disabled={modalMode === 'view'} style={inputStyle} value={formData.sector || ''} onChange={e=>setFormData({...formData, sector: e.target.value})}><option value="">Select</option>{industries.map(i=><option key={i}>{i}</option>)}</select></div>
                <div><label style={labelStyle}>9. Lead Source</label><select disabled={modalMode === 'view'} style={inputStyle} value={formData.lead_source || ''} onChange={e=>setFormData({...formData, lead_source: e.target.value})}><option value="">Select</option>{leadSources.map(l=><option key={l}>{l}</option>)}</select></div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>10. Lead Priority</label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <Pill label="🔥 Hot" colorMode="Hot" selected={formData.priority === 'Hot'} onClick={() => modalMode !== 'view' && setFormData({...formData, priority: 'Hot'})} />
                    <Pill label="☀️ Warm" colorMode="Warm" selected={formData.priority === 'Warm'} onClick={() => modalMode !== 'view' && setFormData({...formData, priority: 'Warm'})} />
                    <Pill label="❄️ Cold" colorMode="Cold" selected={formData.priority === 'Cold'} onClick={() => modalMode !== 'view' && setFormData({...formData, priority: 'Cold'})} />
                  </div>
                </div>
                <div><label style={labelStyle}>11. Team Member Assigned</label><input disabled={modalMode === 'view'} style={inputStyle} placeholder="e.g. Rahul Sharma" value={formData.bd_owner || ''} onChange={e=>setFormData({...formData, bd_owner: e.target.value})} /></div>
                <div><label style={labelStyle}>12. Lead Status</label><select disabled={modalMode === 'view'} style={inputStyle} value={formData.stage || 'New Lead'} onChange={e=>setFormData({...formData, stage: e.target.value})}>{leadStatuses.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>

              <h3 style={{ color: '#3DD68C', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', borderBottom: '1px solid #1F2937', paddingBottom: '10px' }}>3. Actionables & Feedback</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <div><label style={labelStyle}>13. Next Follow-up Date</label><input type="date" disabled={modalMode === 'view'} style={{...inputStyle, width: '50%'}} value={formData.next_followup || ''} onChange={e=>setFormData({...formData, next_followup: e.target.value})} /></div>
                <div><label style={labelStyle}>14. Feedback After Follow-up</label><textarea disabled={modalMode === 'view'} style={{...inputStyle, height: '80px', resize: 'vertical'}} value={formData.feedback || ''} onChange={e=>setFormData({...formData, feedback: e.target.value})} placeholder="What was the outcome of the last call?" /></div>
                <div><label style={labelStyle}>15. Notes / Discussion Summary</label><textarea disabled={modalMode === 'view'} style={{...inputStyle, height: '100px', resize: 'vertical'}} value={formData.notes || ''} onChange={e=>setFormData({...formData, notes: e.target.value})} placeholder="Detailed summary of requirements..." /></div>
                
                <div>
                  <label style={labelStyle}>16. Custom Tags</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {renderTags.map(t => (
                      <span key={t} style={{ background: 'rgba(196,113,237,0.15)', color: '#e88bfa', border: '1px solid #c471ed', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                        {t} {modalMode !== 'view' && <span style={{cursor:'pointer', marginLeft:'5px'}} onClick={()=>removeTag(t)}>✕</span>}
                      </span>
                    ))}
                  </div>
                  {modalMode !== 'view' && <input style={inputStyle} placeholder="Type tag and press Enter..." value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag} />}
                </div>
              </div>

            </div>

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