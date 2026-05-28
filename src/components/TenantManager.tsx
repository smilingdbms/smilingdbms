// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TenantManager() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_code: '',
    owner_name: '',
    owner_email: '',
    plan_type: 'Free' // Defaulting to Free to prevent accidental premium access
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    setLoading(true);
    const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    if (!error && data) setTenants(data);
    setLoading(false);
  }

  const handleAddTenant = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('tenants').insert([formData]);
    
    if (error) {
      alert("Error adding consultancy: " + error.message);
    } else {
      fetchTenants();
      setIsModalOpen(false);
      setFormData({ company_name: '', company_code: '', owner_name: '', owner_email: '', plan_type: 'Free' });
      
      const userRes = await supabase.auth.getUser();
      if(userRes.data?.user) {
        await supabase.from('audit_logs').insert([{
          user_id: userRes.data.user.id,
          action: 'TENANT_ONBOARDED',
          details: `Onboarded: ${formData.company_name} | Plan: ${formData.plan_type}`
        }]);
      }
    }
  };

  const getPlanBadge = (plan) => {
    const colors = {
      'Free': { bg: 'rgba(107, 114, 128, 0.1)', color: 'var(--mu)' },
      'Starter': { bg: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA' },
      'Pro': { bg: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' },
      'Enterprise': { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }
    };
    const style = colors[plan] || colors['Free'];
    return (
      <span style={{ background: style.bg, color: style.color, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
        {plan}
      </span>
    );
  };

  if (loading) return <div style={{ color: 'var(--mu2)', padding: '20px' }}>Loading consultancies...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>Consultancy Onboarding</h1>
          <p style={{ margin: 0, color: 'var(--mu)', fontSize: '13px', marginTop: '5px' }}>Manage all client agencies and their isolated databases.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ background: '#3B82F6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}>
          + Onboard New Agency
        </button>
      </div>

      <div style={{ background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--bg3)', overflow: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg3)' }}>
            <tr>
              <th style={{ padding: '15px', color: 'var(--mu)', fontSize: '11px', textTransform: 'uppercase' }}>Company Details</th>
              <th style={{ padding: '15px', color: 'var(--mu)', fontSize: '11px', textTransform: 'uppercase' }}>Company Code</th>
              <th style={{ padding: '15px', color: 'var(--mu)', fontSize: '11px', textTransform: 'uppercase' }}>Account Owner</th>
              <th style={{ padding: '15px', color: 'var(--mu)', fontSize: '11px', textTransform: 'uppercase' }}>Subscription Plan</th>
              <th style={{ padding: '15px', color: 'var(--mu)', fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--mu2)' }}>No consultancies onboarded yet.</td></tr>
            ) : (
              tenants.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--bg3)' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#fff' }}>{t.company_name}</td>
                  <td style={{ padding: '15px' }}><span style={{ border: '1px solid var(--bg4)', color: 'var(--tx)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{t.company_code}</span></td>
                  <td style={{ padding: '15px' }}><div style={{ fontSize: '13px', color: 'var(--tx)' }}>{t.owner_name}</div><div style={{ fontSize: '11px', color: 'var(--mu2)' }}>{t.owner_email}</div></td>
                  <td style={{ padding: '15px' }}>{getPlanBadge(t.plan_type)}</td>
                  <td style={{ padding: '15px' }}><span style={{ color: '#10B981', fontSize: '12px' }}>● {t.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg2)', width: '450px', borderRadius: '12px', border: '1px solid var(--bg4)', padding: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Onboard Consultancy</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            
            <form onSubmit={handleAddTenant} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--mu)', fontSize: '12px', marginBottom: '5px' }}>Company Name</label>
                <input required type="text" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--bg4)', color: '#fff', borderRadius: '6px' }} placeholder="e.g. Apex Staffing" />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--mu)', fontSize: '12px', marginBottom: '5px' }}>Unique Company Code</label>
                <input required type="text" value={formData.company_code} onChange={e => setFormData({...formData, company_code: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--bg4)', color: '#fff', borderRadius: '6px' }} placeholder="e.g. APEX01" />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--mu)', fontSize: '12px', marginBottom: '5px' }}>Account Owner (AO) Name</label>
                <input required type="text" value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--bg4)', color: '#fff', borderRadius: '6px' }} placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--mu)', fontSize: '12px', marginBottom: '5px' }}>Account Owner Email</label>
                <input required type="email" value={formData.owner_email} onChange={e => setFormData({...formData, owner_email: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--bg4)', color: '#fff', borderRadius: '6px' }} placeholder="rahul@apexstaffing.com" />
              </div>
              
              {/* NAYA FEATURE: DROPDOWN FOR PLANS */}
              <div>
                <label style={{ display: 'block', color: 'var(--mu)', fontSize: '12px', marginBottom: '5px' }}>Subscription Plan</label>
                <select value={formData.plan_type} onChange={e => setFormData({...formData, plan_type: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--bg4)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                  <option value="Free">Free Plan (Basic ATS)</option>
                  <option value="Starter">Starter Plan (Up to 5 Users)</option>
                  <option value="Pro">Pro Plan (Unlimited ATS + CRM)</option>
                  <option value="Enterprise">Enterprise Plan (Custom Limits)</option>
                </select>
              </div>
              
              <button type="submit" style={{ background: '#10B981', color: '#000', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' }}>
                Create Isolated Space
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}