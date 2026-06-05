// @ts-nocheck
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ════════════════════════════════════════════════════════════════════════
//  ANALYTICS — flagship bento dashboard
//  • Industry benchmarking (SHRM 2025) • real Time-to-Hire • AI Insights
//  • smooth gradient area charts • animated count-up • staggered reveal
//  All SVG, zero libs, theme-aware. Defensive: missing fields = no crash.
// ════════════════════════════════════════════════════════════════════════

// Industry benchmarks (SHRM 2025) — used for the "vs industry" badges
const BM = { timeToHire: 44, offerAccept: 82, intToOffer: 3 }

const RANGES = [
  { k: 'today', l: 'Today' }, { k: 'yesterday', l: 'Yesterday' }, { k: 'week', l: 'This Week' },
  { k: '15d', l: '15 Days' }, { k: 'month', l: 'This Month' }, { k: 'quarter', l: 'Quarter' },
  { k: 'half', l: 'Half Year' }, { k: 'year', l: 'This Year' }, { k: 'all', l: 'All Time' },
]
function rangeBounds(k, minDate) {
  const now = new Date(), t = new Date(); t.setHours(0, 0, 0, 0)
  if (k === 'today') return { start: t, end: now }
  if (k === 'yesterday') { const s = new Date(t); s.setDate(s.getDate() - 1); return { start: s, end: new Date(t) } }
  if (k === 'week') { const s = new Date(t); s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); return { start: s, end: now } }
  if (k === '15d') { const s = new Date(t); s.setDate(s.getDate() - 14); return { start: s, end: now } }
  if (k === 'month') return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now }
  if (k === 'quarter') { const q = Math.floor(now.getMonth() / 3); return { start: new Date(now.getFullYear(), q * 3, 1), end: now } }
  if (k === 'half') return { start: new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1), end: now }
  if (k === 'year') return { start: new Date(now.getFullYear(), 0, 1), end: now }
  return { start: minDate || new Date(2024, 0, 1), end: now }
}
const deptOfProfile = (p) => /\bbd\b|business|lead|prospect/.test((p?.type || 'Candidate').toLowerCase()) ? 'bd' : 'recruitment'
const deptOfUser = (u) => /\bbd\b|business|sales/.test((u?.role || '').toLowerCase()) ? 'bd' : 'recruitment'
const isPlaced = (s) => /plac|joined/i.test(s || '')
const isDead = (s) => /reject|declin|not interest|did not join|dnp|drop/i.test(s || '')
const DEPT_L = { recruitment: 'Recruitment', bd: 'BD', all: 'All Departments' }
const DEPT_C = { recruitment: '#3B82F6', bd: '#A855F7' }
const daysBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000))

// ── animated count-up ───────────────────────────────────────────────────
function Count({ to, dur = 900, suffix = '', decimals = 0 }) {
  const [v, setV] = useState(0)
  const raf = useRef()
  useEffect(() => {
    const n = parseFloat(to) || 0; let start
    const tick = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(n * eased)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to])
  return <>{v.toFixed(decimals)}{suffix}</>
}

// ── sparkline ─────────────────────────────────────────────────────────────
function Spark({ data, color = '#3B82F6', w = 110, h = 34 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1), min = Math.min(...data, 0)
  const rng = max - min || 1
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - 3 - ((d - min) / rng) * (h - 6)])
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = line + ` L ${w} ${h} L 0 ${h} Z`
  const id = 'sp' + color.replace('#', '')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── smooth area chart ──────────────────────────────────────────────────────
function Area({ data, color = '#3B82F6', height = 200 }) {
  if (!data.length) return <Empty>No data in range</Empty>
  const max = Math.max(...data.map(d => d.v), 1)
  const W = Math.max(data.length * 46, 320), padX = 14, padTop = 24, padBot = 26
  const x = (i) => padX + (i / Math.max(data.length - 1, 1)) * (W - padX * 2)
  const y = (v) => padTop + (1 - v / max) * (height - padTop - padBot)
  const pts = data.map((d, i) => [x(i), y(d.v)])
  // smooth path (catmull-rom -> bezier)
  let line = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
    line += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  const area = line + ` L ${pts[pts.length - 1][0]} ${height - padBot} L ${pts[0][0]} ${height - padBot} Z`
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} style={{ minWidth: '100%' }}>
        <defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.32" /><stop offset="1" stopColor={color} stopOpacity="0.02" /></linearGradient></defs>
        <path d={area} fill="url(#areaG)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="3" fill="var(--bg2)" stroke={color} strokeWidth="2" />
            {data[i].v > 0 && <text x={p[0]} y={p[1] - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--tx)">{data[i].v}</text>}
            <text x={p[0]} y={height - 9} textAnchor="middle" fontSize="9" fill="var(--mu)">{data[i].label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── donut ───────────────────────────────────────────────────────────────────
function Donut({ data, size = 156 }) {
  const total = data.reduce((s, d) => s + d.v, 0)
  if (!total) return <Empty>No data</Empty>
  let cum = 0; const R = size / 2 - 6, cx = size / 2, cy = size / 2, hole = R - 17
  const slices = data.filter(d => d.v > 0).map(d => {
    const pct = d.v / total, a1 = cum * 2 * Math.PI - Math.PI / 2; cum += pct
    const a2 = cum * 2 * Math.PI - Math.PI / 2
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1), x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2)
    return { ...d, pct, d: `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${pct > .5 ? 1 : 0} 1 ${x2} ${y2} Z` }
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.c} />)}
        <circle cx={cx} cy={cy} r={hole} fill="var(--bg2)" />
        <text x={cx} y={cy - 3} textAnchor="middle" fontSize="24" fontWeight="800" fill="var(--tx)">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="var(--mu)">TOTAL</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 120 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.c, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--mu)' }}>{s.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{s.v}</span>
            <span style={{ fontSize: 11, color: 'var(--mu2)', width: 36, textAlign: 'right' }}>{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const Empty = ({ children }) => <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--mu2)', fontSize: 12 }}>{children}</div>

// benchmark pill
function Bench({ good, text }) {
  const c = good ? '#10B981' : '#F59E0B'
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: c, background: `${c}1a`, padding: '3px 9px', borderRadius: 20 }}>{good ? '▲' : '▼'} {text}</span>
}

export default function Analytics() {
  const router = useRouter()
  const [appUser, setAppUser] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [dept, setDept] = useState('all')
  const [range, setRange] = useState('all')
  const [emp, setEmp] = useState('all')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      load(session.user)
    })
  }, [router])

  async function load(u) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)
    const admin = ['super_admin', 'platform_admin'].includes(au?.role)
    let pq = supabase.from('profiles').select('*'); if (!admin) pq = pq.eq('company_id', au?.company_id)
    let uq = supabase.from('app_users').select('*'); if (!admin) uq = uq.eq('company_id', au?.company_id)
    const [{ data: ps }, { data: us }] = await Promise.all([pq, uq])
    setProfiles(ps || []); setUsers(us || []); setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--tx)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 38, height: 38, border: '3px solid var(--bd2)', borderTopColor: 'var(--ac)', borderRadius: '50%', animation: 'asp 0.8s linear infinite' }} />
        <div style={{ fontSize: 13, color: 'var(--mu)' }}>Crunching your numbers…</div>
        <style>{`@keyframes asp{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  const nameOf = (id) => { const u = users.find(x => x.id === id); return u ? (u.full_name || u.email || 'Unknown') : '—' }
  const minDate = profiles.reduce((m, p) => { const t = p.created_at ? new Date(p.created_at) : null; return t && (!m || t < m) ? t : m }, null)
  const bounds = rangeBounds(range, minDate)
  const inRange = (p) => range === 'all' ? true : (p.created_at ? (new Date(p.created_at) >= bounds.start && new Date(p.created_at) <= bounds.end) : false)

  const filtered = profiles.filter(p => {
    if (dept !== 'all' && deptOfProfile(p) !== dept) return false
    if (emp !== 'all' && p.created_by !== emp) return false
    return inRange(p)
  })

  // ── core metrics ──
  const total = filtered.length
  const placedArr = filtered.filter(p => isPlaced(p.status))
  const placed = placedArr.length
  const dead = filtered.filter(p => isDead(p.status)).length
  const pipeline = total - placed - dead
  const rate = total ? Math.round(placed / total * 100) : 0
  const interviews = filtered.filter(p => p.interview_date || /interview/i.test(p.status || '')).length
  const offers = filtered.filter(p => /offer/i.test(p.status || '')).length
  const activeEmps = new Set(filtered.map(p => p.created_by).filter(Boolean)).size

  // real Time-to-Hire (placement_date - created_at)
  const tthArr = placedArr.map(p => (p.placement_date && p.created_at) ? daysBetween(p.created_at, p.placement_date) : null).filter(v => v != null)
  const avgTTH = tthArr.length ? Math.round(tthArr.reduce((a, b) => a + b, 0) / tthArr.length) : null
  const intToOffer = offers ? +(interviews / offers).toFixed(1) : null
  const offerAccept = offers ? Math.round(placed / offers * 100) : null

  // ── trend (added) ──
  const trend = (() => {
    let unit = 'day'
    if (range === 'today' || range === 'yesterday') unit = 'hour'
    else if (['quarter', 'half', 'year', 'all'].includes(range)) unit = 'month'
    const fmt = (d) => unit === 'hour' ? d.getHours() + 'h' : unit === 'month' ? d.toLocaleString('en', { month: 'short' }) : d.getDate() + '/' + (d.getMonth() + 1)
    const key = (d) => unit === 'hour' ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}` : unit === 'month' ? `${d.getFullYear()}-${d.getMonth()}` : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const map = {}, order = []
    let cur = new Date(bounds.start), end = new Date(bounds.end), g = 0
    while (cur <= end && g < 400) { const k = key(cur); map[k] = { label: fmt(cur), v: 0 }; order.push(k); if (unit === 'hour') cur.setHours(cur.getHours() + 1); else if (unit === 'month') cur.setMonth(cur.getMonth() + 1); else cur.setDate(cur.getDate() + 1); g++ }
    filtered.forEach(p => { if (!p.created_at) return; const k = key(new Date(p.created_at)); if (map[k]) map[k].v++ })
    let arr = order.map(k => map[k]); if (arr.length > 24) arr = arr.slice(arr.length - 24)
    return arr
  })()
  const trendVals = trend.map(t => t.v)

  // ── funnel + conversion ──
  const fc = (re) => filtered.filter(p => re.test(p.status || '')).length
  const funnel = [
    { l: 'Sourced', v: filtered.filter(p => !p.status || /new|sourc|add/i.test(p.status)).length, c: '#64748B' },
    { l: 'Contacted', v: fc(/contact/i), c: '#3B82F6' },
    { l: 'Screened', v: fc(/screen|shortlist/i), c: '#06B6D4' },
    { l: 'Interview', v: fc(/interview/i), c: '#F59E0B' },
    { l: 'Offer', v: fc(/offer/i), c: '#A855F7' },
    { l: 'Placed', v: placed, c: '#10B981' },
  ]
  const funMax = Math.max(...funnel.map(f => f.v), 1)

  // ── dept split / sources / industries / cities ──
  const deptBase = profiles.filter(p => (emp === 'all' || p.created_by === emp) && inRange(p))
  const dStat = (d) => { const s = deptBase.filter(p => deptOfProfile(p) === d); const pl = s.filter(p => isPlaced(p.status)).length; return { added: s.length, placed: pl, rate: s.length ? Math.round(pl / s.length * 100) : 0 } }
  const rec = dStat('recruitment'), bd = dStat('bd')
  const deptPie = [{ label: 'Recruitment', v: rec.added, c: DEPT_C.recruitment }, { label: 'BD', v: bd.added, c: DEPT_C.bd }]
  const topN = (f, n = 6) => Object.entries(filtered.reduce((a, p) => { const k = p[f]; if (k) a[k] = (a[k] || 0) + 1; return a }, {})).map(([label, v]) => ({ label, v })).sort((a, b) => b.v - a.v).slice(0, n)
  const topInd = topN('industry'), topCity = topN('city')
  const srcAgg = Object.entries(filtered.reduce((a, p) => { const k = p.source || p.source_platform; if (k) a[k] = (a[k] || 0) + 1; return a }, {})).map(([label, v], i) => ({ label, v, c: ['#3B82F6', '#A855F7', '#10B981', '#F59E0B', '#06B6D4', '#EC4899'][i % 6] })).sort((a, b) => b.v - a.v).slice(0, 6)

  // ── leaderboard ──
  const lbBase = profiles.filter(p => (dept === 'all' || deptOfProfile(p) === dept) && inRange(p))
  const lbMap = {}
  lbBase.forEach(p => { const id = p.created_by; if (!id) return; if (!lbMap[id]) lbMap[id] = { id, added: 0, placed: 0 }; lbMap[id].added++; if (isPlaced(p.status)) lbMap[id].placed++ })
  const leaderboard = Object.values(lbMap).map(e => ({ ...e, name: nameOf(e.id), dept: deptOfUser(users.find(u => u.id === e.id)), rate: e.added ? Math.round(e.placed / e.added * 100) : 0 })).sort((a, b) => b.placed - a.placed || b.added - a.added)

  // ── AI Smart Insights (rule-based, plain language) ──
  const insights = []
  if (avgTTH != null) insights.push({ icon: avgTTH <= BM.timeToHire ? '⚡' : '🐢', text: avgTTH <= BM.timeToHire ? `Your avg time-to-hire is ${avgTTH} days — ${Math.round((1 - avgTTH / BM.timeToHire) * 100)}% faster than the ${BM.timeToHire}-day industry benchmark.` : `Time-to-hire is ${avgTTH} days, above the ${BM.timeToHire}-day benchmark — worth tightening screening.`, good: avgTTH <= BM.timeToHire })
  if (rate > 0) insights.push({ icon: rate >= 25 ? '🎯' : '📉', text: `Overall conversion is ${rate}% (${placed}/${total}). ${rate >= 25 ? 'Strong pipeline efficiency.' : 'Focus on mid-funnel drop-off to lift this.'}`, good: rate >= 25 })
  if (leaderboard.length) { const top = leaderboard[0]; insights.push({ icon: '🏆', text: `${top.name} leads with ${top.placed} placement${top.placed !== 1 ? 's' : ''} from ${top.added} profiles (${top.rate}% success).`, good: true }) }
  if (topInd.length) insights.push({ icon: '🔥', text: `${topInd[0].label} is your busiest industry with ${topInd[0].v} candidate${topInd[0].v !== 1 ? 's' : ''}.`, good: true })
  if (bd.added > 0 && rec.added > 0) insights.push({ icon: '⚖️', text: `Recruitment ${rec.added} vs BD ${bd.added} — ${rec.added >= bd.added ? 'recruitment' : 'BD'} is driving most volume right now.`, good: true })
  if (!insights.length) insights.push({ icon: '💡', text: 'Add more candidates to unlock trend insights, benchmarks and forecasts.', good: true })

  function exportCSV() {
    const rows = [['Rank', 'Employee', 'Department', 'Added', 'Placed', 'Success%']]
    leaderboard.forEach((e, i) => rows.push([i + 1, e.name, DEPT_L[e.dept], e.added, e.placed, e.rate + '%']))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')], { type: 'text/csv' }))
    a.download = `performance_${dept}_${range}.csv`; a.click()
  }

  const pill = (on) => ({ padding: '7px 14px', borderRadius: 9, border: '1px solid ' + (on ? 'transparent' : 'var(--bd)'), background: on ? 'var(--ac)' : 'var(--bg2)', color: on ? '#fff' : 'var(--mu)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all .15s' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--tx)', fontFamily: 'Outfit,system-ui,sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Sora:wght@600;700;800&display=swap');*{box-sizing:border-box}
        @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .tile{background:var(--bg2);border:1px solid var(--bd);border-radius:18px;padding:20px;position:relative;overflow:hidden;animation:rise .5s ease both}
        .tile::before{content:'';position:absolute;inset:0 0 auto 0;height:3px;background:var(--gx,transparent)}
        .bento{display:grid;grid-template-columns:repeat(12,1fr);gap:14px}
        .h-title{font-family:Sora,sans-serif}
        .lbl{font-size:11px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.6px}
        .big{font-family:Sora,sans-serif;font-weight:800;line-height:1;letter-spacing:-1px}
        .an-tbl{width:100%;border-collapse:collapse}
        .an-tbl th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--mu);padding:9px 11px;border-bottom:1px solid var(--bd)}
        .an-tbl td{padding:11px;border-bottom:1px solid var(--bd);font-size:13px}
        .an-tbl tr:last-child td{border-bottom:none}.an-tbl tbody tr:hover{background:var(--bg3);cursor:pointer}
        .col4{grid-column:span 4}.col6{grid-column:span 6}.col8{grid-column:span 8}.col12{grid-column:span 12}
        .row2{grid-row:span 2}
        @media(max-width:900px){.col4,.col6,.col8{grid-column:span 12 !important}.row2{grid-row:auto !important}}
      `}</style>

      <div style={{ padding: '26px 24px 60px', maxWidth: 1220, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <div className="lbl" style={{ marginBottom: 6 }}>RecruitBase Pro · Analytics</div>
            <h1 className="h-title" style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Performance Intelligence</h1>
            <p style={{ fontSize: 13, color: 'var(--mu)', margin: '6px 0 0' }}>{DEPT_L[dept]} · {RANGES.find(r => r.k === range)?.l}{emp !== 'all' ? ' · ' + nameOf(emp) : ''} · benchmarked vs SHRM 2025</p>
          </div>
          <button onClick={exportCSV} style={{ background: 'var(--bg2)', border: '1px solid var(--bd2)', color: 'var(--tx)', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⬇ Export Report</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 22, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {['all', 'recruitment', 'bd'].map(d => <button key={d} style={pill(dept === d)} onClick={() => setDept(d)}>{DEPT_L[d]}</button>)}
          </div>
          <div style={{ width: 1, height: 22, background: 'var(--bd)' }} />
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {RANGES.map(r => <button key={r.k} style={pill(range === r.k)} onClick={() => setRange(r.k)}>{r.l}</button>)}
          </div>
          <select value={emp} onChange={e => setEmp(e.target.value)} style={{ background: 'var(--bg2)', border: '1px solid var(--bd2)', color: 'var(--tx)', borderRadius: 9, padding: '8px 12px', fontFamily: 'inherit', fontSize: 13, marginLeft: 'auto' }}>
            <option value="all">All Employees</option>
            {users.filter(u => u.role !== 'job_seeker').map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
          </select>
        </div>

        {/* ── BENTO GRID ── */}
        <div className="bento">

          {/* HERO — Placements */}
          <div className="tile col4 row2" style={{ '--gx': 'linear-gradient(90deg,#10B981,#34D399)', animationDelay: '0s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(160deg,var(--bg2),var(--bg2)),radial-gradient(120% 80% at 100% 0%, #10B98118, transparent)', backgroundBlendMode: 'normal', minHeight: 220 }}>
            <div>
              <div className="lbl">Total Placements</div>
              <div className="big" style={{ fontSize: 64, marginTop: 10, background: 'linear-gradient(135deg,#10B981,#34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}><Count to={placed} /></div>
              <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 6 }}>{rate}% conversion · {total} total candidates</div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="lbl" style={{ marginBottom: 6 }}>Added trend</div>
              <Spark data={trendVals.length > 1 ? trendVals : [0, placed]} color="#10B981" w={200} h={44} />
            </div>
          </div>

          {/* Time to Hire */}
          <div className="tile col4" style={{ '--gx': 'linear-gradient(90deg,#3B82F6,#60A5FA)', animationDelay: '.06s' }}>
            <div className="lbl">⏱ Avg Time-to-Hire</div>
            <div className="big" style={{ fontSize: 40, marginTop: 10, color: 'var(--tx)' }}>{avgTTH != null ? <><Count to={avgTTH} /> <span style={{ fontSize: 16, color: 'var(--mu)', fontFamily: 'Outfit' }}>days</span></> : <span style={{ fontSize: 18, color: 'var(--mu2)', fontWeight: 600 }}>No placements yet</span>}</div>
            <div style={{ marginTop: 12 }}>{avgTTH != null ? <Bench good={avgTTH <= BM.timeToHire} text={`vs ${BM.timeToHire}d industry`} /> : <span style={{ fontSize: 11, color: 'var(--mu2)' }}>Benchmark: {BM.timeToHire} days (SHRM)</span>}</div>
          </div>

          {/* Conversion rate */}
          <div className="tile col4" style={{ '--gx': 'linear-gradient(90deg,#F59E0B,#FBBF24)', animationDelay: '.12s' }}>
            <div className="lbl">📈 Success Rate</div>
            <div className="big" style={{ fontSize: 40, marginTop: 10, color: 'var(--tx)' }}><Count to={rate} suffix="%" /></div>
            <div style={{ marginTop: 12 }}><Bench good={rate >= 20} text={rate >= 20 ? 'healthy funnel' : 'room to grow'} /></div>
          </div>

          {/* Added */}
          <div className="tile col4" style={{ '--gx': 'linear-gradient(90deg,#06B6D4,#22D3EE)', animationDelay: '.18s' }}>
            <div className="lbl">➕ Candidates Added</div>
            <div className="big" style={{ fontSize: 40, marginTop: 10, color: 'var(--tx)' }}><Count to={total} /></div>
            <div style={{ marginTop: 10 }}><Spark data={trendVals.length > 1 ? trendVals : [0, total]} color="#06B6D4" w={130} h={32} /></div>
          </div>

          {/* In pipeline + interviews */}
          <div className="tile col4" style={{ '--gx': 'linear-gradient(90deg,#A855F7,#C084FC)', animationDelay: '.24s', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div><div className="lbl">🔄 In Pipeline</div><div className="big" style={{ fontSize: 40, marginTop: 10, color: 'var(--tx)' }}><Count to={pipeline} /></div></div>
            <div style={{ textAlign: 'right' }}><div className="lbl">Interviews</div><div className="big" style={{ fontSize: 40, marginTop: 10, color: '#A855F7' }}><Count to={interviews} /></div></div>
          </div>

          {/* Trend area — wide */}
          <div className="tile col12" style={{ animationDelay: '.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div className="h-title" style={{ fontSize: 15, fontWeight: 700 }}>Hiring Activity Over Time</div>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>{RANGES.find(r => r.k === range)?.l}</div>
            </div>
            <Area data={trend} color="#3B82F6" />
          </div>

          {/* Funnel — tall */}
          <div className="tile col4 row2" style={{ animationDelay: '.36s' }}>
            <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Conversion Funnel</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {funnel.map((f, i) => {
                const prev = i > 0 ? funnel[i - 1].v : null
                const conv = prev ? Math.round(f.v / prev * 100) : null
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

          {/* AI Insights */}
          <div className="tile col8" style={{ '--gx': 'linear-gradient(90deg,#8B5CF6,#EC4899)', animationDelay: '.42s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>✨</span><div className="h-title" style={{ fontSize: 15, fontWeight: 700 }}>Smart Insights</div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#8B5CF6', background: '#8B5CF61a', padding: '2px 8px', borderRadius: 12, marginLeft: 'auto' }}>AUTO-GENERATED</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {insights.slice(0, 5).map((ins, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{ins.icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--tx)', lineHeight: 1.5 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Department comparison */}
          <div className="tile col6" style={{ animationDelay: '.48s' }}>
            <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Recruitment vs BD</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ k: 'recruitment', s: rec }, { k: 'bd', s: bd }].map(({ k, s }) => (
                <div key={k} style={{ border: '1px solid var(--bd)', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: DEPT_C[k] }} /><span style={{ fontWeight: 700 }}>{DEPT_L[k]}</span></div>
                  <div style={{ display: 'flex', gap: 22 }}>{[['Added', s.added], ['Placed', s.placed], ['Rate', s.rate + '%']].map(([l, v]) => <div key={l}><div className="big" style={{ fontSize: 22, color: DEPT_C[k] }}>{v}</div><div className="lbl" style={{ fontSize: 10 }}>{l}</div></div>)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Volume split donut */}
          <div className="tile col6" style={{ animationDelay: '.54s' }}>
            <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Volume Split</div>
            <Donut data={deptPie} />
          </div>

          {/* Leaderboard */}
          <div className="tile col8" style={{ animationDelay: '.6s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="h-title" style={{ fontSize: 15, fontWeight: 700 }}>🏆 Employee Leaderboard</div>
              <span style={{ fontSize: 11, color: 'var(--mu2)' }}>click a row to drill in</span>
            </div>
            {leaderboard.length === 0 ? <Empty>No activity in this range</Empty> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="an-tbl">
                  <thead><tr><th style={{ width: 40 }}>#</th><th>Employee</th><th>Dept</th><th style={{ textAlign: 'right' }}>Added</th><th style={{ textAlign: 'right' }}>Placed</th><th style={{ width: 130 }}>Success</th></tr></thead>
                  <tbody>
                    {leaderboard.map((e, i) => (
                      <tr key={e.id} onClick={() => setEmp(emp === e.id ? 'all' : e.id)} style={{ background: emp === e.id ? 'var(--acbg)' : 'transparent' }}>
                        <td><div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, background: i === 0 ? 'linear-gradient(135deg,#FCD34D,#F59E0B)' : i === 1 ? 'linear-gradient(135deg,#E5E7EB,#9CA3AF)' : i === 2 ? 'linear-gradient(135deg,#FDBA74,#CD7F32)' : 'var(--bg3)', color: i < 3 ? '#fff' : 'var(--mu)' }}>{i + 1}</div></td>
                        <td style={{ fontWeight: 600 }}>{e.name}</td>
                        <td><span style={{ fontSize: 11, fontWeight: 700, color: DEPT_C[e.dept], background: `${DEPT_C[e.dept]}18`, padding: '2px 9px', borderRadius: 12 }}>{DEPT_L[e.dept]}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{e.added}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#10B981' }}>{e.placed}</td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3 }}><div style={{ height: '100%', width: `${e.rate}%`, background: 'linear-gradient(90deg,#10B981,#34D399)', borderRadius: 3 }} /></div><span style={{ fontSize: 11, fontWeight: 700, width: 30 }}>{e.rate}%</span></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Source effectiveness */}
          <div className="tile col4" style={{ animationDelay: '.66s' }}>
            <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Source of Hire</div>
            {srcAgg.length ? <Donut data={srcAgg} size={140} /> : <Empty>No source data yet</Empty>}
          </div>

          {/* Top industries */}
          <div className="tile col6" style={{ animationDelay: '.72s' }}>
            <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Top Industries</div>
            {topInd.length ? <Hbars rows={topInd} color="#3B82F6" /> : <Empty>No data</Empty>}
          </div>
          {/* Top cities */}
          <div className="tile col6" style={{ animationDelay: '.78s' }}>
            <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Top Cities</div>
            {topCity.length ? <Hbars rows={topCity} color="#10B981" /> : <Empty>No data</Empty>}
          </div>

        </div>
      </div>
    </div>
  )
}

function Hbars({ rows, color }) {
  const max = Math.max(...rows.map(r => r.v), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}><span style={{ color: 'var(--tx)' }}>{r.label}</span><span style={{ fontWeight: 700, color: 'var(--mu)' }}>{r.v}</span></div>
          <div style={{ height: 7, background: 'var(--bg3)', borderRadius: 4 }}><div style={{ height: '100%', width: `${(r.v / max) * 100}%`, background: `linear-gradient(90deg,${color},${color}aa)`, borderRadius: 4, transition: 'width .6s' }} /></div>
        </div>
      ))}
    </div>
  )
}
