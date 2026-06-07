import { applyTheme, getSavedTheme } from '../../src/components/theme'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

const EMPTY_JD: any = { title:'', company:'', location:'', industry:'', experience_min:'', experience_max:'', qualification:'', skills:'', description:'', status:'Open', openings:1, team_visibility:false, bd_can_see_candidates:false, _recruiters:[], _bd:'' }
const MANAGE_ROLES = ['super_admin','platform_admin','platform_manager','account_owner','team_manager','team_leader']
const JOB_COLS = ['title','company','company_name','location','city','industry','experience_min','experience_max','qualification','skills','description','status','openings','is_public','salary_min','salary_max','job_type','latitude','longitude','team_visibility','bd_can_see_candidates']

export default function Jobs() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [assignMap, setAssignMap] = useState<any>({})  // jobId -> {recruiters:[ids], bd:id}
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<any>(Object.assign({}, EMPTY_JD))
  const [saving, setSaving] = useState(false)
  const [blindPdf, setBlindPdf] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseNote, setParseNote] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      loadData(session.user)
    })
  }, [router])

  async function loadData(u: any) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)
    const SA = ['super_admin','platform_admin','platform_manager'].includes(au?.role)
    try {
      let _q = supabase.from('job_descriptions').select('*').order('created_at', { ascending: false })
      if (!SA) _q = _q.eq('company_id', au?.company_id)
      const { data: js } = await _q
      setJobs(js || [])
    } catch(e) { console.warn('Jobs table not ready yet') }
    // company users for assignment dropdowns
    try {
      let uq = supabase.from('app_users').select('id, full_name, email, role').neq('role','job_seeker')
      if (!SA && au?.company_id) uq = uq.eq('company_id', au.company_id)
      const { data: us } = await uq
      setUsers(us || [])
    } catch(e) {}
    // existing JD assignments
    try {
      const { data: jas } = await supabase.from('jd_assignments').select('*')
      const m: any = {}
      ;(jas || []).forEach((a:any) => {
        if (!m[a.jd_id]) m[a.jd_id] = { recruiters: [], bd: '' }
        if (a.role === 'bd_owner') m[a.jd_id].bd = a.user_id
        else m[a.jd_id].recruiters.push(a.user_id)
      })
      setAssignMap(m)
    } catch(e) {}
    setLoading(false)
  }

  const canManage = MANAGE_ROLES.includes(appUser?.role)
  const uName = (id:string) => { const x = users.find(u=>u.id===id); return x ? (x.full_name || x.email) : '—' }

  function openJob(j:any) {
    const a = assignMap[j.id] || { recruiters: [], bd: '' }
    setForm({ ...EMPTY_JD, ...j, _recruiters: [...a.recruiters], _bd: a.bd || '' })
    setParseNote(''); setParsing(false); setShowAdd(true)
  }
  function toggleRecruiter(id:string) {
    setForm((f:any) => {
      const has = f._recruiters.includes(id)
      return { ...f, _recruiters: has ? f._recruiters.filter((x:string)=>x!==id) : [...f._recruiters, id] }
    })
  }

  async function saveJob() {
    setSaving(true)
    try {
      const payload:any = {}
      JOB_COLS.forEach(k => { if (form[k] !== undefined) payload[k] = form[k] })
      let jobId = form.id
      if (form.id) {
        payload.updated_at = new Date().toISOString()
        const { data, error } = await supabase.from('job_descriptions').update(payload).eq('id', form.id).select().single()
        if (error) throw error
        setJobs(prev => prev.map(j => j.id === data.id ? data : j)); jobId = data.id
      } else {
        const { data, error } = await supabase.from('job_descriptions').insert({ ...payload, created_by: appUser?.id, company_id: appUser?.company_id, is_public: false }).select().single()
        if (error) throw error
        setJobs(prev => [data, ...prev]); jobId = data.id
      }
      // sync assignments (only managers can; others skip silently)
      if (canManage && jobId) {
        await supabase.from('jd_assignments').delete().eq('jd_id', jobId)
        const rows = (form._recruiters||[]).map((uid:string) => ({ jd_id: jobId, user_id: uid, role: 'recruiter', assigned_by: appUser?.id, company_id: appUser?.company_id }))
        if (form._bd) rows.push({ jd_id: jobId, user_id: form._bd, role: 'bd_owner', assigned_by: appUser?.id, company_id: appUser?.company_id })
        if (rows.length) { const { error: ae } = await supabase.from('jd_assignments').insert(rows); if (ae) throw ae }
        setAssignMap((m:any) => ({ ...m, [jobId]: { recruiters: [...(form._recruiters||[])], bd: form._bd || '' } }))
      }
      setShowAdd(false); setForm(Object.assign({}, EMPTY_JD))
    } catch(e: any) { alert('Save failed: ' + e.message) }
    setSaving(false)
  }

  async function deleteJob(id: string) {
    if (!confirm('Delete this job?')) return
    await supabase.from('jd_assignments').delete().eq('jd_id', id)
    await supabase.from('job_descriptions').delete().eq('id', id)
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  // ── Auto JD PDF (100% free, client-side, unlimited) ──
  function scrub(text:string, blind:boolean, company:string) {
    if (!text) return ''
    if (!blind) return text
    let t = text
    t = t.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[hidden]')                 // emails
    t = t.replace(/(https?:\/\/|www\.)\S+/gi, '[hidden]')                 // urls/websites
    t = t.replace(/\+?\d[\d\s().-]{8,}\d/g, '[hidden]')                   // phone numbers
    if (company) t = t.replace(new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), 'the Company') // client name in text
    return t.replace(/\n{3,}/g, '\n\n')
  }
  function jdText(j:any, blind:boolean) {
    const company = blind ? 'Confidential Client' : (j.company || j.company_name || '')
    const loc=[j.city,j.location].filter(Boolean).join(', ')
    const exp=(j.experience_min||j.experience_max)?`${j.experience_min||'0'}-${j.experience_max||'+'} yrs`:''
    const desc=scrub(j.description||'', blind, j.company||j.company_name||'')
    return [`*${j.title||'Job Opening'}*`, company&&`Company: ${company}`, loc&&`Location: ${loc}`, exp&&`Experience: ${exp}`, j.qualification&&`Qualification: ${j.qualification}`, j.skills&&`Skills: ${j.skills}`, desc&&`\n${desc}`].filter(Boolean).join('\n')
  }
  function shareJDWhatsApp(j:any, blind:boolean) { window.open(`https://wa.me/?text=${encodeURIComponent(jdText(j,blind))}`,'_blank') }

  function loadJsPDF():Promise<any> {
    return new Promise((res)=>{
      const w:any = window
      if (w.jspdf?.jsPDF) return res(w.jspdf.jsPDF)
      const sc=document.createElement('script'); sc.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      sc.onload=()=>res(w.jspdf?.jsPDF||null); sc.onerror=()=>res(null); document.body.appendChild(sc)
    })
  }
  async function downloadJD(j:any, blind:boolean) {
    setPdfBusy(true)
    try {
      const JsPDF = await loadJsPDF()
      if (!JsPDF) { alert('PDF library load nahi hui — internet check karo.'); setPdfBusy(false); return }
      const doc = new JsPDF({ unit:'pt', format:'a4' })
      const M=48, PW=595, W=PW-M*2; let y=58
      const company = blind ? 'Confidential Client' : (j.company || j.company_name || '')
      const loc = [j.city, j.location].filter(Boolean).join(', ') || '—'
      const expStr = (j.experience_min || j.experience_max) ? `${j.experience_min||'0'} - ${j.experience_max||'+'} yrs` : ''
      const NL=()=>{ if(y>805){ doc.addPage(); y=58 } }
      // header
      doc.setFontSize(10); doc.setTextColor(16,185,129); doc.setFont('helvetica','bold'); doc.text('JOB DESCRIPTION', M, y); y+=22
      doc.setFontSize(18); doc.setTextColor(17,17,17); doc.text(j.title||'Untitled Role', M, y); y+=18
      doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(90,90,90)
      const sub=[company, loc].filter(Boolean).join('   |   '); if(sub){ doc.text(sub, M, y); y+=12 }
      doc.setDrawColor(16,185,129); doc.setLineWidth(2); doc.line(M,y,M+W,y); y+=24
      // rows
      const rows:any[] = [['Location',loc],['Experience',expStr],['Qualification',j.qualification],['Industry',j.industry],['Openings',j.openings?String(j.openings):''],['Employment Type',j.job_type],['Key Skills',j.skills]]
      doc.setFontSize(11)
      rows.forEach(([k,v]:any)=>{ if(!v) return; NL(); doc.setTextColor(110,110,110); doc.setFont('helvetica','bold'); doc.text(k, M, y)
        doc.setTextColor(25,25,25); doc.setFont('helvetica','normal'); const lines=doc.splitTextToSize(String(v), W-130); doc.text(lines, M+130, y); y+=Math.max(17, lines.length*14) })
      // description
      const desc = scrub(j.description||'', blind, j.company || j.company_name || '')
      if (desc) { y+=12; NL(); doc.setFont('helvetica','bold'); doc.setTextColor(17,17,17); doc.setFontSize(12); doc.text('Role Details', M, y); y+=18
        doc.setFont('helvetica','normal'); doc.setTextColor(55,55,55); doc.setFontSize(10.5)
        doc.splitTextToSize(desc, W).forEach((line:string)=>{ NL(); doc.text(line, M, y); y+=15 }) }
      // footer
      y+=22; NL(); doc.setFontSize(9); doc.setTextColor(150,150,150)
      doc.text(blind ? 'Client identity & contact details withheld. Apply through our consultancy.' : 'Generated via RecruitBase Pro', M, y)
      doc.save(`${(j.title||'JD').replace(/[^\w]+/g,'_')}${blind?'_Blind':''}_JD.pdf`)
    } catch(e:any){ alert('PDF banane mein dikkat: '+(e.message||'error')) }
    setPdfBusy(false)
  }

  // ── JD upload → auto-fill (pdf.js text extract + Gemini, free) ──
  function loadPdfJs():Promise<any> {
    return new Promise((res)=>{
      const w:any = window
      if (w.pdfjsLib) return res(w.pdfjsLib)
      const sc=document.createElement('script'); sc.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      sc.onload=()=>{ const lib=w.pdfjsLib; if(lib) lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; res(lib) }
      sc.onerror=()=>res(null); document.body.appendChild(sc)
    })
  }
  async function extractText(file:any):Promise<string> {
    const name=(file.name||'').toLowerCase()
    if (name.endsWith('.pdf')) {
      const lib=await loadPdfJs(); if(!lib) return ''
      const buf=await file.arrayBuffer()
      const pdf=await lib.getDocument({data:buf}).promise
      let txt=''
      for(let i=1;i<=pdf.numPages;i++){ const pg=await pdf.getPage(i); const c=await pg.getTextContent(); txt+=c.items.map((it:any)=>it.str).join(' ')+'\n' }
      return txt
    }
    try { return await file.text() } catch { return '' }
  }
  async function onJDFile(e:any) {
    const file=e.target.files?.[0]; if(!file) return
    e.target.value=''
    setParsing(true); setParseNote('Reading file...')
    try {
      const text=await extractText(file)
      if(!text.trim()){ setParseNote('Text nahi nikla (scanned PDF?) - manually bharo.'); setParsing(false); return }
      setParseNote('AI extracting...')
      const r=await fetch('/api/parse-jd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text.slice(0,12000)})})
      const d=await r.json()
      if(d?.ok && d.jd){
        const j=d.jd
        setForm((p:any)=>({...p,
          title:j.title||p.title, company:j.company||p.company, location:j.location||p.location,
          city:j.city||p.city, industry:j.industry||p.industry,
          experience_min:(j.experience_min??'')!==''?j.experience_min:p.experience_min,
          experience_max:(j.experience_max??'')!==''?j.experience_max:p.experience_max,
          qualification:j.qualification||p.qualification, skills:j.skills||p.skills,
          description:j.description||p.description||text,
        }))
        setParseNote('Auto-filled - fields check & edit kar lo.')
      } else {
        setForm((p:any)=>({...p, description:p.description||text}))
        setParseNote('AI busy - text Description mein daal diya, fields manually adjust karo.')
      }
    } catch(err:any){ setParseNote('Parse fail - manually bharo.') }
    setParsing(false)
  }

  const IS: any = { width:'100%', background:'var(--bg3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const LS: any = { display:'block', fontSize:10, fontWeight:600, color:'var(--mu)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }
  const STATUS_C: any = { 'Open': '#3dd68c', 'Closed': '#ff6b6b', 'On Hold': '#ffb347', 'Filled': '#c77dff' }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',color:'var(--tx)'}}>Loading...</div>

  return (
    <>
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--tx)',fontFamily:'Outfit,Inter,sans-serif'}}>
      <style>{`*{box-sizing:border-box}select option{background:var(--bg3)}
        @media (max-width:640px){[style*="grid-template-columns"]{grid-template-columns:1fr !important;}input,select,textarea{font-size:16px !important;min-height:44px;}}`}</style>

      <div style={{padding:'24px',maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <h1 style={{fontSize:20,fontWeight:700,marginBottom:2}}>Job Descriptions</h1>
            <p style={{fontSize:13,color:'var(--mu)'}}>{jobs.length} job{jobs.length!==1?'s':''} posted</p>
          </div>
          <button onClick={()=>{setForm({...EMPTY_JD});setParseNote('');setParsing(false);setShowAdd(true)}} style={{padding:'10px 20px',borderRadius:10,background:'#10b981',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>＋ Post New Job</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
          {[
            {l:'Total Jobs',v:jobs.length,c:'#10b981'},
            {l:'Open',v:jobs.filter(j=>j.status==='Open').length,c:'#3dd68c'},
            {l:'Filled',v:jobs.filter(j=>j.status==='Filled').length,c:'#c77dff'},
            {l:'Closed',v:jobs.filter(j=>j.status==='Closed').length,c:'#ff6b6b'},
          ].map(s=>(
            <div key={s.l} style={{background:'var(--bg2)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:16}}>
              <div style={{fontSize:10,fontWeight:600,color:'var(--mu)',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>{s.l}</div>
              <div style={{fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
          {jobs.length===0 ? (
            <div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'var(--mu)'}}>
              <div style={{fontSize:40,marginBottom:12}}>📋</div>
              <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>No jobs posted yet</div>
              <div style={{fontSize:13}}>Click Post New Job to create your first job description</div>
            </div>
          ) : jobs.map(j => {
            const a = assignMap[j.id] || { recruiters: [], bd: '' }
            return (
            <div key={j.id} style={{background:'var(--bg2)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:20,cursor:'pointer'}} onClick={()=>openJob(j)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{j.title}</div>
                  <div style={{fontSize:12,color:'var(--mu)'}}>{j.company||'—'} · {j.location||j.city||'—'}</div>
                </div>
                <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:`${STATUS_C[j.status]||'var(--mu)'}22`,color:STATUS_C[j.status]||'var(--mu)',fontWeight:600,whiteSpace:'nowrap'}}>{j.status}</span>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                {j.experience_min&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'rgba(16,185,129,0.12)',color:'#10b981'}}>{j.experience_min}-{j.experience_max||'+'} yrs</span>}
                {j.qualification&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'rgba(61,214,140,0.1)',color:'#3dd68c'}}>{j.qualification}</span>}
                {j.openings&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'rgba(255,214,10,0.1)',color:'#ffd60a'}}>{j.openings} opening{j.openings!==1?'s':''}</span>}
              </div>
              {/* assignment summary */}
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                <span style={{fontSize:11,padding:'2px 9px',borderRadius:20,background:'rgba(16,185,129,0.12)',color:'#10b981',fontWeight:600}}>👥 {a.recruiters.length} recruiter{a.recruiters.length!==1?'s':''}</span>
                {a.bd && <span style={{fontSize:11,padding:'2px 9px',borderRadius:20,background:'rgba(199,125,255,0.14)',color:'#c77dff',fontWeight:600}}>🤝 BD: {uName(a.bd)}</span>}
                {j.team_visibility && <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'var(--bg3)',color:'var(--mu)'}}>team-visible</span>}
                {j.bd_can_see_candidates && <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'var(--bg3)',color:'var(--mu)'}}>BD sees candidates</span>}
              </div>
              {j.skills&&<div style={{fontSize:12,color:'var(--mu)',marginBottom:12,lineHeight:1.5}}>Skills: {j.skills}</div>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,color:'var(--mu2)'}}>{new Date(j.created_at).toLocaleDateString('en-IN')}</span>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={e=>{e.stopPropagation();shareJDWhatsApp(j,false)}} style={{fontSize:11,padding:'4px 10px',borderRadius:6,background:'rgba(37,211,102,0.14)',color:'#1faa52',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>💬 WA</button>
                  <button onClick={e=>{e.stopPropagation();downloadJD(j,false)}} disabled={pdfBusy} style={{fontSize:11,padding:'4px 10px',borderRadius:6,background:'rgba(16,185,129,0.12)',color:'#10b981',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>📄 PDF</button>
                  <button onClick={e=>{e.stopPropagation();deleteJob(j.id)}} style={{fontSize:11,padding:'4px 10px',borderRadius:6,background:'rgba(255,107,107,0.1)',color:'#ff6b6b',border:'none',cursor:'pointer',fontFamily:'inherit'}}>Delete</button>
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>

      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:20}} onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div style={{background:'var(--bg2)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:20,width:'100%',maxWidth:680,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 80px rgba(0,0,0,0.5)'}}>
            <div style={{padding:'18px 24px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'var(--bg2)',zIndex:10}}>
              <div style={{fontSize:16,fontWeight:700}}>{form.id ? 'Edit Job' : 'Post New Job'}</div>
              <button onClick={()=>setShowAdd(false)} style={{background:'var(--bg3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,width:28,height:28,cursor:'pointer',color:'var(--tx)',fontSize:14}}>✕</button>
            </div>
            <div style={{padding:24,display:'grid',gap:14}}>
              <div style={{background:'var(--bg3)',border:'1px dashed rgba(16,185,129,0.4)',borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                <div style={{fontSize:13,fontWeight:600,color:'#10b981'}}>⬆️ Upload JD to auto-fill</div>
                <label style={{fontSize:12,padding:'7px 14px',borderRadius:8,background:'#10b981',color:'#fff',cursor:parsing?'wait':'pointer',fontWeight:600}}>
                  {parsing?'Working…':'Choose PDF / TXT'}
                  <input type="file" accept=".pdf,.txt" onChange={onJDFile} disabled={parsing} style={{display:'none'}}/>
                </label>
                {parseNote && <span style={{fontSize:12,color:parseNote.startsWith('✓')?'#10b981':'var(--mu)'}}>{parseNote}</span>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div style={{gridColumn:'1/-1'}}><label style={LS}>Job Title *</label><input style={IS} value={form.title} onChange={e=>setForm((f:any)=>({...f,title:e.target.value}))} placeholder="e.g. Senior Cardiologist, HR Manager"/></div>
                <div><label style={LS}>Company Name</label><input style={IS} value={form.company||''} onChange={e=>setForm((f:any)=>({...f,company:e.target.value}))} placeholder="Company or client name"/></div>
                <div><label style={LS}>Location</label><input style={IS} value={form.location||''} onChange={e=>setForm((f:any)=>({...f,location:e.target.value}))} placeholder="City or Remote"/></div>
                <div><label style={LS}>Industry</label><input style={IS} value={form.industry||''} onChange={e=>setForm((f:any)=>({...f,industry:e.target.value}))} placeholder="e.g. Healthcare, IT, BFSI"/></div>
                <div><label style={LS}>Status</label><select style={IS} value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))}>{['Open','On Hold','Filled','Closed'].map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label style={LS}>Min Experience (Yrs)</label><input style={IS} type="number" value={form.experience_min||''} onChange={e=>setForm((f:any)=>({...f,experience_min:e.target.value}))} placeholder="e.g. 3"/></div>
                <div><label style={LS}>Max Experience (Yrs)</label><input style={IS} type="number" value={form.experience_max||''} onChange={e=>setForm((f:any)=>({...f,experience_max:e.target.value}))} placeholder="e.g. 10"/></div>
                <div><label style={LS}>Qualification Required</label><input style={IS} value={form.qualification||''} onChange={e=>setForm((f:any)=>({...f,qualification:e.target.value}))} placeholder="e.g. MBBS, MBA, B.Tech"/></div>
                <div><label style={LS}>Number of Openings</label><input style={IS} type="number" value={form.openings||1} onChange={e=>setForm((f:any)=>({...f,openings:parseInt(e.target.value)||1}))} min="1"/></div>
                <div style={{gridColumn:'1/-1'}}><label style={LS}>Required Skills</label><input style={IS} value={form.skills||''} onChange={e=>setForm((f:any)=>({...f,skills:e.target.value}))} placeholder="Comma separated skills"/></div>
                <div style={{gridColumn:'1/-1'}}><label style={LS}>Job Description</label><textarea style={{...IS,resize:'none'}} rows={5} value={form.description||''} onChange={e=>setForm((f:any)=>({...f,description:e.target.value}))} placeholder="Full job description, responsibilities, requirements..."/></div>
              </div>

              {/* ── Assignment & Visibility (managers only) ── */}
              {canManage && (
                <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:16}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:'#10b981'}}>👥 Assignment & Visibility</div>

                  <label style={LS}>Assigned Recruiters (multi-select)</label>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
                    {users.filter(u=>u.role!=='bd').length===0 && <span style={{fontSize:12,color:'var(--mu2)'}}>No team members yet.</span>}
                    {users.filter(u=>u.role!=='bd').map(u=>{
                      const on = form._recruiters?.includes(u.id)
                      return <button key={u.id} type="button" onClick={()=>toggleRecruiter(u.id)} style={{fontSize:12,padding:'6px 12px',borderRadius:20,border:'1px solid '+(on?'#10b981':'rgba(255,255,255,0.12)'),background:on?'#10b981':'var(--bg3)',color:on?'#fff':'var(--tx)',cursor:'pointer',fontFamily:'inherit',fontWeight:on?700:400}}>{on?'✓ ':''}{u.full_name||u.email}</button>
                    })}
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr',gap:14,marginBottom:14}}>
                    <div>
                      <label style={LS}>BD Owner (who brought this mandate)</label>
                      <select style={IS} value={form._bd||''} onChange={e=>setForm((f:any)=>({...f,_bd:e.target.value}))}>
                        <option value="">— None —</option>
                        {users.map(u=><option key={u.id} value={u.id}>{(u.full_name||u.email)} {u.role==='bd'?'(BD)':''}</option>)}
                      </select>
                    </div>
                  </div>

                  <label style={{...LS, marginBottom:8}}>Visibility (AO / Team Lead controlled)</label>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <label style={{display:'flex',alignItems:'center',gap:10,fontSize:13,cursor:'pointer'}}>
                      <input type="checkbox" checked={!!form.team_visibility} onChange={e=>setForm((f:any)=>({...f,team_visibility:e.target.checked}))} style={{width:16,height:16,accentColor:'#10b981'}}/>
                      <span>Team visibility — assigned recruiters ek doosre ke candidates dekh sakein (no duplicate)</span>
                    </label>
                    <label style={{display:'flex',alignItems:'center',gap:10,fontSize:13,cursor:'pointer'}}>
                      <input type="checkbox" checked={!!form.bd_can_see_candidates} onChange={e=>setForm((f:any)=>({...f,bd_can_see_candidates:e.target.checked}))} style={{width:16,height:16,accentColor:'#10b981'}}/>
                      <span>BD owner is mandate ke candidates dekh sake</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div style={{padding:'14px 24px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'flex-end',gap:10,position:'sticky',bottom:0,background:'var(--bg2)'}}>
              {form.id && <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--mu)',cursor:'pointer',marginRight:'auto'}}><input type="checkbox" checked={blindPdf} onChange={e=>setBlindPdf(e.target.checked)} style={{accentColor:'#10b981'}}/> Blind JD (hide client + contact)</label>}
              {form.id && <button onClick={()=>shareJDWhatsApp(form, blindPdf)} style={{padding:'9px 16px',borderRadius:10,background:'rgba(37,211,102,0.14)',color:'#1faa52',border:'1px solid rgba(37,211,102,0.3)',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>💬 WhatsApp JD</button>}
              {form.id && <button onClick={()=>downloadJD(form, blindPdf)} disabled={pdfBusy} style={{padding:'9px 16px',borderRadius:10,background:'rgba(16,185,129,0.12)',color:'#10b981',border:'1px solid rgba(16,185,129,0.3)',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>{pdfBusy?'…':'📄 Download PDF'}</button>}
              <button onClick={()=>setShowAdd(false)} style={{padding:'9px 18px',borderRadius:10,background:'transparent',color:'var(--mu)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',fontFamily:'inherit',fontSize:13}}>Cancel</button>
              <button onClick={saveJob} disabled={saving||!form.title} style={{padding:'9px 20px',borderRadius:10,background:'#10b981',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit',opacity:saving?0.7:1}}>{saving?'Saving...':'Save Job'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
