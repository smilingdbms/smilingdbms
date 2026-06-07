// @ts-nocheck
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ════════════════════════════════════════════════════════════════════════
//  PUBLIC CAREERS PAGE  —  /careers/[company]
//  No login. Shows a company's PUBLIC open jobs + Apply form.
//  Applications go straight into career_applications (anon insert allowed).
//  100% free inbound channel.
// ════════════════════════════════════════════════════════════════════════

export default function Careers() {
  const router = useRouter()
  const { company } = router.query
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [applyJob, setApplyJob] = useState(null)
  const [form, setForm] = useState({ name:'', mobile:'', email:'', resume_url:'', message:'' })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!router.isReady || !company) return
    ;(async () => {
      const { data } = await supabase.from('job_descriptions')
        .select('*').eq('company_id', company).eq('is_public', true)
        .order('created_at', { ascending: false })
      const open = (data || []).filter(j => !j.status || /open/i.test(j.status))
      setJobs(open)
      setCompanyName(open[0]?.company_name || open[0]?.company || 'Open Positions')
      setLoading(false)
    })()
  }, [router.isReady, company])

  async function submit() {
    if (!form.name.trim() || !form.mobile.trim()) { alert('Naam aur mobile zaroori hai.'); return }
    setSending(true)
    try {
      const { error } = await supabase.from('career_applications').insert([{
        company_id: company, job_id: applyJob?.id || null,
        name: form.name.trim(), mobile: form.mobile.trim(), email: form.email.trim() || null,
        resume_url: form.resume_url.trim() || null, message: form.message.trim() || null,
      }])
      if (error) throw error
      setDone(true)
    } catch(e) { alert('Submit nahi hua: ' + (e.message || 'try again')) }
    setSending(false)
  }

  const IN = { width:'100%', padding:'11px 13px', borderRadius:10, border:'1px solid #d8dde3', fontSize:14, fontFamily:'inherit', boxSizing:'border-box', outline:'none' }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#f6f8f7,#eef2f0)', fontFamily:'Outfit,system-ui,sans-serif', color:'#16201b' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Sora:wght@700;800&display=swap');
        @keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}} />
      {/* header */}
      <div style={{ background:'linear-gradient(135deg,#059669,#10b981)', color:'#fff', padding:'44px 20px 40px', textAlign:'center' }}>
        <div style={{ fontSize:12, fontWeight:700, letterSpacing:2, opacity:.85, textTransform:'uppercase' }}>Careers</div>
        <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:32, fontWeight:800, margin:'8px 0 4px' }}>{companyName}</h1>
        <p style={{ fontSize:14, opacity:.9, margin:0 }}>Open positions — apply in 30 seconds</p>
      </div>

      <div style={{ maxWidth:820, margin:'0 auto', padding:'28px 16px 60px' }}>
        {loading ? <div style={{ textAlign:'center', padding:60, color:'#789' }}>Loading openings…</div>
        : jobs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1px solid #e6ebe8' }}>
            <div style={{ fontSize:40 }}>📭</div>
            <div style={{ fontWeight:700, marginTop:10 }}>No open positions right now</div>
            <div style={{ fontSize:13, color:'#789', marginTop:4 }}>Please check back soon.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {jobs.map((j,i) => (
              <div key={j.id} style={{ background:'#fff', border:'1px solid #e6ebe8', borderRadius:16, padding:'20px 22px', animation:'up .4s ease both', animationDelay:`${i*.05}s` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
                  <div>
                    <div style={{ fontSize:18, fontWeight:800, fontFamily:'Sora,sans-serif' }}>{j.title}</div>
                    <div style={{ fontSize:13, color:'#5a6b62', marginTop:4 }}>
                      📍 {[j.city, j.location].filter(Boolean).join(', ') || 'Location flexible'}
                      {(j.experience_min||j.experience_max) ? `  ·  ${j.experience_min||'0'}-${j.experience_max||'+'} yrs` : ''}
                    </div>
                  </div>
                  <button onClick={()=>{ setApplyJob(j); setDone(false); setForm({name:'',mobile:'',email:'',resume_url:'',message:''}) }} style={{ background:'#10b981', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>Apply →</button>
                </div>
                {j.skills && <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:12 }}>{String(j.skills).split(/[,;]/).slice(0,8).map((s,k)=> s.trim() && <span key={k} style={{ fontSize:11, fontWeight:600, color:'#0f7a5a', background:'#e7f5ef', padding:'3px 10px', borderRadius:20 }}>{s.trim()}</span>)}</div>}
                {j.qualification && <div style={{ fontSize:12.5, color:'#5a6b62', marginTop:10 }}>🎓 {j.qualification}</div>}
                {j.description && <div style={{ fontSize:13, color:'#3f4a44', marginTop:10, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{String(j.description).slice(0,320)}{String(j.description).length>320?'…':''}</div>}
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign:'center', fontSize:11, color:'#9aa8a1', marginTop:30 }}>Powered by RecruitBase Pro</div>
      </div>

      {/* apply modal */}
      {applyJob && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:100 }} onClick={e=>{ if(e.target===e.currentTarget) setApplyJob(null) }}>
          <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:460, padding:24, maxHeight:'90vh', overflowY:'auto' }}>
            {done ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:46 }}>✅</div>
                <div style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:800, marginTop:8 }}>Application received!</div>
                <div style={{ fontSize:13.5, color:'#5a6b62', marginTop:6 }}>Thanks {form.name}. Our team will reach out if shortlisted.</div>
                <button onClick={()=>setApplyJob(null)} style={{ marginTop:18, background:'#10b981', color:'#fff', border:'none', borderRadius:10, padding:'10px 24px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ fontFamily:'Sora,sans-serif', fontSize:18, fontWeight:800 }}>Apply — {applyJob.title}</div>
                <div style={{ fontSize:12.5, color:'#789', marginBottom:16 }}>{companyName}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
                  <input style={IN} placeholder="Full name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                  <input style={IN} placeholder="Mobile (WhatsApp) *" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})} />
                  <input style={IN} placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
                  <input style={IN} placeholder="Resume link (Google Drive / LinkedIn)" value={form.resume_url} onChange={e=>setForm({...form,resume_url:e.target.value})} />
                  <textarea style={{...IN, resize:'none'}} rows={3} placeholder="Short message (optional)" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} />
                  <div style={{ display:'flex', gap:10, marginTop:4 }}>
                    <button onClick={()=>setApplyJob(null)} style={{ flex:'0 0 auto', background:'#f1f4f2', color:'#5a6b62', border:'none', borderRadius:10, padding:'11px 18px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                    <button onClick={submit} disabled={sending} style={{ flex:1, background:'#10b981', color:'#fff', border:'none', borderRadius:10, padding:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity:sending?.7:1 }}>{sending?'Submitting…':'Submit Application'}</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
