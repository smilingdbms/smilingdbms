// @ts-nocheck
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ════════════════════════════════════════════════════════════════════════
//  TEAM COMPARISON — side-by-side employee / whole-team performance, time-wise
//  Pick 2+ people (or whole team) → compare on real metrics with a winner per row.
//  100% computed from existing data. SVG only, theme-aware. Benchmarked.
// ════════════════════════════════════════════════════════════════════════

const BM_TTH = 44
const RANGES = [
  { k: 'week', l: 'This Week' }, { k: '15d', l: '15 Days' }, { k: 'month', l: 'This Month' },
  { k: 'quarter', l: 'Quarter' }, { k: 'half', l: 'Half Year' }, { k: 'year', l: 'This Year' }, { k: 'all', l: 'All Time' },
]
function rangeStart(k, minDate) {
  const now = new Date(), t = new Date(); t.setHours(0, 0, 0, 0)
  if (k === 'week') { const s = new Date(t); s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); return s }
  if (k === '15d') { const s = new Date(t); s.setDate(s.getDate() - 14); return s }
  if (k === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (k === 'quarter') { const q = Math.floor(now.getMonth() / 3); return new Date(now.getFullYear(), q * 3, 1) }
  if (k === 'half') return new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1)
  if (k === 'year') return new Date(now.getFullYear(), 0, 1)
  return minDate || new Date(2024, 0, 1)
}
const isPlaced = (s) => /plac|joined/i.test(s || '')
const daysBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000))
const deptOfUser = (u) => /\bbd\b|business|sales/.test((u?.role || '').toLowerCase()) ? 'BD' : 'Recruitment'
const PALETTE = ['#3B82F6', '#10B981', '#A855F7', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#8B5CF6']

function Count({ to, dur = 800, suffix = '' }) {
  const [v, setV] = useState(0); const raf = useRef()
  useEffect(() => { const n = parseFloat(to) || 0; let s; const tick = (ts) => { if (!s) s = ts; const p = Math.min((ts - s) / dur, 1); setV(n * (1 - Math.pow(1 - p, 3))); if (p < 1) raf.current = requestAnimationFrame(tick) }; raf.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf.current) }, [to])
  return <>{Math.round(v)}{suffix}</>
}

export default function TeamCompare() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState([])
  const [users, setUsers] = useState([])
  const [range, setRange] = useState('all')
  const [picked, setPicked] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      load(session.user)
    })
  }, [router])

  async function load(u) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    const admin = ['super_admin', 'platform_admin'].includes(au?.role)
    let pq = supabase.from('profiles').select('*'); if (!admin) pq = pq.eq('company_id', au?.company_id)
    let uq = supabase.from('app_users').select('*'); if (!admin) uq = uq.eq('company_id', au?.company_id)
    const [{ data: ps }, { data: us }] = await Promise.all([pq, uq])
    const team = (us || []).filter(x => x.role !== 'job_seeker')
    setProfiles(ps || []); setUsers(team)
    // preselect top 2 by volume
    const counts = {}
    ;(ps || []).forEach(p => { if (p.created_by) counts[p.created_by] = (counts[p.created_by] || 0) + 1 })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0])
    setPicked(top.length ? top : team.slice(0, 2).map(t => t.id))
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--mu)' }}>Loading team…</div>

  const minDate = profiles.reduce((m, p) => { const t = p.created_at ? new Date(p.created_at) : null; return t && (!m || t < m) ? t : m }, null)
  const start = rangeStart(range, minDate)
  const inRange = (p) => range === 'all' ? true : (p.created_at ? new Date(p.created_at) >= start : false)
  const scoped = profiles.filter(inRange)

  const nameOf = (id) => { const u = users.find(x => x.id === id); return u ? (u.full_name || u.email || 'Unknown') : '—' }

  const stat = (id) => {
    const mine = scoped.filter(p => p.created_by === id)
    const placedArr = mine.filter(p => isPlaced(p.status))
    const tth = placedArr.map(p => (p.placement_date && p.created_at) ? daysBetween(p.created_at, p.placement_date) : null).filter(v => v != null)
    const ind = {}; mine.forEach(p => { if (p.industry) ind[p.industry] = (ind[p.industry] || 0) + 1 })
    const topInd = Object.entries(ind).sort((a, b) => b[1] - a[1])[0]
    return {
      added: mine.length,
      placed: placedArr.length,
      conv: mine.length ? Math.round(placedArr.length / mine.length * 100) : 0,
      tth: tth.length ? Math.round(tth.reduce((a, b) => a + b, 0) / tth.length) : null,
      interviews: mine.filter(p => p.interview_date || /interview/i.test(p.status || '')).length,
      topInd: topInd ? topInd[0] : '—',
    }
  }

  const cols = picked.map((id, i) => ({ id, name: nameOf(id), dept: deptOfUser(users.find(u => u.id === id)), color: PALETTE[i % PALETTE.length], s: stat(id) }))

  // team average (whole team in range)
  const teamIds = users.map(u => u.id)
  const teamStat = (() => {
    const all = teamIds.map(stat)
    const n = all.length || 1
    return {
      added: Math.round(all.reduce((a, b) => a + b.added, 0) / n),
      placed: Math.round(all.reduce((a, b) => a + b.placed, 0) / n),
      conv: Math.round(all.reduce((a, b) => a + b.conv, 0) / n),
    }
  })()

  // metrics rows for comparison (higher better unless invert)
  const METRICS = [
    { key: 'added', label: 'Candidates Added', invert: false },
    { key: 'placed', label: 'Placements', invert: false },
    { key: 'conv', label: 'Conversion %', invert: false, suffix: '%' },
    { key: 'tth', label: 'Avg Time-to-Hire', invert: true, suffix: 'd', bm: BM_TTH },
    { key: 'interviews', label: 'Interviews', invert: false },
  ]

  const toggle = (id) => setPicked(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length < 6 ? [...prev, id] : prev))
  const pickAll = () => setPicked(users.slice(0, 6).map(u => u.id))

  const pill = (on) => ({ padding: '7px 13px', borderRadius: 9, border: '1px solid ' + (on ? 'transparent' : 'var(--bd)'), background: on ? 'var(--ac)' : 'var(--bg2)', color: on ? '#fff' : 'var(--mu)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Sora:wght@600;700;800&display=swap');
        @keyframes cmrise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .cm-wrap{font-family:Outfit,system-ui,sans-serif}
        .cm-card{background:var(--bg2);border:1px solid var(--bd);border-radius:18px;padding:18px;animation:cmrise .5s ease both}
        .big{font-family:Sora,sans-serif;font-weight:800;line-height:1;letter-spacing:-.5px}
        .h-title{font-family:Sora,sans-serif}
        .lbl{font-size:11px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.5px}
        .chip{display:inline-flex;align-items:center;gap:7px;padding:7px 12px;border-radius:20px;cursor:pointer;font-size:12px;font-weight:600;border:1px solid var(--bd);background:var(--bg2);color:var(--mu);transition:all .15s}
        .chip.on{color:var(--tx);border-color:var(--bd2)}
      `}} />
      <div className="cm-wrap" style={{ padding: '4px 2px 48px' }}>
        <div style={{ marginBottom: 18 }}>
          <div className="lbl" style={{ marginBottom: 5 }}>Performance · Team Comparison</div>
          <h1 className="h-title" style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-.5px', color: 'var(--tx)' }}>Compare Your Team</h1>
          <p style={{ fontSize: 13, color: 'var(--mu)', margin: '6px 0 0' }}>Side-by-side performance · {RANGES.find(r => r.k === range)?.l} · benchmarked vs SHRM 2025</p>
        </div>

        {/* time range */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
          {RANGES.map(r => <button key={r.k} style={pill(range === r.k)} onClick={() => setRange(r.k)}>{r.l}</button>)}
        </div>

        {/* employee picker */}
        <div className="cm-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="lbl">Pick people to compare (max 6)</div>
            <button onClick={pickAll} style={{ fontSize: 12, color: 'var(--ac)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Select whole team</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {users.map((u, i) => {
              const on = picked.includes(u.id), idx = picked.indexOf(u.id)
              return (
                <span key={u.id} className={`chip${on ? ' on' : ''}`} onClick={() => toggle(u.id)} style={on ? { background: `${PALETTE[idx % PALETTE.length]}1a`, borderColor: PALETTE[idx % PALETTE.length] } : {}}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: on ? PALETTE[idx % PALETTE.length] : 'var(--mu2)' }} />
                  {u.full_name || u.email}
                </span>
              )
            })}
          </div>
        </div>

        {cols.length < 2 ? (
          <div className="cm-card" style={{ textAlign: 'center', padding: 50, color: 'var(--mu)' }}>Select at least 2 people to compare.</div>
        ) : (
          <>
            {/* summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(cols.length, 3)}, 1fr)`, gap: 14, marginBottom: 16 }}>
              {cols.map((c, i) => (
                <div key={c.id} className="cm-card" style={{ borderTop: `3px solid ${c.color}`, animationDelay: `${i * 0.05}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${c.color}22`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>{(c.name || '?').charAt(0)}</div>
                    <div><div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div><div style={{ fontSize: 11, color: 'var(--mu)' }}>{c.dept}</div></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div><div className="big" style={{ fontSize: 26, color: c.color }}><Count to={c.s.added} /></div><div className="lbl" style={{ fontSize: 9 }}>Added</div></div>
                    <div><div className="big" style={{ fontSize: 26, color: '#10B981' }}><Count to={c.s.placed} /></div><div className="lbl" style={{ fontSize: 9 }}>Placed</div></div>
                    <div><div className="big" style={{ fontSize: 26, color: 'var(--tx)' }}><Count to={c.s.conv} suffix="%" /></div><div className="lbl" style={{ fontSize: 9 }}>Conv</div></div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--mu)' }}>⏱ {c.s.tth != null ? `${c.s.tth}d to hire` : 'no placements'} · 🔥 {c.s.topInd}</div>
                </div>
              ))}
            </div>

            {/* metric-by-metric comparison */}
            <div className="cm-card">
              <div className="h-title" style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Head-to-Head</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {METRICS.map((m, mi) => {
                  const vals = cols.map(c => c.s[m.key])
                  const valid = vals.filter(v => v != null)
                  const max = Math.max(...valid.map(v => v || 0), 1)
                  // winner: lowest for invert (and non-null), highest otherwise
                  let winIdx = -1
                  if (valid.length) {
                    let best = m.invert ? Infinity : -Infinity
                    cols.forEach((c, i) => { const v = c.s[m.key]; if (v == null) return; if (m.invert ? v < best : v > best) { best = v; winIdx = i } })
                  }
                  return (
                    <div key={mi}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</span>
                        {m.bm && <span style={{ fontSize: 10, color: 'var(--mu2)' }}>industry: {m.bm}{m.suffix || ''}</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {cols.map((c, i) => {
                          const v = c.s[m.key]
                          const width = v == null ? 0 : (m.invert ? (max ? (1 - (v - 0) / (max || 1)) : 0) : v / max)
                          const w = v == null ? 6 : Math.max(width * 100, 4)
                          const win = i === winIdx
                          return (
                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 90, fontSize: 11, color: 'var(--mu)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                              <div style={{ flex: 1, height: 22, background: 'var(--bg3)', borderRadius: 7, overflow: 'hidden', position: 'relative' }}>
                                <div style={{ height: '100%', width: `${w}%`, background: `linear-gradient(90deg,${c.color},${c.color}bb)`, borderRadius: 7, transition: 'width .6s ease' }} />
                              </div>
                              <span style={{ width: 56, textAlign: 'right', fontSize: 13, fontWeight: 700, color: win ? c.color : 'var(--tx)' }}>{v == null ? '—' : v}{m.suffix || ''}{win && ' 🏆'}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--bd)', fontSize: 12, color: 'var(--mu)' }}>
                Team average (in range): <b style={{ color: 'var(--tx)' }}>{teamStat.added}</b> added · <b style={{ color: 'var(--tx)' }}>{teamStat.placed}</b> placed · <b style={{ color: 'var(--tx)' }}>{teamStat.conv}%</b> conversion per person. 🏆 = best in that metric.
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
