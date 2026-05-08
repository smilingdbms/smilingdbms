// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';
import Confetti from 'react-confetti';

// Custom hook to make Confetti full screen automatically
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

export default function BDPipeline() {
  const { width, height } = useWindowSize();
  const [mandates, setMandates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'

  const [formData, setFormData] = useState({
    id: null, company_name: '', sector: '', city: '', state: '', pincode: '',
    spoc_name: '', spoc_contact: '', spoc_email: '', bd_owner: '', commercial_type: 'Percentage (%)', value: ''
  });

  useEffect(() => { fetchMandates(); }, []);

  const fetchMandates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bd_mandates').select('*').order('created_at', { ascending: false });
    if (!error && data) setMandates(data);
    setLoading(false);
  };

  const handleSave = async () => {
    // CRITICAL FIX: Convert empty strings to 0 to prevent the "invalid input syntax for type numeric" crash
    const numericValue = parseFloat(formData.value) || 0;

    const payload = {
      company_name: formData.company_name, sector: formData.sector, city: formData.city, state: formData.state,
      pincode: formData.pincode, spoc_name: formData.spoc_name, spoc_contact: formData.spoc_contact,
      spoc_email: formData.spoc_email, bd_owner: formData.bd_owner, commercial_type: formData.commercial_type,
      value: numericValue, stage: formData.stage || 'Prospect'
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
      // Trigger Confetti ONLY when stage changes to 'Won'
      if (newStage === 'Won') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000); // Turns off after 5 seconds
      }
    }
  };

  const openModal = (mode, mandate = null) => {
    setModalMode(mode);
    if (mandate) {
      setFormData(mandate);
    } else {
      setFormData({ id: null, company_name: '', sector: '', city: '', state: '', pincode: '', spoc_name: '', spoc_contact: '', spoc_email: '', bd_owner: '', commercial_type: 'Percentage (%)', value: '' });
    }
    setIsModalOpen(true);
  };

  return (
    <Layout>
      {/* Dynamic Confetti Overlay */}
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={600} gravity={0.2} />}
      
      <div style={{ padding: '30px', background: '#070B1A', minHeight: '100vh', color: '#fff', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', background: 'linear-gradient(90deg, #A855F7, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            BD Enterprise Pipeline
          </h1>
          <button onClick={() => openModal('add')} style={{ background: '#10B981', color: '#000', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
            + New Mandate
          </button>
        </div>

        <div style={{ background: '#11182D', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '20px' }}>Company</th>
                <th style={{ padding: '20px' }}>Location</th>
                <th style={{ padding: '20px' }}>Commercials</th>
                <th style={{ padding: '20px' }}>Agreement / Mail</th>
                <th style={{ padding: '20px' }}>Stage</th>
                <th style={{ padding: '20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mandates.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.3s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.02)'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>
                  <td style={{ padding: '20px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{m.company_name}</div>
                    <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px' }}>{m.spoc_name || 'No SPOC'}</div>
                  </td>
                  <td style={{ padding: '20px', fontSize: '13px', color: '#D1D5DB' }}>{m.city}{m.city && m.state ? ', ' : ''}{m.state}</td>
                  <td style={{ padding: '20px', fontSize: '13px', color: '#F59E0B', fontWeight: 'bold' }}>
                    {m.commercial_type === 'Percentage (%)' ? `${m.value}%` : `₹${m.value}`}
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: '#1F2937', color: '#fff', border: '1px solid #374151', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', transition: '0.2s' }}>🔗 Attach</button>
                      <button style={{ background: '#1F2937', color: '#fff', border: '1px solid #374151', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', transition: '0.2s' }}>✉️ Mail</button>
                    </div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <select 
                      value={m.stage || 'Prospect'} 
                      onChange={(e) => handleStageChange(m.id, e.target.value)}
                      style={{ 
                        background: m.stage === 'Won' ? 'rgba(16,185,129,0.1)' : '#0b0e14', 
                        color: m.stage === 'Won' ? '#10B981' : '#fff', 
                        border: m.stage === 'Won' ? '1px solid #10B981' : '1px solid #374151', 
                        padding: '8px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none', cursor: 'pointer', fontWeight: '600'
                      }}
                    >
                      <option value="Prospect">Prospect</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </td>
                  <td style={{ padding: '20px', textAlign: 'right' }}>
                    {/* RESTORED DESCRIPTIVE OPTIONS (VIEW & EDIT) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button onClick={() => openModal('view', m)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>View</button>
                      <button onClick={() => openModal('edit', m)} style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
              {mandates.length === 0 && !loading && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '14px' }}>No mandates found. Create one to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MULTI-PURPOSE MODAL (ADD / EDIT / VIEW) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#11182D', width: '95%', maxWidth: '750px', borderRadius: '16px', border: '1px solid #374151', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '20px 30px', borderBottom: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#10B981', margin: 0, fontSize: '20px', fontWeight: '800' }}>
                {modalMode === 'add' ? 'New Client Mandate' : modalMode === 'edit' ? 'Edit Mandate' : 'View Mandate Details'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: '24px', cursor: 'pointer', transition: '0.2s' }}>✕</button>
            </div>
            
            <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase' }}>Company Name</label><input disabled={modalMode === 'view'} style={{ width: '100%', background: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }} value={formData.company_name} onChange={e=>setFormData({...formData, company_name: e.target.value})} /></div>
              <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase' }}>City</label><input disabled={modalMode === 'view'} style={{ width: '100%', background: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }} value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} /></div>
              <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase' }}>State</label><input disabled={modalMode === 'view'} style={{ width: '100%', background: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }} value={formData.state} onChange={e=>setFormData({...formData, state: e.target.value})} /></div>
              <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase' }}>SPOC Name</label><input disabled={modalMode === 'view'} style={{ width: '100%', background: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }} value={formData.spoc_name} onChange={e=>setFormData({...formData, spoc_name: e.target.value})} /></div>
              <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase' }}>SPOC Contact</label><input disabled={modalMode === 'view'} style={{ width: '100%', background: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }} value={formData.spoc_contact} onChange={e=>setFormData({...formData, spoc_contact: e.target.value})} /></div>
              <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase' }}>Commercial Type</label><select disabled={modalMode === 'view'} style={{ width: '100%', background: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }} value={formData.commercial_type} onChange={e=>setFormData({...formData, commercial_type: e.target.value})}><option>Percentage (%)</option><option>Fixed (₹)</option></select></div>
              <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase' }}>Value</label><input type="number" disabled={modalMode === 'view'} placeholder="0" style={{ width: '100%', background: '#0b0e14', border: '1px solid #374151', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }} value={formData.value} onChange={e=>setFormData({...formData, value: e.target.value})} /></div>
            </div>

            {modalMode !== 'view' ? (
              <div style={{ padding: '20px 30px', borderTop: '1px solid #1F2937', display: 'flex', gap: '15px' }}>
                <button onClick={handleSave} style={{ flex: 1, background: 'linear-gradient(90deg, #3DD68C, #10B981)', color: '#000', padding: '14px', borderRadius: '8px', fontWeight: '800', border: 'none', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>Save Mandate</button>
                <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: 'transparent', color: '#9CA3AF', border: '1px solid #374151', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>Cancel</button>
              </div>
            ) : (
              <div style={{ padding: '20px 30px', borderTop: '1px solid #1F2937' }}>
                <button onClick={() => setIsModalOpen(false)} style={{ width: '100%', background: '#1F2937', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Close Window</button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}