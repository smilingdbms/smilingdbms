import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../src/lib/supabase'
import { applyTheme, getSavedTheme, THEME_LIST } from '../src/lib/theme'

const INDUSTRIES = ['All','IT / Software','BFSI / Banking','Healthcare','Manufacturing','Real Estate','E-commerce','Education','Consulting','Media','Pharma','Logistics','Legal','Hospitality','Telecom','Other']

export default function JobBoard() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('All')
  const [filterExp, setFilterExp] = useState('All')
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [appUser, setAppUser] = useState<any>(null)
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyForm, setApplyForm] = useState({ full_name:'', email:'', mobile:'', cover_letter:'' })
  const [applying, setApplying] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [showThemePicker, setShowThemePicker] = useState(false)

  useEffect(() => {
    const t = getSavedTheme(); setTheme(t); applyTheme(t)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) loadUser(s.user)
    })
    loadJobs()
  }, [])

  async function loadUser(u: any) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)
    setApplyForm(p => ({ ...p, full_name: au?.full_name||'', email: au?.email||'', mobile: au?.phone||'' }))
    const { data: apps } = await supabase.from('job_applications').select('job_id').eq('applicant_id', u.id)
    setApplied(new Set((apps||[]).map((a:any) => a.job_id)))
  }

  async function loadJobs() {
    const { data } = await supabase.from('job_descriptions').select('*').eq('status','Open').order('created_at',{ascending:false})
    const jobs = data || []
    setJobs(jobs)
    if (jobs.length > 0) setSelectedJob(jobs[0])
    setLoading(false)
  }

  async function submitApplication() {
    if (!applyForm.full_name || !applyForm.email) return
    if (!session) { router.push('/'); return }
    setApplying(true)
    const { error } = await supabase.from('job_applications').insert({
      job_id: selectedJob.id, applicant_id: session.user.id,
      full_name: applyForm.full_name, email: applyForm.email,
      mobile: applyForm.mobile, cover_letter: applyForm.cover_letter, status: 'Applied'
    })
    if (!error) {
      setApplied(prev => new Set([...prev, selectedJob.id]))
      setApplySuccess(true)
      setTimeout(() => { setShowApplyModal(false); setApplySuccess(false) }, 2000)
      if (selectedJob.created_by) {
        await supabase.from('notifications').insert({
          user_id: selectedJob.created_by, from_user_id: session.user.id,
          type: 'application', title: `New application for ${selectedJob.title}`,
          message: `${applyForm.full_name} applied for ${selectedJob.title}`, is_read: false
        }).catch(()=>{})
      }
    }
    setApplying(false)
  }

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchSearch = !search || j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) || j.skills?.toLowerCase().includes(q)
    const matchIndustry = filterIndustry === 'All' || j.industry === filterIndustry
    const matchExp = filterExp === 'All' || (
      filterExp === '0-1 years' ? j.experience_max <= 1 :
      filterExp === '1-3 years' ? j.experience_min >= 1 && j.experience_max <= 3 :
      filterExp === '3-5 years' ? j.experience_min >= 3 && j.experience_max <= 5 :
      filterExp === '5-8 years' ? j.experience_min >= 5 && j.experience_max <= 8 :
      filterExp === '8+ years' ? j.experience_min >= 8 : true
    )
    return matchSearch && matchIndustry && matchExp
  })

  const cur = THEME_LIST.find(t => t.id === theme) || THEME_LIST[1]
  const isApplied = selectedJob && applied.has(selectedJob.id)

  const daysAgo = (date: string) => {
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
    return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',color:'var(--tx)',fontFamily:'Outfit,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:12}}>🚀</div>
        <div style={{fontSize:16,fontWeight:600}}>Loading Jobs...</div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--tx)',fontFamily:'Outfit,sans-serif'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        select option{background:var(--bg3)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:4px}
        .job-card:hover{border-color:var(--ac)!important;background:var(--bg3)!important}
        .job-card.active{border-color:var(--ac)!important;background:var(--acbg)!important}
        @keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* TOP NAV */}
      <nav style={{background:'var(--nb)',borderBottom:'1px solid var(--nbr)',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 12px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>router.push('/')}>
            <div style={{width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,var(--ac),var(--acbg))',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:16,boxShadow:'0 4px 12px var(--acbg)'}}>R</div>
            <div>
              <div style={{fontWeight:800,fontSize:16,letterSpacing:'-0.5px'}}>RecruitBase <span style={{color:'var(--ac)'}}>Pro</span></div>
              <div style={{fontSize:9,color:'var(--mu)',letterSpacing:'2px',textTransform:'uppercase'}}>Job Board</div>
            </div>
          </div>
          <div style={{width:1,height:28,background:'var(--bd)',margin:'0 4px'}}/>
          <span style={{fontSize:12,background:'var(--gnbg)',color:'var(--gn)',padding:'4px 12px',borderRadius:20,fontWeight:600}}>🎯 {jobs.length} Live Jobs</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {session ? (
            <>
              <button onClick={()=>router.push('/jobseeker')} style={{background:'var(--acbg)',color:'var(--ac)',border:'1px solid var(--ac)',borderRadius:8,padding:'7px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>My Applications</button>
              {['super_admin','admin','account_owner','recruiter','sr_recruiter','team_manager','bd_manager'].includes(appUser?.role||'') && (
                <button onClick={()=>router.push('/dashboard')} style={{background:'var(--gnbg)',color:'var(--gn)',border:'1px solid var(--gn)',borderRadius:8,padding:'7px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Recruiter Panel</button>
              )}
              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--acbg)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'var(--ac)',fontSize:13}}>
                {appUser?.full_name?.[0]?.toUpperCase()||'U'}
              </div>
            </>
          ) : (
            <button onClick={()=>router.push('/')} style={{background:'var(--ac)',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Login / Sign Up →</button>
          )}
          {/* Theme */}
          <div style={{position:'relative'}}>
            <button onClick={()=>setShowThemePicker(v=>!v)} style={{width:32,height:32,borderRadius:8,background:'var(--bg2)',border:'1px solid var(--bd)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>
              {cur.emoji}
            </button>
            {showThemePicker && (
              <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:12,padding:8,zIndex:200,boxShadow:'0 8px 32px rgba(0,0,0,0.4)',minWidth:150}}>
                {THEME_LIST.map(t=>(
                  <div key={t.id} onClick={()=>{setTheme(t.id);applyTheme(t.id);localStorage.setItem('rbp_theme',t.id);setShowThemePicker(false)}}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:7,cursor:'pointer',background:theme===t.id?'var(--acbg)':'transparent'}}>
                    <span style={{width:12,height:12,borderRadius:'50%',background:t.color,display:'inline-block'}}/>
                    <span style={{fontSize:12,color:theme===t.id?'var(--ac)':'var(--tx)',fontWeight:theme===t.id?600:400}}>{t.emoji} {t.label}</span>
                    {theme===t.id&&<span style={{marginLeft:'auto',color:'var(--ac)',fontSize:11}}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* SEARCH HERO */}
      <div style={{background:'linear-gradient(135deg,var(--acbg) 0%,transparent 60%)',borderBottom:'1px solid var(--bd)',padding:'20px 24px'}}>
        <div style={{maxWidth:1400,margin:'0 auto'}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <div style={{flex:2,minWidth:240,position:'relative'}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:16}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Job title, company, skills, location..." style={{width:'100%',background:'var(--bg2)',border:'2px solid var(--bd)',borderRadius:10,padding:'11px 14px 11px 42px',fontSize:14,color:'var(--tx)',outline:'none',fontFamily:'Outfit,sans-serif',transition:'border-color .2s'}} onFocus={e=>e.target.style.borderColor='var(--ac)'} onBlur={e=>e.target.style.borderColor='var(--bd)'} />
            </div>
            <select value={filterIndustry} onChange={e=>setFilterIndustry(e.target.value)} style={{flex:1,minWidth:160,background:'var(--bg2)',border:'2px solid var(--bd)',borderRadius:10,padding:'11px 14px',fontSize:13,color:'var(--tx)',outline:'none',fontFamily:'Outfit,sans-serif'}}>
              {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
            </select>
            <select value={filterExp} onChange={e=>setFilterExp(e.target.value)} style={{flex:1,minWidth:140,background:'var(--bg2)',border:'2px solid var(--bd)',borderRadius:10,padding:'11px 14px',fontSize:13,color:'var(--tx)',outline:'none',fontFamily:'Outfit,sans-serif'}}>
              {['All','0-1 years','1-3 years','3-5 years','5-8 years','8+ years'].map(e=><option key={e}>{e}</option>)}
            </select>
          </div>
          <div style={{marginTop:10,fontSize:12,color:'var(--mu)'}}>
            Showing <strong style={{color:'var(--tx)'}}>{filtered.length}</strong> of <strong style={{color:'var(--tx)'}}>{jobs.length}</strong> jobs
            {search && <span> matching "<strong style={{color:'var(--ac)'}}>{search}</strong>"</span>}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - Split Layout */}
      <div style={{maxWidth:1400,margin:'0 auto',display:'grid',gridTemplateColumns:'420px 1fr',height:'calc(100vh - 136px)',overflow:'hidden'}}>

        {/* LEFT — Job List */}
        <div style={{borderRight:'1px solid var(--bd)',overflowY:'auto',background:'var(--bg)'}}>
          {filtered.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',color:'var(--mu)'}}>
              <div style={{fontSize:40,marginBottom:12}}>🔍</div>
              <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>No jobs found</div>
              <div style={{fontSize:13}}>Try different keywords or clear filters</div>
            </div>
          ) : filtered.map(job => (
            <div key={job.id} className={`job-card${selectedJob?.id===job.id?' active':''}`}
              onClick={()=>setSelectedJob(job)}
              style={{padding:'16px 20px',borderBottom:'1px solid var(--bd)',cursor:'pointer',background:selectedJob?.id===job.id?'var(--acbg)':'transparent',borderLeft:`3px solid ${selectedJob?.id===job.id?'var(--ac)':'transparent'}`,transition:'all .15s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--tx)',marginBottom:3,lineHeight:1.3}}>{job.title}</div>
                  <div style={{fontSize:12,color:'var(--ac)',fontWeight:600}}>{job.company}</div>
                </div>
                {applied.has(job.id) && (
                  <span style={{fontSize:9,background:'var(--gnbg)',color:'var(--gn)',padding:'2px 7px',borderRadius:20,fontWeight:700,flexShrink:0,marginLeft:8}}>✅ APPLIED</span>
                )}
              </div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:8}}>
                {job.location && <span style={{fontSize:11,color:'var(--mu)',display:'flex',alignItems:'center',gap:3}}>📍 {job.location}</span>}
                {job.experience_min!==undefined && <span style={{fontSize:11,color:'var(--mu)'}}>⏳ {job.experience_min}-{job.experience_max} yrs</span>}
                {job.openings && <span style={{fontSize:11,color:'var(--mu)'}}>👥 {job.openings} opening{job.openings>1?'s':''}</span>}
              </div>
              {job.skills && (
                <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
                  {job.skills.split(',').slice(0,3).map((s:string)=>(
                    <span key={s} style={{fontSize:10,background:'var(--bg3)',color:'var(--mu)',padding:'2px 7px',borderRadius:20,border:'1px solid var(--bd)'}}>{s.trim()}</span>
                  ))}
                  {job.skills.split(',').length > 3 && <span style={{fontSize:10,color:'var(--mu)'}}>+{job.skills.split(',').length-3} more</span>}
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:10,color:'var(--mu2)'}}>{daysAgo(job.created_at)}</span>
                {job.industry && <span style={{fontSize:10,background:'var(--acbg)',color:'var(--ac)',padding:'2px 7px',borderRadius:20}}>{job.industry}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — Job Detail */}
        <div style={{overflowY:'auto',background:'var(--bg2)'}}>
          {!selectedJob ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flexDirection:'column',gap:12,color:'var(--mu)'}}>
              <div style={{fontSize:48}}>👆</div>
              <div style={{fontSize:16,fontWeight:600}}>Select a job to view details</div>
            </div>
          ) : (
            <div style={{padding:'28px 32px',animation:'slideIn 0.2s ease'}}>
              {/* Header */}
              <div style={{marginBottom:24}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,marginBottom:16}}>
                  <div style={{flex:1}}>
                    <h1 style={{fontSize:24,fontWeight:800,letterSpacing:'-0.5px',marginBottom:6,lineHeight:1.2}}>{selectedJob.title}</h1>
                    <div style={{fontSize:16,color:'var(--ac)',fontWeight:700,marginBottom:8}}>{selectedJob.company}</div>
                    <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                      {selectedJob.location && <span style={{fontSize:13,color:'var(--mu)',display:'flex',alignItems:'center',gap:4}}>📍 {selectedJob.location}</span>}
                      {selectedJob.industry && <span style={{fontSize:13,color:'var(--mu)',display:'flex',alignItems:'center',gap:4}}>🏭 {selectedJob.industry}</span>}
                      <span style={{fontSize:13,color:'var(--mu)'}}>🕐 {daysAgo(selectedJob.created_at)}</span>
                    </div>
                  </div>
                  <div style={{flexShrink:0,textAlign:'center',background:'var(--acbg)',borderRadius:12,padding:'12px 16px'}}>
                    <div style={{fontSize:22,fontWeight:800,color:'var(--ac)'}}>{selectedJob.openings||1}</div>
                    <div style={{fontSize:10,color:'var(--mu)',marginTop:2}}>Opening{selectedJob.openings>1?'s':''}</div>
                  </div>
                </div>

                {/* Apply Button */}
                {isApplied ? (
                  <div style={{display:'flex',alignItems:'center',gap:10,background:'var(--gnbg)',border:'1px solid var(--gn)',borderRadius:12,padding:'14px 20px'}}>
                    <span style={{fontSize:20}}>✅</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:'var(--gn)'}}>Application Submitted!</div>
                      <div style={{fontSize:12,color:'var(--mu)',marginTop:2}}>You have already applied for this position</div>
                    </div>
                  </div>
                ) : (
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>session?setShowApplyModal(true):router.push('/')}
                      style={{flex:1,background:'var(--ac)',color:'#fff',border:'none',borderRadius:10,padding:'14px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 16px var(--acbg)',transition:'all .2s'}}
                      onMouseEnter={e=>e.currentTarget.style.opacity='0.9'}
                      onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                      {session ? '🚀 Apply Now' : '🔐 Login to Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Info Cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:24}}>
                {[
                  {icon:'⏳',label:'Experience',value:`${selectedJob.experience_min||0}-${selectedJob.experience_max||0} Years`},
                  {icon:'🎓',label:'Qualification',value:selectedJob.qualification||'Any'},
                  {icon:'👥',label:'Openings',value:`${selectedJob.openings||1} Position${selectedJob.openings>1?'s':''}`},
                  {icon:'📋',label:'Status',value:selectedJob.status||'Open'},
                ].map(info=>(
                  <div key={info.label} style={{background:'var(--bg3)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--bd)'}}>
                    <div style={{fontSize:18,marginBottom:4}}>{info.icon}</div>
                    <div style={{fontSize:10,color:'var(--mu)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:3}}>{info.label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--tx)'}}>{info.value}</div>
                  </div>
                ))}
              </div>

              {/* Skills */}
              {selectedJob.skills && (
                <div style={{marginBottom:24}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                    <span>🛠️</span> Required Skills
                  </div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {selectedJob.skills.split(',').map((s:string)=>(
                      <span key={s} style={{fontSize:12,background:'var(--acbg)',color:'var(--ac)',padding:'6px 14px',borderRadius:20,border:'1px solid var(--ac)',fontWeight:500}}>{s.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedJob.description && (
                <div style={{marginBottom:24}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                    <span>📄</span> Job Description
                  </div>
                  <div style={{background:'var(--bg3)',borderRadius:12,padding:'20px',border:'1px solid var(--bd)',fontSize:13,color:'var(--tx)',lineHeight:1.8,whiteSpace:'pre-wrap'}}>
                    {selectedJob.description}
                  </div>
                </div>
              )}

              {/* About Company */}
              <div style={{background:'linear-gradient(135deg,var(--acbg),var(--bg3))',borderRadius:12,padding:'20px',border:'1px solid var(--bd)',marginBottom:24}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>🏢 About {selectedJob.company}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {selectedJob.location && <div><span style={{fontSize:11,color:'var(--mu)'}}>📍 Location</span><div style={{fontSize:13,fontWeight:500,marginTop:2}}>{selectedJob.location}</div></div>}
                  {selectedJob.industry && <div><span style={{fontSize:11,color:'var(--mu)'}}>🏭 Industry</span><div style={{fontSize:13,fontWeight:500,marginTop:2}}>{selectedJob.industry}</div></div>}
                </div>
              </div>

              {/* Bottom Apply */}
              {!isApplied && (
                <button onClick={()=>session?setShowApplyModal(true):router.push('/')}
                  style={{width:'100%',background:'var(--ac)',color:'#fff',border:'none',borderRadius:10,padding:'16px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit',marginBottom:32}}>
                  {session ? '🚀 Apply for this Job' : '🔐 Login to Apply'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* APPLY MODAL */}
      {showApplyModal && selectedJob && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:20,padding:32,width:'100%',maxWidth:520,animation:'fadeUp 0.2s ease'}}>
            {applySuccess ? (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:52,marginBottom:12}}>🎉</div>
                <div style={{fontSize:20,fontWeight:800,color:'var(--gn)',marginBottom:8}}>Application Submitted!</div>
                <div style={{fontSize:13,color:'var(--mu)'}}>Good luck with your application for <strong>{selectedJob.title}</strong></div>
              </div>
            ) : (
              <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>Apply for {selectedJob.title}</div>
                    <div style={{fontSize:13,color:'var(--ac)',fontWeight:600}}>{selectedJob.company}</div>
                  </div>
                  <button onClick={()=>setShowApplyModal(false)} style={{background:'var(--bg3)',border:'none',color:'var(--mu)',fontSize:16,cursor:'pointer',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={{fontSize:11,color:'var(--mu)',marginBottom:4,display:'block',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Full Name *</label>
                    <input value={applyForm.full_name} onChange={e=>setApplyForm(p=>({...p,full_name:e.target.value}))} placeholder="Your full name" style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,padding:'10px 12px',fontSize:13,color:'var(--tx)',outline:'none',fontFamily:'inherit',marginBottom:10}} />
                  </div>
                  <div>
                    <label style={{fontSize:11,color:'var(--mu)',marginBottom:4,display:'block',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Email *</label>
                    <input type="email" value={applyForm.email} onChange={e=>setApplyForm(p=>({...p,email:e.target.value}))} placeholder="your@email.com" style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,padding:'10px 12px',fontSize:13,color:'var(--tx)',outline:'none',fontFamily:'inherit',marginBottom:10}} />
                  </div>
                  <div>
                    <label style={{fontSize:11,color:'var(--mu)',marginBottom:4,display:'block',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Mobile</label>
                    <input value={applyForm.mobile} onChange={e=>setApplyForm(p=>({...p,mobile:e.target.value}))} placeholder="+91 98765 43210" style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,padding:'10px 12px',fontSize:13,color:'var(--tx)',outline:'none',fontFamily:'inherit',marginBottom:10}} />
                  </div>
                </div>
                <label style={{fontSize:11,color:'var(--mu)',marginBottom:4,display:'block',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Cover Letter</label>
                <textarea rows={4} value={applyForm.cover_letter} onChange={e=>setApplyForm(p=>({...p,cover_letter:e.target.value}))} placeholder="Tell us why you're perfect for this role..." style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,padding:'10px 12px',fontSize:13,color:'var(--tx)',outline:'none',fontFamily:'inherit',resize:'vertical',lineHeight:1.6,marginBottom:16}} />
                <div style={{display:'flex',gap:10}}>
                  <button onClick={()=>setShowApplyModal(false)} style={{flex:1,background:'var(--bg3)',color:'var(--tx)',border:'none',borderRadius:10,padding:'12px',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
                  <button onClick={submitApplication} disabled={applying||!applyForm.full_name||!applyForm.email}
                    style={{flex:2,background:applying?'var(--bg3)':'var(--ac)',color:applying?'var(--mu)':'#fff',border:'none',borderRadius:10,padding:'12px',fontSize:14,fontWeight:700,cursor:applying?'not-allowed':'pointer',fontFamily:'inherit',transition:'all .2s'}}>
                    {applying ? '⏳ Submitting...' : '🚀 Submit Application'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
