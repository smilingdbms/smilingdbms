import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import DashboardNav from '../../src/components/DashboardNav'

export default function CompanyDashboard() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      loadData(session.user)
    })
  }, [router])

  async function loadData(u: any) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)
    if (au?.company_id) {
      const { data: co } = await supabase.from('companies').select('*').eq('id', au.company_id).single()
      setCompany(co)
      setForm(co || {})
      const { data: mb } = await supabase.from('app_users').select('*').eq('company_id', au.company_id).order('points', { ascending: false })
      const { data: ps } = await supabase.from('profiles').select('*').eq('created_by', u.id)
      const { data: ds } = await supabase.from('bd_pipeline').select('*').eq('company_id', au.company_id)
      const { data: iv } = await supabase.from('interviews').select('*').eq('company_id', au.company_id)
      setMembers(mb || [])
      setProfiles(ps || [])
      setDeals(ds || [])
      setInterviews(iv || [])
    }
    setLoading(false)
  }

  async function saveCompany() {
    if (!company?.id) return
    setSaving(true)
    await supabase.from('companies').update({
      name: form.name, industry: form.industry, website: form.website,
      email: form.email, phone: form.phone, address: form.address,
      city: form.city, gst_number: form.gst_number, description: form.description
    }).eq('id', company.id)
    setSaving(false)
    setEditMode(false)
    loadData({ id: appUser.id })
  }

  async function updateMemberRole(userId: string, role: string) {
    await supabase.from('app_users').update({ role }).eq('id', userId)
    setMembers(prev => prev.map(m => m.id === userId ? { ...m, role } : m))
  }

  async function removeMember(userId: string) {
    if (!confirm('Remove this member from company?')) return
    await supabase.from('app_users').update({ company_id: null, status: 'inactive' }).eq('id', userId)
    setMembers(prev => prev.filter(m => m.id !== userId))
  }

  const ROLES = ['recruiter','sr_recruiter','team_leader','team_manager','bd_executive','bd_manager','account_owner']
  const ROLE_C: any = { recruiter:'#3dd68c', sr_recruiter:'#48cae4', team_leader:'#6c8cff', team_manager:'#c77dff', bd_executive:'#ff9f43', bd_manager:'#ffd60a', account_owner:'#ff6b6b' }

  const byStatus = profiles.reduce((a: any, p) => { a[p.status||'New']=(a[p.status||'New']||0)+1; return a }, {})
  const placed = byStatus['Placed'] || 0
  const wonRevenue = deals.filter(d=>d.stage==='Won').reduce((s,d)=>s+(d.deal_value||0),0)

  const PLAN_COLORS: any = { free:'#7a7f90', starter:'#3dd68c', professional:'#6c8cff', enterprise:'#ffd60a' }

  const S: any = {
    page: { minHeight:'100vh', background:'var(--bg)', color:'var(--tx)', fontFamily:'Outfit,sans-serif' },
    card: { background:'var(--bg2)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:20 },
    inp: { width:'100%', background:'var(--bg3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--tx)', outline:'none', marginBottom:10 },
    lbl: { fontSize:11, color:'var(--mu)', marginBottom:4, display:'block', fontWeight:600, textTransform:'uppercase' as any, letterSpacing:'0.8px' },
    tab: (a: boolean) => ({ padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', background:a?'rgba(108,140,255,0.15)':'transparent', color:a?'#6c8cff':'#7a7f90' }),
    btn: { background:'#6c8cff', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer' },
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',color:'var(--tx)'}}>Loading Company Dashboard...</div>

  if (!company) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',color:'var(--tx)',flexDirection:'column' as any,gap:16}}>
      <DashboardNav />
      <div style={{fontSize:40}}>🏢</div>
      <div style={{fontSize:18,fontWeight:600}}>No Company Found</div>
      <div style={{fontSize:13,color:'var(--mu)'}}>You are not linked to any company yet.</div>
      
    </div>
  )

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');*{box-sizing:border-box}select option{background:#22262f}`}</style>

      <nav style={{background:'var(--nb)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky' as any,top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer'}} onClick={()=>router.push('/dashboard')}>
          <div style={{width:30,height:30,borderRadius:8,background:'rgba(108,140,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'#6c8cff',fontSize:14}}>R</div>
          <div>
            <div style={{fontWeight:700,fontSize:15,lineHeight:1.2}}>RecruitBase Pro</div>
            <div style={{fontSize:9,color:'var(--mu2)',letterSpacing:'1.5px',textTransform:'uppercase'}}>Recruitment OS</div>
          </div>
          <span style={{fontSize:12,padding:'2px 10px',borderRadius:20,background:'rgba(255,214,10,0.1)',color:'#ffd60a'}}>🏢 Company</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          {!editMode
            ? <button onClick={()=>setEditMode(true)} style={{background:'rgba(108,140,255,0.15)',color:'#6c8cff',border:'none',borderRadius:7,padding:'7px 14px',fontSize:12,cursor:'pointer'}}>✏️ Edit Company</button>
            : <>
                <button onClick={()=>setEditMode(false)} style={{background:'rgba(255,255,255,0.06)',color:'var(--tx)',border:'none',borderRadius:7,padding:'7px 14px',fontSize:12,cursor:'pointer'}}>Cancel</button>
                <button onClick={saveCompany} disabled={saving} style={S.btn}>{saving?'Saving...':'Save Changes'}</button>
              </>
          }
          
        </div>
      </nav>

      <div style={{maxWidth:1300,margin:'0 auto',padding:'24px 20px'}}>

        {/* COMPANY HEADER */}
        <div style={{...S.card,marginBottom:20,display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap' as any}}>
          <div style={{width:60,height:60,borderRadius:12,background:'rgba(108,140,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:700,color:'#6c8cff',flexShrink:0}}>
            {company.name?.[0]?.toUpperCase()||'C'}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>{company.name}</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap' as any}}>
              {company.industry && <span style={{fontSize:12,color:'var(--mu)'}}>🏭 {company.industry}</span>}
              {company.city && <span style={{fontSize:12,color:'var(--mu)'}}>📍 {company.city}</span>}
              {company.website && <a href={company.website} target="_blank" rel="noreferrer" style={{fontSize:12,color:'#6c8cff'}}>🌐 Website</a>}
              <span style={{fontSize:11,background:`${PLAN_COLORS[company.subscription_plan]||'#7a7f90'}22`,color:PLAN_COLORS[company.subscription_plan]||'#7a7f90',padding:'2px 8px',borderRadius:6,fontWeight:600,textTransform:'capitalize' as any}}>
                {company.subscription_plan||'free'} Plan
              </span>
            </div>
            {company.description && <div style={{fontSize:12,color:'var(--mu2)',marginTop:6}}>{company.description}</div>}
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{fontSize:11,color:'var(--mu)',marginBottom:4}}>Company Code</div>
            <div style={{fontSize:18,fontWeight:700,color:'#ffd60a',letterSpacing:'2px'}}>{company.company_code}</div>
            <div style={{fontSize:10,color:'var(--mu2)',marginTop:2}}>Share with team to join</div>
          </div>
        </div>

        {/* TABS */}
        <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.04)',padding:4,borderRadius:10,marginBottom:20,width:'fit-content'}}>
          {[
            {id:'overview',label:'📊 Overview'},
            {id:'team',label:'👥 Team'},
            {id:'settings',label:'⚙️ Settings'},
          ].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={S.tab(activeTab===t.id)}>{t.label}</button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab==='overview' && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20}}>
              {[
                {l:'Team Members',v:members.length,c:'#6c8cff',icon:'👥'},
                {l:'Total Profiles',v:profiles.length,c:'#48cae4',icon:'🎯'},
                {l:'Placed',v:placed,c:'#3dd68c',icon:'🎉'},
                {l:'Active Deals',v:deals.filter(d=>!['Won','Lost'].includes(d.stage)).length,c:'#c77dff',icon:'💼'},
                {l:'Revenue Won',v:`₹${(wonRevenue/1000).toFixed(0)}K`,c:'#ffd60a',icon:'💰'},
                {l:'Interviews',v:interviews.length,c:'#ff9f43',icon:'📅'},
              ].map(s=>(
                <div key={s.l} style={{...S.card,textAlign:'center'}}>
                  <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                  <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:10,color:'var(--mu)',marginTop:3,textTransform:'uppercase',letterSpacing:'0.8px'}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              <div style={S.card}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>🏆 Team Leaderboard</div>
                {members.slice(0,8).map((m,i)=>(
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <div style={{width:26,height:26,borderRadius:'50%',background:i===0?'rgba(255,214,10,0.2)':'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:i===0?'#ffd60a':'#555'}}>{i+1}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500}}>{m.full_name}</div>
                      <span style={{fontSize:10,background:`${ROLE_C[m.role]||'#555'}22`,color:ROLE_C[m.role]||'#555',padding:'1px 6px',borderRadius:4}}>{m.role}</span>
                    </div>
                    <div style={{fontWeight:700,color:'#ffd60a',fontSize:13}}>{m.points||0} pts</div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Pipeline Status</div>
                {Object.entries(byStatus).sort((a:any,b:any)=>b[1]-a[1]).map(([st,cnt]:any)=>(
                  <div key={st} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:13}}>
                    <span style={{color:'#c8c8d8'}}>{st}</span>
                    <span style={{fontWeight:600,color:'#6c8cff'}}>{cnt}</span>
                  </div>
                ))}
                {!profiles.length && <div style={{color:'var(--mu2)',fontSize:13}}>No profiles yet</div>}
              </div>
            </div>
          </>
        )}

        {/* ── TEAM ── */}
        {activeTab==='team' && (
          <div style={S.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <span style={{fontSize:14,fontWeight:600}}>{members.length} Team Members</span>
              <div style={{fontSize:12,color:'var(--mu)'}}>Company Code: <span style={{color:'#ffd60a',fontWeight:700,letterSpacing:'1px'}}>{company.company_code}</span></div>
            </div>
            <div style={{overflowX:'auto' as any}}>
              <table style={{width:'100%',borderCollapse:'collapse' as any,fontSize:13}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                    {['Member','Email','Role','Points','Actions'].map(h=>(
                      <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,color:'var(--mu2)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map(m=>(
                    <tr key={m.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                      <td style={{padding:'10px 10px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:30,height:30,borderRadius:'50%',background:`${ROLE_C[m.role]||'#555'}22`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:ROLE_C[m.role]||'#555',fontSize:12}}>
                            {m.full_name?.[0]?.toUpperCase()||'?'}
                          </div>
                          <div>
                            <div style={{fontWeight:500}}>{m.full_name}</div>
                            {m.id===appUser?.id && <span style={{fontSize:10,color:'#3dd68c'}}>You</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'10px 10px',color:'var(--mu)',fontSize:12}}>{m.email}</td>
                      <td style={{padding:'10px 10px'}}>
                        {m.id===appUser?.id ? (
                          <span style={{fontSize:11,background:`${ROLE_C[m.role]||'#555'}22`,color:ROLE_C[m.role]||'#555',padding:'3px 8px',borderRadius:6,fontWeight:600}}>{m.role}</span>
                        ) : (
                          <select value={m.role} onChange={e=>updateMemberRole(m.id,e.target.value)}
                            style={{background:`${ROLE_C[m.role]||'#555'}22`,color:ROLE_C[m.role]||'#555',border:`1px solid ${ROLE_C[m.role]||'#555'}44`,borderRadius:6,padding:'4px 8px',fontSize:11,fontWeight:600,cursor:'pointer',outline:'none'}}>
                            {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                      </td>
                      <td style={{padding:'10px 10px',color:'#ffd60a',fontWeight:600}}>{m.points||0}</td>
                      <td style={{padding:'10px 10px'}}>
                        {m.id!==appUser?.id && (
                          <button onClick={()=>removeMember(m.id)} style={{background:'rgba(255,107,107,0.12)',color:'#ff6b6b',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,cursor:'pointer'}}>Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab==='settings' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <div style={S.card}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>Company Information</div>
              {[
                {lbl:'Company Name',key:'name',type:'text'},
                {lbl:'Industry',key:'industry',type:'text'},
                {lbl:'City',key:'city',type:'text'},
                {lbl:'Website',key:'website',type:'text'},
                {lbl:'Email',key:'email',type:'email'},
                {lbl:'Phone',key:'phone',type:'text'},
                {lbl:'GST Number',key:'gst_number',type:'text'},
              ].map(f=>(
                <div key={f.key}>
                  <label style={S.lbl}>{f.lbl}</label>
                  <input type={f.type} value={form[f.key]||''} onChange={e=>setForm((p:any)=>({...p,[f.key]:e.target.value}))} disabled={!editMode} style={{...S.inp,opacity:editMode?1:0.6}} />
                </div>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column' as any,gap:16}}>
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Description</div>
                <textarea rows={4} value={form.description||''} onChange={e=>setForm((p:any)=>({...p,description:e.target.value}))} disabled={!editMode} placeholder="About your company..." style={{...S.inp,resize:'vertical' as any,opacity:editMode?1:0.6}} />
              </div>
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Subscription</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  <span style={{fontSize:13,color:'var(--mu)'}}>Current Plan</span>
                  <span style={{fontSize:13,fontWeight:700,color:PLAN_COLORS[company.subscription_plan]||'#7a7f90',textTransform:'capitalize' as any}}>{company.subscription_plan||'Free'}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  <span style={{fontSize:13,color:'var(--mu)'}}>Company Code</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#ffd60a',letterSpacing:'1px'}}>{company.company_code}</span>
                </div>
                <div style={{marginTop:12}}>
                  <button onClick={()=>router.push('/dashboard')} style={{width:'100%',background:'rgba(108,140,255,0.15)',color:'#6c8cff',border:'1px solid rgba(108,140,255,0.3)',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                    Upgrade Plan (Coming Soon)
                  </button>
                </div>
              </div>
              {editMode && (
                <button onClick={saveCompany} disabled={saving} style={{...S.btn,width:'100%',padding:'12px'}}>
                  {saving?'Saving...':'💾 Save All Changes'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
