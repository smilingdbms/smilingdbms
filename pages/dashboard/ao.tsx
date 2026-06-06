// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';

// ════════════════════════════════════════════════════════════════════════
//  ACCOUNT OWNER — wow at-a-glance workspace (renders inside Layout)
//  Premium bento overview · animated counters · benchmark badge · funnel
//  + Candidates tab (full table). Reuses existing working queries.
// ════════════════════════════════════════════════════════════════════════

const BM_TTH = 44 // SHRM 2025 time-to-hire benchmark (days)
const PLACED = ['Joined Successfully']
const DEAD = ['Contacted - Not Interested', 'Interview Done - Rejected', 'Offer Declined', 'Did Not Join']
const isPlaced = (s) => /plac|joined/i.test(s || '')
const isDead = (s) => /reject|declin|not interest|did not join|dnp|drop/i.test(s || '')
const daysBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000))
function sColor(s) {
  if (isPlaced(s)) return '#10B981'
  if ((s || '').match(/Rejected|Declined|Not Interest/)) return '#EF4444'
  if ((s || '').includes('Interview')) return '#3B82F6'
  if ((s || '').includes('Offer')) return '#A855F7'
  return '#F59E0B'
}

function Count({ to, dur = 850, suffix = '' }) {
  const [v, setV] = useState(0); const raf = useRef()
  useEffect(() => {
    const n = parseFloat(to) || 0; let s
    const tick = (ts) => { if (!s) s = ts; const p = Math.min((ts - s) / dur, 1); setV(n * (1 - Math.pow(1 - p, 3))); if (p < 1) raf.current = requestAnimationFrame(tick) }
    raf.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf.current)
  }, [to])
  return <>{Math.round(v)}{suffix}</>
}
function Spark({ data, color = '#3B82F6', w = 130, h = 36 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1), min = Math.min(...data, 0), rng = max - min || 1
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - 3 - ((d - min) / rng) * (h - 6)])
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const id = 'aos' + color.replace('#', '')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={line + ` L ${w} ${h} L 0 ${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function AccountOwnerWorkspace() {
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState(null)
  const [company, setCompany] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, mandates: 0, interviews: 0, placements: 0, pipeline: 0, team: 0 })

  const [viewingAs, setViewingAs] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    let off = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      const { data: au } = await supabase.from('app_users').select('*').eq('id', user.id).single()
      if (off || !au) { router.replace('/'); return }
      if (au.role === 'job_seeker') { router.replace('/jobseeker'); return }
      setMe(au)

      // Super Admin drill-in: ?company=<id> scopes this dashboard to that company
      const admin = ['super_admin', 'platform_admin'].includes(au.role)
      const qCompany = router.query.company
      const overrideCo = (admin && qCompany) ? String(qCompany) : null
      setViewingAs(!!overrideCo)
      const ocid = overrideCo || au.company_id

      if (ocid) { const { data: co } = await supabase.from('companies').select('*').eq('id', ocid).single(); if (!off) setCompany(co) }
      let prof = []
      if (overrideCo) {
        const { data } = await supabase.from('profiles').select('*').eq('company_id', overrideCo).order('created_at', { ascending: false })
        prof = (data || []).filter(p => !p.type || p.type === 'Candidate')
      } else if (au.company_id) {
        const { data } = await supabase.from('profiles').select('*').or(`company_id.eq.${au.company_id},assigned_to.eq.${au.id},created_by.eq.${au.id}`).order('created_at', { ascending: false })
        prof = (data || []).filter(p => !p.type || p.type === 'Candidate')
      } else {
        const { data } = await supabase.from('profiles').select('*').or(`created_by.eq.${au.id},assigned_to.eq.${au.id}`).order('created_at', { ascending: false })
        prof = (data || []).filter(p => !p.type || p.type === 'Candidate')
      }
      if (off) return
      setCandidates(prof)
      const cid = overrideCo || au.company_id
      const cnt = async (table, build) => { try { let q = supabase.from(table).select('id', { count: 'exact', head: true }); if (cid) q = q.eq('company_id', cid); if (build) q = build(q); const { count } = await q; return count || 0 } catch { return 0 } }
      const mandates = await cnt('job_descriptions', q => q.eq('status', 'Open'))
      const interviews = await cnt('interviews')
      let team = 0
      if (cid) { try { const { count } = await supabase.from('app_users').select('id', { count: 'exact', head: true }).eq('company_id', cid); team = count || 0 } catch {} }
      const placements = prof.filter(p => isPlaced(p.status)).length
      const pipeline = prof.filter(p => !isPlaced(p.status) && !isDead(p.status)).length
      if (!off) { setStats({ total: prof.length, mandates, interviews, placements, pipeline, team }); setLoading(false) }
    })()
    return () => { off = true }
  }, [router.isReady, router.query.company])

  const filtered = candidates.filter(c => { if (!search) return true; const q = search.toLowerCase(); return [c.name, c.mobile, c.email, c.role, c.city, c.skills].some(v => (v || '').toLowerCase().includes(q)) })

  // derived
  const placedArr = candidates.filter(p => isPlaced(p.status))
  const rate = stats.total ? Math.round(stats.placements / stats.total * 100) : 0
  const tthArr = placedArr.map(p => (p.placement_date && p.created_at) ? daysBetween(p.created_at, p.placement_date) : null).filter(v => v != null)
  const avgTTH = tthArr.length ? Math.round(tthArr.reduce((a, b) => a + b, 0) / tthArr.length) : null

  // last-12-weeks added sparkline
  const spark = (() => {
    const now = new Date(); const buckets = new Array(12).fill(0)
    candidates.forEach(p => { if (!p.created_at) return; const w = Math.floor((now - new Date(p.created_at)) / (7 * 86400000)); if (w >= 0 && w < 12) buckets[11 - w]++ })
    return buckets
  })()

  const funnel = [
    { l: 'Sourced', v: candidates.filter(p => !p.status || /new|sourc|add/i.test(p.status)).length, c: '#64748B' },
    { l: 'Contacted', v: candidates.filter(p => /contact/i.test(p.status || '')).length, c: '#3B82F6' },
    { l: 'Screened', v: candidates.filter(p => /screen|shortlist/i.test(p.status || '')).length, c: '#06B6D4' },
    { l: 'Interview', v: candidates.filter(p => /interview/i.test(p.status || '')).length, c: '#F59E0B' },
    { l: 'Offer', v: candidates.filter(p => /offer/i.test(p.status || '')).length, c: '#A855F7' },
    { l: 'Placed', v: stats.placements, c: '#10B981' },
  ]
  const funMax = Math.max(...funnel.map(f => f.v), 1)

  const seg = [
    { label: 'Students', v: candidates.filter(c => c.segment === 'pursuing').length, c: '#3B82F6' },
    { label: 'Freshers', v: candidates.filter(c => c.segment === 'fresher').length, c: '#A855F7' },
    { label: 'Experienced', v: candidates.filter(c => c.segment === 'experienced').length, c: '#10B981' },
  ]
  const segMax = Math.max(...seg.map(s => s.v), 1)

  const KPI = [
    { l: 'Active Mandates', v: stats.mandates, c: '#F59E0B', icon: '📋' },
    { l: 'Interviews', v: stats.interviews, c: '#06B6D4', icon: '🗓️' },
    { l: 'In Pipeline', v: stats.pipeline, c: '#A855F7', icon: '🔄' },
    { l: 'Team Members', v: stats.team, c: '#EC4899', icon: '👤' },
  ]

  const TABS = [{ k: 'overview', l: 'Overview' }, { k: 'ats', l: 'Candidates' }, { k: 'crm', l: 'Client CRM' }, { k: 'billing', l: 'Billing' }]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Sora:wght@600;700;800&display=swap');
        @keyframes aorise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ao-wrap{font-family:Outfit,system-ui,sans-serif}
        .ao-tab{padding:8px 16px;border-radius:9px;border:1px solid transparent;background:transparent;color:var(--mu);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .15s}
        .ao-tab:hover{background:var(--bg3)}
        .ao-tab.on{background:var(--ac);color:#fff}
        .ao-tile{background:var(--bg2);border:1px solid var(--bd);border-radius:18px;padding:20px;position:relative;overflow:hidden;animation:aorise .5s ease both}
        .ao-tile::before{content:'';position:absolute;inset:0 0 auto 0;height:3px;background:var(--gx,transparent)}
        .ao-bento{display:grid;grid-template-columns:repeat(12,1fr);gap:14px}
        .big{font-family:Sora,sans-serif;font-weight:800;line-height:1;letter-spacing:-1px}
        .h-title{font-family:Sora,sans-serif}
        .lbl{font-size:11px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.6px}
        .c4{grid-column:span 4}.c6{grid-column:span 6}.c8{grid-column:span 8}.c12{grid-column:span 12}.r2{grid-row:span 2}
        .ao-tbl{width:100%;border-collapse:collapse}
        .ao-tbl th{background:var(--bg3);padding:11px 14px;text-align:left;font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.4px;font-weight:700}
        .ao-tbl td{padding:12px 14px;border-bottom:1px solid var(--bd);font-size:13px;color:var(--tx)}
        .ao-tbl tr:last-child td{border-bottom:none}.ao-tbl tbody tr:hover{background:var(--bg3)}
        .badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700}
        @media(max-width:760px){.c4,.c6,.c8{grid-column:span 12 !important}.r2{grid-row:auto !important}.ao-tbl{display:block;overflow-x:auto}}
      `}} />

      <div className="ao-wrap" style={{ padding: '4px 2px 48px' }}>
        {viewingAs && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: 'linear-gradient(90deg,#F59E0B22,#F59E0B11)', border: '1px solid #F59E0B55', borderRadius: 12, padding: '10px 16px', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>👁️ Super Admin view — viewing <b>{company?.name || 'this company'}</b> as their dashboard</span>
            <button onClick={() => router.push('/dashboard/overview')} style={{ background: 'var(--bg2)', border: '1px solid var(--bd2)', color: 'var(--tx)', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>← Exit to Platform</button>
          </div>
        )}
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <div className="lbl" style={{ marginBottom: 5 }}>Account Owner Workspace</div>
            <h1 className="h-title" style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--tx)' }}>{company?.name || 'My Company'}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/dashboard/add-profile')} style={{ background: 'var(--ac)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>+ Add Profile</button>
            <button onClick={() => router.push(viewingAs ? `/dashboard/analytics?company=${router.query.company}` : '/dashboard/analytics')} style={{ background: 'var(--bg2)', color: 'var(--tx)', border: '1px solid var(--bd2)', padding: '9px 14px', borderRadius: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Analytics →</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap', borderBottom: '1px solid var(--bd)', paddingBottom: 12 }}>
          {TABS.map(t => <button key={t.k} className={`ao-tab${tab === t.k ? ' on' : ''}`} onClick={() => setTab(t.k)}>{t.l}</button>)}
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--mu)' }}>Loading your workspace…</div> : <>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="ao-bento">
              {/* HERO placements */}
              <div className="ao-tile c4 r2" style={{ '--gx': 'linear-gradient(90deg,#10B981,#34D399)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 220, background: 'linear-gradient(160deg,var(--bg2),var(--bg2)),radial-gradient(120% 80% at 100% 0%, #10B98115, transparent)' }}>
                <div>
                  <div className="lbl">Total Placements</div>
                  <div className="big" style={{ fontSize: 62, marginTop: 10, background: 'linear-gradient(135deg,#10B981,#34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}><Count to={stats.placements} /></div>
                  <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 6 }}>{rate}% conversion · {stats.total} candidates</div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div className="lbl" style={{ marginBottom: 6 }}>Added · last 12 weeks</div>
                  <Spark data={spark.some(x => x) ? spark : [0, stats.total]} color="#10B981" w={200} h={46} />
                </div>
              </div>

              {/* Candidates total */}
              <div className="ao-tile c4" style={{ '--gx': 'linear-gradient(90deg,#3B82F6,#60A5FA)' }}>
                <div className="lbl">👥 Company Candidates</div>
                <div className="big" style={{ fontSize: 42, marginTop: 10, color: 'var(--tx)' }}><Count to={stats.total} /></div>
                <div style={{ marginTop: 10 }}><Spark data={spark.some(x => x) ? spark : [0, stats.total]} color="#3B82F6" w={150} h={30} /></div>
              </div>

              {/* Time to hire */}
              <div className="ao-tile c4" style={{ '--gx': 'linear-gradient(90deg,#F59E0B,#FBBF24)' }}>
                <div className="lbl">⏱ Avg Time-to-Hire</div>
                <div className="big" style={{ fontSize: 42, marginTop: 10, color: 'var(--tx)' }}>{avgTTH != null ? <><Count to={avgTTH} /> <span style={{ fontSize: 15, color: 'var(--mu)', fontFamily: 'Outfit' }}>days</span></> : <span style={{ fontSize: 16, color: 'var(--mu2)', fontWeight: 600 }}>No placements yet</span>}</div>
                <div style={{ marginTop: 12 }}>{avgTTH != null ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: avgTTH <= BM_TTH ? '#10B981' : '#F59E0B', background: (avgTTH <= BM_TTH ? '#10B981' : '#F59E0B') + '1a', padding: '3px 9px', borderRadius: 20 }}>{avgTTH <= BM_TTH ? '▲' : '▼'} vs {BM_TTH}d industry</span> : <span style={{ fontSize: 11, color: 'var(--mu2)' }}>Benchmark: {BM_TTH} days (SHRM)</span>}</div>
              </div>

              {/* KPI strip ×4 */}
              {KPI.map((k, i) => (
                <div key={i} className="ao-tile c4" style={{ '--gx': `linear-gradient(90deg,${k.c},${k.c}aa)` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: `${k.c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{k.icon}</div>
                    <div><div className="lbl" style={{ fontSize: 10 }}>{k.l}</div><div className="big" style={{ fontSize: 30, marginTop: 3, color: k.c }}><Count to={k.v} /></div></div>
                  </div>
                </div>
              ))}

              {/* Funnel */}
              <div className="ao-tile c8" style={{ animationDelay: '.1s' }}>
                <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recruitment Funnel</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {funnel.map((f, i) => {
                    const prev = i > 0 ? funnel[i - 1].v : null, conv = prev ? Math.round(f.v / prev * 100) : null
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--tx)', fontWeight: 600 }}>{f.l}</span>
                          <span style={{ color: 'var(--mu)' }}>{f.v}{conv != null && <span style={{ color: conv >= 50 ? '#10B981' : '#F59E0B', marginLeft: 6, fontWeight: 700 }}>{conv}%</span>}</span>
                        </div>
                        <div style={{ height: 12, background: 'var(--bg3)', borderRadius: 8, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(f.v / funMax) * 100}%`, background: `linear-gradient(90deg,${f.c},${f.c}cc)`, borderRadius: 8, minWidth: f.v ? 6 : 0, transition: 'width .7s ease' }} /></div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Candidate mix */}
              <div className="ao-tile c4" style={{ animationDelay: '.16s' }}>
                <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Candidate Mix</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {seg.map((s, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: 'var(--tx)' }}>{s.label}</span><span style={{ fontWeight: 700, color: 'var(--mu)' }}>{s.v}</span></div>
                      <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 5 }}><div style={{ height: '100%', width: `${(s.v / segMax) * 100}%`, background: `linear-gradient(90deg,${s.c},${s.c}aa)`, borderRadius: 5, transition: 'width .6s' }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent candidates */}
              <div className="ao-tile c8" style={{ animationDelay: '.22s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div className="h-title" style={{ fontSize: 15, fontWeight: 700 }}>Recent Candidates</div>
                  <button onClick={() => setTab('ats')} style={{ fontSize: 12, color: 'var(--ac)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
                </div>
                {candidates.length === 0 ? <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mu)', fontSize: 13 }}>No candidates yet. <span onClick={() => router.push('/dashboard/add-profile')} style={{ color: 'var(--ac)', cursor: 'pointer', fontWeight: 600 }}>Add one →</span></div> : (
                  <div style={{ overflowX: 'auto' }}><table className="ao-tbl">
                    <thead><tr><th>Name</th><th>Role</th><th>Location</th><th>Status</th><th></th></tr></thead>
                    <tbody>{candidates.slice(0, 6).map(c => (
                      <tr key={c.id}>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, overflow: 'hidden', flexShrink: 0 }}>{c.photo_url ? <img src={c.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.name || '?').charAt(0)}</div><span style={{ fontWeight: 600 }}>{c.name || 'Unnamed'}</span></div></td>
                        <td style={{ color: 'var(--mu)', fontSize: 12 }}>{c.role || '—'}</td>
                        <td style={{ color: 'var(--mu)', fontSize: 12 }}>📍 {c.city || '—'}</td>
                        <td><span className="badge" style={{ background: `${sColor(c.status)}18`, color: sColor(c.status) }}>{c.status || 'New'}</span></td>
                        <td><button onClick={() => router.push(`/dashboard/master?focus=${c.id}`)} style={{ background: 'none', border: '1px solid var(--bd2)', color: 'var(--ac)', padding: '5px 11px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>View</button></td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </div>

              {/* Quick actions */}
              <div className="ao-tile c4" style={{ animationDelay: '.28s' }}>
                <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Quick Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[{ l: '➕ Add Profile', f: () => router.push('/dashboard/add-profile') }, { l: '📋 Mandates', f: () => router.push('/dashboard/jobs') }, { l: '🗓️ Interviews', f: () => router.push('/dashboard/interviews') }, { l: '👥 Team', f: () => router.push('/dashboard/admin') }, { l: '🤝 BD / Clients', f: () => router.push('/dashboard/bd') }].map((a, i) => (
                    <button key={i} onClick={a.f} style={{ background: 'var(--bg3)', color: 'var(--tx)', border: '1px solid var(--bd)', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, textAlign: 'left' }}>{a.l}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CANDIDATES ── */}
          {tab === 'ats' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div><div className="h-title" style={{ fontSize: 16, fontWeight: 700 }}>Candidates</div><div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>{company?.name || 'Your company'} — {candidates.length} total</div></div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, mobile, skill…" style={{ background: 'var(--bg2)', border: '1px solid var(--bd2)', padding: '9px 14px', borderRadius: 9, color: 'var(--tx)', width: 240, fontFamily: 'inherit', fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[{ l: `All (${candidates.length})`, c: '#3B82F6' }, { l: `Students (${seg[0].v})`, c: '#3B82F6' }, { l: `Freshers (${seg[1].v})`, c: '#A855F7' }, { l: `Experienced (${seg[2].v})`, c: '#10B981' }, { l: `Placed (${stats.placements})`, c: '#10B981' }].map((p, i) => <span key={i} style={{ background: `${p.c}14`, color: p.c, border: `1px solid ${p.c}30`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{p.l}</span>)}
              </div>
              {filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 50, color: 'var(--mu)', background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--bd)' }}><div style={{ fontSize: 32, marginBottom: 8 }}>📋</div><div style={{ fontSize: 14, fontWeight: 600 }}>No candidates found</div></div> : (
                <div className="ao-tile" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}><table className="ao-tbl">
                    <thead><tr><th>Candidate</th><th>Experience / CTC</th><th>Skills</th><th>Location</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>{filtered.map(c => (
                      <tr key={c.id}>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, overflow: 'hidden', flexShrink: 0 }}>{c.photo_url ? <img src={c.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.name || '?').charAt(0)}</div><div><div style={{ fontWeight: 700, fontSize: 13 }}>{c.name || 'Unnamed'}</div><div style={{ fontSize: 11, color: 'var(--mu)' }}>{c.role || c.segment || '—'}</div></div></div></td>
                        <td><div style={{ fontWeight: 600, fontSize: 13 }}>{c.experience ? `${c.experience} yrs` : (c.segment === 'pursuing' ? 'Student' : c.segment === 'fresher' ? 'Fresher' : '—')}</div><div style={{ fontSize: 11, color: 'var(--mu)' }}>{c.expected_ctc ? `₹${c.expected_ctc} LPA` : '—'}</div></td>
                        <td style={{ fontSize: 12, color: 'var(--mu)' }}>{(c.skills || '').split(',').slice(0, 3).join(', ') || '—'}</td>
                        <td style={{ fontSize: 12 }}>📍 {c.city || '—'}</td>
                        <td><span className="badge" style={{ background: `${sColor(c.status)}18`, color: sColor(c.status) }}>{c.status || 'New'}</span></td>
                        <td><button onClick={() => router.push(`/dashboard/master?focus=${c.id}`)} style={{ background: 'var(--ac)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>View →</button></td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                </div>
              )}
            </div>
          )}

          {['crm', 'billing'].includes(tab) && (
            <div style={{ display: 'flex', height: '45vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--mu)', background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--bd)' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🚧</div>
              <div className="h-title" style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{tab === 'crm' ? 'Client CRM' : 'Billing & Invoices'}</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>Coming soon.</div>
              {tab === 'crm' && <button onClick={() => router.push('/dashboard/companies')} style={{ marginTop: 16, background: 'var(--ac)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Open Companies →</button>}
            </div>
          )}

        </>}
      </div>
    </>
  )
}
