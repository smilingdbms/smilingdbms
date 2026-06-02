// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';

// ══════════════════════════════════════════════════════════
// ACCOUNT OWNER DASHBOARD — Phase B1 (real data, company-scoped)
// Overview (6 live stats) + ATS Pipeline (company candidates).
// CRM + Billing = next phases. All data limited to AO's company.
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

export default function AccountOwnerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

      // Company-scoped candidates (no other company's data)
      let prof = [];
      if (au.company_id) {
        const { data } = await supabase.from('profiles').select('*').eq('company_id', au.company_id).eq('type', 'Candidate').order('created_at', { ascending: false });
        prof = data || [];
      } else {
        const { data } = await supabase.from('profiles').select('*').or(`created_by.eq.${au.id},assigned_to.eq.${au.id}`).order('created_at', { ascending: false });
        prof = data || [];
      }
      if (cancelled) return;
      setCandidates(prof);

      // Stats (company-scoped)
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

  const initials = (me?.full_name || 'AO').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <Head><title>Account Owner | RecruitBase Pro</title></Head>
      <style dangerouslySetInnerHTML={{__html: `
        body { margin: 0; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--tx); }
        .ao-layout { display: flex; height: 100vh; overflow: hidden; width: 100%; }
        .ao-sidebar { background: var(--bg2); border-right: 1px solid var(--bd); transition: width 0.25s ease; display: flex; flex-direction: column; z-index: 50; flex-shrink: 0; }
        .nav-item { padding: 14px 20px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: 0.18s; color: var(--mu); white-space: nowrap; overflow: hidden; border-left: 3px solid transparent; font-size: 14px; }
        .nav-item:hover { background: var(--hv); color: var(--tx); }
        .nav-item.active { background: var(--acbg); color: var(--ac); border-left-color: var(--ac); font-weight: 700; }
        .ao-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg); min-width: 0; }
        .ao-header { background: var(--bg2); padding: 14px 24px; border-bottom: 1px solid var(--bd); display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .ao-content { padding: 24px; overflow-y: auto; flex: 1; }
        .mini-stat-box { background: var(--bg2); border: 1px solid var(--bd); border-radius: 10px; padding: 14px; text-align: center; flex: 1; min-width: 90px; }
        .mini-stat-value { font-size: 22px; font-weight: 800; color: var(--tx); }
        .mini-stat-label { font-size: 10px; color: var(--mu2); text-transform: uppercase; margin-top: 4px; font-weight: 700; letter-spacing: 0.3px; }
        .ats-table { width: 100%; border-collapse: collapse; background: var(--bg2); border-radius: 12px; overflow: hidden; border: 1px solid var(--bd); }
        .ats-table th { background: var(--bg3); padding: 13px 15px; text-align: left; font-size: 11px; color: var(--mu); text-transform: uppercase; letter-spacing: 0.3px; }
        .ats-table td { padding: 13px 15px; border-bottom: 1px solid var(--bd); font-size: 13px; color: var(--tx); }
        .ats-table tr:last-child td { border-bottom: none; }
        .ats-table tbody tr { transition: background 0.12s; }
        .ats-table tbody tr:hover { background: var(--bg3); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--bd2); border-radius: 4px; }
        @media (max-width: 760px){
          .ao-sidebar{ position: fixed; height: 100vh; box-shadow: 4px 0 24px rgba(0,0,0,0.3); }
          .ao-content{ padding: 14px; }
          [style*="grid-template-columns"]{ grid-template-columns: 1fr 1fr !important; }
          .ats-table{ display: block; overflow-x: auto; }
          input,select,textarea{ font-size:16px !important; min-height:44px; }
          button{ min-height:42px; }
        }
        @media (max-width: 460px){ [style*="grid-template-columns"]{ grid-template-columns: 1fr !important; } }
      `}} />

      <div className="ao-layout">
        <div className="ao-sidebar" style={{ width: isSidebarOpen ? 240 : 64 }}>
          <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--bd)' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: 'var(--tx)', fontSize: 20, cursor: 'pointer' }}>☰</button>
            {isSidebarOpen && <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company?.name || 'My Company'}</span>}
          </div>
          <div style={{ flex: 1, padding: '10px 0' }}>
            {[
              { k: 'overview', icon: '📊', label: 'Dashboard' },
              { k: 'ats', icon: '👩‍💼', label: 'ATS Pipeline' },
              { k: 'crm', icon: '🏢', label: 'Client CRM' },
              { k: 'billing', icon: '🧾', label: 'Billing & Invoices' },
            ].map(t => (
              <div key={t.k} className={`nav-item ${activeTab === t.k ? 'active' : ''}`} onClick={() => setActiveTab(t.k)}>
                <span style={{ fontSize: 18 }}>{t.icon}</span> {isSidebarOpen && t.label}
              </div>
            ))}
          </div>
          <div className="nav-item" onClick={() => router.push('/dashboard')} style={{ borderTop: '1px solid var(--bd)' }}>
            <span style={{ fontSize: 18 }}>🏠</span> {isSidebarOpen && 'Main Dashboard'}
          </div>
        </div>

        <div className="ao-main">
          <div className="ao-header">
            <h2 style={{ margin: 0, fontSize: 17, color: 'var(--tx)' }}>Welcome back, {me?.full_name || '...'} 👋</h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={() => router.push('/dashboard/add-profile')} style={{ background: 'var(--ac)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>+ Add Profile</button>
              <button onClick={() => router.push('/dashboard/master')} style={{ background: 'var(--acbg)', color: 'var(--ac)', border: '1px solid var(--bd2)', padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>All Candidates →</button>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--ac)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{initials}</div>
            </div>
          </div>

          <div className="ao-content">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--mu)' }}>Loading your workspace…</div>
            ) : (<>

              {activeTab === 'overview' && (
                <div>
                  <h2 style={{ marginTop: 0, fontSize: 20 }}>Business Overview</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h1 style={{ margin: 0, fontSize: 22 }}>Candidates</h1>
                      <p style={{ margin: '4px 0 0', color: 'var(--mu)', fontSize: 13 }}>All candidates in {company?.name || 'your company'}.</p>
                    </div>
                    <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="🔍 Search name, mobile, skill…" style={{ background: 'var(--bg2)', border: '1px solid var(--bd2)', padding: '10px 15px', borderRadius: 8, color: 'var(--tx)', width: 260, fontFamily: 'inherit', fontSize: 13 }} />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                    <div className="mini-stat-box"><div className="mini-stat-value" style={{ color: '#60A5FA' }}>{candidates.length}</div><div className="mini-stat-label">Total</div></div>
                    <div className="mini-stat-box"><div className="mini-stat-value" style={{ color: '#f59e0b' }}>{candidates.filter(c => c.segment === 'pursuing').length}</div><div className="mini-stat-label">Students</div></div>
                    <div className="mini-stat-box"><div className="mini-stat-value" style={{ color: '#A855F7' }}>{candidates.filter(c => c.segment === 'fresher').length}</div><div className="mini-stat-label">Freshers</div></div>
                    <div className="mini-stat-box"><div className="mini-stat-value" style={{ color: '#6c8cff' }}>{candidates.filter(c => c.segment === 'experienced').length}</div><div className="mini-stat-label">Experienced</div></div>
                    <div className="mini-stat-box"><div className="mini-stat-value" style={{ color: '#10B981' }}>{stats.placements}</div><div className="mini-stat-label">Placed</div></div>
                  </div>

                  {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 50, color: 'var(--mu2)', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--bd)' }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>No candidates yet</div>
                      <div style={{ fontSize: 13, marginTop: 6 }}>Add your first candidate to get started.</div>
                    </div>
                  ) : (
                    <table className="ats-table">
                      <thead>
                        <tr>
                          <th>Candidate</th><th>Experience / CTC</th><th>Skills</th><th>Location</th><th>Status</th><th>Action</th>
                        </tr>
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
                <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--mu2)', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--bd)' }}>
                  <div style={{ fontSize: 50, marginBottom: 18 }}>🚧</div>
                  <h2 style={{ margin: 0, color: 'var(--tx)' }}>{activeTab === 'crm' ? 'Client CRM' : 'Billing & Invoices'}</h2>
                  <p style={{ marginTop: 10 }}>Coming in the next update.</p>
                  {activeTab === 'crm' && <button onClick={() => router.push('/dashboard/companies')} style={{ marginTop: 14, background: 'var(--ac)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Open Companies →</button>}
                </div>
              )}

            </>)}
          </div>
        </div>
      </div>
    </>
  );
}
