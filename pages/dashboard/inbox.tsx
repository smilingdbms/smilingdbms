// @ts-nocheck
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ════════════════════════════════════════════════════════════════════════
//  CAREERS INBOX — public applications from the Careers page
//  career_applications → review, WhatsApp/Call, "Add to Candidates", status.
// ════════════════════════════════════════════════════════════════════════
const WA = (raw:any, text:string) => { const d=String(raw||'').replace(/\D/g,''); const n=d?(d.length===10?'91'+d:d.replace(/^0+/,'')):''; return n?`https://wa.me/${n}?text=${encodeURIComponent(text)}`:'' }

export default function CareersInbox() {
  const router = useRouter()
  const [me, setMe] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  const [jobs, setJobs] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string>('')
  const [filter, setFilter] = useState('all')

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
    let q = supabase.from('career_applications').select('*').order('created_at',{ascending:false})
    if (!admin && au?.company_id) q = q.eq('company_id', au.company_id)
    const { data } = await q; setApps(data || [])
    const { data: js } = await supabase.from('job_descriptions').select('id, title')
    const m:any={}; (js||[]).forEach((j:any)=>m[j.id]=j.title); setJobs(m)
  }

  async function setStatus(a:any, status:string) {
    setBusy(a.id)
    try { await supabase.from('career_applications').update({ status }).eq('id', a.id)
      setApps(p=>p.map(x=>x.id===a.id?{...x,status}:x)) } catch(e){}
    setBusy('')
  }

  async function addToCandidates(a:any) {
    if (!confirm(`${a.name} ko Candidates mein add karein?`)) return
    setBusy(a.id)
    try {
      const payload:any = { name:a.name, mobile:String(a.mobile||'').replace(/\D/g,'').slice(0,15), email:a.email||null,
        source:'Careers Page', status:'New', segment:'experienced',
        company_id: me?.company_id||null, assigned_to: me?.id, created_by: me?.id, job_id: a.job_id||null }
      const { error } = await supabase.from('profiles').insert([payload])
      if (error) throw error
      await supabase.from('career_applications').update({ status:'converted' }).eq('id', a.id)
      setApps(p=>p.map(x=>x.id===a.id?{...x,status:'converted'}:x))
      alert('✓ Candidate add ho gaya (owner: tum).')
    } catch(e:any){ alert('Add nahi hua: '+(e.message||'error')+(/(duplicate|unique)/i.test(e.message||'')?' (mobile already exists)':'')) }
    setBusy('')
  }

  if (loading) return <div style={{padding:60,textAlign:'center',color:'var(--mu)'}}>Loading inbox…</div>

  const shown = filter==='all' ? apps : apps.filter(a=>(a.status||'new')===filter)
  const newCount = apps.filter(a=>(a.status||'new')==='new').length
  const SC:any = { new:{c:'#10b981',l:'🔵 New'}, reviewed:{c:'#F59E0B',l:'👀 Reviewed'}, converted:{c:'#3B82F6',l:'✓ Added'} }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap');.i-wrap{font-family:Outfit,system-ui,sans-serif}.i-card{background:var(--bg2);border:1px solid var(--bd);border-radius:14px;padding:16px}.ib{border:none;border-radius:8px;padding:7px 12px;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit}`}}/>
      <div className="i-wrap" style={{padding:'4px 2px 52px',maxWidth:1000}}>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase',letterSpacing:.5}}>Recruitment · Inbound</div>
          <h1 style={{fontFamily:'Sora,sans-serif',margin:'5px 0 0',fontSize:27,fontWeight:800,color:'var(--tx)'}}>📥 Careers Inbox {newCount>0&&<span style={{fontSize:13,color:'#fff',background:'#10b981',padding:'3px 11px',borderRadius:20,verticalAlign:'middle',marginLeft:8}}>{newCount} new</span>}</h1>
          <p style={{fontSize:13,color:'var(--mu)',margin:'6px 0 0'}}>Public Careers page se aaye applicants</p>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {['all','new','reviewed','converted'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className="ib" style={{background:filter===f?'#10b981':'var(--bg3)',color:filter===f?'#fff':'var(--mu)',textTransform:'capitalize'}}>{f}</button>
          ))}
        </div>

        {shown.length===0 ? (
          <div className="i-card" style={{textAlign:'center',padding:50,color:'var(--mu)'}}>
            <div style={{fontSize:36}}>📭</div>
            <div style={{fontWeight:600,marginTop:8}}>No applications {filter!=='all'?`(${filter})`:'yet'}</div>
            <div style={{fontSize:13,marginTop:4}}>Careers page link share karo → applicants yahan aayenge.</div>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {shown.map(a=>{
              const st=SC[a.status||'new']||SC.new
              const msg=`Hi ${a.name||''}, thanks for applying${jobs[a.job_id]?` for ${jobs[a.job_id]}`:''}. We'd like to connect regarding your application.`
              return (
                <div key={a.id} className="i-card">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,flexWrap:'wrap'}}>
                    <div style={{minWidth:200}}>
                      <div style={{fontWeight:700,fontSize:15}}>{a.name||'Applicant'} <span style={{fontSize:11,fontWeight:700,color:st.c,marginLeft:6}}>{st.l}</span></div>
                      <div style={{fontSize:12,color:'#10b981',fontWeight:600,marginTop:2}}>Applied for: {jobs[a.job_id]||'—'}</div>
                      <div style={{fontSize:12,color:'var(--mu)',marginTop:6}}>📱 {a.mobile||'—'}{a.email?`  ·  ✉️ ${a.email}`:''}</div>
                      {a.resume_url && <div style={{fontSize:12,marginTop:4}}><a href={a.resume_url} target="_blank" rel="noopener noreferrer" style={{color:'#10b981',fontWeight:600}}>🔗 Resume</a></div>}
                      {a.message && <div style={{fontSize:12,color:'var(--mu)',marginTop:6,fontStyle:'italic'}}>"{a.message}"</div>}
                      <div style={{fontSize:11,color:'var(--mu2)',marginTop:6}}>{a.created_at?new Date(a.created_at).toLocaleString('en-IN'):''}</div>
                    </div>
                    <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'flex-start'}}>
                      {a.mobile && <a href={WA(a.mobile,msg)} target="_blank" rel="noopener noreferrer" className="ib" style={{background:'#25D366',color:'#fff',textDecoration:'none'}}>💬 WA</a>}
                      {a.mobile && <a href={`tel:${a.mobile}`} className="ib" style={{background:'rgba(16,185,129,0.12)',color:'#10b981',textDecoration:'none'}}>📞 Call</a>}
                      {(a.status||'new')==='new' && <button onClick={()=>setStatus(a,'reviewed')} disabled={busy===a.id} className="ib" style={{background:'rgba(245,158,11,0.15)',color:'#F59E0B'}}>👀 Reviewed</button>}
                      {a.status!=='converted' && <button onClick={()=>addToCandidates(a)} disabled={busy===a.id} className="ib" style={{background:'#10b981',color:'#fff'}}>{busy===a.id?'…':'➕ Add to Candidates'}</button>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
