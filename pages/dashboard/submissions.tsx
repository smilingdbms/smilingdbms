// @ts-nocheck
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ════════════════════════════════════════════════════════════════════════
//  SUBMISSIONS — consultant tracker. Share candidates to clients + status.
//  Auto-fills from profiles. Same CV → multiple clients = multiple rows.
// ════════════════════════════════════════════════════════════════════════
const STAGES = ['Submitted','Shortlisted','Interview','Hold','Rejected']
const SC:any = { Submitted:'#6B7280', Shortlisted:'#10b981', Interview:'#3B82F6', Hold:'#F59E0B', Rejected:'#EF4444' }
const latestOrg = (p:any) => {
  if (p?.current_company) return p.current_company
  const we = Array.isArray(p?.work_experiences) ? p.work_experiences : []
  const cur = we.find((w:any)=> !w.to || /present|current|till|now/i.test(String(w.to)))
  return (cur||we[0])?.company || ''
}
const EMPTY = { id:null, client_id:'', candidate_id:null, job_id:null, candidate_name:'', current_position:'',
  current_org:'', is_fresher:false, current_ctc:'', expected_ctc:'', notice_period:'', current_location:'',
  total_experience:'', skills:'', applying_position:'', branch:'', custom_notes:'', cv_url:'' }

export default function Submissions() {
  const router = useRouter()
  const [me, setMe] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [cands, setCands] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [csearch, setCsearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [up, setUp] = useState(false)
  // filters
  const [fq, setFq] = useState(''); const [fClient, setFClient] = useState(''); const [fPos, setFPos] = useState('')
  const [fBranch, setFBranch] = useState(''); const [fStatus, setFStatus] = useState(''); const [fNotice, setFNotice] = useState('')
  const [fLoc, setFLoc] = useState(''); const [fCtcMin, setFCtcMin] = useState(''); const [fCtcMax, setFCtcMax] = useState('')
  const [fFrom, setFFrom] = useState(''); const [fTo, setFTo] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data:{ session } }) => {
      if (!session) { router.push('/'); return }
      const { data: au } = await supabase.from('app_users').select('*').eq('id', session.user.id).single()
      if (!au || au.role==='job_seeker') { router.push('/'); return }
      setMe(au); await load(au); setLoading(false)
    })
  }, [])

  async function load(au:any) {
    const admin = ['super_admin','platform_admin','platform_manager'].includes(au?.role)
    let q = supabase.from('client_submissions').select('*').order('created_at',{ascending:false})
    if (!admin && au?.company_id) q = q.eq('company_id', au.company_id)
    const { data } = await q; setRows(data||[])
    const cl = supabase.from('bd_pipeline').select('id, company_name, spoc_name'); 
    const { data: cld } = au?.company_id && !admin ? await cl.eq('company_id',au.company_id) : await cl
    setClients(cld||[])
    const ca = supabase.from('profiles').select('id,name,role,current_company,work_experiences,current_ctc,expected_ctc,notice_period,city,total_experience,experience,skills,resume_url,segment')
    const { data: cad } = au?.company_id && !admin ? await ca.eq('company_id',au.company_id) : await ca
    setCands(cad||[])
    const { data: jd } = await supabase.from('job_descriptions').select('id,title'); setJobs(jd||[])
  }

  function pick(p:any) {
    const org = latestOrg(p)
    setForm((f:any)=>({...f, candidate_id:p.id, candidate_name:p.name||'', current_position:p.role||'',
      current_org:org, is_fresher: !org && p.segment==='fresher',
      current_ctc:p.current_ctc||'', expected_ctc:p.expected_ctc||'', notice_period:p.notice_period||'',
      current_location:p.city||'', total_experience:p.total_experience||p.experience||'',
      skills:p.skills||'', cv_url:p.resume_url||'' }))
    setCsearch('')
  }

  async function uploadCV(e:any) {
    const file = e.target.files?.[0]; if(!file) return; e.target.value=''
    setUp(true)
    try {
      const path = `${me?.company_id||'x'}/${Date.now()}_${file.name.replace(/[^\w.]+/g,'_')}`
      const { error } = await supabase.storage.from('resumes').upload(path, file, { upsert:false })
      if (error) throw error
      const { data } = supabase.storage.from('resumes').getPublicUrl(path)
      setForm((f:any)=>({...f, cv_url:data.publicUrl}))
    } catch(err:any){ alert('Upload nahi hua ('+(err.message||'')+'). CV ka link paste kar do.') }
    setUp(false)
  }

  async function save() {
    if (!form.client_id) { alert('Client choose karo.'); return }
    if (!form.candidate_name.trim()) { alert('Candidate name zaroori hai.'); return }
    setSaving(true)
    try {
      const payload:any = { company_id: me?.company_id||null, client_id: form.client_id,
        candidate_id: form.candidate_id||null, job_id: form.job_id||null,
        candidate_name: form.candidate_name.trim(), current_position: form.current_position||null,
        branch: form.branch||null, applying_position: form.applying_position||null,
        current_company: form.is_fresher ? 'Fresher' : (form.current_org||null),
        current_ctc: form.current_ctc||null, expected_ctc: form.expected_ctc||null,
        notice_period: form.notice_period||null, current_location: form.current_location||null,
        total_experience: form.total_experience||null, skills: form.skills||null,
        custom_notes: form.custom_notes||null, cv_url: form.cv_url||null,
        status:'Submitted', created_by: me?.id }
      const { data, error } = await supabase.from('client_submissions').insert([payload]).select().single()
      if (error) throw error
      setRows(r=>[data, ...r]); setOpen(false); setForm(EMPTY)
    } catch(e:any){ alert('Save nahi hua: '+(e.message||'error')) }
    setSaving(false)
  }

  async function setStatus(row:any, status:string) {
    try { await supabase.from('client_submissions').update({status}).eq('id',row.id)
      setRows(r=>r.map(x=>x.id===row.id?{...x,status}:x)) } catch(e){}
  }

  const clientName = (id:string)=> clients.find(c=>c.id===id)?.company_name || '—'
  const filtered = rows.filter(r=>{
    const q=fq.toLowerCase()
    if (q && ![r.candidate_name,r.skills,r.current_position,r.applying_position,r.current_company].some((v:any)=>(v||'').toLowerCase().includes(q))) return false
    if (fClient && r.client_id!==fClient) return false
    if (fPos && !(r.applying_position||'').toLowerCase().includes(fPos.toLowerCase()) && !(r.current_position||'').toLowerCase().includes(fPos.toLowerCase())) return false
    if (fBranch && !(r.branch||'').toLowerCase().includes(fBranch.toLowerCase())) return false
    if (fStatus && (r.status||'')!==fStatus) return false
    if (fNotice && !(r.notice_period||'').toLowerCase().includes(fNotice.toLowerCase())) return false
    if (fLoc && !(r.current_location||'').toLowerCase().includes(fLoc.toLowerCase())) return false
    const ctc = parseFloat(String(r.expected_ctc||'').replace(/[^\d.]/g,''))
    if (fCtcMin && (isNaN(ctc)||ctc<parseFloat(fCtcMin))) return false
    if (fCtcMax && (isNaN(ctc)||ctc>parseFloat(fCtcMax))) return false
    if (fFrom && new Date(r.created_at) < new Date(fFrom)) return false
    if (fTo && new Date(r.created_at) > new Date(fTo+'T23:59:59')) return false
    return true
  })

  if (loading) return <div style={{padding:60,textAlign:'center',color:'var(--mu)'}}>Loading…</div>
  const IN:any = { padding:'9px 11px', borderRadius:9, border:'1px solid var(--bd)', background:'var(--bg2)', color:'var(--tx)', fontSize:13, fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box' }
  const LB:any = { fontSize:11, fontWeight:600, color:'var(--mu)', marginBottom:4, display:'block' }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap');.s-wrap{font-family:Outfit,system-ui,sans-serif}.s-card{background:var(--bg2);border:1px solid var(--bd);border-radius:13px;padding:15px}.sb{border:none;border-radius:8px;padding:7px 13px;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit}`}}/>
      <div className="s-wrap" style={{padding:'4px 2px 56px',maxWidth:1180}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:12,marginBottom:18}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase',letterSpacing:.5}}>Business · Pipeline</div>
            <h1 style={{fontFamily:'Sora,sans-serif',margin:'5px 0 0',fontSize:27,fontWeight:800,color:'var(--tx)'}}>📤 Submissions</h1>
            <p style={{fontSize:13,color:'var(--mu)',margin:'6px 0 0'}}>Kis CV ko kis client ko, kis position par bheja — pura tracker</p>
          </div>
          <button onClick={()=>{setForm(EMPTY);setOpen(true)}} className="sb" style={{background:'#10b981',color:'#fff',padding:'11px 20px',fontSize:14}}>＋ New Submission</button>
        </div>

        {/* filters */}
        <div className="s-card" style={{marginBottom:14,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
          <input style={IN} placeholder="🔍 Search name/skills" value={fq} onChange={e=>setFq(e.target.value)}/>
          <select style={IN} value={fClient} onChange={e=>setFClient(e.target.value)}><option value="">All clients</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}</select>
          <input style={IN} placeholder="Position" value={fPos} onChange={e=>setFPos(e.target.value)}/>
          <input style={IN} placeholder="Branch" value={fBranch} onChange={e=>setFBranch(e.target.value)}/>
          <select style={IN} value={fStatus} onChange={e=>setFStatus(e.target.value)}><option value="">Any status</option>{STAGES.map(s=><option key={s}>{s}</option>)}</select>
          <input style={IN} placeholder="Notice" value={fNotice} onChange={e=>setFNotice(e.target.value)}/>
          <input style={IN} placeholder="Location" value={fLoc} onChange={e=>setFLoc(e.target.value)}/>
          <input style={IN} placeholder="Exp CTC min" value={fCtcMin} onChange={e=>setFCtcMin(e.target.value)}/>
          <input style={IN} placeholder="Exp CTC max" value={fCtcMax} onChange={e=>setFCtcMax(e.target.value)}/>
          <input style={IN} type="date" value={fFrom} onChange={e=>setFFrom(e.target.value)}/>
          <input style={IN} type="date" value={fTo} onChange={e=>setFTo(e.target.value)}/>
        </div>

        <div style={{fontSize:12,color:'var(--mu)',marginBottom:10}}>{filtered.length} submission{filtered.length!==1?'s':''}</div>

        {filtered.length===0 ? <div className="s-card" style={{textAlign:'center',padding:46,color:'var(--mu)'}}>Koi submission nahi. "＋ New Submission" se shuru karo.</div> : (
          <div style={{display:'flex',flexDirection:'column',gap:11}}>
            {filtered.map(r=>(
              <div key={r.id} className="s-card">
                <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div style={{minWidth:240,flex:1}}>
                    <div style={{fontWeight:700,fontSize:15}}>{r.candidate_name} <span style={{fontSize:12,color:'var(--mu)',fontWeight:500}}>· {r.current_position||'—'}</span></div>
                    <div style={{fontSize:12.5,marginTop:4}}><span style={{color:'#10b981',fontWeight:700}}>→ {clientName(r.client_id)}</span> <span style={{color:'var(--mu)'}}>· {r.applying_position||'position —'}{r.branch?` · 🏢 ${r.branch}`:''}</span></div>
                    <div style={{fontSize:11.5,color:'var(--mu)',marginTop:5}}>{r.current_company||'—'} · 💰 {r.expected_ctc||'—'} · ⏳ {r.notice_period||'—'} · 📍 {r.current_location||'—'}</div>
                    {r.cv_url && <a href={r.cv_url} target="_blank" rel="noopener noreferrer" style={{fontSize:11.5,color:'#10b981',fontWeight:600}}>🔗 CV</a>}
                    {r.client_note && <div style={{fontSize:12,marginTop:6,padding:'6px 10px',background:'var(--bg3)',borderRadius:8,color:'var(--tx)'}}>💬 Client: {r.client_note}</div>}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
                    <select value={r.status||'Submitted'} onChange={e=>setStatus(r,e.target.value)} style={{...IN,width:'auto',padding:'5px 9px',color:SC[r.status||'Submitted'],fontWeight:700,fontSize:12}}>{STAGES.map(s=><option key={s}>{s}</option>)}</select>
                    <div style={{fontSize:10.5,color:'var(--mu2)'}}>{r.created_at?new Date(r.created_at).toLocaleDateString('en-IN'):''}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Submission modal */}
      {open && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:20,zIndex:100,overflowY:'auto'}} onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="s-wrap" style={{background:'var(--bg)',borderRadius:16,width:'100%',maxWidth:560,padding:22,margin:'10px 0'}}>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:19,fontWeight:800,color:'var(--tx)',marginBottom:14}}>📤 New Submission</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label style={LB}>Client *</label><select style={IN} value={form.client_id} onChange={e=>setForm({...form,client_id:e.target.value})}><option value="">Select client…</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}</select></div>

              <div><label style={LB}>Candidate (DB se — auto-fill)</label>
                <input style={IN} placeholder="Type to search candidate…" value={csearch} onChange={e=>setCsearch(e.target.value)}/>
                {csearch && <div style={{maxHeight:160,overflowY:'auto',border:'1px solid var(--bd)',borderRadius:9,marginTop:5}}>
                  {cands.filter(p=>(p.name||'').toLowerCase().includes(csearch.toLowerCase())).slice(0,20).map(p=>(
                    <div key={p.id} onClick={()=>pick(p)} style={{padding:'8px 11px',cursor:'pointer',fontSize:13,borderBottom:'1px solid var(--bd)'}}>{p.name} <span style={{color:'var(--mu)',fontSize:11}}>· {p.role||''}</span></div>
                  ))}
                  {cands.filter(p=>(p.name||'').toLowerCase().includes(csearch.toLowerCase())).length===0 && <div style={{padding:10,fontSize:12,color:'var(--mu)'}}>Nahi mila — niche manually bharo (direct CV)</div>}
                </div>}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={LB}>Candidate Name *</label><input style={IN} value={form.candidate_name} onChange={e=>setForm({...form,candidate_name:e.target.value})}/></div>
                <div><label style={LB}>Current Position</label><input style={IN} value={form.current_position} onChange={e=>setForm({...form,current_position:e.target.value})}/></div>
                <div><label style={LB}>Applying for Position</label><input style={IN} list="jobsdl" value={form.applying_position} onChange={e=>{const j=jobs.find(x=>x.title===e.target.value);setForm({...form,applying_position:e.target.value,job_id:j?.id||form.job_id})}}/><datalist id="jobsdl">{jobs.map(j=><option key={j.id} value={j.title}/>)}</datalist></div>
                <div><label style={LB}>Branch</label><input style={IN} placeholder="e.g. Gurugram Office" value={form.branch} onChange={e=>setForm({...form,branch:e.target.value})}/></div>
                <div>
                  <label style={LB}>Current / Last Organisation</label>
                  <input style={{...IN,opacity:form.is_fresher?.5:1}} disabled={form.is_fresher} value={form.is_fresher?'Fresher':form.current_org} onChange={e=>setForm({...form,current_org:e.target.value})}/>
                  <label style={{fontSize:11,color:'var(--mu)',display:'flex',gap:5,alignItems:'center',marginTop:4,cursor:'pointer'}}><input type="checkbox" checked={form.is_fresher} onChange={e=>setForm({...form,is_fresher:e.target.checked})} style={{accentColor:'#10b981'}}/>Fresher</label>
                </div>
                <div>
                  <label style={LB}>Notice Period</label>
                  <input style={IN} value={form.notice_period} onChange={e=>setForm({...form,notice_period:e.target.value})}/>
                  <button type="button" onClick={()=>setForm({...form,notice_period:'Immediate'})} style={{fontSize:10.5,color:'#10b981',background:'none',border:'none',cursor:'pointer',marginTop:3,fontFamily:'inherit',fontWeight:600}}>＋ Immediate Joiner</button>
                </div>
                <div><label style={LB}>Current CTC</label><input style={IN} value={form.current_ctc} onChange={e=>setForm({...form,current_ctc:e.target.value})}/></div>
                <div><label style={LB}>Expected CTC</label><input style={IN} value={form.expected_ctc} onChange={e=>setForm({...form,expected_ctc:e.target.value})}/></div>
                <div><label style={LB}>Current Location</label><input style={IN} value={form.current_location} onChange={e=>setForm({...form,current_location:e.target.value})}/></div>
                <div><label style={LB}>Total Experience</label><input style={IN} value={form.total_experience} onChange={e=>setForm({...form,total_experience:e.target.value})}/></div>
              </div>

              <div><label style={LB}>Skills</label><input style={IN} value={form.skills} onChange={e=>setForm({...form,skills:e.target.value})}/></div>

              <div><label style={LB}>Custom Notes (har line = ek bullet)</label><textarea style={{...IN,resize:'vertical'}} rows={4} placeholder={"Strong in client handling\nLed a team of 8\nOpen to relocate"} value={form.custom_notes} onChange={e=>setForm({...form,custom_notes:e.target.value})}/></div>

              <div><label style={LB}>CV link / upload</label>
                <input style={IN} placeholder="CV link (Drive/LinkedIn) — auto-filled if available" value={form.cv_url} onChange={e=>setForm({...form,cv_url:e.target.value})}/>
                <label style={{fontSize:11,color:'#10b981',cursor:'pointer',marginTop:4,display:'inline-block',fontWeight:600}}>{up?'Uploading…':'📎 ya CV file upload karo'}<input type="file" accept=".pdf,.doc,.docx" onChange={uploadCV} style={{display:'none'}}/></label>
              </div>

              <div style={{display:'flex',gap:10,marginTop:4}}>
                <button onClick={()=>setOpen(false)} className="sb" style={{background:'var(--bg3)',color:'var(--mu)',padding:'10px 18px'}}>Cancel</button>
                <button onClick={save} disabled={saving} className="sb" style={{flex:1,background:'#10b981',color:'#fff',padding:'10px'}}>{saving?'Sharing…':'Share with Client'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
