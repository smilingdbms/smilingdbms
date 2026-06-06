// @ts-nocheck
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ════════════════════════════════════════════════════════════════════════
//  AI CANDIDATE MATCH — deterministic, explainable fit-score & ranking
//  Pick a Job (auto-fills requirement) OR type requirement manually.
//  Scores each candidate: Skills 55% · Experience 20% · Location 15% · CTC 10%
//  100% free, no API/quota. Fully explainable (matched/missing skills shown).
// ════════════════════════════════════════════════════════════════════════

const pick = (o, keys) => { for (const k of keys) { if (o?.[k] != null && String(o[k]).trim() !== '') return String(o[k]) } return '' }
const parseNum = (t) => { const m = String(t || '').match(/[\d.]+/); return m ? parseFloat(m[0]) : null }
const splitList = (t) => String(t || '').split(/[,;/|]/).map(x => x.trim().toLowerCase()).filter(Boolean)
const scoreColor = (s) => s >= 75 ? '#10B981' : s >= 50 ? '#F59E0B' : '#94A3B8'

export default function AIMatch() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState(null)
  const [jobs, setJobs] = useState([])
  const [cands, setCands] = useState([])
  const [mode, setMode] = useState('manual')   // job | manual
  const [jobId, setJobId] = useState('')
  const [req, setReq] = useState({ role: '', skills: '', location: '', minExp: '', maxCtc: '' })
  const [ranked, setRanked] = useState(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchNote, setSearchNote] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      const { data: au } = await supabase.from('app_users').select('*').eq('id', session.user.id).single()
      setMe(au)
      const admin = ['super_admin', 'platform_admin', 'platform_manager'].includes(au?.role)
      let cq = supabase.from('profiles').select('*').order('created_at', { ascending: false })
      let jq = supabase.from('job_descriptions').select('*').order('created_at', { ascending: false })
      if (!admin && au?.company_id) { cq = cq.eq('company_id', au.company_id); jq = jq.eq('company_id', au.company_id) }
      const [{ data: cs }, { data: js }] = await Promise.all([cq, jq])
      setCands((cs || []).filter(p => !p.type || p.type === 'Candidate'))
      setJobs(js || [])
      setLoading(false)
    })
  }, [])

  function loadJob(id) {
    setJobId(id); const j = jobs.find(x => x.id === id); if (!j) return
    setReq({
      role: pick(j, ['title', 'role', 'job_title', 'position', 'designation']),
      skills: pick(j, ['skills', 'required_skills', 'skills_required', 'key_skills', 'must_have_skills']),
      location: pick(j, ['city', 'location', 'job_location']),
      minExp: pick(j, ['min_experience', 'experience', 'exp', 'experience_required']),
      maxCtc: pick(j, ['max_ctc', 'ctc', 'budget', 'salary', 'max_salary']),
    })
  }

  function candExp(c) {
    if (c.segment === 'pursuing' || c.segment === 'fresher') return 0
    return parseNum(c.total_experience) ?? parseNum(c.experience) ?? parseNum(c.relevant_experience) ?? 0
  }

  async function doSearch() {
    if (!query.trim()) return
    setSearching(true); setSearchNote('')
    try {
      const res = await fetch('/api/ai-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) })
      const d = await res.json()
      if (d?.ok && d.filters) {
        const f = d.filters
        const nr = { role: f.role || '', skills: (f.skills || []).join(', '), location: f.location || '', minExp: f.min_experience ?? '', maxCtc: f.max_ctc ?? '' }
        setReq(nr); rank(nr)
      } else throw new Error('ai')
    } catch {
      // AI unavailable → point to the reliable structured fields (no garbage parsing)
      setMode('manual'); setSearchNote('🔎 AI abhi unavailable — neeche fields bhar ke "Rank Candidates" dabao.')
    }
    setSearching(false)
  }

  function rank(rq = req) {
    const reqSkills = splitList(rq.skills)
    const minExp = parseNum(rq.minExp)
    const maxCtc = parseNum(rq.maxCtc)
    const loc = (rq.location || '').trim().toLowerCase()
    const hasSkills = reqSkills.length > 0

    const scored = cands.map(c => {
      const cs = splitList(c.skills)
      const matched = reqSkills.filter(rs => cs.some(x => x.includes(rs) || rs.includes(x)))
      const missing = reqSkills.filter(rs => !matched.includes(rs))
      const skill = hasSkills ? matched.length / reqSkills.length : null

      const ce = candExp(c)
      const exp = minExp == null ? 1 : (ce >= minExp ? 1 : Math.max(ce / minExp, 0.2))

      const cc = (c.city || '').trim().toLowerCase()
      const locFit = !loc ? 1 : (cc && (cc === loc || cc.includes(loc) || loc.includes(cc)) ? 1 : (c.willing_to_relocate ? 0.6 : 0.25))

      const cctc = parseNum(c.expected_ctc)
      const ctcFit = maxCtc == null ? 1 : (cctc == null ? 0.7 : (cctc <= maxCtc ? 1 : (cctc <= maxCtc * 1.2 ? 0.6 : 0.25)))

      // weights (renormalised if no skills given)
      let score
      if (hasSkills) score = 100 * (0.55 * skill + 0.20 * exp + 0.15 * locFit + 0.10 * ctcFit)
      else score = 100 * (0.50 * exp + 0.30 * locFit + 0.20 * ctcFit)

      return { c, score: Math.round(score), matched, missing, ce, locFit, ctcFit, cctc }
    }).sort((a, b) => b.score - a.score)

    setRanked(scored)
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--mu)' }}>Loading…</div>

  const inStyle = { background: 'var(--bg3)', border: '1px solid var(--bd2)', borderRadius: 9, padding: '10px 12px', color: 'var(--tx)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 5 }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Sora:wght@700;800&display=swap');
        .m-wrap{font-family:Outfit,system-ui,sans-serif}.h-title{font-family:Sora,sans-serif}
        .m-card{background:var(--bg2);border:1px solid var(--bd);border-radius:16px;padding:18px}
        .seg{display:flex;background:var(--bg3);border:1px solid var(--bd2);border-radius:10px;padding:3px;gap:3px;width:fit-content}
        .seg button{border:none;background:transparent;color:var(--mu);padding:8px 16px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}
        .seg button.on{background:#10b981;color:#fff}
        .chip{font-size:11px;font-weight:600;padding:3px 9px;borderRadius:12px;border-radius:12px}
      `}} />
      <div className="m-wrap" style={{ padding: '4px 2px 52px', maxWidth: 1080 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: .5 }}>Recruitment · AI</div>
          <h1 className="h-title" style={{ margin: '5px 0 0', fontSize: 28, fontWeight: 800, color: 'var(--tx)' }}>🎯 AI Candidate Match</h1>
          <p style={{ fontSize: 13, color: 'var(--mu)', margin: '6px 0 0' }}>Fit-score & ranking — Skills 55% · Experience 20% · Location 15% · CTC 10% · fully explainable</p>
        </div>

        <div className="m-card" style={{ marginBottom: 16 }}>
          <div className="seg" style={{ marginBottom: 14 }}>
            <button className={mode === 'search' ? 'on' : ''} onClick={() => setMode('search')}>🔎 AI Search</button>
            <button className={mode === 'job' ? 'on' : ''} onClick={() => setMode('job')}>💼 From a Job</button>
            <button className={mode === 'manual' ? 'on' : ''} onClick={() => setMode('manual')}>✍️ Manual</button>
          </div>

          {mode === 'search' && (
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Describe who you're looking for (plain English / Hinglish)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input style={{ ...inStyle, flex: 1, minWidth: 220 }} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder='e.g. "React developers in Noida with 3+ years under 12 LPA"' />
                <button onClick={doSearch} disabled={searching} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{searching ? '🔎 Thinking…' : '🔎 Search'}</button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--mu2)', marginTop: 6 }}>AI tumhari query ko skills/location/experience/CTC mein todega, phir rank karega. Niche fields edit bhi kar sakte ho.</div>
            </div>
          )}

          {mode === 'job' && (
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Select Job</label>
              <select style={inStyle} value={jobId} onChange={e => loadJob(e.target.value)}>
                <option value="">Choose a job…</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{pick(j, ['title', 'role', 'job_title', 'position']) || 'Untitled'} {pick(j, ['city', 'location']) ? '· ' + pick(j, ['city', 'location']) : ''}</option>)}
              </select>
              {jobs.length === 0 && <div style={{ fontSize: 12, color: 'var(--mu2)', marginTop: 6 }}>Koi job nahi mila — "Manual Requirement" use karo.</div>}
            </div>
          )}

          {searchNote && <div style={{ fontSize: 13, color: '#F59E0B', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 9, padding: '9px 12px', marginBottom: 12 }}>{searchNote}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
            <div><label style={lbl}>Role / Title</label><input style={inStyle} value={req.role} onChange={e => setReq({ ...req, role: e.target.value })} placeholder="e.g. React Developer" /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Must-have skills (comma separated)</label><input style={inStyle} value={req.skills} onChange={e => setReq({ ...req, skills: e.target.value })} placeholder="React, Node.js, TypeScript, MongoDB" /></div>
            <div><label style={lbl}>Location</label><input style={inStyle} value={req.location} onChange={e => setReq({ ...req, location: e.target.value })} placeholder="Noida" /></div>
            <div><label style={lbl}>Min Experience (yrs)</label><input style={inStyle} type="number" value={req.minExp} onChange={e => setReq({ ...req, minExp: e.target.value })} placeholder="3" /></div>
            <div><label style={lbl}>Max CTC (LPA)</label><input style={inStyle} type="number" value={req.maxCtc} onChange={e => setReq({ ...req, maxCtc: e.target.value })} placeholder="12" /></div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button onClick={rank} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>🎯 Rank Candidates</button>
          </div>
        </div>

        {/* RESULTS */}
        {ranked && (
          <div className="m-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div className="h-title" style={{ fontSize: 15, fontWeight: 700 }}>Ranked Matches</div>
              <span style={{ fontSize: 12, color: 'var(--mu2)' }}>{ranked.length} candidates scored</span>
            </div>
            {ranked.length === 0 ? <div style={{ textAlign: 'center', padding: 30, color: 'var(--mu)' }}>No candidates to rank.</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ranked.slice(0, 50).map((r, i) => (
                  <div key={r.c.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 12, border: '1px solid var(--bd)', borderRadius: 12, background: i < 3 ? 'var(--bg3)' : 'transparent' }}>
                    <div style={{ width: 30, textAlign: 'center', fontWeight: 800, color: i === 0 ? '#F59E0B' : 'var(--mu)', fontSize: 15 }}>{i + 1}</div>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>{r.c.photo_url ? <img src={r.c.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (r.c.name || '?').charAt(0)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.c.name || 'Unnamed'} <span style={{ fontWeight: 400, color: 'var(--mu)', fontSize: 12 }}>· {r.c.role || r.c.segment || ''}</span></div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
                        {r.matched.map(s => <span key={s} style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '2px 7px', borderRadius: 10 }}>✓ {s}</span>)}
                        {r.missing.map(s => <span key={s} style={{ fontSize: 10, fontWeight: 600, color: 'var(--mu2)', background: 'var(--bg3)', padding: '2px 7px', borderRadius: 10, textDecoration: 'line-through' }}>{s}</span>)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 5 }}>
                        {r.ce ? `${r.ce}y exp` : 'fresher'} · 📍{r.c.city || '—'}{r.locFit >= 1 ? ' ✓' : r.locFit >= 0.6 ? ' (relocate)' : ''} · {r.cctc != null ? `₹${r.cctc}L` : 'CTC —'}{r.ctcFit >= 1 ? ' ✓' : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ position: 'relative', width: 52, height: 52 }}>
                        <svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="var(--bg3)" strokeWidth="5" /><circle cx="26" cy="26" r="22" fill="none" stroke={scoreColor(r.score)} strokeWidth="5" strokelinecap="round" strokeDasharray={`${(r.score / 100) * 138} 138`} transform="rotate(-90 26 26)" /></svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: scoreColor(r.score) }}>{r.score}</div>
                      </div>
                      <button onClick={() => router.push(`/dashboard/master?focus=${r.c.id}`)} style={{ marginTop: 6, background: 'none', border: '1px solid var(--bd2)', color: 'var(--ac)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--mu2)', marginTop: 12 }}>💡 Score breakdown: ✓ = matched skill, strikethrough = missing. Location/CTC ticks fit dikhate hain.</div>
          </div>
        )}
      </div>
    </>
  )
}
