// @ts-nocheck
import { applyTheme, getSavedTheme } from '../../src/components/theme'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ════════════════════════════════════════════════════════════════
// ANALYTICS & REPORTS — 360° view
// Filters: Department (All/Recruitment/BD) + Time (8 ranges) + Employee
// Views: KPIs, Trend, Dept comparison, Pipeline, Funnel, Leaderboard,
//        Top Industries, Top Cities, Source split. All SVG, no libs.
// Data-driven & defensive: koi field/status missing ho to crash nahi.
// ════════════════════════════════════════════════════════════════

const RANGES = [
  { k: 'today',     label: 'Today' },
  { k: 'yesterday', label: 'Yesterday' },
  { k: 'week',      label: 'This Week' },
  { k: '15d',       label: '15 Days' },
  { k: 'month',     label: 'This Month' },
  { k: 'quarter',   label: 'Quarter' },
  { k: 'half',      label: 'Half Year' },
  { k: 'year',      label: 'This Year' },
  { k: 'all',       label: 'All Time' },
]

function rangeBounds(k, minDate) {
  const now = new Date()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  if (k === 'today')     return { start: today, end: now }
  if (k === 'yesterday') { const s = new Date(today); s.setDate(s.getDate() - 1); return { start: s, end: new Date(today) } }
  if (k === 'week')      { const s = new Date(today); const d = (s.getDay() + 6) % 7; s.setDate(s.getDate() - d); return { start: s, end: now } }
  if (k === '15d')       { const s = new Date(today); s.setDate(s.getDate() - 14); return { start: s, end: now } }
  if (k === 'month')     return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now }
  if (k === 'quarter')   { const q = Math.floor(now.getMonth() / 3); return { start: new Date(now.getFullYear(), q * 3, 1), end: now } }
  if (k === 'half')      return { start: new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1), end: now }
  if (k === 'year')      return { start: new Date(now.getFullYear(), 0, 1), end: now }
  return { start: minDate || new Date(2024, 0, 1), end: now }
}

const deptOfProfile = (p) => {
  const t = (p?.type || 'Candidate').toLowerCase()
  if (/bd|client|company|lead|business|prospect/.test(t)) return 'bd'
  return 'recruitment'
}
const deptOfUser = (u) => {
  const r = (u?.role || '').toLowerCase()
  if (/bd|business|sales|client/.test(r)) return 'bd'
  return 'recruitment'
}
const isPlaced = (s) => /plac|joined/i.test(s || '')
const isDead   = (s) => /reject|declin|not interest|did not join|dnp|drop/i.test(s || '')
const DEPT_LABEL = { recruitment: 'Recruitment', bd: 'BD', all: 'All Departments' }
const DEPT_COLOR = { recruitment: '#3B82F6', bd: '#A855F7' }

// ── SVG Donut ─────────────────────────────────────────────────────
function Donut({ data, size = 150 }) {
  const total = data.reduce((s, d) => s + d.v, 0)
  if (!total) return <Empty>No data</Empty>
  let cum = 0; const R = size / 2 - 6, cx = size / 2, cy = size / 2, hole = R - 16
  const slices = data.filter(d => d.v > 0).map(d => {
    const pct = d.v / total, a1 = cum * 2 * Math.PI - Math.PI / 2; cum += pct
    const a2 = cum * 2 * Math.PI - Math.PI / 2
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
    const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2)
    return { ...d, pct, d: `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z` }
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.c} />)}
        <circle cx={cx} cy={cy} r={hole} fill="var(--bg2)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--tx)">{total}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize={9} fill="var(--mu)">TOTAL</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minWidth: 130 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.c, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--mu)' }}>{s.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--tx)' }}>{s.v}</span>
            <span style={{ fontSize: 11, color: 'var(--mu2)', width: 34, textAlign: 'right' }}>{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SVG Vertical Bars (trend) ─────────────────────────────────────
function Bars({ data, color = '#3B82F6', height = 160 }) {
  if (!data.length) return <Empty>No data in range</Empty>
  const max = Math.max(...data.map(d => d.v), 1)
  const W = Math.max(data.length * 34, 260), pad = 24, bw = (W - pad * 2) / data.length * 0.62
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} style={{ minWidth: '100%' }}>
        {data.map((d, i) => {
          const x = pad + (i + 0.5) * ((W - pad * 2) / data.length)
          const h = (d.v / max) * (height - 44)
          const y = height - 26 - h
          return (
            <g key={i}>
              {d.v > 0 && <text x={x} y={y - 5} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--tx)">{d.v}</text>}
              <rect x={x - bw / 2} y={y} width={bw} height={Math.max(h, d.v ? 2 : 0)} rx={3} fill={color} opacity={0.88} />
              <text x={x} y={height - 9} textAnchor="middle" fontSize={9} fill="var(--mu)">{d.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Horizontal bar list ───────────────────────────────────────────
function HBars({ rows, color = '#3B82F6' }) {
  if (!rows.length) return <Empty>No data</Empty>
  const max = Math.max(...rows.map(r => r.v), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: 'var(--tx)' }}>{r.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--mu)' }}>{r.v}</span>
          </div>
          <div style={{ height: 7, background: 'var(--bg3)', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${(r.v / max) * 100}%`, background: r.c || color, borderRadius: 4, transition: 'width .5s' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Empty({ children }) {
  return <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mu2)', fontSize: 12 }}>{children}</div>
}
function Card({ title, extra, children }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 14, padding: 18 }}>
      {title && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{title}</div>{extra}
      </div>}
      {children}
    </div>
  )
}

export default function Analytics() {
  const router = useRouter()
  const [appUser, setAppUser] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [dept, setDept] = useState('all')
  const [range, setRange] = useState('month')
  const [emp, setEmp] = useState('all')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      loadData(session.user)
    })
  }, [router])

  async function loadData(u) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)
    const isAdmin = ['super_admin', 'platform_admin'].includes(au?.role)
    let q = supabase.from('profiles').select('*')
    if (!isAdmin) q = q.eq('company_id', au?.company_id)
    const { data: ps } = await q
    let uq = supabase.from('app_users').select('*')
    if (!isAdmin) uq = uq.eq('company_id', au?.company_id)
    const { data: us } = await uq
    setProfiles(ps || [])
    setUsers(us || [])
    setLoading(false)
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--tx)' }}>Loading analytics…</div>

  // ── name lookup ──
  const nameOf = (id) => {
    const u = users.find(x => x.id === id)
    return u ? (u.full_name || u.email || 'Unknown') : '—'
  }

  // ── date span for "all" ──
  const minDate = profiles.reduce((m, p) => {
    const t = p.created_at ? new Date(p.created_at) : null
    return t && (!m || t < m) ? t : m
  }, null)
  const bounds = rangeBounds(range, minDate)

  // ── master filter ──
  const inRange = (p) => {
    if (range === 'all') return true
    const t = p.created_at ? new Date(p.created_at) : null
    return t ? (t >= bounds.start && t <= bounds.end) : false
  }
  const filtered = profiles.filter(p => {
    if (dept !== 'all' && deptOfProfile(p) !== dept) return false
    if (emp !== 'all' && p.created_by !== emp) return false
    return inRange(p)
  })

  // ── KPIs ──
  const total = filtered.length
  const placed = filtered.filter(p => isPlaced(p.status)).length
  const dead = filtered.filter(p => isDead(p.status)).length
  const pipeline = total - placed - dead
  const rate = total ? Math.round((placed / total) * 100) : 0
  const activeEmps = new Set(filtered.map(p => p.created_by).filter(Boolean)).size
  const avgPerEmp = activeEmps ? Math.round(total / activeEmps) : 0

  const KPI = [
    { l: 'Total Added',     v: total,        c: '#3B82F6', icon: '➕' },
    { l: 'Placed',          v: placed,       c: '#10B981', icon: '🏆' },
    { l: 'Success Rate',    v: rate + '%',   c: '#F59E0B', icon: '📈' },
    { l: 'In Pipeline',     v: pipeline,     c: '#06B6D4', icon: '🔄' },
    { l: 'Active Staff',    v: activeEmps,   c: '#EC4899', icon: '👤' },
    { l: 'Avg / Person',    v: avgPerEmp,    c: '#A855F7', icon: '⚖️' },
  ]

  // ── Department comparison (ignores dept filter, respects time+emp) ──
  const deptBase = profiles.filter(p => (emp === 'all' || p.created_by === emp) && inRange(p))
  const deptStats = (d) => {
    const set = deptBase.filter(p => deptOfProfile(p) === d)
    const pl = set.filter(p => isPlaced(p.status)).length
    return { added: set.length, placed: pl, rate: set.length ? Math.round(pl / set.length * 100) : 0 }
  }
  const rec = deptStats('recruitment'), bd = deptStats('bd')
  const deptPie = [
    { label: 'Recruitment', v: rec.added, c: DEPT_COLOR.recruitment },
    { label: 'BD',          v: bd.added,  c: DEPT_COLOR.bd },
  ]

  // ── Trend buckets ──
  const trend = (() => {
    let unit = 'day'
    if (range === 'today' || range === 'yesterday') unit = 'hour'
    else if (['quarter', 'half', 'year', 'all'].includes(range)) unit = 'month'
    const buckets = []
    const fmt = (dt) => unit === 'hour' ? `${dt.getHours()}h`
      : unit === 'month' ? dt.toLocaleString('en', { month: 'short' }) + (range === 'all' || range === 'year' ? '' : '')
      : `${dt.getDate()}/${dt.getMonth() + 1}`
    const key = (dt) => unit === 'hour' ? dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate() + '-' + dt.getHours()
      : unit === 'month' ? dt.getFullYear() + '-' + dt.getMonth()
      : dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate()
    const start = new Date(bounds.start), end = new Date(bounds.end)
    const map = {}
    let cur = new Date(start), guard = 0
    while (cur <= end && guard < 400) {
      map[key(cur)] = { label: fmt(cur), v: 0 }
      buckets.push(key(cur))
      if (unit === 'hour') cur.setHours(cur.getHours() + 1)
      else if (unit === 'month') cur.setMonth(cur.getMonth() + 1)
      else cur.setDate(cur.getDate() + 1)
      guard++
    }
    filtered.forEach(p => {
      if (!p.created_at) return
      const k = key(new Date(p.created_at))
      if (map[k]) map[k].v++
    })
    let arr = buckets.map(b => map[b])
    if (arr.length > 30) arr = arr.slice(arr.length - 30) // cap
    return arr
  })()

  // ── Pipeline by status ──
  const byStatus = Object.entries(filtered.reduce((a, p) => { const s = p.status || 'New'; a[s] = (a[s] || 0) + 1; return a }, {}))
    .map(([label, v]) => ({ label, v })).sort((a, b) => b.v - a.v)

  // ── Funnel ──
  const fc = (re) => filtered.filter(p => re.test(p.status || '')).length
  const funnel = [
    { label: 'New / Sourced', v: filtered.filter(p => !p.status || /new|sourc|add/i.test(p.status)).length, c: '#64748B' },
    { label: 'Contacted',     v: fc(/contact/i),                                                            c: '#3B82F6' },
    { label: 'Screening',     v: fc(/screen|shortlist/i),                                                   c: '#06B6D4' },
    { label: 'Interview',     v: fc(/interview/i),                                                          c: '#F59E0B' },
    { label: 'Offer',         v: fc(/offer/i),                                                              c: '#A855F7' },
    { label: 'Placed',        v: placed,                                                                    c: '#10B981' },
  ]
  const funMax = Math.max(...funnel.map(f => f.v), 1)

  // ── Top industries / cities / sources ──
  const topN = (field, n = 7) => Object.entries(filtered.reduce((a, p) => { const k = p[field]; if (k) a[k] = (a[k] || 0) + 1; return a }, {}))
    .map(([label, v]) => ({ label, v })).sort((a, b) => b.v - a.v).slice(0, n)
  const topInd = topN('industry'), topCity = topN('city'), topSrc = topN('source')

  // ── Employee leaderboard (respects dept+time, ignores emp filter) ──
  const lbBase = profiles.filter(p => (dept === 'all' || deptOfProfile(p) === dept) && inRange(p))
  const lbMap = {}
  lbBase.forEach(p => {
    const id = p.created_by; if (!id) return
    if (!lbMap[id]) lbMap[id] = { id, added: 0, placed: 0 }
    lbMap[id].added++
    if (isPlaced(p.status)) lbMap[id].placed++
  })
  const leaderboard = Object.values(lbMap).map(e => ({
    ...e, name: nameOf(e.id), dept: deptOfUser(users.find(u => u.id === e.id)),
    rate: e.added ? Math.round(e.placed / e.added * 100) : 0,
  })).sort((a, b) => b.added - a.added || b.placed - a.placed)

  function exportCSV() {
    const rows = [['Rank', 'Employee', 'Department', 'Added', 'Placed', 'Success%']]
    leaderboard.forEach((e, i) => rows.push([i + 1, e.name, DEPT_LABEL[e.dept], e.added, e.placed, e.rate + '%']))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `performance_${dept}_${range}.csv`; a.click()
  }

  const selBtn = (on) => ({
    padding: '7px 13px', borderRadius: 8, border: '1px solid ' + (on ? 'var(--ac)' : 'var(--bd)'),
    background: on ? 'var(--acbg)' : 'var(--bg2)', color: on ? 'var(--ac)' : 'var(--mu)',
    cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--tx)', fontFamily: 'Outfit,Inter,sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');*{box-sizing:border-box}
        .an-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16;}
        .an-kpi{display:grid;grid-template-columns:repeat(6,1fr);gap:12;}
        @media(max-width:880px){.an-grid2{grid-template-columns:1fr !important;}.an-kpi{grid-template-columns:repeat(3,1fr) !important;}}
        @media(max-width:520px){.an-kpi{grid-template-columns:repeat(2,1fr) !important;}}
        .an-tbl{width:100%;border-collapse:collapse;}
        .an-tbl th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--mu);padding:8px 10px;border-bottom:1px solid var(--bd);}
        .an-tbl td{padding:10px;border-bottom:1px solid var(--bd);font-size:13px;}
        .an-tbl tr:last-child td{border-bottom:none;}
        .an-tbl tbody tr:hover{background:var(--bg3);}
      `}</style>

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Analytics & Reports</h1>
        <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 20 }}>
          360° performance — {DEPT_LABEL[dept]} · {RANGES.find(r => r.k === range)?.label}{emp !== 'all' ? ' · ' + nameOf(emp) : ''}
        </p>

        {/* ── FILTER BAR ── */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 14, padding: 14, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 7 }}>Department</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['all', 'recruitment', 'bd'].map(d => <button key={d} style={selBtn(dept === d)} onClick={() => setDept(d)}>{DEPT_LABEL[d]}</button>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 7 }}>Time Range</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {RANGES.map(r => <button key={r.k} style={selBtn(range === r.k)} onClick={() => setRange(r.k)}>{r.label}</button>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 7 }}>Employee</div>
            <select value={emp} onChange={e => setEmp(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--bd2)', color: 'var(--tx)', borderRadius: 8, padding: '8px 12px', fontFamily: 'inherit', fontSize: 13, minWidth: 220 }}>
              <option value="all">All Employees</option>
              {users.filter(u => u.role !== 'job_seeker').map(u => <option key={u.id} value={u.id}>{u.full_name || u.email} ({DEPT_LABEL[deptOfUser(u)]})</option>)}
            </select>
          </div>
        </div>

        {/* ── KPI ROW ── */}
        <div className="an-kpi" style={{ marginBottom: 20 }}>
          {KPI.map(s => (
            <div key={s.l} style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.c, lineHeight: 1.1 }}>{s.v}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: .5, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── TREND ── */}
        <div style={{ marginBottom: 16 }}>
          <Card title={`Added Over Time — ${RANGES.find(r => r.k === range)?.label}`}>
            <Bars data={trend} color="#3B82F6" />
          </Card>
        </div>

        {/* ── DEPT COMPARE + SPLIT ── */}
        <div className="an-grid2" style={{ marginBottom: 16 }}>
          <Card title="Department Comparison">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ k: 'recruitment', s: rec }, { k: 'bd', s: bd }].map(({ k, s }) => (
                <div key={k} style={{ border: '1px solid var(--bd)', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: DEPT_COLOR[k] }} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{DEPT_LABEL[k]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 18 }}>
                    {[['Added', s.added], ['Placed', s.placed], ['Rate', s.rate + '%']].map(([l, v]) => (
                      <div key={l}><div style={{ fontSize: 20, fontWeight: 800, color: DEPT_COLOR[k] }}>{v}</div><div style={{ fontSize: 10, color: 'var(--mu)', textTransform: 'uppercase' }}>{l}</div></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Volume Split"><Donut data={deptPie} /></Card>
        </div>

        {/* ── PIPELINE + FUNNEL ── */}
        <div className="an-grid2" style={{ marginBottom: 16 }}>
          <Card title="Pipeline by Status">
            {byStatus.length ? <HBars rows={byStatus.slice(0, 9)} color="#A855F7" /> : <Empty>No data</Empty>}
          </Card>
          <Card title="Conversion Funnel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {funnel.map((f, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: 'var(--mu)' }}>{f.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--tx)' }}>{f.v}{f.v && total ? <span style={{ color: 'var(--mu2)', fontWeight: 500 }}> · {Math.round(f.v / total * 100)}%</span> : ''}</span>
                  </div>
                  <div style={{ height: 22, background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(f.v / funMax) * 100}%`, background: f.c, borderRadius: 6, minWidth: f.v ? 4 : 0, transition: 'width .6s' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── LEADERBOARD ── */}
        <div style={{ marginBottom: 16 }}>
          <Card title="🏆 Employee Performance" extra={<button onClick={exportCSV} style={{ background: 'var(--bg3)', border: '1px solid var(--bd2)', color: 'var(--tx)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⬇ Export CSV</button>}>
            {leaderboard.length === 0 ? <Empty>No activity in this range</Empty> : (
              <table className="an-tbl">
                <thead><tr><th style={{ width: 40 }}>#</th><th>Employee</th><th>Dept</th><th style={{ textAlign: 'right' }}>Added</th><th style={{ textAlign: 'right' }}>Placed</th><th style={{ width: 140 }}>Success</th></tr></thead>
                <tbody>
                  {leaderboard.map((e, i) => (
                    <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => setEmp(emp === e.id ? 'all' : e.id)}>
                      <td><div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, background: i === 0 ? 'rgba(255,214,10,.18)' : i === 1 ? 'rgba(180,180,180,.18)' : i === 2 ? 'rgba(205,127,50,.18)' : 'var(--bg3)', color: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7F32' : 'var(--mu)' }}>{i + 1}</div></td>
                      <td style={{ fontWeight: 600 }}>{e.name}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 700, color: DEPT_COLOR[e.dept], background: `${DEPT_COLOR[e.dept]}18`, padding: '2px 8px', borderRadius: 12 }}>{DEPT_LABEL[e.dept]}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{e.added}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{e.placed}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3 }}><div style={{ height: '100%', width: `${e.rate}%`, background: '#10B981', borderRadius: 3 }} /></div>
                          <span style={{ fontSize: 11, fontWeight: 700, width: 32 }}>{e.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ fontSize: 11, color: 'var(--mu2)', marginTop: 10 }}>💡 Kisi employee pe click karke uska individual view kholo.</div>
          </Card>
        </div>

        {/* ── TOP INDUSTRIES / CITIES / SOURCES ── */}
        <div className="an-grid2" style={{ marginBottom: 16 }}>
          <Card title="Top Industries"><HBars rows={topInd} color="#3B82F6" /></Card>
          <Card title="Top Cities"><HBars rows={topCity} color="#10B981" /></Card>
        </div>
        <Card title="Top Sources"><HBars rows={topSrc} color="#F59E0B" /></Card>
      </div>
    </div>
  )
}
