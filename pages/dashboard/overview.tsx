// @ts-nocheck
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ════════════════════════════════════════════════════════════════════════
//  SUPER ADMIN — Platform Overview (premium bento, god-view)
//  KPIs · growth area · users-by-role donut · top companies · companies table
//  Per company: Manage Plan + Full View (drill-in to that company's dashboard)
// ════════════════════════════════════════════════════════════════════════

const isPlaced = (s) => /plac|joined/i.test(s || '')
const ROLE_C = (r) => ({ super_admin: '#EF4444', platform_admin: '#F97316', account_owner: '#3B82F6', team_manager: '#818CF8', team_leader: '#A78BFA', sr_recruiter: '#34D399', recruiter: '#10B981', individual_recruiter: '#06B6D4', bd: '#A855F7', job_seeker: '#EC4899' }[r] || '#94A3B8')
const fmtRole = (r) => (r || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

function Count({ to, dur = 850, suffix = '' }) {
  const [v, setV] = useState(0); const raf = useRef()
  useEffect(() => { const n = parseFloat(to) || 0; let s; const tick = (ts) => { if (!s) s = ts; const p = Math.min((ts - s) / dur, 1); setV(n * (1 - Math.pow(1 - p, 3))); if (p < 1) raf.current = requestAnimationFrame(tick) }; raf.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf.current) }, [to])
  return <>{Math.round(v)}{suffix}</>
}
function Spark({ data, color = '#3B82F6', w = 180, h = 44 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1), min = Math.min(...data, 0), rng = max - min || 1
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - 3 - ((d - min) / rng) * (h - 6)])
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const id = 'ovs' + color.replace('#', '')
  return (<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs><path d={line + ` L ${w} ${h} L 0 ${h} Z`} fill={`url(#${id})`} /><path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)
}
function Area({ data, color = '#3B82F6', height = 200 }) {
  if (!data.length) return <Empty>No data</Empty>
  const max = Math.max(...data.map(d => d.v), 1)
  const W = Math.max(data.length * 46, 320), padX = 14, padTop = 24, padBot = 26
  const x = (i) => padX + (i / Math.max(data.length - 1, 1)) * (W - padX * 2)
  const y = (v) => padTop + (1 - v / max) * (height - padTop - padBot)
  const pts = data.map((d, i) => [x(i), y(d.v)])
  let line = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2; const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6, c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6; line += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}` }
  const area = line + ` L ${pts[pts.length - 1][0]} ${height - padBot} L ${pts[0][0]} ${height - padBot} Z`
  return (<div style={{ overflowX: 'auto' }}><svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} style={{ minWidth: '100%' }}><defs><linearGradient id="ovAreaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".32" /><stop offset="1" stopColor={color} stopOpacity=".02" /></linearGradient></defs><path d={area} fill="url(#ovAreaG)" /><path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />{pts.map((p, i) => (<g key={i}><circle cx={p[0]} cy={p[1]} r="3" fill="var(--bg2)" stroke={color} strokeWidth="2" />{data[i].v > 0 && <text x={p[0]} y={p[1] - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--tx)">{data[i].v}</text>}<text x={p[0]} y={height - 9} textAnchor="middle" fontSize="9" fill="var(--mu)">{data[i].label}</text></g>))}</svg></div>)
}
function Donut({ data, size = 156 }) {
  const total = data.reduce((s, d) => s + d.v, 0)
  if (!total) return <Empty>No data</Empty>
  let cum = 0; const R = size / 2 - 6, cx = size / 2, cy = size / 2, hole = R - 17
  const slices = data.filter(d => d.v > 0).map(d => { const pct = d.v / total, a1 = cum * 2 * Math.PI - Math.PI / 2; cum += pct; const a2 = cum * 2 * Math.PI - Math.PI / 2; const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1), x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2); return { ...d, pct, d: `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${pct > .5 ? 1 : 0} 1 ${x2} ${y2} Z` } })
  return (<div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}><svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>{slices.map((s, i) => <path key={i} d={s.d} fill={s.c} />)}<circle cx={cx} cy={cy} r={hole} fill="var(--bg2)" /><text x={cx} y={cy - 3} textAnchor="middle" fontSize="24" fontWeight="800" fill="var(--tx)">{total}</text><text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="var(--mu)">USERS</text></svg><div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minWidth: 130 }}>{slices.map((s, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: s.c, flexShrink: 0 }} /><span style={{ fontSize: 12, color: 'var(--mu)' }}>{s.label}</span><span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{s.v}</span></div>))}</div></div>)
}
function HBars({ rows, color }) {
  if (!rows.length) return <Empty>No data</Empty>
  const max = Math.max(...rows.map(r => r.v), 1)
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{rows.map((r, i) => (<div key={i}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}><span style={{ color: 'var(--tx)' }}>{r.label}</span><span style={{ fontWeight: 700, color: 'var(--mu)' }}>{r.v}</span></div><div style={{ height: 7, background: 'var(--bg3)', borderRadius: 4 }}><div style={{ height: '100%', width: `${(r.v / max) * 100}%`, background: `linear-gradient(90deg,${color},${color}aa)`, borderRadius: 4, transition: 'width .6s' }} /></div></div>))}</div>)
}
const Empty = ({ children }) => <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mu2)', fontSize: 12 }}>{children}</div>

export default function PlatformOverview() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/'); return }
      const { data: au } = await supabase.from('app_users').select('role').eq('id', session.user.id).single()
      if (!au || !['super_admin', 'platform_admin'].includes(au.role)) { setDenied(true); setLoading(false); return }
      const [{ data: co }, { data: us }, { data: ps }] = await Promise.all([
        supabase.from('companies').select('*'),
        supabase.from('app_users').select('*'),
        supabase.from('profiles').select('*'),
      ])
      setCompanies(co || []); setUsers(us || []); setProfiles(ps || []); setLoading(false)
    })()
  }, [])

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mu)' }}>Loading platform…</div>
  if (denied) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--tx)' }}>
      <div style={{ fontSize: 40 }}>🔒</div><div style={{ fontWeight: 700 }}>Super Admin only</div>
      <button onClick={() => router.replace('/dashboard')} style={{ background: 'var(--ac)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Go to Dashboard →</button>
    </div>
  )

  const candidates = profiles.filter(p => !p.type || p.type === 'Candidate')
  const placed = candidates.filter(p => isPlaced(p.status)).length
  const realUsers = users.filter(u => u.role !== 'job_seeker')
  const jobSeekers = users.filter(u => u.role === 'job_seeker').length

  const growth = (() => {
    const now = new Date(); const arr = []
    for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); arr.push({ key: d.getFullYear() + '-' + d.getMonth(), label: d.toLocaleString('en', { month: 'short' }), v: 0 }) }
    const idx = {}; arr.forEach((a, i) => idx[a.key] = i)
    candidates.forEach(p => { if (!p.created_at) return; const d = new Date(p.created_at); const k = d.getFullYear() + '-' + d.getMonth(); if (idx[k] != null) arr[idx[k]].v++ })
    return arr
  })()
  const sparkVals = growth.map(g => g.v)

  const roleAgg = Object.entries(users.reduce((a, u) => { const r = u.role || 'unknown'; a[r] = (a[r] || 0) + 1; return a }, {})).map(([r, v]) => ({ label: fmtRole(r), v, c: ROLE_C(r) })).sort((a, b) => b.v - a.v)

  const companyRows = companies.map(c => {
    const cu = users.filter(u => u.company_id === c.id && u.role !== 'job_seeker').length
    const cc = candidates.filter(p => p.company_id === c.id)
    return { id: c.id, name: c.name || c.company_name || 'Unnamed', users: cu, candidates: cc.length, placed: cc.filter(p => isPlaced(p.status)).length, plan: c.package_code || c.plan || '—' }
  }).sort((a, b) => b.candidates - a.candidates)
  const topCompanies = companyRows.filter(c => c.candidates > 0).slice(0, 8).map(c => ({ label: c.name, v: c.candidates }))

  const KPI = [
    { l: 'Total Users', v: realUsers.length, c: '#A855F7', icon: '👥' },
    { l: 'Candidates', v: candidates.length, c: '#06B6D4', icon: '🧑‍💼' },
    { l: 'Placements', v: placed, c: '#10B981', icon: '🏆' },
    { l: 'Job Seekers', v: jobSeekers, c: '#EC4899', icon: '🔎' },
    { l: 'Avg / Company', v: companies.length ? Math.round(candidates.length / companies.length) : 0, c: '#F59E0B', icon: '⚖️' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Sora:wght@600;700;800&display=swap');
        @keyframes ovrise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ov-wrap{font-family:Outfit,system-ui,sans-serif}
        .ov-tile{background:var(--bg2);border:1px solid var(--bd);border-radius:18px;padding:20px;position:relative;overflow:hidden;animation:ovrise .5s ease both}
        .ov-tile::before{content:'';position:absolute;inset:0 0 auto 0;height:3px;background:var(--gx,transparent)}
        .ov-bento{display:grid;grid-template-columns:repeat(12,1fr);gap:14px}
        .big{font-family:Sora,sans-serif;font-weight:800;line-height:1;letter-spacing:-1px}
        .h-title{font-family:Sora,sans-serif}
        .lbl{font-size:11px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.6px}
        .c4{grid-column:span 4}.c5{grid-column:span 5}.c7{grid-column:span 7}.c6{grid-column:span 6}.c8{grid-column:span 8}.c12{grid-column:span 12}.r2{grid-row:span 2}
        .ov-tbl{width:100%;border-collapse:collapse}
        .ov-tbl th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--mu);padding:10px 12px;border-bottom:1px solid var(--bd)}
        .ov-tbl td{padding:11px 12px;border-bottom:1px solid var(--bd);font-size:13px}
        .ov-tbl tr:last-child td{border-bottom:none}.ov-tbl tbody tr:hover{background:var(--bg3)}
        .ov-btn{border:1px solid var(--bd2);background:var(--bg2);color:var(--tx);padding:5px 11px;border-radius:7px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600}
        .ov-btn.pri{background:var(--ac);color:#fff;border-color:transparent}
        @media(max-width:900px){.c4,.c5,.c6,.c7,.c8{grid-column:span 12 !important}.r2{grid-row:auto !important}}
      `}} />
      <div className="ov-wrap" style={{ padding: '4px 2px 52px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <div className="lbl" style={{ marginBottom: 5 }}>RecruitBase Pro · Platform</div>
            <h1 className="h-title" style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-.5px', color: 'var(--tx)' }}>🌐 Platform Overview</h1>
            <p style={{ fontSize: 13, color: 'var(--mu)', margin: '6px 0 0' }}>God-view across all companies on the platform</p>
          </div>
          <button onClick={() => router.push('/dashboard/companies')} className="ov-btn pri" style={{ padding: '9px 16px', borderRadius: 9 }}>Manage Companies & Plans</button>
        </div>

        <div className="ov-bento">
          {/* HERO Companies */}
          <div className="ov-tile c4 r2" style={{ '--gx': 'linear-gradient(90deg,#3B82F6,#60A5FA)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 220, background: 'linear-gradient(160deg,var(--bg2),var(--bg2)),radial-gradient(120% 80% at 100% 0%, #3B82F615, transparent)' }}>
            <div>
              <div className="lbl">Companies on Platform</div>
              <div className="big" style={{ fontSize: 64, marginTop: 10, background: 'linear-gradient(135deg,#3B82F6,#60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}><Count to={companies.length} /></div>
              <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 6 }}>{realUsers.length} users · {candidates.length} candidates</div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="lbl" style={{ marginBottom: 6 }}>Candidate growth · 12 months</div>
              <Spark data={sparkVals.some(x => x) ? sparkVals : [0, candidates.length]} color="#3B82F6" w={200} h={46} />
            </div>
          </div>

          {/* KPI tiles */}
          {KPI.map((k, i) => (
            <div key={i} className="ov-tile c4" style={{ '--gx': `linear-gradient(90deg,${k.c},${k.c}aa)`, animationDelay: `${0.04 * i}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: `${k.c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{k.icon}</div>
                <div><div className="lbl" style={{ fontSize: 10 }}>{k.l}</div><div className="big" style={{ fontSize: 30, marginTop: 3, color: k.c }}><Count to={k.v} /></div></div>
              </div>
            </div>
          ))}

          {/* Growth area */}
          <div className="ov-tile c7" style={{ animationDelay: '.26s' }}>
            <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Platform Growth — Candidates Added</div>
            <Area data={growth} color="#3B82F6" />
          </div>
          {/* Users by role */}
          <div className="ov-tile c5" style={{ animationDelay: '.32s' }}>
            <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Users by Role</div>
            <Donut data={roleAgg} />
          </div>

          {/* Top companies */}
          <div className="ov-tile c5" style={{ animationDelay: '.38s' }}>
            <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Top Companies by Volume</div>
            <HBars rows={topCompanies} color="#10B981" />
          </div>

          {/* Companies table */}
          <div className="ov-tile c7" style={{ animationDelay: '.44s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="h-title" style={{ fontSize: 15, fontWeight: 700 }}>All Companies</div>
              <span style={{ fontSize: 12, color: 'var(--mu)' }}>{companies.length} total</span>
            </div>
            {companyRows.length === 0 ? <Empty>No companies yet</Empty> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="ov-tbl">
                  <thead><tr><th>Company</th><th>Plan</th><th style={{ textAlign: 'right' }}>Users</th><th style={{ textAlign: 'right' }}>Cand.</th><th style={{ textAlign: 'right' }}>Placed</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                  <tbody>
                    {companyRows.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td><span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac)', background: 'var(--acbg)', padding: '2px 9px', borderRadius: 12, textTransform: 'capitalize' }}>{c.plan}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{c.users}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#06B6D4' }}>{c.candidates}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{c.placed}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button className="ov-btn" onClick={() => router.push(`/dashboard/companies?company=${c.id}`)} style={{ marginRight: 6 }}>Manage Plan</button>
                          <button className="ov-btn pri" onClick={() => router.push(`/dashboard/ao?company=${c.id}`)}>Full View →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
