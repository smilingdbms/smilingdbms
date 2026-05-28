import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

const STAKEHOLDER_TYPES = ['Client','Vendor','Partner','Consultant','Investor','Government','Media','Other']
const STATUSES = ['Active','Inactive','Prospect','Blacklisted']
const INDUSTRIES = ['IT / Software','BFSI / Banking','Healthcare','Manufacturing','Real Estate','E-commerce','Education','Consulting','Media','Pharma','Logistics','Legal','Hospitality','Telecom','Automobile','Other']
const ALLOWED_ROLES = ['super_admin','platform_manager','operations_manager','support_manager','admin','account_owner','team_manager']

const TYPE_COLORS: any = {
  'Client':'#3dd68c','Vendor':'#48cae4','Partner':'#c77dff','Consultant':'#ff9f43',
  'Investor':'#ffd60a','Government':'#6c8cff','Media':'#ff6b6b','Other':'var(--mu)'
}
const STATUS_COLORS: any = {
  'Active':'#3dd68c','Inactive':'var(--mu)','Prospect':'#ffb347','Blacklisted':'#ff6b6b'
}

export default function Stakeholders() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [stakeholders, setStakeholders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [saving, setSaving] = useState(false)
  const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({
    name:'', email:'', mobile:'', country_code:'+91',
    type:'Client', organization:'', designation:'', industry:'',
    city:'', linkedin:'', notes:'', status:'Active', assigned_to:''
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      loadData(session.user)
    })
  }, [router])

  async function loadData(u: any) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)
    if (!ALLOWED_ROLES.includes(au?.role)) {
      router.push('/dashboard')
      return
    }
    const { data: sh } = await supabase.from('stakeholders').select('*, assigned_user:app_users!stakeholders_assigned_to_fkey(full_name)').order('created_at', { ascending: false })
    const { data: us } = await supabase.from('app_users').select('id,full_name,role').order('full_name')
    setStakeholders(sh || [])
    setUsers(us || [])
    setLoading(false)
  }

  function openAdd() {
    setEditItem(null)
    setForm({ name:'', email:'', mobile:'', country_code:'+91', type:'Client', organization:'', designation:'', industry:'', city:'', linkedin:'', notes:'', status:'Active', assigned_to:'' })
    setShowModal(true)
  }

  function openEdit(s: any) {
    setEditItem(s)
    setForm({
      name:s.name||'', email:s.email||'', mobile:s.mobile||'',
      country_code:s.country_code||'+91', type:s.type||'Client',
      organization:s.organization||'', designation:s.designation||'',
      industry:s.industry||'', city:s.city||'', linkedin:s.linkedin||'',
      notes:s.notes||'', status:s.status||'Active', assigned_to:s.assigned_to||''
    })
    setShowModal(true)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      ...form, assigned_to: form.assigned_to || null,
      company_id: appUser?.company_id || null,
      created_by: appUser?.id
    }
    if (editItem) {
      await supabase.from('stakeholders').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('stakeholders').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    loadData({ id: appUser.id })
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this stakeholder?')) return
    await supabase.from('stakeholders').delete().eq('id', id)
    setStakeholders(prev => prev.filter(s => s.id !== id))
  }

  async function revealContact(id: string) {
    setRevealedContacts(prev => new Set([...prev, id]))
    await supabase.from('contact_views').insert({ profile_id: id, viewed_by: appUser?.id }).catch(()=>{})
  }

  function maskMobile(mobile: string) {
    if (!mobile) return '—'
    const clean = mobile.replace(/\D/g, '')
    if (clean.length < 6) return mobile
    return clean.slice(0, 2) + 'xxxxxx' + clean.slice(-2)
  }

  function maskEmail(email: string) {
    if (!email) return '—'
    const [user, domain] = email.split('@')
    if (!domain) return email
    return user.slice(0, 2) + '****@' + domain
  }

  const filtered = stakeholders.filter(s => {
    const matchType = filterType === 'All' || s.type === filterType
    const matchStatus = filterStatus === 'All' || s.status === filterStatus
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.organization?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchStatus && matchSearch
  })

  const S: any = {
    page: { minHeight:'100vh', background:'var(--bg)', color:'var(--tx)', fontFamily:'Outfit,sans-serif' },
    card: { background:'var(--bg2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20 },
    btn: { background:'#6c8cff', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer' },
    inp: { width:'100%', background:'var(--bg3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--tx)', outline:'none', marginBottom:10 },
    lbl: { fontSize:11, color:'var(--mu)', marginBottom:4, display:'block', fontWeight:600, textTransform:'uppercase' as any, letterSpacing:'0.8px' },
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',color:'var(--tx)'}}>Loading Stakeholders...</div>

  return (
    <>
    <div style={S.page}>
      
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');*{box-sizing:border-box}select option{background:var(--bg3)}`}</style>

      <nav style={{background:'var(--nb)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky' as any,top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer'}} onClick={()=>router.push('/dashboard')}>
          <div style={{width:30,height:30,borderRadius:8,background:'rgba(108,140,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'#6c8cff',fontSize:14}}>R</div>
          <div>
            <div style={{fontWeight:700,fontSize:15,lineHeight:1.2}}>RecruitBase Pro</div>
            <div style={{fontSize:9,color:'var(--mu2)',letterSpacing:'1.5px',textTransform:'uppercase'}}>Recruitment OS</div>
          </div>
          <span style={{fontSize:12,padding:'2px 10px',borderRadius:20,background:'rgba(255,214,10,0.1)',color:'#ffd60a'}}>🤝 Stakeholders</span>
          <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,background:'rgba(255,107,107,0.1)',color:'#ff6b6b',fontWeight:600}}>🔒 Admin Only</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          
          <button onClick={openAdd} style={S.btn}>+ Add Stakeholder</button>
        </div>
      </nav>

      <div style={{maxWidth:1300,margin:'0 auto',padding:'24px 20px'}}>

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20}}>
          {[
            {l:'Total',v:stakeholders.length,c:'#6c8cff',icon:'🤝'},
            ...STAKEHOLDER_TYPES.slice(0,4).map(t=>({
              l:t, v:stakeholders.filter(s=>s.type===t).length,
              c:TYPE_COLORS[t], icon:'📋'
            })),
            {l:'Active',v:stakeholders.filter(s=>s.status==='Active').length,c:'#3dd68c',icon:'✅'},
          ].map(s=>(
            <div key={s.l} style={{...S.card,textAlign:'center'}}>
              <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:20,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,color:'var(--mu)',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' as any}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search name, org, email..." style={{...S.inp,marginBottom:0,flex:1,minWidth:200}} />
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{...S.inp,marginBottom:0,width:'auto'}}>
            <option value="All">All Types</option>
            {STAKEHOLDER_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...S.inp,marginBottom:0,width:'auto'}}>
            <option value="All">All Status</option>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>

        {/* TABLE */}
        <div style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:600}}>{filtered.length} Stakeholders</span>
            <span style={{fontSize:11,color:'var(--mu2)'}}>🔒 Visible to Admin & above only</span>
          </div>
          {filtered.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px 0',color:'var(--mu2)'}}>
              <div style={{fontSize:32,marginBottom:8}}>🤝</div>
              <div style={{fontSize:14}}>No stakeholders yet. Add your first one!</div>
            </div>
          ) : (
            <div style={{overflowX:'auto' as any}}>
              <table style={{width:'100%',borderCollapse:'collapse' as any,fontSize:13}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                    {['Name','Type','Organization','Contact','Industry','City','Status','Assigned','Actions'].map(h=>(
                      <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,color:'var(--mu2)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const revealed = revealedContacts.has(s.id)
                    return (
                      <tr key={s.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                        <td style={{padding:'10px 10px'}}>
                          <div style={{fontWeight:600}}>{s.name}</div>
                          {s.designation && <div style={{fontSize:11,color:'var(--mu2)'}}>{s.designation}</div>}
                        </td>
                        <td style={{padding:'10px 10px'}}>
                          <span style={{fontSize:11,background:`${TYPE_COLORS[s.type]||'var(--mu)'}22`,color:TYPE_COLORS[s.type]||'var(--mu)',padding:'2px 8px',borderRadius:6,fontWeight:600}}>{s.type}</span>
                        </td>
                        <td style={{padding:'10px 10px',color:'var(--mu)'}}>{s.organization||'—'}</td>
                        <td style={{padding:'10px 10px'}}>
                          {revealed ? (
                            <div>
                              {s.mobile && <div style={{fontSize:12,color:'#3dd68c'}}>{s.country_code} {s.mobile}</div>}
                              {s.email && <div style={{fontSize:12,color:'#6c8cff'}}>{s.email}</div>}
                            </div>
                          ) : (
                            <div>
                              {s.mobile && <div style={{fontSize:12,color:'var(--mu2)'}}>{maskMobile(s.mobile)}</div>}
                              {s.email && <div style={{fontSize:12,color:'var(--mu2)'}}>{maskEmail(s.email)}</div>}
                              <button onClick={()=>revealContact(s.id)} style={{fontSize:10,background:'rgba(108,140,255,0.15)',color:'#6c8cff',border:'none',borderRadius:4,padding:'2px 7px',cursor:'pointer',marginTop:2}}>👁 View</button>
                            </div>
                          )}
                        </td>
                        <td style={{padding:'10px 10px',color:'var(--mu)',fontSize:12}}>{s.industry||'—'}</td>
                        <td style={{padding:'10px 10px',color:'var(--mu)',fontSize:12}}>{s.city||'—'}</td>
                        <td style={{padding:'10px 10px'}}>
                          <span style={{fontSize:11,background:`${STATUS_COLORS[s.status]||'var(--mu)'}22`,color:STATUS_COLORS[s.status]||'var(--mu)',padding:'2px 8px',borderRadius:6,fontWeight:600}}>{s.status}</span>
                        </td>
                        <td style={{padding:'10px 10px',fontSize:12,color:'var(--mu)'}}>{s.assigned_user?.full_name||'—'}</td>
                        <td style={{padding:'10px 10px'}}>
                          <div style={{display:'flex',gap:6}}>
                            {s.linkedin && <a href={s.linkedin} target="_blank" rel="noreferrer" style={{background:'rgba(108,140,255,0.12)',color:'#6c8cff',borderRadius:6,padding:'5px 8px',fontSize:11,textDecoration:'none'}}>in</a>}
                            <button onClick={()=>openEdit(s)} style={{background:'rgba(108,140,255,0.12)',color:'#6c8cff',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,cursor:'pointer'}}>Edit</button>
                            <button onClick={()=>deleteItem(s.id)} style={{background:'rgba(255,107,107,0.12)',color:'#ff6b6b',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,cursor:'pointer'}}>Del</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
          <div style={{background:'var(--bg2)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:28,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto' as any}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <span style={{fontSize:16,fontWeight:700}}>{editItem?'Edit Stakeholder':'+ New Stakeholder'}</span>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',color:'var(--mu)',fontSize:18,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={S.lbl}>Full Name *</label>
                <input placeholder="John Smith" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>Type</label>
                <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={S.inp}>
                  {STAKEHOLDER_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Status</label>
                <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={S.inp}>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Organization</label>
                <input placeholder="Company name" value={form.organization} onChange={e=>setForm(p=>({...p,organization:e.target.value}))} style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>Designation</label>
                <input placeholder="CEO, HR Manager..." value={form.designation} onChange={e=>setForm(p=>({...p,designation:e.target.value}))} style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>Mobile</label>
                <input placeholder="9876543210" value={form.mobile} onChange={e=>setForm(p=>({...p,mobile:e.target.value.replace(/\D/g,'')}))} style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>Email</label>
                <input type="email" placeholder="john@company.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>Industry</label>
                <select value={form.industry} onChange={e=>setForm(p=>({...p,industry:e.target.value}))} style={S.inp}>
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>City</label>
                <input placeholder="Delhi" value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))} style={S.inp} />
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={S.lbl}>LinkedIn URL</label>
                <input placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={e=>setForm(p=>({...p,linkedin:e.target.value}))} style={S.inp} />
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={S.lbl}>Assign To</label>
                <select value={form.assigned_to} onChange={e=>setForm(p=>({...p,assigned_to:e.target.value}))} style={S.inp}>
                  <option value="">Unassigned</option>
                  {users.map(u=><option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
                </select>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={S.lbl}>Notes</label>
                <textarea rows={3} placeholder="Any notes about this stakeholder..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{...S.inp,resize:'vertical' as any}} />
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:6}}>
              <button onClick={()=>setShowModal(false)} style={{flex:1,background:'rgba(255,255,255,0.06)',color:'var(--tx)',border:'none',borderRadius:8,padding:'11px',fontSize:13,cursor:'pointer'}}>Cancel</button>
              <button onClick={save} disabled={saving} style={{...S.btn,flex:2,padding:'11px'}}>
                {saving?'Saving...':editItem?'Update':'Add Stakeholder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
