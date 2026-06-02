// @ts-nocheck
// ════════════════════════════════════════════════════════════════
// DEDICATED FILTERS PAGE — Candidates (v2: dropdown-based, searchable)
// Route: /dashboard/filters
// Builds URL query params and redirects to master.tsx.
// Supports BOOLEAN search (FTS) + all filter fields.
// Multi-select dropdowns (searchable). Cities grouped state-wise.
// ════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import { applyTheme, getSavedTheme } from '../../src/components/theme'
import { EDUCATION_LEVELS, coursesForLevel, branchesForCourse } from '../../src/lib/courseBranches'

// ── DATA ─────────────────────────────────────────────────────────
const INDUSTRIES = ['IT / Software','BFSI / Banking','Healthcare / Medical','FMCG / Consumer Goods','Real Estate / Property','Manufacturing / Engineering','E-commerce / Retail','Education / EdTech','Consulting / Advisory','Media / Advertising','Pharma / Biotech','Logistics / Supply Chain','Legal / Law','Hospitality / Travel','Telecom','Automobile','Infrastructure / Construction','Government / PSU','NGO / Social Sector','Other']

const QUALIFICATIONS = ['MBBS','MD','MS','BDS','MDS','B.Tech','M.Tech','BE','ME','MCA','BCA','B.Sc','M.Sc','MBA','PGDM','BBA','CA (Qualified)','CA (Inter)','CMA','CS','LLB','LLM','BA','MA','B.Com','M.Com','PhD','Diploma','ITI','12th Pass','10th Pass','Graduate','Post Graduate','Other']

const SOURCES = ['Direct','WhatsApp','LinkedIn','Facebook','Instagram','Naukri','Indeed','Monster','Referral','Walk-in','Campus','Job Fair','Agency','Other']

const NOTICE_PERIODS = ['Immediate','7 days','15 days','1 month','2 months','3 months','Negotiable']
const WORK_MODES = ['WFH','Office','Hybrid','Flexible']
const LANGUAGES = ['Hindi','English','Tamil','Telugu','Kannada','Malayalam','Bengali','Marathi','Gujarati','Punjabi','Odia','Urdu','Assamese','Kashmiri','Konkani','Sindhi','Sanskrit','Nepali','Bodo']

const SEGMENTS = [
  { value:'all',         label:'All segments' },
  { value:'pursuing',    label:'🎓 Student (Pursuing)' },
  { value:'fresher',     label:'🌱 Fresher' },
  { value:'experienced', label:'💼 Experienced' },
  { value:'recruiter',   label:'🔍 Recruitment Team' },
  { value:'bd',          label:'🤝 Client Management' },
]
const LOOKING_FOR_OPTS = ['Internship / Training','Live Project','Part-time Job','Full-time Job','Just Exploring']
const DURATION_OPTS = ['1 month','2 months','3 months','4 months','5 months','6 months','7 months','8 months','9 months','10 months','11 months','12 months','Flexible']

const PIPELINE_STATUSES = ['New','Contacted - Interested','Contacted - Not Interested','Contacted - Call Back Later','Contacted - Number Busy','Contacted - Not Reachable','Resume Received','Resume Shortlisted','Interview Scheduled','Interview Done - Selected','Interview Done - Rejected','Interview Done - On Hold','Offer Discussed','Offer Accepted','Offer Declined','Did Not Join','Joined Successfully']

const GENDERS = [
  { value:'',       label:'Any' },
  { value:'Male',   label:'Male' },
  { value:'Female', label:'Female' },
  { value:'Other',  label:'Other' },
]

// India: states & UTs with major cities
const CITIES_BY_STATE: Record<string, string[]> = {
  'Andhra Pradesh':['Visakhapatnam','Vijayawada','Guntur','Tirupati','Nellore','Kurnool','Kakinada','Rajahmundry'],
  'Arunachal Pradesh':['Itanagar','Naharlagun'],
  'Assam':['Guwahati','Dibrugarh','Silchar','Jorhat','Tezpur'],
  'Bihar':['Patna','Gaya','Bhagalpur','Muzaffarpur','Darbhanga','Purnia'],
  'Chhattisgarh':['Raipur','Bhilai','Bilaspur','Durg','Korba'],
  'Goa':['Panaji','Margao','Vasco da Gama','Mapusa'],
  'Gujarat':['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Gandhinagar','Junagadh','Anand'],
  'Haryana':['Gurgaon','Faridabad','Panipat','Karnal','Hisar','Rohtak','Sonipat','Ambala','Yamunanagar'],
  'Himachal Pradesh':['Shimla','Dharamshala','Mandi','Solan','Kullu','Manali'],
  'Jharkhand':['Ranchi','Jamshedpur','Dhanbad','Bokaro','Hazaribagh','Deoghar'],
  'Karnataka':['Bangalore','Mysore','Hubli','Mangalore','Belgaum','Gulbarga','Davanagere','Tumkur'],
  'Kerala':['Kochi','Thiruvananthapuram','Kozhikode','Thrissur','Kollam','Kannur','Palakkad','Alappuzha'],
  'Madhya Pradesh':['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna'],
  'Maharashtra':['Mumbai','Pune','Nagpur','Nashik','Aurangabad','Thane','Navi Mumbai','Solapur','Kolhapur','Amravati'],
  'Manipur':['Imphal'],
  'Meghalaya':['Shillong','Tura'],
  'Mizoram':['Aizawl'],
  'Nagaland':['Kohima','Dimapur'],
  'Odisha':['Bhubaneswar','Cuttack','Rourkela','Berhampur','Sambalpur','Puri'],
  'Punjab':['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Pathankot','Hoshiarpur'],
  'Rajasthan':['Jaipur','Jodhpur','Udaipur','Kota','Ajmer','Bikaner','Alwar','Bhilwara'],
  'Sikkim':['Gangtok'],
  'Tamil Nadu':['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Erode','Vellore','Thanjavur'],
  'Telangana':['Hyderabad','Warangal','Nizamabad','Karimnagar','Khammam'],
  'Tripura':['Agartala'],
  'Uttar Pradesh':['Lucknow','Kanpur','Agra','Varanasi','Ghaziabad','Noida','Greater Noida','Meerut','Allahabad','Bareilly','Aligarh','Moradabad'],
  'Uttarakhand':['Dehradun','Haridwar','Rishikesh','Roorkee','Haldwani','Nainital'],
  'West Bengal':['Kolkata','Howrah','Durgapur','Asansol','Siliguri','Bardhaman'],
  'Delhi (UT)':['New Delhi','Delhi','Dwarka','Rohini'],
  'Chandigarh (UT)':['Chandigarh'],
  'Puducherry (UT)':['Puducherry','Karaikal'],
  'Andaman & Nicobar (UT)':['Port Blair'],
  'Jammu & Kashmir (UT)':['Srinagar','Jammu','Anantnag','Baramulla'],
  'Ladakh (UT)':['Leh','Kargil'],
  'Lakshadweep (UT)':['Kavaratti'],
  'Dadra & NH and Daman & Diu (UT)':['Daman','Diu','Silvassa'],
}

// ── Empty filter state ───────────────────────────────────────────
const EMPTY: any = {
  q: '', segment: 'all', status: [] as string[], city: [] as string[], city_other: '',
  include_relocate: false, industry: [] as string[], qualification: [] as string[],
  edu_criteria: [] as any[],
  exp_min: '', exp_max: '', cctc_min: '', cctc_max: '', ectc_min: '', ectc_max: '',
  notice: [] as string[], work_mode: [] as string[], only_willing_relocate: false,
  looking_for: [] as string[], duration: [] as string[],
  skills: '', languages: [] as string[], gender: '', age_min: '', age_max: '',
  source: [] as string[], assigned_to: '', added_by: '', date_from: '', date_to: '',
}

// ─────────────────────────────────────────────────────────────────
// Reusable MultiSelect dropdown (searchable, optionally grouped)
// ─────────────────────────────────────────────────────────────────
function MultiSelect({ options, selected, onChange, placeholder='Search...', emptyLabel='Any' }: any) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<any>(null)
  const isGrouped = options && !Array.isArray(options)

  useEffect(() => {
    if (!open) return
    const close = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const sel = Array.isArray(selected) ? selected : []
  const toggle = (v: string) => onChange(sel.includes(v) ? sel.filter((x: string) => x !== v) : [...sel, v])
  const clear = () => onChange([])

  const lower = search.trim().toLowerCase()
  const matches = (s: string) => !lower || s.toLowerCase().includes(lower)

  let groups: { name?: string; items: string[] }[] = []
  if (isGrouped) {
    for (const g of Object.keys(options)) {
      const items = (options[g] as string[]).filter(matches)
      if (matches(g) || items.length > 0) {
        groups.push({ name: g, items: matches(g) ? options[g] : items })
      }
    }
  } else {
    groups = [{ items: (options as string[]).filter(matches) }]
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width:'100%', textAlign:'left', background:'var(--bg3)', border:'1px solid var(--bd2)', borderRadius:8, padding:'9px 12px', color:'var(--tx)', fontSize:13, fontFamily:'inherit', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <span style={{ color: sel.length ? 'var(--tx)' : 'var(--mu)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {sel.length === 0 ? emptyLabel : (sel.length <= 2 ? sel.join(', ') : sel.length + ' selected')}
        </span>
        <span style={{ color:'var(--mu)', flexShrink:0 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:20, background:'var(--bg2)', border:'1px solid var(--bd2)', borderRadius:10, boxShadow:'var(--shl)', maxHeight:360, display:'flex', flexDirection:'column' }}>
          <div style={{ padding:8, borderBottom:'1px solid var(--bd)', display:'flex', gap:6 }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder} style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--bd)', borderRadius:6, padding:'7px 10px', color:'var(--tx)', fontSize:12, outline:'none', fontFamily:'inherit' }}/>
            {sel.length > 0 && <button onClick={clear} style={{ background:'transparent', border:'1px solid var(--bd)', borderRadius:6, padding:'4px 10px', cursor:'pointer', color:'var(--rd)', fontSize:11, fontFamily:'inherit' }}>Clear ({sel.length})</button>}
          </div>
          <div style={{ overflowY:'auto', padding:'4px 0' }}>
            {groups.length === 0 || groups.every(g => g.items.length === 0)
              ? <div style={{ padding:'14px', fontSize:12, color:'var(--mu)', textAlign:'center' }}>No matches</div>
              : groups.map((g, gi) => (
                <div key={gi}>
                  {g.name && <div style={{ padding:'8px 12px 4px', fontSize:10, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', letterSpacing:1 }}>{g.name}</div>}
                  {g.items.map(item => (
                    <label key={item} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', cursor:'pointer', fontSize:13, color:'var(--tx)' }}>
                      <input type="checkbox" checked={sel.includes(item)} onChange={() => toggle(item)} style={{ accentColor:'var(--ac)' }}/>
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
export default function FiltersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [appUser, setAppUser] = useState<any>(null)
  const [teamUsers, setTeamUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [f, setF] = useState<any>({ ...EMPTY })
  const [open, setOpen] = useState<any>({ search:true, basic:true, professional:false, education:false, compensation:false, location:false, preferences:false, identity:false, activity:false })

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
    // Pre-fill from URL
    const q = router.query
    setF((prev: any) => {
      const out = { ...prev }
      const setIfPresent = (k: string, parseAs: 'str' | 'arr' | 'bool' = 'str') => {
        if (q[k] === undefined) return
        const v = q[k]
        if (parseAs === 'arr') out[k] = String(v || '').split(',').filter(Boolean)
        else if (parseAs === 'bool') out[k] = v === '1' || v === 'true'
        else out[k] = String(v || '')
      }
      setIfPresent('q'); setIfPresent('segment')
      setIfPresent('status', 'arr'); setIfPresent('city', 'arr')
      setIfPresent('city_other'); setIfPresent('include_relocate', 'bool')
      setIfPresent('industry', 'arr'); setIfPresent('qualification', 'arr')
      if (q.edu !== undefined) { try { out.edu_criteria = JSON.parse(decodeURIComponent(String(q.edu))) } catch {} }
      setIfPresent('exp_min'); setIfPresent('exp_max')
      setIfPresent('cctc_min'); setIfPresent('cctc_max')
      setIfPresent('ectc_min'); setIfPresent('ectc_max')
      setIfPresent('notice', 'arr'); setIfPresent('work_mode', 'arr')
      setIfPresent('looking_for', 'arr'); setIfPresent('duration', 'arr')
      setIfPresent('only_willing_relocate', 'bool')
      setIfPresent('skills'); setIfPresent('languages', 'arr')
      setIfPresent('gender')
      setIfPresent('age_min'); setIfPresent('age_max')
      setIfPresent('source', 'arr')
      setIfPresent('assigned_to'); setIfPresent('added_by')
      setIfPresent('date_from'); setIfPresent('date_to')
      return out
    })
    setLoading(false)
  }

  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }))

  function activeCount(): number {
    let n = 0
    if (f.q?.trim()) n++
    if (f.segment && f.segment !== 'all') n++
    if (f.status?.length) n++
    if (f.city?.length || f.city_other?.trim()) n++
    if (f.industry?.length) n++
    if (f.qualification?.length) n++
    if ((f.edu_criteria||[]).filter((c:any)=>c.level||c.course).length) n++
    if (f.exp_min || f.exp_max) n++
    if (f.cctc_min || f.cctc_max) n++
    if (f.ectc_min || f.ectc_max) n++
    if (f.notice?.length) n++
    if (f.work_mode?.length) n++
    if (f.looking_for?.length) n++
    if (f.duration?.length) n++
    if (f.only_willing_relocate) n++
    if (f.skills?.trim()) n++
    if (f.languages?.length) n++
    if (f.gender) n++
    if (f.age_min || f.age_max) n++
    if (f.source?.length) n++
    if (f.assigned_to) n++
    if (f.added_by) n++
    if (f.date_from || f.date_to) n++
    return n
  }

  function applyFilters() {
    const params: Record<string, string> = {}
    const add = (k: string, v: any) => {
      if (v === '' || v === false || v == null) return
      if (Array.isArray(v) && v.length === 0) return
      params[k] = Array.isArray(v) ? v.join(',') : (v === true ? '1' : String(v))
    }
    add('q', f.q?.trim() || '')
    if (f.segment && f.segment !== 'all') add('segment', f.segment)
    add('status', f.status); add('city', f.city); add('city_other', f.city_other?.trim() || '')
    add('include_relocate', f.include_relocate)
    add('industry', f.industry); add('qualification', f.qualification)
    const eduClean = (f.edu_criteria||[]).filter((c:any)=>c.level||c.course)
    if (eduClean.length) params['edu'] = encodeURIComponent(JSON.stringify(eduClean))
    add('exp_min', f.exp_min); add('exp_max', f.exp_max)
    add('cctc_min', f.cctc_min); add('cctc_max', f.cctc_max)
    add('ectc_min', f.ectc_min); add('ectc_max', f.ectc_max)
    add('notice', f.notice); add('work_mode', f.work_mode)
    add('looking_for', f.looking_for); add('duration', f.duration)
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
    setF({ ...EMPTY })
  }

  const IS: any = { width:'100%', background:'var(--bg3)', border:'1px solid var(--bd2)', borderRadius:8, padding:'9px 12px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const LS: any = { display:'block', fontSize:10, fontWeight:600, color:'var(--mu)', textTransform:'uppercase', letterSpacing:1, marginBottom:4, marginTop:12 }
  const SECTION: any = { background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:16, marginBottom:14, overflow:'visible' }
  const SECHEAD: any = { padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', userSelect:'none' }
  const SECBODY: any = { padding:'0 18px 18px 18px' }

  function Group({ id, title, count, icon }: any) {
    return (
      <div style={SECHEAD} onClick={() => setOpen((s: any) => ({ ...s, [id]: !s[id] }))}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--tx)' }}>{title}</span>
          {(count || 0) > 0 && <span style={{ fontSize:11, background:'var(--acbg)', color:'var(--ac)', padding:'2px 8px', borderRadius:10, fontWeight:600 }}>{count} set</span>}
        </div>
        <span style={{ color:'var(--mu)', fontSize:14, transform: open[id] ? 'rotate(90deg)' : 'rotate(0deg)', transition:'0.2s' }}>▸</span>
      </div>
    )
  }

  const cntBasic = (f.segment !== 'all' ? 1 : 0) + (f.status?.length ? 1 : 0)
  const cntProf  = (f.industry?.length ? 1 : 0) + (f.qualification?.length ? 1 : 0) + ((f.exp_min || f.exp_max) ? 1 : 0) + (f.skills?.trim() ? 1 : 0)
  const cntComp  = ((f.cctc_min || f.cctc_max) ? 1 : 0) + ((f.ectc_min || f.ectc_max) ? 1 : 0) + (f.notice?.length ? 1 : 0)
  const cntLoc   = ((f.city?.length || f.city_other?.trim()) ? 1 : 0) + (f.only_willing_relocate ? 1 : 0)
  const cntPref  = (f.work_mode?.length ? 1 : 0) + (f.languages?.length ? 1 : 0) + (f.looking_for?.length ? 1 : 0) + (f.duration?.length ? 1 : 0)
  const cntId    = (f.gender ? 1 : 0) + ((f.age_min || f.age_max) ? 1 : 0)
  const cntAct   = (f.source?.length ? 1 : 0) + (f.assigned_to ? 1 : 0) + (f.added_by ? 1 : 0) + ((f.date_from || f.date_to) ? 1 : 0)

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', flexDirection:'column', gap:12 }}>
      <div style={{ width:40, height:40, border:'3px solid var(--ac)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize:13, color:'var(--mu)', fontFamily:'Outfit,sans-serif' }}>Loading filters...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--tx)', fontFamily:'Outfit,sans-serif', paddingBottom:90 }}>
      <style>{`
        *{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus,select:focus,textarea:focus{border-color:var(--ac)!important;outline:none;}
        select option{background:var(--bg3,#22262f);color:var(--tx,#fff);}
        @media (max-width:640px){
          [style*="grid-template-columns"]{grid-template-columns:1fr !important;}
          input,select,textarea{font-size:16px !important;min-height:44px;}
          button{min-height:42px;}
        }
      `}</style>

      {/* Top bar */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'var(--bg)', borderBottom:'1px solid var(--bd)', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={() => router.back()} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', borderRadius:8, width:36, height:36, cursor:'pointer', color:'var(--tx)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
          <div>
            <div style={{ fontSize:17, fontWeight:700 }}>🔧 Filters — Candidates</div>
            <div style={{ fontSize:11, color:'var(--mu)', marginTop:2 }}>{activeCount()} active</div>
          </div>
        </div>
        <button onClick={clearAll} style={{ background:'transparent', color:'var(--rd)', border:'1px solid var(--bd)', borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Clear All</button>
      </div>

      <div style={{ maxWidth:780, margin:'0 auto', padding:'20px 16px' }}>

        {/* ── SMART / BOOLEAN SEARCH ── */}
        <div style={SECTION}>
          <Group id="search" title="Smart Search" icon="🔎" count={(f.q?.trim() ? 1 : 0)} />
          {open.search && (
            <div style={SECBODY}>
              <label style={LS}>Boolean Search (name, role, skills, summary, work, education)</label>
              <textarea rows={2} style={{ ...IS, resize:'none', fontFamily:'monospace', fontSize:13 }} value={f.q || ''} onChange={e => set('q', e.target.value)} placeholder='e.g.  "Talent Acquisition" AND naukri AND -fresher'/>
              <div style={{ fontSize:11, color:'var(--mu)', marginTop:8, lineHeight:1.6 }}>
                💡 <b>Operators:</b> <code>AND</code> (default), <code>OR</code>, <code>"exact phrase"</code>, <code>-word</code> to exclude.<br/>
                Examples: <code>react AND (node OR python)</code> · <code>"Software Engineer" -fresher</code>
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
              <select style={IS} value={f.segment || 'all'} onChange={e => set('segment', e.target.value)}>
                {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>

              <label style={LS}>Pipeline Status</label>
              <MultiSelect options={PIPELINE_STATUSES} selected={f.status} onChange={(v: any) => set('status', v)} emptyLabel="Any status" placeholder="Search statuses..."/>
            </div>
          )}
        </div>

        {/* ── PROFESSIONAL ── */}
        <div style={SECTION}>
          <Group id="professional" title="Professional" icon="💼" count={cntProf} />
          {open.professional && (
            <div style={SECBODY}>
              <label style={LS}>Industry</label>
              <MultiSelect options={INDUSTRIES} selected={f.industry} onChange={(v: any) => set('industry', v)} emptyLabel="Any industry" placeholder="Search industries..."/>

              <label style={LS}>Qualification</label>
              <MultiSelect options={QUALIFICATIONS} selected={f.qualification} onChange={(v: any) => set('qualification', v)} emptyLabel="Any qualification" placeholder="Search qualifications..."/>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:4 }}>
                <div><label style={LS}>Min Experience (years)</label><input style={IS} type="number" step="0.5" min="0" value={f.exp_min || ''} onChange={e => set('exp_min', e.target.value)} placeholder="e.g. 2"/></div>
                <div><label style={LS}>Max Experience (years)</label><input style={IS} type="number" step="0.5" min="0" value={f.exp_max || ''} onChange={e => set('exp_max', e.target.value)} placeholder="e.g. 8"/></div>
              </div>

              <label style={LS}>Skills (comma separated — basic match)</label>
              <input style={IS} value={f.skills || ''} onChange={e => set('skills', e.target.value)} placeholder="e.g. React, Node.js, SAP"/>
              <div style={{ fontSize:11, color:'var(--mu)', marginTop:4 }}>For complex logic use the Smart Search box.</div>
            </div>
          )}
        </div>

        {/* ── EDUCATION CRITERIA (multi-criterion precise builder) ── */}
        <div style={SECTION}>
          <Group id="education" title="Education Criteria" icon="🎓" count={(f.edu_criteria||[]).filter((c:any)=>c.level||c.course).length} />
          {open.education && (
            <div style={SECBODY}>
              <div style={{ fontSize:11, color:'var(--mu)', marginBottom:6, lineHeight:1.6 }}>
                Add one or more education requirements. A candidate must match <b>ALL</b> of them.<br/>
                Example: Bachelor→MBBS, then Master→MD→Dermatology, then Super-Speciality→MCh→Plastic Surgery.
              </div>
              {(f.edu_criteria||[]).map((c:any, idx:number) => {
                const courses = coursesForLevel(c.level||'')
                const branches = branchesForCourse(c.course||'')
                return (
                  <div key={idx} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', borderRadius:10, padding:'12px 14px', marginBottom:10, position:'relative' }}>
                    <button onClick={()=>set('edu_criteria', (f.edu_criteria||[]).filter((_:any,i:number)=>i!==idx))} style={{ position:'absolute', top:8, right:8, background:'var(--rdbg)', color:'var(--rd)', border:'none', borderRadius:6, width:24, height:24, cursor:'pointer', fontSize:11, fontWeight:700 }}>✕</button>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--mu)', marginBottom:8 }}>CRITERION #{idx+1}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <div>
                        <label style={LS}>Level</label>
                        <select style={IS} value={c.level||''} onChange={e=>{ const arr=[...f.edu_criteria]; arr[idx]={...arr[idx], level:e.target.value, course:'', branch:''}; set('edu_criteria', arr) }}>
                          <option value="">Any level</option>{EDUCATION_LEVELS.map(l=><option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={LS}>Course</label>
                        {courses.length>0 ? (
                          <select style={IS} value={c.course||''} onChange={e=>{ const arr=[...f.edu_criteria]; arr[idx]={...arr[idx], course:e.target.value, branch:''}; set('edu_criteria', arr) }}>
                            <option value="">Any course</option>{courses.map(x=><option key={x}>{x}</option>)}
                          </select>
                        ) : (
                          <input style={IS} value={c.course||''} onChange={e=>{ const arr=[...f.edu_criteria]; arr[idx]={...arr[idx], course:e.target.value}; set('edu_criteria', arr) }} placeholder="Select level first"/>
                        )}
                      </div>
                      <div>
                        <label style={LS}>Branch (optional)</label>
                        {branches.length>0 ? (
                          <select style={IS} value={c.branch||''} onChange={e=>{ const arr=[...f.edu_criteria]; arr[idx]={...arr[idx], branch:e.target.value}; set('edu_criteria', arr) }}>
                            <option value="">Any branch</option>{branches.map(x=><option key={x}>{x}</option>)}
                          </select>
                        ) : (
                          <input style={IS} value={c.branch||''} onChange={e=>{ const arr=[...f.edu_criteria]; arr[idx]={...arr[idx], branch:e.target.value}; set('edu_criteria', arr) }} placeholder="Any branch"/>
                        )}
                      </div>
                      <div>
                        <label style={LS}>Status</label>
                        <select style={IS} value={c.status||'any'} onChange={e=>{ const arr=[...f.edu_criteria]; arr[idx]={...arr[idx], status:e.target.value}; set('edu_criteria', arr) }}>
                          <option value="any">Any</option>
                          <option value="completed">Completed</option>
                          <option value="pursuing">Pursuing</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )
              })}
              <button onClick={()=>set('edu_criteria', [...(f.edu_criteria||[]), {level:'',course:'',branch:'',status:'any'}])} style={{ background:'var(--acbg)', color:'var(--ac)', border:'1px dashed var(--bd2)', borderRadius:10, padding:'9px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', width:'100%' }}>+ Add Education Criterion</button>
            </div>
          )}
        </div>

        {/* ── COMPENSATION ── */}
        <div style={SECTION}>
          <Group id="compensation" title="Compensation" icon="💰" count={cntComp} />
          {open.compensation && (
            <div style={SECBODY}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={LS}>Current CTC — Min (₹ LPA)</label><input style={IS} type="number" step="0.5" value={f.cctc_min || ''} onChange={e => set('cctc_min', e.target.value)} placeholder="e.g. 5"/></div>
                <div><label style={LS}>Current CTC — Max (₹ LPA)</label><input style={IS} type="number" step="0.5" value={f.cctc_max || ''} onChange={e => set('cctc_max', e.target.value)} placeholder="e.g. 20"/></div>
                <div><label style={LS}>Expected CTC — Min (₹ LPA)</label><input style={IS} type="number" step="0.5" value={f.ectc_min || ''} onChange={e => set('ectc_min', e.target.value)} placeholder="e.g. 6"/></div>
                <div><label style={LS}>Expected CTC — Max (₹ LPA)</label><input style={IS} type="number" step="0.5" value={f.ectc_max || ''} onChange={e => set('ectc_max', e.target.value)} placeholder="e.g. 30"/></div>
              </div>

              <label style={LS}>Notice Period</label>
              <MultiSelect options={NOTICE_PERIODS} selected={f.notice} onChange={(v: any) => set('notice', v)} emptyLabel="Any" placeholder="Search..."/>
            </div>
          )}
        </div>

        {/* ── LOCATION ── */}
        <div style={SECTION}>
          <Group id="location" title="Location" icon="📍" count={cntLoc} />
          {open.location && (
            <div style={SECBODY}>
              <label style={LS}>Cities (search by city OR state)</label>
              <MultiSelect options={CITIES_BY_STATE} selected={f.city} onChange={(v: any) => set('city', v)} emptyLabel="Any city / Pan-India" placeholder="Type city or state e.g. Mumbai, Karnataka..."/>

              <label style={LS}>Other City (if not in list, comma separated)</label>
              <input style={IS} value={f.city_other || ''} onChange={e => set('city_other', e.target.value)} placeholder="e.g. Custom city names"/>

              <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer', fontSize:13, color:'var(--tx)', marginTop:14, lineHeight:1.4 }}>
                <input type="checkbox" checked={!!f.include_relocate} onChange={e => set('include_relocate', e.target.checked)} style={{ marginTop:2 }}/>
                <span>Also include candidates from <b>other cities</b> who are willing to relocate</span>
              </label>

              <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer', fontSize:13, color:'var(--tx)', marginTop:10, lineHeight:1.4 }}>
                <input type="checkbox" checked={!!f.only_willing_relocate} onChange={e => set('only_willing_relocate', e.target.checked)} style={{ marginTop:2 }}/>
                <span>Only show candidates who are willing to relocate</span>
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
              <MultiSelect options={WORK_MODES} selected={f.work_mode} onChange={(v: any) => set('work_mode', v)} emptyLabel="Any mode" placeholder="Search..."/>

              <label style={LS}>Looking For</label>
              <MultiSelect options={LOOKING_FOR_OPTS} selected={f.looking_for} onChange={(v: any) => set('looking_for', v)} emptyLabel="Any" placeholder="Internship, Full-time..."/>

              <label style={LS}>Internship / Project Duration</label>
              <MultiSelect options={DURATION_OPTS} selected={f.duration} onChange={(v: any) => set('duration', v)} emptyLabel="Any duration" placeholder="1-12 months..."/>

              <label style={LS}>Languages Known</label>
              <MultiSelect options={LANGUAGES} selected={f.languages} onChange={(v: any) => set('languages', v)} emptyLabel="Any language" placeholder="Search languages..."/>
            </div>
          )}
        </div>

        {/* ── IDENTITY ── */}
        <div style={SECTION}>
          <Group id="identity" title="Identity" icon="👤" count={cntId} />
          {open.identity && (
            <div style={SECBODY}>
              <label style={LS}>Gender</label>
              <select style={IS} value={f.gender || ''} onChange={e => set('gender', e.target.value)}>
                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={LS}>Min Age</label><input style={IS} type="number" min="16" max="80" value={f.age_min || ''} onChange={e => set('age_min', e.target.value)} placeholder="e.g. 22"/></div>
                <div><label style={LS}>Max Age</label><input style={IS} type="number" min="16" max="80" value={f.age_max || ''} onChange={e => set('age_max', e.target.value)} placeholder="e.g. 45"/></div>
              </div>
            </div>
          )}
        </div>

        {/* ── ACTIVITY ── */}
        <div style={SECTION}>
          <Group id="activity" title="Activity & Ownership" icon="📊" count={cntAct} />
          {open.activity && (
            <div style={SECBODY}>
              <label style={LS}>Source</label>
              <MultiSelect options={SOURCES} selected={f.source} onChange={(v: any) => set('source', v)} emptyLabel="Any source" placeholder="Search..."/>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:4 }}>
                <div>
                  <label style={LS}>Assigned To</label>
                  <select style={IS} value={f.assigned_to || ''} onChange={e => set('assigned_to', e.target.value)}>
                    <option value="">Anyone</option>
                    {teamUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role?.replace(/_/g, ' ')})</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>Added By</label>
                  <select style={IS} value={f.added_by || ''} onChange={e => set('added_by', e.target.value)}>
                    <option value="">Anyone</option>
                    {teamUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>Added On — From</label>
                  <input style={IS} type="date" value={f.date_from || ''} onChange={e => set('date_from', e.target.value)}/>
                </div>
                <div>
                  <label style={LS}>Added On — To</label>
                  <input style={IS} type="date" value={f.date_to || ''} onChange={e => set('date_to', e.target.value)}/>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:60, background:'var(--bg2)', borderTop:'1px solid var(--bd)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, boxShadow:'0 -8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:12, color:'var(--mu)' }}>{activeCount()} filter{activeCount() === 1 ? '' : 's'} active</div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => router.back()} style={{ padding:'10px 20px', borderRadius:10, background:'transparent', color:'var(--mu)', border:'1px solid var(--bd)', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Cancel</button>
          <button onClick={applyFilters} style={{ padding:'10px 28px', borderRadius:10, background:'var(--ac)', color:'#fff', border:'none', cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:'inherit' }}>✅ Apply Filters</button>
        </div>
      </div>
    </div>
  )
}
