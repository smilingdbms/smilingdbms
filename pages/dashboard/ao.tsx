// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';

// ══════════════════════════════════════════════════════════
// ACCOUNT OWNER WORKSPACE — inside standard Layout (single sidebar)
// Tabs: Overview (6 live stats) + ATS Pipeline (company candidates)
// CRM + Billing = next phases. All data scoped to AO's company.
// ══════════════════════════════════════════════════════════

const PIPELINE_DONE = ['Joined Successfully'];
const PIPELINE_DEAD = ['Contacted - Not Interested', 'Interview Done - Rejected', 'Offer Declined', 'Did Not Join'];

function statusColor(s) {
  if (PIPELINE_DONE.includes(s)) return '#10B981';
  if ((s || '').includes('Rejected') || (s || '').includes('Declined') || (s || '').includes('Not')) return '#EF4444';
  if ((s || '').includes('Interview')) return '#3B82F6';
  if ((s || '').includes('Offer')) return '#A855F7';
  return '#F59E0B';
}

export default function AccountOwnerWorkspace() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [company, setCompany] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ candidates: 0, mandates: 0, interviews: 0, placements: 0, pipeline: 0, team: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }
      const { data: au } = await supabase.from('app_users').select('*').eq('id', user.id).single();
      if (cancelled) return;
      if (!au) { router.replace('/'); return; }
      if (au.role === 'job_seeker') { router.replace('/jobseeker'); return; }
      setMe(au);

      if (au.company_id) {
        const { data: co } = await supabase.from('companies').select('*').eq('id', au.company_id).single();
        if (!cancelled) setCompany(co);
      }

      let prof = [];
      if (au.company_id) {
        const { data } = await supabase.from('profiles').select('*')
          .or(`company_id.eq.${au.company_id},assigned_to.eq.${au.id},created_by.eq.${au.id}`)
          .order('created_at', { ascending: false });
        prof = (data || []).filter(p => !p.type || p.type === 'Candidate');
      } else {
        const { data } = await supabase.from('profiles').select('*').or(`created_by.eq.${au.id},assigned_to.eq.${au.id}`).order('created_at', { ascending: false });
        prof = (data || []).filter(p => !p.type || p.type === 'Candidate');
      }
      if (cancelled) return;
      setCandidates(prof);

      const cid = au.company_id;
      const countIn = async (table, build) => {
        try { let q = supabase.from(table).select('id', { count: 'exact', head: true }); if (cid) q = q.eq('company_id', cid); if (build) q = build(q); const { count } = await q; return count || 0; }
        catch { return 0; }
      };
      const mandates = await countIn('job_descriptions', (q) => q.eq('status', 'Open'));
      const interviews = await countIn('interviews');
      let team = 0;
      if (cid) { try { const { count } = await supabase.from('app_users').select('id', { count: 'exact', head: true }).eq('company_id', cid); team = count || 0; } catch {} }
      const placements = prof.filter(p => PIPELINE_DONE.includes(p.status)).length;
      const pipeline = prof.filter(p => !PIPELINE_DONE.includes(p.status) && !PIPELINE_DEAD.includes(p.status)).length;
      if (!cancelled) { setStats({ candidates: prof.length, mandates, interviews, placements, pipeline, team }); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = candidates.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [c.name, c.mobile, c.email, c.role, c.city, c.skills].some(v => (v || '').toLowerCase().includes(q));
  });

  const STAT_CARDS = [
    { title: 'Company Candidates', value: stats.candidates, icon: '👥', color: '#A855F7' },
    { title: 'Active Mandates', value: stats.mandates, icon: '🏢', color: '#3B82F6' },
    { title: 'Interviews Scheduled', value: stats.interviews, icon: '🗓️', color: '#06B6D4' },
    { title: 'Placements', value: stats.placements, icon: '🏆', color: '#10B981' },
    { title: 'In Pipeline', value: stats.pipeline, icon: '🔄', color: '#F59E0B' },
    { title: 'Team Members', value: stats.team, icon: '🧑‍🤝‍🧑', color: '#EC4899' },
  ];

  const TABS = [
    { k: 'overview', label: '📊 Overview' },
    { k: 'ats', label: '👩‍💼 ATS Pipeline' },
    { k: 'crm', label: '🏢 Client CRM' },
    { k: 'billing', label: '🧾 Billing' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .aow-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;}
        .aow-tab{padding:9px 16px;border-radius:10px;border:1px solid var(--bd);background:var(--bg2);color:var(--mu);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;}
        .aow-tab.on{background:var(--acbg);color:var(--ac);border-color:var(--ac);}
        .aow-mini{background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:14px;text-align:center;flex:1;min-width:90px;}
        .aow-table{width:100%;border-collapse:collapse;background:var(--bg2);border-radius:12px;overflow:hidden;border:1px solid var(--bd);}
        .aow-table th{background:var(--bg3);padding:13px 15px;text-align:left;font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:0.3px;}
        .aow-table td{padding:13px 15px;border-bottom:1px solid var(--bd);font-size:13px;color:var(--tx);}
        .aow-table tr:last-child td{border-bottom:none;}
        .aow-table tbody tr:hover{background:var(--bg3);}
        @media (max-width:760px){[style*="grid-template-columns"]{grid-template-columns:1fr 1fr !important;}.aow-table{display:block;overflow-x:auto;}input{font-size:16px !important;}}
        @media (max-width:460px){[style*="grid-template-columns"]{grid-template-columns:1fr !important;}}
      `}} />

      <div style={{ padding: '4px 2px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, color: 'var(--tx)' }}>Welcome back, {me?.full_name || '...'} 👋</h1>
            <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 3 }}>{company?.name || 'My Company'} workspace</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.push('/dashboard/add-profile')} style={{ background: 'var(--ac)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>+ Add Profile</button>
            <button onClick={() => router.push('/dashboard/master')} style={{ background: 'var(--acbg)', color: 'var(--ac)', border: '1px solid var(--bd2)', padding: '9px 14px', borderRadius: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>All Candidates →</button>
          </div>
        </div>

        <div className="aow-tabs">
          {TABS.map(t => (
            <button key={t.k} className={`aow-tab ${activeTab === t.k ? 'on' : ''}`} onClick={() => setActiveTab(t.k)}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: 'var(--mu)' }}>Loading your workspace…</div>
        ) : (<>

          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 22 }}>
                {STAT_CARDS.map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg2)', padding: 18, borderRadius: 12, border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: `${s.color}20`, color: s.color }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--mu)', fontWeight: 600 }}>{s.title}</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--tx)' }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Quick actions</div>
                <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 12 }}>Jump straight into your work.</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => setActiveTab('ats')} style={{ background: 'var(--bg3)', color: 'var(--tx)', border: '1px solid var(--bd2)', padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>👩‍💼 View Pipeline</button>
                  <button onClick={() => router.push('/dashboard/jobs')} style={{ background: 'var(--bg3)', color: 'var(--tx)', border: '1px solid var(--bd2)', padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>🏢 Manage Mandates</button>
                  <button onClick={() => router.push('/dashboard/interviews')} style={{ background: 'var(--bg3)', color: 'var(--tx)', border: '1px solid var(--bd2)', padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>🗓️ Interviews</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ats' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>Candidates</h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--mu)', fontSize: 13 }}>All candidates in {company?.name || 'your company'}.</p>
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="🔍 Search name, mobile, skill…" style={{ background: 'var(--bg2)', border: '1px solid var(--bd2)', padding: '10px 15px', borderRadius: 8, color: 'var(--tx)', width: 260, fontFamily: 'inherit', fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div className="aow-mini"><div style={{ fontSize: 22, fontWeight: 800, color: '#60A5FA' }}>{candidates.length}</div><div style={{ fontSize: 10, color: 'var(--mu2)', textTransform: 'uppercase', marginTop: 4, fontWeight: 700 }}>Total</div></div>
                <div className="aow-mini"><div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{candidates.filter(c => c.segment === 'pursuing').length}</div><div style={{ fontSize: 10, color: 'var(--mu2)', textTransform: 'uppercase', marginTop: 4, fontWeight: 700 }}>Students</div></div>
                <div className="aow-mini"><div style={{ fontSize: 22, fontWeight: 800, color: '#A855F7' }}>{candidates.filter(c => c.segment === 'fresher').length}</div><div style={{ fontSize: 10, color: 'var(--mu2)', textTransform: 'uppercase', marginTop: 4, fontWeight: 700 }}>Freshers</div></div>
                <div className="aow-mini"><div style={{ fontSize: 22, fontWeight: 800, color: '#6c8cff' }}>{candidates.filter(c => c.segment === 'experienced').length}</div><div style={{ fontSize: 10, color: 'var(--mu2)', textTransform: 'uppercase', marginTop: 4, fontWeight: 700 }}>Experienced</div></div>
                <div className="aow-mini"><div style={{ fontSize: 22, fontWeight: 800, color: '#10B981' }}>{stats.placements}</div><div style={{ fontSize: 10, color: 'var(--mu2)', textTransform: 'uppercase', marginTop: 4, fontWeight: 700 }}>Placed</div></div>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 50, color: 'var(--mu2)', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--bd)' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>No candidates yet</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Add your first candidate to get started.</div>
                </div>
              ) : (
                <table className="aow-table">
                  <thead>
                    <tr><th>Candidate</th><th>Experience / CTC</th><th>Skills</th><th>Location</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, background: 'var(--bg4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                              {c.photo_url ? <img src={c.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name || 'Unnamed'}</div>
                              <div style={{ fontSize: 11, color: 'var(--mu2)' }}>{c.role || c.segment || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.experience ? `${c.experience} yrs` : (c.segment === 'pursuing' ? 'Student' : c.segment === 'fresher' ? 'Fresher' : '—')}</div>
                          <div style={{ fontSize: 12, color: 'var(--mu)' }}>{c.expected_ctc ? `₹${c.expected_ctc} LPA` : '—'}</div>
                        </td>
                        <td><span style={{ fontSize: 12, color: 'var(--mu)' }}>{(c.skills || '').split(',').slice(0, 3).join(', ') || '—'}</span></td>
                        <td><span style={{ fontSize: 12 }}>📍 {c.city || '—'}</span></td>
                        <td><span style={{ color: statusColor(c.status), fontWeight: 700, fontSize: 12 }}>{c.status || 'New'}</span></td>
                        <td><button onClick={() => router.push(`/dashboard/master?focus=${c.id}`)} style={{ background: 'var(--ac)', color: '#fff', border: 'none', padding: '7px 13px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>View →</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {['crm', 'billing'].includes(activeTab) && (
            <div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--mu2)', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--bd)' }}>
              <div style={{ fontSize: 50, marginBottom: 18 }}>🚧</div>
              <h2 style={{ margin: 0, color: 'var(--tx)' }}>{activeTab === 'crm' ? 'Client CRM' : 'Billing & Invoices'}</h2>
              <p style={{ marginTop: 10 }}>Coming in the next update.</p>
              {activeTab === 'crm' && <button onClick={() => router.push('/dashboard/companies')} style={{ marginTop: 14, background: 'var(--ac)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Open Companies →</button>}
            </div>
          )}

        </>)}
      </div>
    </>
  );
}
