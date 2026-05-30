// @ts-nocheck
// ════════════════════════════════════════════════════════════════
// DEDICATED FILTERS PAGE — Candidates
// Route: /dashboard/filters?type=candidates  (or just /dashboard/filters)
// Self-contained. Builds URL query params and redirects to master.tsx.
// Supports BOOLEAN search (FTS) + all filter fields scrollable in one page.
// ════════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import { applyTheme, getSavedTheme } from '../../src/components/theme'

// ── CONSTANTS (mirror master.tsx) ──────────────────────────────
const INDUSTRIES = ['IT / Software','BFSI / Banking','Healthcare / Medical','FMCG / Consumer Goods','Real Estate / Property','Manufacturing / Engineering','E-commerce / Retail','Education / EdTech','Consulting / Advisory','Media / Advertising','Pharma / Biotech','Logistics / Supply Chain','Legal / Law','Hospitality / Travel','Telecom','Automobile','Infrastructure / Construction','Government / PSU','NGO / Social Sector','Other']
const CITIES = ['Delhi','Mumbai','Bangalore','Hyderabad','Pune','Chennai','Noida','Gurgaon','Kolkata','Ahmedabad','Jaipur','Lucknow','Chandigarh','Kochi','Nagpur','Indore','Bhopal','Surat','Vadodara','Patna','Ranchi','Coimbatore','Visakhapatnam','Bhubaneswar','Mysore','Nashik','Aurangabad','Rajkot','Jodhpur','Agra']
const QUALIFICATIONS = ['MBBS','MD','MS','BDS','MDS','B.Tech','M.Tech','BE','ME','MCA','BCA','B.Sc','M.Sc','MBA','PGDM','BBA','CA (Qualified)','CA (Inter)','CMA','CS','LLB','LLM','BA','MA','B.Com','M.Com','PhD','Diploma','ITI','12th Pass','10th Pass','Graduate','Post Graduate','Other']
const SOURCES = ['Direct','WhatsApp','LinkedIn','Facebook','Instagram','Naukri','Indeed','Monster','Referral','Walk-in','Campus','Job Fair','Agency','Other']
const NOTICE_PERIODS = ['Immediate','7 days','15 days','1 month','2 months','3 months','Negotiable']
const WORK_MODES = ['WFH','Office','Hybrid','Flexible']
const LANGUAGES = ['Hindi','English','Tamil','Telugu','Kannada','Malayalam','Bengali','Marathi','Gujarati','Punjabi','Odia','Urdu']
const SEGMENTS = [
  { id:'all',          label:'All',         icon:'👥', color:'#6c8cff' },
  { id:'fresher',      label:'Freshers',    icon:'🎓', color:'#3dd68c' },
  { id:'experienced',  label:'Experienced', icon:'💼', color:'#6c8cff' },
  { id:'recruiter',    label:'Recruitment Team', icon:'🔍', color:'#c77dff' },
  { id:'bd',           label:'Client Mgmt',  icon:'🤝', color:'#ff9f43' },
]
const PIPELINE_STATUSES = ['New','Contacted - Interested','Contacted - Not Interested','Contacted - Call Back Later','Contacted - Number Busy','Contacted - Not Reachable','Resume Received','Resume Shortlisted','Interview Scheduled','Interview Done - Selected','Interview Done - Rejected','Interview Done - On Hold','Offer Discussed','Offer Accepted','Offer Declined','Did Not Join','Joined Successfully']
const GENDERS = ['Male','Female','Other']

// ── Empty filter state ─────────────────────────────────────────
const EMPTY: any = {
  q: '',                  // boolean / full-text search
  segment: 'all',
  status: [] as string[],
  city: [] as string[],
  city_other: '',
  include_relocate: false,
  industry: [] as string[],
  qualification: [] as string[],
  exp_min: '', exp_max: '',
  cctc_min: '', cctc_max: '',
  ectc_min: '', ectc_max: '',
  notice: [] as string[],
  work_mode: [] as string[],          // empty = Any
  only_willing_relocate: false,
  skills: '',
  languages: [] as string[],
  gender: [] as string[],
  age_min: '', age_max: '',
  source: [] as string[],
  assigned_to: '',
  added_by: '',
  date_from: '',
  date_to: '',
}

export default function FiltersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [appUser, setAppUser] = useState<any>(null)
  const [teamUsers, setTeamUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [f, setF] = useState<any>({...EMPTY})

  // Collapsible groups (default: first two open)
  const [open, setOpen] = useState<any>({
    search: true, basic: true, professional: false, compensation: false,
    location: false, preferences: false, identity: false, activity: false
  })

  useEffect(() => {
    applyTheme(getSavedTheme())
    if (!router.isReady) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      init(session.user)
    })
  }, [router.isReady])

  async function init(u: any) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    if (!au) { router.push('/dashboard/master'); return }
    if (au.role === 'job_seeker') { router.replace('/jobseeker'); return }
    setAppUser(au)
    if (['super_admin','platform_admin','platform_manager'].includes(au.role)) {
      const { data: users } = await supabase.from('app_users').select('id,full_name,role').order('full_name')
      setTeamUsers(users || [])
    } else if (au.company_id) {
      const { data: users } = await supabase.from('app_users').select('id,full_name,role').eq('company_id', au.company_id)
      setTeamUsers(users || [])
    }
    // Pre-fill from URL (so editing existing filters works)
    const q = router.query
    setF((prev:any) => {
      const out = {...prev}
      const setIfPresent = (k:string, parseAs:'str'|'arr'|'bool'='str') => {
        if (q[k] === undefined) return
        const v = q[k]
        if (parseAs === 'arr') out[k] = String(v||'').split(',').filter(Boolean)
        else if (parseAs === 'bool') out[k] = v === '1' || v === 'true'
        else out[k] = String(v||'')
      }
      setIfPresent('q'); setIfPresent('segment')
      setIfPresent('status', 'arr'); setIfPresent('city', 'arr')
      setIfPresent('city_other'); setIfPresent('include_relocate', 'bool')
      setIfPresent('industry', 'arr'); setIfPresent('qualification', 'arr')
      setIfPresent('exp_min'); setIfPresent('exp_max')
      setIfPresent('cctc_min'); setIfPresent('cctc_max')
      setIfPresent('ectc_min'); setIfPresent('ectc_max')
      setIfPresent('notice', 'arr'); setIfPresent('work_mode', 'arr')
      setIfPresent('only_willing_relocate', 'bool')
      setIfPresent('skills'); setIfPresent('languages', 'arr')
      setIfPresent('gender', 'arr')
      setIfPresent('age_min'); setIfPresent('age_max')
      setIfPresent('source', 'arr')
      setIfPresent('assigned_to'); setIfPresent('added_by')
      setIfPresent('date_from'); setIfPresent('date_to')
      return out
    })
    setLoading(false)
  }

  // ── Helpers ──
  const set = (k:string, v:any) => setF((x:any) => ({...x, [k]: v}))
  function toggleInArr(key: string, val: string) {
    setF((x:any) => {
      const arr = Array.isArray(x[key]) ? x[key] : []
      return { ...x, [key]: arr.includes(val) ? arr.filter((v:string)=>v!==val) : [...arr, val] }
    })
  }
  function activeCount(): number {
    let n = 0
    if (f.q?.trim()) n++
    if (f.segment && f.segment !== 'all') n++
    if (f.status?.length) n++
    if (f.city?.length || f.city_other?.trim()) n++
    if (f.industry?.length) n++
    if (f.qualification?.length) n++
    if (f.exp_min || f.exp_max) n++
    if (f.cctc_min || f.cctc_max) n++
    if (f.ectc_min || f.ectc_max) n++
    if (f.notice?.length) n++
    if (f.work_mode?.length) n++
    if (f.only_willing_relocate) n++
    if (f.skills?.trim()) n++
    if (f.languages?.length) n++
    if (f.gender?.length) n++
    if (f.age_min || f.age_max) n++
    if (f.source?.length) n++
    if (f.assigned_to) n++
    if (f.added_by) n++
    if (f.date_from || f.date_to) n++
    return n
  }

  function applyFilters() {
    const params: Record<string,string> = {}
    const add = (k:string, v:any) => { if (v !== '' && v !== false && !(Array.isArray(v) && v.length === 0)) params[k] = Array.isArray(v) ? v.join(',') : (v === true ? '1' : String(v)) }
    add('q', f.q?.trim() || '')
    if (f.segment && f.segment !== 'all') add('segment', f.segment)
    add('status', f.status); add('city', f.city); add('city_other', f.city_other?.trim() || '')
    add('include_relocate', f.include_relocate)
    add('industry', f.industry); add('qualification', f.qualification)
    add('exp_min', f.exp_min); add('exp_max', f.exp_max)
    add('cctc_min', f.cctc_min); add('cctc_max', f.cctc_max)
    add('ectc_min', f.ectc_min); add('ectc_max', f.ectc_max)
    add('notice', f.notice); add('work_mode', f.work_mode)
    add('only_willing_relocate', f.only_willing_relocate)
    add('skills', f.skills?.trim() || '')
    add('languages', f.languages); add('gender', f.gender)
    add('age_min', f.age_min); add('age_max', f.age_max)
    add('source', f.source); add('assigned_to', f.assigned_to); add('added_by', f.added_by)
    add('date_from', f.date_from); add('date_to', f.date_to)
    const qs = new URLSearchParams(params).toString()
    router.push('/dashboard/master' + (qs ? '?' + qs : ''))
  }

  function clearAll() {
    if (!window.confirm('Clear all filters?')) return
    setF({...EMPTY})
  }

  // ── Styles ──
  const IS: any = { width:'100%', background:'var(--bg3)', border:'1px solid var(--bd2)', borderRadius:8, padding:'9px 12px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const LS: any = { display:'block', fontSize:10, fontWeight:600, color:'var(--mu)', textTransform:'uppercase', letterSpacing:1, marginBottom:4, marginTop:10 }
  const SECTION: any = { background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:16, marginBottom:14, overflow:'hidden' }
  const SECHEAD: any = { padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', userSelect:'none' }
  const SECBODY: any = { padding:'0 18px 18px 18px' }
  function Chip({ active, onClick, children, color }: any) {
    return (
      <button onClick={onClick} style={{padding:'7px 12px',borderRadius:20,fontSize:12,cursor:'pointer',border:`1px solid ${active?(color||'var(--ac)'):'var(--bd)'}`,background:active?(color?`${color}22`:'var(--acbg)'):'transparent',color:active?(color||'var(--ac)'):'var(--mu)',fontFamily:'inherit',fontWeight:active?600:400,whiteSpace:'nowrap'}}>
        {children}
      </button>
    )
  }
  function Group({ id, title, count, icon }: { id:string, title:string, count?:number, icon?:string }) {
    return (
      <div style={SECHEAD} onClick={()=>setOpen((s:any)=>({...s, [id]: !s[id]}))}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:18}}>{icon}</span>
          <span style={{fontSize:14,fontWeight:700,color:'var(--tx)'}}>{title}</span>
          {(count||0) > 0 && <span style={{fontSize:11,background:'var(--acbg)',color:'var(--ac)',padding:'2px 8px',borderRadius:10,fontWeight:600}}>{count} set</span>}
        </div>
        <span style={{color:'var(--mu)',fontSize:14,transform: open[id]?'rotate(90deg)':'rotate(0deg)',transition:'0.2s'}}>▸</span>
      </div>
    )
  }

  // ── Sub-counts for group badges ──
  const cntBasic = (f.segment !== 'all' ? 1 : 0) + (f.status?.length ? 1 : 0)
  const cntProf  = (f.industry?.length?1:0) + (f.qualification?.length?1:0) + ((f.exp_min||f.exp_max)?1:0) + (f.skills?.trim()?1:0)
  const cntComp  = ((f.cctc_min||f.cctc_max)?1:0) + ((f.ectc_min||f.ectc_max)?1:0) + (f.notice?.length?1:0)
  const cntLoc   = ((f.city?.length||f.city_other?.trim())?1:0) + (f.only_willing_relocate?1:0)
  const cntPref  = (f.work_mode?.length?1:0) + (f.languages?.length?1:0)
  const cntId    = (f.gender?.length?1:0) + ((f.age_min||f.age_max)?1:0)
  const cntAct   = (f.source?.length?1:0) + (f.assigned_to?1:0) + (f.added_by?1:0) + ((f.date_from||f.date_to)?1:0)

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',flexDirection:'column',gap:12}}>
      <div style={{width:40,height:40,border:'3px solid var(--ac)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{fontSize:13,color:'var(--mu)',fontFamily:'Outfit,sans-serif'}}>Loading filters...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--tx)',fontFamily:'Outfit,sans-serif',paddingBottom:90}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus,select:focus,textarea:focus{border-color:var(--ac)!important;outline:none;}
        select option{background:var(--bg3,#22262f);color:var(--tx,#fff);}
      `}</style>

      {/* Top bar */}
      <div style={{position:'sticky',top:0,zIndex:50,background:'var(--bg)',borderBottom:'1px solid var(--bd)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <button onClick={()=>router.back()} style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,width:36,height:36,cursor:'pointer',color:'var(--tx)',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
          <div>
            <div style={{fontSize:17,fontWeight:700}}>🔧 Filters — Candidates</div>
            <div style={{fontSize:11,color:'var(--mu)',marginTop:2}}>{activeCount()} active</div>
          </div>
        </div>
        <button onClick={clearAll} style={{background:'transparent',color:'var(--rd)',border:'1px solid var(--bd)',borderRadius:8,padding:'8px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Clear All</button>
      </div>

      <div style={{maxWidth:780,margin:'0 auto',padding:'20px 16px'}}>

        {/* ── BOOLEAN / FULL-TEXT SEARCH ── */}
        <div style={SECTION}>
          <Group id="search" title="Smart Search" icon="🔎" count={(f.q?.trim()?1:0)} />
          {open.search && (
            <div style={SECBODY}>
              <label style={LS}>Boolean Search (across name, role, skills, summary, work, education)</label>
              <textarea rows={2} style={{...IS,resize:'none',fontFamily:'monospace',fontSize:13}} value={f.q||''} onChange={e=>set('q', e.target.value)} placeholder='e.g.  "Talent Acquisition" AND naukri AND -fresher'/>
              <div style={{fontSize:11,color:'var(--mu)',marginTop:8,lineHeight:1.6}}>
                💡 <b>Operators:</b> <code>AND</code> (default), <code>OR</code>, <code>"exact phrase"</code>, <code>-word</code> to exclude.<br/>
                Examples:<br/>
                • <code>react AND (node OR python)</code><br/>
                • <code>"Software Engineer" -fresher -intern</code><br/>
                • <code>recruiter AND (naukri OR linkedin)</code>
              </div>
            </div>
          )}
        </div>

        {/* ── BASIC ── */}
        <div style={SECTION}>
          <Group id="basic" title="Basic" icon="📋" count={cntBasic} />
          {open.basic && (
            <div style={SECBODY}>
              <label style={LS}>Profile Segment</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {SEGMENTS.map(s => (
                  <Chip key={s.id} active={f.segment===s.id} color={s.color} onClick={()=>set('segment', s.id)}>{s.icon} {s.label}</Chip>
                ))}
              </div>

              <label style={LS}>Pipeline Status (multiple)</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {PIPELINE_STATUSES.map(s => (
                  <Chip key={s} active={f.status.includes(s)} onClick={()=>toggleInArr('status', s)}>{s}</Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── PROFESSIONAL ── */}
        <div style={SECTION}>
          <Group id="professional" title="Professional" icon="💼" count={cntProf} />
          {open.professional && (
            <div style={SECBODY}>
              <label style={LS}>Industry (multiple)</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {INDUSTRIES.map(x => <Chip key={x} active={f.industry.includes(x)} onClick={()=>toggleInArr('industry', x)}>{x}</Chip>)}
              </div>

              <label style={LS}>Qualification (multiple)</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {QUALIFICATIONS.map(x => <Chip key={x} active={f.qualification.includes(x)} onClick={()=>toggleInArr('qualification', x)}>{x}</Chip>)}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={LS}>Min Experience (years)</label><input style={IS} type="number" step="0.5" min="0" value={f.exp_min||''} onChange={e=>set('exp_min', e.target.value)} placeholder="e.g. 2"/></div>
                <div><label style={LS}>Max Experience (years)</label><input style={IS} type="number" step="0.5" min="0" value={f.exp_max||''} onChange={e=>set('exp_max', e.target.value)} placeholder="e.g. 8"/></div>
              </div>

              <label style={LS}>Skills (comma separated — basic match)</label>
              <input style={IS} value={f.skills||''} onChange={e=>set('skills', e.target.value)} placeholder="e.g. React, Node.js, SAP"/>
              <div style={{fontSize:11,color:'var(--mu)',marginTop:4}}>For complex skill logic use the Smart Search box above.</div>
            </div>
          )}
        </div>

        {/* ── COMPENSATION ── */}
        <div style={SECTION}>
          <Group id="compensation" title="Compensation" icon="💰" count={cntComp} />
          {open.compensation && (
            <div style={SECBODY}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={LS}>Current CTC — Min (₹ LPA)</label><input style={IS} type="number" step="0.5" value={f.cctc_min||''} onChange={e=>set('cctc_min', e.target.value)} placeholder="e.g. 5"/></div>
                <div><label style={LS}>Current CTC — Max (₹ LPA)</label><input style={IS} type="number" step="0.5" value={f.cctc_max||''} onChange={e=>set('cctc_max', e.target.value)} placeholder="e.g. 20"/></div>
                <div><label style={LS}>Expected CTC — Min (₹ LPA)</label><input style={IS} type="number" step="0.5" value={f.ectc_min||''} onChange={e=>set('ectc_min', e.target.value)} placeholder="e.g. 6"/></div>
                <div><label style={LS}>Expected CTC — Max (₹ LPA)</label><input style={IS} type="number" step="0.5" value={f.ectc_max||''} onChange={e=>set('ectc_max', e.target.value)} placeholder="e.g. 30"/></div>
              </div>

              <label style={LS}>Notice Period (multiple)</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {NOTICE_PERIODS.map(x => <Chip key={x} active={f.notice.includes(x)} onClick={()=>toggleInArr('notice', x)}>{x}</Chip>)}
              </div>
            </div>
          )}
        </div>

        {/* ── LOCATION ── */}
        <div style={SECTION}>
          <Group id="location" title="Location" icon="📍" count={cntLoc} />
          {open.location && (
            <div style={SECBODY}>
              <label style={LS}>Cities (select multiple)</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {CITIES.map(c => <Chip key={c} active={f.city.includes(c)} onClick={()=>toggleInArr('city', c)}>{c}</Chip>)}
              </div>

              <label style={LS}>Other City (if not in list, comma separated)</label>
              <input style={IS} value={f.city_other||''} onChange={e=>set('city_other', e.target.value)} placeholder="e.g. Dehradun, Goa"/>

              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--tx)',marginTop:14}}>
                <input type="checkbox" checked={!!f.include_relocate} onChange={e=>set('include_relocate', e.target.checked)}/>
                Also include candidates from <b>other cities</b> who are willing to relocate
              </label>

              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--tx)',marginTop:10}}>
                <input type="checkbox" checked={!!f.only_willing_relocate} onChange={e=>set('only_willing_relocate', e.target.checked)}/>
                Only show candidates who are willing to relocate
              </label>
            </div>
          )}
        </div>

        {/* ── PREFERENCES ── */}
        <div style={SECTION}>
          <Group id="preferences" title="Preferences" icon="⚙️" count={cntPref} />
          {open.preferences && (
            <div style={SECBODY}>
              <label style={LS}>Work Mode (empty = Any)</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {WORK_MODES.map(w => <Chip key={w} active={f.work_mode.includes(w)} onClick={()=>toggleInArr('work_mode', w)}>{w}</Chip>)}
              </div>

              <label style={LS}>Languages Known (multiple)</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {LANGUAGES.map(l => <Chip key={l} active={f.languages.includes(l)} onClick={()=>toggleInArr('languages', l)}>{l}</Chip>)}
              </div>
            </div>
          )}
        </div>

        {/* ── IDENTITY ── */}
        <div style={SECTION}>
          <Group id="identity" title="Identity" icon="👤" count={cntId} />
          {open.identity && (
            <div style={SECBODY}>
              <label style={LS}>Gender</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {GENDERS.map(g => <Chip key={g} active={f.gender.includes(g)} onClick={()=>toggleInArr('gender', g)}>{g}</Chip>)}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={LS}>Min Age</label><input style={IS} type="number" min="16" max="80" value={f.age_min||''} onChange={e=>set('age_min', e.target.value)} placeholder="e.g. 22"/></div>
                <div><label style={LS}>Max Age</label><input style={IS} type="number" min="16" max="80" value={f.age_max||''} onChange={e=>set('age_max', e.target.value)} placeholder="e.g. 45"/></div>
              </div>
            </div>
          )}
        </div>

        {/* ── ACTIVITY ── */}
        <div style={SECTION}>
          <Group id="activity" title="Activity & Ownership" icon="📊" count={cntAct} />
          {open.activity && (
            <div style={SECBODY}>
              <label style={LS}>Source (multiple)</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {SOURCES.map(s => <Chip key={s} active={f.source.includes(s)} onClick={()=>toggleInArr('source', s)}>{s}</Chip>)}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={LS}>Assigned To</label>
                  <select style={IS} value={f.assigned_to||''} onChange={e=>set('assigned_to', e.target.value)}>
                    <option value="">Anyone</option>
                    {teamUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role?.replace(/_/g,' ')})</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>Added By</label>
                  <select style={IS} value={f.added_by||''} onChange={e=>set('added_by', e.target.value)}>
                    <option value="">Anyone</option>
                    {teamUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>Added On — From</label>
                  <input style={IS} type="date" value={f.date_from||''} onChange={e=>set('date_from', e.target.value)}/>
                </div>
                <div>
                  <label style={LS}>Added On — To</label>
                  <input style={IS} type="date" value={f.date_to||''} onChange={e=>set('date_to', e.target.value)}/>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:60,background:'var(--bg2)',borderTop:'1px solid var(--bd)',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,boxShadow:'0 -8px 24px rgba(0,0,0,0.15)'}}>
        <div style={{fontSize:12,color:'var(--mu)'}}>{activeCount()} filter{activeCount()===1?'':'s'} active</div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>router.back()} style={{padding:'10px 20px',borderRadius:10,background:'transparent',color:'var(--mu)',border:'1px solid var(--bd)',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Cancel</button>
          <button onClick={applyFilters} style={{padding:'10px 28px',borderRadius:10,background:'var(--ac)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:700,fontFamily:'inherit'}}>✅ Apply Filters</button>
        </div>
      </div>
    </div>
  )
}
