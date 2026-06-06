// @ts-nocheck
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ════════════════════════════════════════════════════════════════════════
//  PLACEMENTS — Recruitment Quality metrics + data entry
//  Cost-per-Hire · 90-day Retention (Quality of Hire) · New-hire Turnover
//  · Avg Time-to-Hire — benchmarked vs SHRM 2025. Editable per placement.
//  Computes from real data; missing data shows hints, never fake zeros.
// ════════════════════════════════════════════════════════════════════════

const BM = { tth: 44, retention: 85, costUsd: 4700 }
const isPlaced = (s) => /plac|joined/i.test(s || '')
const daysBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000))
const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

function Count({ to, dur = 850, prefix = '', suffix = '' }) {
  const [v, setV] = useState(0); const raf = useRef()
  useEffect(() => { const n = parseFloat(to) || 0; let s; const tick = (ts) => { if (!s) s = ts; const p = Math.min((ts - s) / dur, 1); setV(n * (1 - Math.pow(1 - p, 3))); if (p < 1) raf.current = requestAnimationFrame(tick) }; raf.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf.current) }, [to])
  return <>{prefix}{Math.round(v).toLocaleString('en-IN')}{suffix}</>
}
function Bench({ good, text }) { const c = good ? '#10B981' : '#F59E0B'; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: c, background: `${c}1a`, padding: '3px 9px', borderRadius: 20 }}>{good ? '▲' : '▼'} {text}</span> }

export default function Placements() {
  const router = useRouter()
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [edits, setEdits] = useState({})
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      const { data: au } = await supabase.from('app_users').select('*').eq('id', session.user.id).single()
      setMe(au); await load(au); setLoading(false)
    })
  }, [])

  async function load(au) {
    const admin = ['super_admin', 'platform_admin', 'platform_manager'].includes(au?.role)
    let q = supabase.from('profiles').select('id, name, role, status, created_at, placement_date, placed_at_company, hire_cost, post_join_status, left_date, company_id').order('placement_date', { ascending: false, nullsFirst: false })
    if (!admin && au?.company_id) q = q.eq('company_id', au.company_id)
    const { data } = await q
    setRows((data || []).filter(p => isPlaced(p.status)))
  }

  const now = Date.now()
  const daysAgo = (d) => d ? (now - new Date(d)) / 86400000 : null
  const status = (p) => (edits[p.id]?.post_join_status ?? p.post_join_status) || 'active'
  const leftDate = (p) => edits[p.id]?.left_date ?? p.left_date
  const cost = (p) => { const c = edits[p.id]?.hire_cost ?? p.hire_cost; return c === '' || c == null ? null : Number(c) }

  // ── metrics (computed from SAVED data) ──
  const placed = rows.length
  const costsSet = rows.map(p => p.hire_cost).filter(c => c != null && c !== '')
  const costPerHire = costsSet.length ? Math.round(costsSet.reduce((a, b) => a + Number(b), 0) / costsSet.length) : null

  const tthArr = rows.map(p => (p.placement_date && p.created_at) ? daysBetween(p.created_at, p.placement_date) : null).filter(v => v != null)
  const avgTTH = tthArr.length ? Math.round(tthArr.reduce((a, b) => a + b, 0) / tthArr.length) : null

  // retention 90d: eligible = placed_date older than 90d
  const elig90 = rows.filter(p => p.placement_date && daysAgo(p.placement_date) >= 90)
  const left90 = elig90.filter(p => (p.post_join_status === 'left') && p.left_date && daysBetween(p.placement_date, p.left_date) <= 90)
  const ret90 = elig90.length ? Math.round((1 - left90.length / elig90.length) * 100) : null
  // new-hire turnover 1y
  const elig1y = rows.filter(p => p.placement_date && daysAgo(p.placement_date) >= 365)
  const left1y = elig1y.filter(p => (p.post_join_status === 'left') && p.left_date && daysBetween(p.placement_date, p.left_date) <= 365)
  const turn1y = elig1y.length ? Math.round((left1y.length / elig1y.length) * 100) : null

  function setEdit(id, k, v) { setEdits(e => ({ ...e, [id]: { ...e[id], [k]: v, dirty: true } })) }
  async function saveRow(p) {
    const e = edits[p.id]; if (!e) return
    setSavingId(p.id)
    const patch = {}
    if ('hire_cost' in e) patch.hire_cost = e.hire_cost === '' ? null : Number(e.hire_cost)
    if ('post_join_status' in e) patch.post_join_status = e.post_join_status
    if ('left_date' in e) patch.left_date = e.left_date || null
    if (patch.post_join_status === 'active') patch.left_date = null
    try {
      const { error } = await supabase.from('profiles').update(patch).eq('id', p.id)
      if (error) throw error
      setRows(rs => rs.map(r => r.id === p.id ? { ...r, ...patch } : r))
      setEdits(ed => { const n = { ...ed }; delete n[p.id]; return n })
    } catch (err) { alert('Save nahi hua: ' + (err.message || 'error')) }
    setSavingId(null)
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--mu)' }}>Loading placements…</div>

  const KPI = [
    { l: 'Total Placed', v: placed, c: '#10B981', icon: '🏆', node: <Count to={placed} /> },
    { l: 'Cost per Hire', c: '#F59E0B', icon: '💰', node: costPerHire != null ? <Count to={costPerHire} prefix="₹" /> : <span style={{ fontSize: 15, color: 'var(--mu2)', fontWeight: 600 }}>Set fees below</span>, sub: costPerHire != null ? `SHRM 2025: ~$${BM.costUsd}` : null },
    { l: '90-day Retention', c: '#3B82F6', icon: '✅', node: ret90 != null ? <Count to={ret90} suffix="%" /> : <span style={{ fontSize: 14, color: 'var(--mu2)', fontWeight: 600 }}>Builds after 90d</span>, bench: ret90 != null ? <Bench good={ret90 >= BM.retention} text={`vs ${BM.retention}% target`} /> : null },
    { l: 'New-hire Turnover', c: '#EF4444', icon: '📉', node: turn1y != null ? <Count to={turn1y} suffix="%" /> : <span style={{ fontSize: 14, color: 'var(--mu2)', fontWeight: 600 }}>Builds after 1yr</span>, sub: turn1y != null ? 'lower is better' : null },
    { l: 'Avg Time-to-Hire', c: '#06B6D4', icon: '⏱', node: avgTTH != null ? <Count to={avgTTH} suffix="d" /> : <span style={{ fontSize: 14, color: 'var(--mu2)', fontWeight: 600 }}>—</span>, bench: avgTTH != null ? <Bench good={avgTTH <= BM.tth} text={`vs ${BM.tth}d industry`} /> : null },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Sora:wght@700;800&display=swap');
        .p-wrap{font-family:Outfit,system-ui,sans-serif}.h-title{font-family:Sora,sans-serif}
        .lbl{font-size:11px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.5px}
        .big{font-family:Sora,sans-serif;font-weight:800;line-height:1;letter-spacing:-.5px}
        .p-tile{background:var(--bg2);border:1px solid var(--bd);border-radius:16px;padding:18px;position:relative;overflow:hidden}
        .p-tile::before{content:'';position:absolute;inset:0 0 auto 0;height:3px;background:var(--gx)}
        .p-kpi{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
        @media(max-width:900px){.p-kpi{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:480px){.p-kpi{grid-template-columns:1fr}}
        .p-tbl{width:100%;border-collapse:collapse}
        .p-tbl th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--mu);padding:10px;border-bottom:1px solid var(--bd);white-space:nowrap}
        .p-tbl td{padding:10px;border-bottom:1px solid var(--bd);font-size:13px}
        .p-in{background:var(--bg3);border:1px solid var(--bd2);border-radius:7px;padding:7px 9px;color:var(--tx);font-size:13px;font-family:inherit;width:110px;box-sizing:border-box}
      `}} />
      <div className="p-wrap" style={{ padding: '4px 2px 52px' }}>
        <div style={{ marginBottom: 20 }}>
          <div className="lbl" style={{ marginBottom: 5 }}>Recruitment · Quality</div>
          <h1 className="h-title" style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--tx)' }}>🎯 Placements & Quality</h1>
          <p style={{ fontSize: 13, color: 'var(--mu)', margin: '6px 0 0' }}>Cost-per-Hire · Quality of Hire · Retention — benchmarked vs SHRM 2025</p>
        </div>

        {/* KPIs */}
        <div className="p-kpi" style={{ marginBottom: 22 }}>
          {KPI.map((k, i) => (
            <div key={i} className="p-tile" style={{ '--gx': `linear-gradient(90deg,${k.c},${k.c}aa)` }}>
              <div style={{ fontSize: 17, marginBottom: 7 }}>{k.icon}</div>
              <div className="lbl" style={{ fontSize: 10 }}>{k.l}</div>
              <div className="big" style={{ fontSize: 30, marginTop: 6, color: k.c }}>{k.node}</div>
              <div style={{ marginTop: 10 }}>{k.bench || (k.sub && <span style={{ fontSize: 11, color: 'var(--mu2)' }}>{k.sub}</span>)}</div>
            </div>
          ))}
        </div>

        {/* Data entry table */}
        <div className="p-tile" style={{ '--gx': 'transparent', padding: 0 }}>
          <div style={{ padding: '16px 18px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div className="h-title" style={{ fontSize: 15, fontWeight: 700 }}>Placed Candidates</div>
            <span style={{ fontSize: 12, color: 'var(--mu2)' }}>Fee + retention bharo → metrics auto-update</span>
          </div>
          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 44, color: 'var(--mu)' }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>🎯</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>No placements yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Candidate ko "Joined Successfully" status milte hi yahan aayega.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', padding: '8px 8px 12px' }}>
              <table className="p-tbl">
                <thead><tr><th>Candidate</th><th>Placed At</th><th>Placed On</th><th>T-T-H</th><th>Hire Cost (₹)</th><th>Status</th><th>Left Date</th><th></th></tr></thead>
                <tbody>
                  {rows.map(p => {
                    const st = status(p), dirty = edits[p.id]?.dirty
                    const tth = (p.placement_date && p.created_at) ? daysBetween(p.created_at, p.placement_date) + 'd' : '—'
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name || 'Unnamed'}<div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 400 }}>{p.role || ''}</div></td>
                        <td style={{ color: 'var(--mu)' }}>{p.placed_at_company || '—'}</td>
                        <td style={{ color: 'var(--mu)', whiteSpace: 'nowrap' }}>{p.placement_date ? new Date(p.placement_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={{ color: 'var(--mu)' }}>{tth}</td>
                        <td><input className="p-in" type="number" placeholder="e.g. 50000" value={edits[p.id]?.hire_cost ?? (p.hire_cost ?? '')} onChange={e => setEdit(p.id, 'hire_cost', e.target.value)} /></td>
                        <td>
                          <select className="p-in" style={{ width: 100 }} value={st} onChange={e => setEdit(p.id, 'post_join_status', e.target.value)}>
                            <option value="active">🟢 Active</option><option value="left">🔴 Left</option>
                          </select>
                        </td>
                        <td>{st === 'left' ? <input className="p-in" style={{ width: 130 }} type="date" value={(leftDate(p) ? String(leftDate(p)).slice(0, 10) : '')} onChange={e => setEdit(p.id, 'left_date', e.target.value)} /> : <span style={{ color: 'var(--mu2)' }}>—</span>}</td>
                        <td>{dirty ? <button onClick={() => saveRow(p)} disabled={savingId === p.id} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{savingId === p.id ? '…' : 'Save'}</button> : <span style={{ color: '#10b981', fontSize: 16 }}>✓</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--mu2)', marginTop: 12 }}>
          💡 Retention/Turnover tabhi calculate hote hain jab placement ko 90 din / 1 saal ho jaata hai. Naye placements abhi "Active" maane jaate hain jab tak "Left" mark na karo.
        </div>
      </div>
    </>
  )
}
