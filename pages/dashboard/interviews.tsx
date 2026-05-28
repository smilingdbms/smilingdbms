import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import Layout from '../../src/components/Layout'
import { applyTheme, getSavedTheme } from '../../src/components/theme'
import DashboardNav from '../../src/components/DashboardNav'

const STATUSES = ['Scheduled','Completed','Cancelled','No Show','Rescheduled']
const OUTCOMES = ['','Selected','Rejected','On Hold','No Show','Rescheduled']
const ROUNDS = ['HR Round','Technical Round 1','Technical Round 2','Managerial Round','Director Round','Final Round','Client Round']

const STATUS_COLORS: Record<string,{bg:string,color:string}> = {
  'Scheduled':   {bg:'rgba(30,90,200,0.2)',  color:'#7ab3ff'},
  'Completed':   {bg:'rgba(30,160,100,0.2)', color:'#3dd68c'},
  'Cancelled':   {bg:'rgba(200,50,50,0.2)',  color:'#ff6b6b'},
  'No Show':     {bg:'rgba(200,120,0,0.2)',  color:'#ffb347'},
  'Rescheduled': {bg:'rgba(150,80,255,0.2)', color:'#c77dff'},
}

const OUTCOME_COLORS: Record<string,{bg:string,color:string}> = {
  'Selected':    {bg:'rgba(30,160,100,0.2)', color:'#3dd68c'},
  'Rejected':    {bg:'rgba(200,50,50,0.2)',  color:'#ff6b6b'},
  'On Hold':     {bg:'rgba(80,80,100,0.2)',  color:'var(--mu)'},
  'No Show':     {bg:'rgba(200,120,0,0.2)',  color:'#ffb347'},
  'Rescheduled': {bg:'rgba(150,80,255,0.2)', color:'#c77dff'},
}

const EMPTY_FORM = {
  candidate_name:'', candidate_mobile:'', candidate_email:'',
  role:'', round:'HR Round', interview_date:'', interview_time:'',
  duration_minutes:'60', interviewer_name:'', meet_link:'',
  location:'', status:'Scheduled', outcome:'', feedback_notes:'',
  notes:'', profile_id:'', job_id:''
}

function fixMeetLink(url: string): string {
  if (!url || url.trim() === '') return ''
  const u = url.trim()
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  return 'https://' + u
}

export default function Interviews() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [appUser, setAppUser] = useState<any>(null)
  const [interviews, setInterviews] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState<any>(null)
  const [form, setForm] = useState<any>({...EMPTY_FORM})
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [search, setSearch] = useState('')
  const [newFeedback, setNewFeedback] = useState('')
  const [savingFeedback, setSavingFeedback] = useState(false)
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const sf = (k:string,v:any) => setForm((f:any)=>({...f,[k]:v}))

  useEffect(() => {
    applyTheme(getSavedTheme())
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      loadAll(session.user)
    })
  }, [])

  async function loadAll(u: any) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)

    // Load notifications count
    const { count } = await supabase.from('notifications')
      .select('*', {count:'exact',head:true})
      .eq('user_id', u.id).eq('is_read', false)
    setUnreadCount(count || 0)

    // Load interviews — RLS handles company isolation automatically
    const { data: iv, error } = await supabase
      .from('interviews')
      .select('*')
      .order('interview_date', {ascending: true})
    
    if (!error) setInterviews(iv || [])

    // Load profiles for dropdown (company isolated by RLS)
    const { data: ps } = await supabase
      .from('profiles')
      .select('id, name, mobile, role')
      .order('name')
    setProfiles(ps || [])

    setLoading(false)
  }

  async function loadFeedbacks(interviewId: string) {
    const { data } = await supabase
      .from('feedbacks')
      .select('*, app_users(full_name)')
      .eq('interview_id', interviewId)
      .order('created_at', {ascending: false})
    setFeedbacks(data || [])
  }

  async function saveInterview() {
    if (!form.candidate_name?.trim()) { alert('Candidate name is required'); return }
    if (!form.interview_date) { alert('Interview date is required'); return }
    setSaving(true)

    // Fix meet link — ensure full URL
    const cleanMeetLink = fixMeetLink(form.meet_link)

    const payload = {
      candidate_name:   form.candidate_name.trim(),
      candidate_mobile: form.candidate_mobile.trim(),
      candidate_email:  form.candidate_email.trim(),
      role:             form.role.trim(),
      round:            form.round || 'HR Round',
      interview_date:   form.interview_date,
      interview_time:   form.interview_time || null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : 60,
      interviewer_name: form.interviewer_name.trim(),
      meet_link:        cleanMeetLink,
      location:         form.location.trim(),
      status:           form.status || 'Scheduled',
      outcome:          form.outcome || '',
      feedback_notes:   form.feedback_notes.trim(),
      notes:            form.notes.trim(),
      profile_id:       form.profile_id || null,
      company_id:       appUser?.company_id || null,
      created_by:       user?.id,
    }

    if (showDetail?.id) {
      const { data, error } = await supabase
        .from('interviews')
        .update(payload)
        .eq('id', showDetail.id)
        .select().single()
      
      if (error) { alert('Update failed: ' + error.message); setSaving(false); return }
      if (data) {
        setInterviews(prev => prev.map(i => i.id === data.id ? data : i))
        setShowDetail(data)
      }
    } else {
      const { data, error } = await supabase
        .from('interviews')
        .insert(payload)
        .select().single()
      
      if (error) { alert('Save failed: ' + error.message); setSaving(false); return }
      if (data) {
        setInterviews(prev => [data, ...prev])
        setShowForm(false)
        setForm({...EMPTY_FORM})
      }
    }
    setSaving(false)
  }

  async function deleteInterview(id: string) {
    if (!confirm('Delete this interview?')) return
    await supabase.from('interviews').delete().eq('id', id)
    setInterviews(prev => prev.filter(i => i.id !== id))
    setShowDetail(null)
  }

  async function addFeedback() {
    if (!newFeedback.trim() || !showDetail?.id) return
    setSavingFeedback(true)
    const { data, error } = await supabase.from('feedbacks').insert({
      interview_id: showDetail.id,
      profile_id: showDetail.profile_id || null,
      text: newFeedback.trim(),
      created_by: user?.id,
      status: showDetail.status,
    }).select('*, app_users(full_name)').single()
    if (!error && data) {
      setFeedbacks(prev => [data, ...prev])
      setNewFeedback('')
    }
    setSavingFeedback(false)
  }

  function openDetail(iv: any) {
    setShowDetail(iv)
    setShowForm(false)
    setForm({...iv, interview_date: iv.interview_date?.split('T')[0] || ''})
    loadFeedbacks(iv.id)
  }

  // Filter logic
  const today = new Date().toDateString()
  const tomorrow = new Date(Date.now() + 86400000).toDateString()

  const filtered = interviews.filter(iv => {
    const q = search.toLowerCase()
    if (q && !['candidate_name','role','interviewer_name','round','location'].some(
      k => (iv[k]||'').toLowerCase().includes(q)
    )) return false
    if (filterStatus !== 'all' && iv.status !== filterStatus) return false
    if (filterDate === 'today' && new Date(iv.interview_date).toDateString() !== today) return false
    if (filterDate === 'tomorrow' && new Date(iv.interview_date).toDateString() !== tomorrow) return false
    if (filterDate === 'upcoming' && new Date(iv.interview_date) <= new Date()) return false
    if (filterDate === 'past' && new Date(iv.interview_date) > new Date()) return false
    return true
  })

  const counts = {
    today: interviews.filter(iv => new Date(iv.interview_date).toDateString() === today).length,
    tomorrow: interviews.filter(iv => new Date(iv.interview_date).toDateString() === tomorrow).length,
    upcoming: interviews.filter(iv => new Date(iv.interview_date) > new Date()).length,
    scheduled: interviews.filter(iv => iv.status === 'Scheduled').length,
    completed: interviews.filter(iv => iv.status === 'Completed').length,
    selected: interviews.filter(iv => iv.outcome === 'Selected').length,
  }

  const IS:any = {width:'100%',background:'var(--bg3)',border:'1px solid var(--bd2)',borderRadius:8,padding:'9px 12px',color:'var(--tx)',fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box' as const}
  const LS:any = {display:'block',fontSize:10,fontWeight:600,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:1,marginBottom:4,marginTop:12}

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      
      <div style={{width:36,height:36,border:'3px solid var(--ac)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .iv-row:hover{background:var(--bg3)!important;cursor:pointer;}
        input:focus,select:focus,textarea:focus{border-color:var(--ac)!important;outline:none;}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:4px}
      `}</style>

      {/* TOP BAR */}
      <div style={{background:'var(--bg2)',borderBottom:'1px solid var(--bd)',padding:'0 20px',height:54,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <span style={{fontSize:16}}>🗓</span>
        <div style={{fontWeight:700,fontSize:14}}>Interview Management</div>
        <div style={{flex:1,display:'flex',alignItems:'center',gap:8,background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:9,padding:'6px 14px',maxWidth:360,marginLeft:12}}>
          <span style={{color:'var(--mu)',fontSize:13}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search candidate, role, interviewer..."
            style={{background:'none',border:'none',outline:'none',color:'var(--tx)',fontSize:13,fontFamily:'inherit',width:'100%'}}/>
        </div>
        <div style={{marginLeft:'auto'}}>
          <button onClick={()=>{setShowForm(true);setShowDetail(null);setForm({...EMPTY_FORM})}}
            style={{background:'var(--ac)',color:'#fff',border:'none',borderRadius:8,padding:'7px 18px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            + Schedule Interview
          </button>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>

        {/* STAT CARDS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,marginBottom:16}}>
          {[
            {l:'Today',v:counts.today,c:'#ff9f43',click:()=>setFilterDate('today')},
            {l:'Tomorrow',v:counts.tomorrow,c:'#48cae4',click:()=>setFilterDate('tomorrow')},
            {l:'Upcoming',v:counts.upcoming,c:'#6c8cff',click:()=>setFilterDate('upcoming')},
            {l:'Scheduled',v:counts.scheduled,c:'#7ab3ff',click:()=>setFilterStatus('Scheduled')},
            {l:'Completed',v:counts.completed,c:'#3dd68c',click:()=>setFilterStatus('Completed')},
            {l:'Selected',v:counts.selected,c:'#ffd60a',click:()=>{}},
          ].map(s=>(
            <div key={s.l} onClick={s.click} style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:10,padding:'10px 12px',borderTop:`2px solid ${s.c}`,cursor:'pointer',textAlign:'center' as const,transition:'all .2s'}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=s.c)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--bd)')}>
              <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* FILTER BAR */}
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap' as const}}>
          <div style={{display:'flex',gap:4}}>
            {(['all','today','tomorrow','upcoming','past'] as const).map(d=>(
              <button key={d} onClick={()=>setFilterDate(d)}
                style={{padding:'5px 12px',borderRadius:20,border:'1px solid var(--bd)',background:filterDate===d?'var(--acbg)':'transparent',color:filterDate===d?'var(--ac)':'var(--mu)',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit',textTransform:'capitalize' as const}}>
                {d}
              </button>
            ))}
          </div>
          <div style={{width:1,background:'var(--bd)',margin:'0 4px'}}/>
          <div style={{display:'flex',gap:4}}>
            {(['all',...STATUSES] as const).map(s=>{
              const sc = STATUS_COLORS[s] || {bg:'transparent',color:'var(--mu)'}
              return (
                <button key={s} onClick={()=>setFilterStatus(s)}
                  style={{padding:'5px 12px',borderRadius:20,border:`1px solid ${filterStatus===s?sc.color:'var(--bd)'}`,background:filterStatus===s?sc.bg:'transparent',color:filterStatus===s?sc.color:'var(--mu)',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>
                  {s==='all'?'All Status':s}
                </button>
              )
            })}
          </div>
          {(filterStatus!=='all'||filterDate!=='all') && (
            <button onClick={()=>{setFilterStatus('all');setFilterDate('all')}}
              style={{marginLeft:'auto',padding:'5px 12px',borderRadius:20,border:'1px solid rgba(255,107,107,0.3)',color:'#ff6b6b',background:'transparent',cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>
              ✕ Clear
            </button>
          )}
          <div style={{marginLeft:filterStatus==='all'&&filterDate==='all'?'auto':'0',fontSize:12,color:'var(--mu)',alignSelf:'center'}}>
            {filtered.length} interviews
          </div>
        </div>

        {/* INTERVIEWS TABLE */}
        <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:14,overflow:'hidden',marginBottom:20}}>
          <div style={{overflowX:'auto' as const}}>
            <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:13}}>
              <thead>
                <tr style={{background:'var(--bg3)'}}>
                  {['Candidate','Role & Round','Date & Time','Interviewer','Meet Link','Status','Outcome','Actions'].map(h=>(
                    <th key={h} style={{textAlign:'left' as const,padding:'10px 14px',fontSize:10,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',whiteSpace:'nowrap' as const}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{textAlign:'center' as const,padding:48,color:'var(--mu)'}}>
                    <div style={{fontSize:28,marginBottom:8}}>🗓</div>
                    <div style={{fontWeight:600,marginBottom:4}}>No interviews found</div>
                    <div style={{fontSize:12}}>Schedule your first interview</div>
                  </td></tr>
                ) : filtered.map(iv => {
                  const sc = STATUS_COLORS[iv.status] || {bg:'transparent',color:'var(--mu)'}
                  const oc = OUTCOME_COLORS[iv.outcome] || null
                  const ivDate = iv.interview_date ? new Date(iv.interview_date) : null
                  const isToday = ivDate?.toDateString() === today
                  const isTomorrow = ivDate?.toDateString() === tomorrow
                  const cleanLink = fixMeetLink(iv.meet_link || '')
                  return (
                    <tr key={iv.id} className="iv-row"
                      style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}
                      onClick={()=>openDetail(iv)}>
                      <td style={{padding:'11px 14px'}}>
                        <div style={{fontWeight:600}}>{iv.candidate_name}</div>
                        {iv.candidate_mobile && <div style={{fontSize:11,color:'var(--mu)',marginTop:1}}>📱 {iv.candidate_mobile}</div>}
                        {iv.candidate_email && <div style={{fontSize:11,color:'var(--mu)'}}>✉ {iv.candidate_email}</div>}
                      </td>
                      <td style={{padding:'11px 14px'}}>
                        <div style={{fontWeight:500}}>{iv.role||'—'}</div>
                        <div style={{fontSize:11,color:'var(--ac)',marginTop:2}}>{iv.round||'—'}</div>
                      </td>
                      <td style={{padding:'11px 14px',whiteSpace:'nowrap' as const}}>
                        <div style={{fontWeight:600,color:isToday?'#ff9f43':isTomorrow?'#48cae4':'var(--tx)'}}>
                          {isToday?'Today':isTomorrow?'Tomorrow':ivDate?.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})||'—'}
                        </div>
                        <div style={{fontSize:11,color:'var(--mu)',marginTop:1}}>
                          {iv.interview_time||'—'} {iv.duration_minutes?`· ${iv.duration_minutes}min`:''}
                        </div>
                      </td>
                      <td style={{padding:'11px 14px',fontSize:12,color:'var(--mu)'}}>{iv.interviewer_name||'—'}</td>
                      <td style={{padding:'11px 14px'}} onClick={e=>e.stopPropagation()}>
                        {cleanLink ? (
                          <a href={cleanLink} target="_blank" rel="noopener noreferrer"
                            style={{color:'var(--ac)',fontSize:12,textDecoration:'none',display:'flex',alignItems:'center',gap:4}}
                            onClick={e=>e.stopPropagation()}>
                            🔗 Join
                          </a>
                        ) : (
                          <span style={{fontSize:11,color:'var(--mu)'}}>No link</span>
                        )}
                        {iv.location && <div style={{fontSize:10,color:'var(--mu)',marginTop:2}}>📍{iv.location}</div>}
                      </td>
                      <td style={{padding:'11px 14px'}}>
                        <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:sc.bg,color:sc.color,whiteSpace:'nowrap' as const}}>
                          {iv.status||'Scheduled'}
                        </span>
                      </td>
                      <td style={{padding:'11px 14px'}}>
                        {iv.outcome && oc ? (
                          <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:oc.bg,color:oc.color,whiteSpace:'nowrap' as const}}>
                            {iv.outcome}
                          </span>
                        ) : <span style={{fontSize:11,color:'var(--mu)'}}>—</span>}
                      </td>
                      <td style={{padding:'11px 14px'}} onClick={e=>e.stopPropagation()}>
                        <div style={{display:'flex',gap:4}}>
                          <button onClick={()=>openDetail(iv)}
                            style={{background:'var(--acbg)',border:'none',borderRadius:6,padding:'4px 10px',color:'var(--ac)',cursor:'pointer',fontSize:11,fontFamily:'inherit',fontWeight:600}}>
                            Edit
                          </button>
                          {cleanLink && (
                            <a href={cleanLink} target="_blank" rel="noopener noreferrer"
                              style={{background:'rgba(37,211,102,0.15)',border:'none',borderRadius:6,padding:'4px 10px',color:'#3dd68c',cursor:'pointer',fontSize:11,fontFamily:'inherit',fontWeight:600,textDecoration:'none',display:'flex',alignItems:'center'}}>
                              Join
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── ADD / EDIT INTERVIEW MODAL ─────────────────────────── */}
      {(showForm || showDetail) && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:100,padding:16,overflowY:'auto'}}
          onClick={e=>{if(e.target===e.currentTarget){setShowForm(false);setShowDetail(null)}}}>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:20,padding:24,width:'100%',maxWidth:720,marginTop:20,marginBottom:20,boxShadow:'0 24px 80px rgba(0,0,0,0.5)',animation:'fadeIn 0.2s ease'}}>

            {/* Header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:700}}>{showDetail?'Edit Interview':'Schedule Interview'}</div>
                {showDetail && <div style={{fontSize:11,color:'var(--mu)',marginTop:2}}>{showDetail.candidate_name} · {showDetail.round}</div>}
              </div>
              <div style={{display:'flex',gap:8}}>
                {showDetail && (
                  <button onClick={()=>deleteInterview(showDetail.id)}
                    style={{padding:'6px 12px',borderRadius:8,background:'rgba(255,107,107,0.1)',color:'#ff6b6b',border:'1px solid rgba(255,107,107,0.3)',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
                    🗑 Delete
                  </button>
                )}
                <button onClick={()=>{setShowForm(false);setShowDetail(null)}}
                  style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,width:32,height:32,cursor:'pointer',color:'var(--tx)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              </div>
            </div>

            {/* Form */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

              {/* Candidate Section */}
              <div style={{gridColumn:'1/-1',background:'var(--bg3)',borderRadius:10,padding:12,border:'1px solid var(--bd)'}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:10}}>Candidate Details</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                  <div>
                    <label style={LS}>Name *</label>
                    <input style={IS} value={form.candidate_name||''} onChange={e=>sf('candidate_name',e.target.value)} placeholder="Full name"/>
                  </div>
                  <div>
                    <label style={LS}>Mobile</label>
                    <input style={IS} value={form.candidate_mobile||''} onChange={e=>sf('candidate_mobile',e.target.value)} placeholder="Mobile number"/>
                  </div>
                  <div>
                    <label style={LS}>Email</label>
                    <input style={IS} type="email" value={form.candidate_email||''} onChange={e=>sf('candidate_email',e.target.value)} placeholder="Email"/>
                  </div>
                </div>
                {profiles.length > 0 && (
                  <div style={{marginTop:8}}>
                    <label style={LS}>Link to Existing Profile (Optional)</label>
                    <select style={IS} value={form.profile_id||''} onChange={e=>{
                      sf('profile_id',e.target.value)
                      const p = profiles.find(x=>x.id===e.target.value)
                      if(p){sf('candidate_name',p.name);sf('candidate_mobile',p.mobile||'');sf('role',p.role||'')}
                    }}>
                      <option value="">Select profile or fill manually</option>
                      {profiles.map(p=><option key={p.id} value={p.id}>{p.name} {p.role?`— ${p.role}`:''}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Interview Details */}
              <div>
                <label style={LS}>Role / Position</label>
                <input style={IS} value={form.role||''} onChange={e=>sf('role',e.target.value)} placeholder="e.g. Software Engineer"/>
              </div>
              <div>
                <label style={LS}>Interview Round</label>
                <select style={IS} value={form.round||'HR Round'} onChange={e=>sf('round',e.target.value)}>
                  {ROUNDS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={LS}>Date *</label>
                <input style={IS} type="date" value={form.interview_date||''} onChange={e=>sf('interview_date',e.target.value)}/>
              </div>
              <div>
                <label style={LS}>Time</label>
                <input style={IS} type="time" value={form.interview_time||''} onChange={e=>sf('interview_time',e.target.value)}/>
              </div>
              <div>
                <label style={LS}>Duration (minutes)</label>
                <select style={IS} value={form.duration_minutes||'60'} onChange={e=>sf('duration_minutes',e.target.value)}>
                  {['30','45','60','90','120'].map(d=><option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div>
                <label style={LS}>Interviewer Name</label>
                <input style={IS} value={form.interviewer_name||''} onChange={e=>sf('interviewer_name',e.target.value)} placeholder="Interviewer name"/>
              </div>

              {/* Meet Link — KEY FIX */}
              <div style={{gridColumn:'1/-1'}}>
                <label style={LS}>Google Meet / Zoom Link</label>
                <input style={IS} value={form.meet_link||''} 
                  onChange={e=>sf('meet_link',e.target.value)}
                  placeholder="meet.google.com/xxx or zoom.us/j/xxx (https:// added automatically)"/>
                {form.meet_link && (
                  <div style={{marginTop:6,display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:11,color:'var(--mu)'}}>Preview:</span>
                    <a href={fixMeetLink(form.meet_link)} target="_blank" rel="noopener noreferrer"
                      style={{fontSize:11,color:'var(--ac)',textDecoration:'none'}}>
                      🔗 {fixMeetLink(form.meet_link)}
                    </a>
                  </div>
                )}
              </div>

              <div style={{gridColumn:'1/-1'}}>
                <label style={LS}>Location (if in-person)</label>
                <input style={IS} value={form.location||''} onChange={e=>sf('location',e.target.value)} placeholder="Office address or location"/>
              </div>

              {/* Status & Outcome */}
              <div>
                <label style={LS}>Status</label>
                <select style={{...IS,background:STATUS_COLORS[form.status]?.bg,color:STATUS_COLORS[form.status]?.color,fontWeight:600}} value={form.status||'Scheduled'} onChange={e=>sf('status',e.target.value)}>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={LS}>Outcome (after interview)</label>
                <select style={{...IS,...(OUTCOME_COLORS[form.outcome]?{background:OUTCOME_COLORS[form.outcome].bg,color:OUTCOME_COLORS[form.outcome].color,fontWeight:600}:{})}} value={form.outcome||''} onChange={e=>sf('outcome',e.target.value)}>
                  {OUTCOMES.map(o=><option key={o} value={o}>{o||'— Not set —'}</option>)}
                </select>
              </div>

              <div style={{gridColumn:'1/-1'}}>
                <label style={LS}>Recruiter Notes</label>
                <textarea rows={2} style={{...IS,resize:'none' as const}} value={form.notes||''} onChange={e=>sf('notes',e.target.value)} placeholder="Internal notes about this interview..."/>
              </div>
            </div>

            {/* Feedback section — only for existing interviews */}
            {showDetail?.id && (
              <div style={{marginTop:16,background:'var(--bg3)',borderRadius:10,padding:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:10}}>Interview Feedback Log</div>
                <div style={{display:'flex',gap:8,marginBottom:10}}>
                  <textarea value={newFeedback} onChange={e=>setNewFeedback(e.target.value)}
                    placeholder="Add feedback or follow-up notes..." rows={2}
                    style={{...IS,flex:1,resize:'none' as const}}/>
                  <button onClick={addFeedback} disabled={savingFeedback||!newFeedback.trim()}
                    style={{padding:'8px 14px',borderRadius:8,background:'var(--ac)',color:'#fff',border:'none',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit',alignSelf:'flex-start',opacity:savingFeedback||!newFeedback.trim()?0.5:1}}>
                    {savingFeedback?'...':'Add'}
                  </button>
                </div>
                <div style={{maxHeight:200,overflowY:'auto' as const,display:'flex',flexDirection:'column' as const,gap:8}}>
                  {feedbacks.map(f=>(
                    <div key={f.id} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px',borderLeft:'2px solid var(--ac)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:11,fontWeight:600,color:'var(--ac)'}}>{f.app_users?.full_name||'Unknown'}</span>
                        <span style={{fontSize:10,color:'var(--mu)'}}>{new Date(f.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      <div style={{fontSize:12,color:'var(--tx)',lineHeight:1.5}}>{f.text}</div>
                    </div>
                  ))}
                  {feedbacks.length===0&&<div style={{fontSize:12,color:'var(--mu)',textAlign:'center' as const,padding:'12px 0'}}>No feedback yet</div>}
                </div>
              </div>
            )}

            {/* Save buttons */}
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20,paddingTop:16,borderTop:'1px solid var(--bd)'}}>
              <button onClick={()=>{setShowForm(false);setShowDetail(null)}}
                style={{padding:'9px 20px',borderRadius:10,background:'transparent',color:'var(--mu)',border:'1px solid var(--bd)',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>
                Cancel
              </button>
              <button onClick={saveInterview} disabled={saving}
                style={{padding:'9px 28px',borderRadius:10,background:'var(--ac)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:700,fontFamily:'inherit',opacity:saving?0.7:1}}>
                {saving?'Saving...':showDetail?'Save Changes':'Schedule Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
