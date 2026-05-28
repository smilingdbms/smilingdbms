import { applyTheme, getSavedTheme } from '../../src/components/theme'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

const EMPTY_JD = { title:'', company:'', location:'', industry:'', experience_min:'', experience_max:'', qualification:'', skills:'', description:'', status:'Open', openings:1 }

export default function Jobs() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<any>(Object.assign({}, EMPTY_JD))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      loadData(session.user)
    })
  }, [router])

  async function loadData(u: any) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)
    try {
      let _q = supabase.from('job_descriptions').select('*').order('created_at', { ascending: false }); if (!['super_admin','platform_admin','platform_manager'].includes(au?.role)) _q = _q.eq('company_id', au?.company_id); const { data: js } = await _q; // company isolated
      setJobs(js || [])
    } catch(e) { console.warn('Jobs table not ready yet') }
    setLoading(false)
  }

  async function saveJob() {
    setSaving(true)
    try {
      if (form.id) {
        const { data, error } = await supabase.from('job_descriptions').update(form).eq('id', form.id).select().single()
        if (error) throw error
        setJobs(prev => prev.map(j => j.id === data.id ? data : j))
      } else {
        const { data, error } = await supabase.from('job_descriptions').insert({ 
            ...form, 
            created_by: appUser?.id,
            company_id: appUser?.company_id,
            is_public: false
          }).select().single()
        if (error) throw error
        setJobs(prev => [data, ...prev])
      }
      setShowAdd(false); setForm(Object.assign({}, EMPTY_JD))
    } catch(e: any) { alert('Save failed: ' + e.message) }
    setSaving(false)
  }

  async function deleteJob(id: string) {
    if (!confirm('Delete this job?')) return
    await supabase.from('job_descriptions').delete().eq('id', id)
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  const IS: any = { width:'100%', background:'#22262f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', color:'#e8eaf0', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const LS: any = { display:'block', fontSize:10, fontWeight:600, color:'#7a7f90', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }
  const STATUS_C: any = { 'Open': '#3dd68c', 'Closed': '#ff6b6b', 'On Hold': '#ffb347', 'Filled': '#c77dff' }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#111318',color:'#e8eaf0'}}>Loading...</div>

  return (
    <>
    <div style={{minHeight:'100vh',background:'#111318',color:'#e8eaf0',fontFamily:'Outfit,Inter,sans-serif'}}>
      
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box}select option{background:#22262f}`}</style>
      
      

      <div style={{padding:'24px',maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <h1 style={{fontSize:20,fontWeight:700,marginBottom:2}}>Job Descriptions</h1>
            <p style={{fontSize:13,color:'#7a7f90'}}>{jobs.length} job{jobs.length!==1?'s':''} posted</p>
          </div>
          <button onClick={()=>{setForm({...EMPTY_JD});setShowAdd(true)}} style={{padding:'10px 20px',borderRadius:10,background:'#6c8cff',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>＋ Post New Job</button>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
          {[
            {l:'Total Jobs',v:jobs.length,c:'#6c8cff'},
            {l:'Open',v:jobs.filter(j=>j.status==='Open').length,c:'#3dd68c'},
            {l:'Filled',v:jobs.filter(j=>j.status==='Filled').length,c:'#c77dff'},
            {l:'Closed',v:jobs.filter(j=>j.status==='Closed').length,c:'#ff6b6b'},
          ].map(s=>(
            <div key={s.l} style={{background:'#1a1d24',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:16}}>
              <div style={{fontSize:10,fontWeight:600,color:'#7a7f90',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>{s.l}</div>
              <div style={{fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Jobs Grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
          {jobs.length===0 ? (
            <div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'#7a7f90'}}>
              <div style={{fontSize:40,marginBottom:12}}>📋</div>
              <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>No jobs posted yet</div>
              <div style={{fontSize:13}}>Click Post New Job to create your first job description</div>
            </div>
          ) : jobs.map(j => (
            <div key={j.id} style={{background:'#1a1d24',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:20,cursor:'pointer'}}
              onClick={()=>{setForm({...j});setShowAdd(true)}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{j.title}</div>
                  <div style={{fontSize:12,color:'#7a7f90'}}>{j.company||'—'} · {j.location||'—'}</div>
                </div>
                <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:`${STATUS_C[j.status]||'#aaa'}22`,color:STATUS_C[j.status]||'#aaa',fontWeight:600,whiteSpace:'nowrap'}}>{j.status}</span>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                {j.experience_min&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'rgba(108,140,255,0.1)',color:'#6c8cff'}}>{j.experience_min}-{j.experience_max||'+'} yrs</span>}
                {j.qualification&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'rgba(61,214,140,0.1)',color:'#3dd68c'}}>{j.qualification}</span>}
                {j.openings&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'rgba(255,214,10,0.1)',color:'#ffd60a'}}>{j.openings} opening{j.openings!==1?'s':''}</span>}
              </div>
              {j.skills&&<div style={{fontSize:12,color:'#7a7f90',marginBottom:12,lineHeight:1.5}}>Skills: {j.skills}</div>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,color:'#505468'}}>{new Date(j.created_at).toLocaleDateString('en-IN')}</span>
                <button onClick={e=>{e.stopPropagation();deleteJob(j.id)}} style={{fontSize:11,padding:'4px 10px',borderRadius:6,background:'rgba(255,107,107,0.1)',color:'#ff6b6b',border:'none',cursor:'pointer',fontFamily:'inherit'}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:20}} onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div style={{background:'#1a1d24',border:'1px solid rgba(255,255,255,0.08)',borderRadius:20,width:'100%',maxWidth:680,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 80px rgba(0,0,0,0.5)'}}>
            <div style={{padding:'18px 24px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#1a1d24',zIndex:10}}>
              <div style={{fontSize:16,fontWeight:700}}>{form.id ? 'Edit Job' : 'Post New Job'}</div>
              <button onClick={()=>setShowAdd(false)} style={{background:'#22262f',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,width:28,height:28,cursor:'pointer',color:'#e8eaf0',fontSize:14}}>✕</button>
            </div>
            <div style={{padding:24,display:'grid',gap:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Job Title *</label>
                  <input style={IS} value={form.title} onChange={e=>setForm((f:any)=>({...f,title:e.target.value}))} placeholder="e.g. Senior Cardiologist, HR Manager"/>
                </div>
                <div>
                  <label style={LS}>Company Name</label>
                  <input style={IS} value={form.company||''} onChange={e=>setForm((f:any)=>({...f,company:e.target.value}))} placeholder="Company or client name"/>
                </div>
                <div>
                  <label style={LS}>Location</label>
                  <input style={IS} value={form.location||''} onChange={e=>setForm((f:any)=>({...f,location:e.target.value}))} placeholder="City or Remote"/>
                </div>
                <div>
                  <label style={LS}>Industry</label>
                  <input style={IS} value={form.industry||''} onChange={e=>setForm((f:any)=>({...f,industry:e.target.value}))} placeholder="e.g. Healthcare, IT, BFSI"/>
                </div>
                <div>
                  <label style={LS}>Status</label>
                  <select style={IS} value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))}>
                    {['Open','On Hold','Filled','Closed'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>Min Experience (Yrs)</label>
                  <input style={IS} type="number" value={form.experience_min||''} onChange={e=>setForm((f:any)=>({...f,experience_min:e.target.value}))} placeholder="e.g. 3"/>
                </div>
                <div>
                  <label style={LS}>Max Experience (Yrs)</label>
                  <input style={IS} type="number" value={form.experience_max||''} onChange={e=>setForm((f:any)=>({...f,experience_max:e.target.value}))} placeholder="e.g. 10"/>
                </div>
                <div>
                  <label style={LS}>Qualification Required</label>
                  <input style={IS} value={form.qualification||''} onChange={e=>setForm((f:any)=>({...f,qualification:e.target.value}))} placeholder="e.g. MBBS, MBA, B.Tech"/>
                </div>
                <div>
                  <label style={LS}>Number of Openings</label>
                  <input style={IS} type="number" value={form.openings||1} onChange={e=>setForm((f:any)=>({...f,openings:parseInt(e.target.value)||1}))} min="1"/>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Required Skills</label>
                  <input style={IS} value={form.skills||''} onChange={e=>setForm((f:any)=>({...f,skills:e.target.value}))} placeholder="Comma separated skills"/>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Job Description</label>
                  <textarea style={{...IS,resize:'none'}} rows={5} value={form.description||''} onChange={e=>setForm((f:any)=>({...f,description:e.target.value}))} placeholder="Full job description, responsibilities, requirements..."/>
                </div>
              </div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'flex-end',gap:10,position:'sticky',bottom:0,background:'#1a1d24'}}>
              <button onClick={()=>setShowAdd(false)} style={{padding:'9px 18px',borderRadius:10,background:'transparent',color:'#7a7f90',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',fontFamily:'inherit',fontSize:13}}>Cancel</button>
              <button onClick={saveJob} disabled={saving||!form.title} style={{padding:'9px 20px',borderRadius:10,background:'#6c8cff',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit',opacity:saving?0.7:1}}>{saving?'Saving...':'Save Job'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
