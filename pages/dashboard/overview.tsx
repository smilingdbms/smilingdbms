// @ts-nocheck
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ════════════════════════════════════════════════════════════════
// SUPER ADMIN — Platform Overview (god-view across ALL companies)
// KPIs · Growth trend · Users by role · Top companies · Company table
// Only super_admin / platform_admin. All SVG, no libs, theme-aware.
// ════════════════════════════════════════════════════════════════

const isPlaced = (s) => /plac|joined/i.test(s || '')
const ROLE_COLOR = (r) => {
  const m = { super_admin: '#EF4444', platform_admin: '#F97316', account_owner: '#3B82F6', recruiter: '#10B981', bd: '#A855F7', job_seeker: '#06B6D4' }
  return m[r] || '#94A3B8'
}
const fmtRole = (r) => (r || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

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
          </div>
        ))}
      </div>
    </div>
  )
}

function Bars({ data, color = '#3B82F6', height = 170 }) {
  if (!data.length) return <Empty>No data</Empty>
  const max = Math.max(...data.map(d => d.v), 1)
  const W = Math.max(data.length * 50, 300), pad = 26, bw = (W - pad * 2) / data.length * 0.6
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} style={{ minWidth: '100%' }}>
        {data.map((d, i) => {
          const x = pad + (i + 0.5) * ((W - pad * 2) / data.length)
          const h = (d.v / max) * (height - 46); const y = height - 26 - h
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

function HBars({ rows, color = '#3B82F6' }) {
  if (!rows.length) return <Empty>No data</Empty>
  const max = Math.max(...rows.map(r => r.v), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: 'var(--tx)' }}>{r.label}</span><span style={{ fontWeight: 700, color: 'var(--mu)' }}>{r.v}</span>
          </div>
          <div style={{ height: 7, background: 'var(--bg3)', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${(r.v / max) * 100}%`, background: r.c || color, borderRadius: 4, transition: 'width .5s' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

const Empty = ({ children }) => <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mu2)', fontSize: 12 }}>{children}</div>
const Card = ({ title, extra, children }) => (
  <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 14, padding: 18 }}>
    {title && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{title}</div>{extra}</div>}
    {children}
  </div>
)

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
      setCompanies(co || []); setUsers(us || []); setProfiles(ps || [])
      setLoading(false)
    })()
  }, [])

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--tx)' }}>Loading platform…</div>
  if (denied) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--tx)', gap: 12 }}>
      <div style={{ fontSize: 40 }}>🔒</div>
      <div style={{ fontWeight: 700 }}>Super Admin only</div>
      <button onClick={() => router.replace('/dashboard/master')} style={{ background: 'var(--ac)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Go to Dashboard →</button>
    </div>
  )

  const candidates = profiles.filter(p => !p.type || p.type === 'Candidate')
  const placed = candidates.filter(p => isPlaced(p.status)).length
  const realUsers = users.filter(u => u.role !== 'job_seeker')

  const KPI = [
    { l: 'Companies',     v: companies.length,                              c: '#3B82F6', icon: '🏢' },
    { l: 'Total Users',   v: realUsers.length,                              c: '#A855F7', icon: '👥' },
    { l: 'Candidates',    v: candidates.length,                             c: '#06B6D4', icon: '🧑‍💼' },
    { l: 'Placements',    v: placed,                                        c: '#10B981', icon: '🏆' },
    { l: 'Job Seekers',   v: users.filter(u => u.role === 'job_seeker').length, c: '#EC4899', icon: '🔎' },
    { l: 'Avg / Company', v: companies.length ? Math.round(candidates.length / companies.length) : 0, c: '#F59E0B', icon: '⚖️' },
  ]

  // ── Growth: candidates added per month (last 12) ──
  const growth = (() => {
    const now = new Date(); const arr = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      arr.push({ key: d.getFullYear() + '-' + d.getMonth(), label: d.toLocaleString('en', { month: 'short' }), v: 0 })
    }
    const idx = {}; arr.forEach((a, i) => idx[a.key] = i)
    candidates.forEach(p => { if (!p.created_at) return; const d = new Date(p.created_at); const k = d.getFullYear() + '-' + d.getMonth(); if (idx[k] != null) arr[idx[k]].v++ })
    return arr
  })()

  // ── Users by role ──
  const roleAgg = Object.entries(users.reduce((a, u) => { const r = u.role || 'unknown'; a[r] = (a[r] || 0) + 1; return a }, {}))
    .map(([r, v]) => ({ label: fmtRole(r), v, c: ROLE_COLOR(r) })).sort((a, b) => b.v - a.v)

  // ── Per-company aggregation ──
  const companyRows = companies.map(c => {
    const cu = users.filter(u => u.company_id === c.id && u.role !== 'job_seeker').length
    const cc = candidates.filter(p => p.company_id === c.id)
    const cp = cc.filter(p => isPlaced(p.status)).length
    return { id: c.id, name: c.name || c.company_name || 'Unnamed', users: cu, candidates: cc.length, placed: cp, plan: c.package_code || c.plan || '—', created: c.created_at }
  }).sort((a, b) => b.candidates - a.candidates)

  const topCompanies = companyRows.filter(c => c.candidates > 0).slice(0, 8).map(c => ({ label: c.name, v: c.candidates }))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--tx)', fontFamily: 'Outfit,Inter,sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');*{box-sizing:border-box}
        .ov-kpi{display:grid;grid-template-columns:repeat(6,1fr);gap:12;}
        .ov-g2{display:grid;grid-template-columns:1fr 1fr;gap:16;}
        @media(max-width:880px){.ov-g2{grid-template-columns:1fr !important;}.ov-kpi{grid-template-columns:repeat(3,1fr) !important;}}
        @media(max-width:520px){.ov-kpi{grid-template-columns:repeat(2,1fr) !important;}}
        .ov-tbl{width:100%;border-collapse:collapse;}
        .ov-tbl th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--mu);padding:9px 11px;border-bottom:1px solid var(--bd);}
        .ov-tbl td{padding:11px;border-bottom:1px solid var(--bd);font-size:13px;}
        .ov-tbl tr:last-child td{border-bottom:none;}
        .ov-tbl tbody tr:hover{background:var(--bg3);}
      `}</style>

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>🌐 Platform Overview</h1>
            <p style={{ fontSize: 13, color: 'var(--mu)', margin: '4px 0 0' }}>God-view across all companies on RecruitBase Pro</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/dashboard/companies')} style={{ background: 'var(--ac)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Manage Companies</button>
            <button onClick={() => router.push('/dashboard/analytics')} style={{ background: 'var(--bg2)', color: 'var(--tx)', border: '1px solid var(--bd2)', padding: '9px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Analytics →</button>
          </div>
        </div>

        <div className="ov-kpi" style={{ marginBottom: 20 }}>
          {KPI.map(s => (
            <div key={s.l} style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.c, lineHeight: 1.1 }}>{s.v}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: .5, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <Card title="Platform Growth — Candidates Added (last 12 months)"><Bars data={growth} color="#3B82F6" /></Card>
        </div>

        <div className="ov-g2" style={{ marginBottom: 16 }}>
          <Card title="Users by Role"><Donut data={roleAgg} /></Card>
          <Card title="Top Companies by Volume"><HBars rows={topCompanies} color="#10B981" /></Card>
        </div>

        <Card title="All Companies" extra={<span style={{ fontSize: 12, color: 'var(--mu)' }}>{companies.length} total</span>}>
          {companyRows.length === 0 ? <Empty>No companies yet</Empty> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ov-tbl">
                <thead><tr><th>Company</th><th>Plan</th><th style={{ textAlign: 'right' }}>Users</th><th style={{ textAlign: 'right' }}>Candidates</th><th style={{ textAlign: 'right' }}>Placed</th><th></th></tr></thead>
                <tbody>
                  {companyRows.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac)', background: 'var(--acbg)', padding: '2px 9px', borderRadius: 12, textTransform: 'capitalize' }}>{c.plan}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{c.users}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#06B6D4' }}>{c.candidates}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{c.placed}</td>
                      <td style={{ textAlign: 'right' }}><button onClick={() => router.push('/dashboard/companies')} style={{ background: 'none', border: '1px solid var(--bd2)', color: 'var(--ac)', padding: '5px 11px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>Manage</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
