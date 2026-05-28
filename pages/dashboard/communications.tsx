import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

const TEMPLATE_TYPES = ['whatsapp','email','both']
const TYPE_COLORS: any = { whatsapp:'#25d366', email:'#6c8cff', both:'#ff9f43' }

export default function Communications() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('templates')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [previewMsg, setPreviewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [form, setForm] = useState({ name:'', type:'whatsapp', subject:'', body:'' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      loadData(session.user)
    })
  }, [router])

  async function loadData(u: any) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)
    const { data: ts } = await supabase.from('message_templates').select('*').order('created_at', { ascending: false })
    const { data: ps } = await supabase.from('profiles').select('id,name,mobile,email,status,role,city').order('name')
    setTemplates(ts || [])
    setProfiles(ps || [])
    setLoading(false)
  }

  function openAdd() {
    setEditItem(null)
    setForm({ name:'', type:'whatsapp', subject:'', body:'' })
    setShowModal(true)
  }

  function openEdit(t: any) {
    setEditItem(t)
    setForm({ name:t.name, type:t.type, subject:t.subject||'', body:t.body })
    setShowModal(true)
  }

  async function saveTemplate() {
    if (!form.name || !form.body) return
    setSaving(true)
    const payload = {
      name: form.name, type: form.type,
      subject: form.subject, body: form.body,
      company_id: appUser?.company_id || null,
      created_by: appUser?.id, is_system: false
    }
    if (editItem) {
      await supabase.from('message_templates').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('message_templates').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    loadData({ id: appUser.id })
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return
    await supabase.from('message_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  function selectTemplate(t: any) {
    setSelectedTemplate(t)
    setPreviewMsg(t.body)
    setActiveTab('send')
  }

  function fillPreview(profile: any) {
    if (!selectedTemplate) return ''
    return selectedTemplate.body
      .replace(/{{name}}/g, profile.name || '')
      .replace(/{{role}}/g, profile.role || '')
      .replace(/{{city}}/g, profile.city || '')
      .replace(/{{company}}/g, appUser?.company_name || 'Our Company')
      .replace(/{{recruiter}}/g, appUser?.full_name || '')
  }

  function openWhatsApp(profile: any) {
    const msg = fillPreview(profile)
    const phone = (profile.mobile || '').replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function openEmail(profile: any) {
    const msg = fillPreview(profile)
    const subject = selectedTemplate?.subject?.replace(/{{name}}/g, profile.name || '') || 'Message from RecruitBase Pro'
    window.open(`mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`, '_blank')
  }

  function toggleProfile(id: string) {
    setSelectedProfiles(prev => prev.includes(id) ? prev.filter(p=>p!==id) : [...prev, id])
  }

  function selectAll() {
    setSelectedProfiles(profiles.map(p=>p.id))
  }

  function clearAll() {
    setSelectedProfiles([])
  }

  const S: any = {
    page: { minHeight:'100vh', background:'var(--bg)', color:'var(--tx)', fontFamily:'Outfit,sans-serif' },
    card: { background:'var(--bg2)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:20 },
    btn: { background:'#6c8cff', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer' },
    inp: { width:'100%', background:'var(--bg3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--tx)', outline:'none', marginBottom:10 },
    lbl: { fontSize:11, color:'var(--mu)', marginBottom:4, display:'block', fontWeight:600, textTransform:'uppercase' as any, letterSpacing:'0.8px' },
    tab: (active: boolean) => ({ padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', background:active?'rgba(108,140,255,0.15)':'transparent', color:active?'#6c8cff':'var(--mu)' }),
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',color:'var(--tx)'}}>Loading...</div>

  return (
    <>
    <div style={S.page}>
      
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');*{box-sizing:border-box}select option{background:var(--bg3)}textarea{font-family:Outfit,sans-serif}`}</style>

      <nav style={{background:'var(--nb)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky' as any,top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer'}} onClick={()=>router.push('/dashboard')}>
          <div style={{width:30,height:30,borderRadius:8,background:'rgba(108,140,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'#6c8cff',fontSize:14}}>R</div>
          <div>
            <div style={{fontWeight:700,fontSize:15,lineHeight:1.2}}>RecruitBase Pro</div>
            <div style={{fontSize:9,color:'var(--mu2)',letterSpacing:'1.5px',textTransform:'uppercase'}}>Recruitment OS</div>
          </div>
          <span style={{fontSize:12,padding:'2px 10px',borderRadius:20,background:'rgba(255,159,67,0.1)',color:'#ff9f43'}}>📨 Communications</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          
          <button onClick={openAdd} style={S.btn}>+ New Template</button>
        </div>
      </nav>

      <div style={{maxWidth:1300,margin:'0 auto',padding:'24px 20px'}}>

        {/* TABS */}
        <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.04)',padding:4,borderRadius:10,marginBottom:24,width:'fit-content'}}>
          <button onClick={()=>setActiveTab('templates')} style={S.tab(activeTab==='templates')}>📋 Templates</button>
          <button onClick={()=>setActiveTab('send')} style={S.tab(activeTab==='send')}>📤 Send Messages</button>
        </div>

        {/* ── TEMPLATES TAB ── */}
        {activeTab==='templates' && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
              {templates.map(t=>(
                <div key={t.id} style={{...S.card,display:'flex',flexDirection:'column' as any,gap:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{t.name}</div>
                      <span style={{fontSize:11,background:`${TYPE_COLORS[t.type]||'var(--mu)'}22`,color:TYPE_COLORS[t.type]||'var(--mu)',padding:'2px 8px',borderRadius:6,fontWeight:600,textTransform:'capitalize' as any}}>
                        {t.type==='whatsapp'?'💬':t.type==='email'?'📧':'📨'} {t.type}
                      </span>
                      {t.is_system && <span style={{marginLeft:6,fontSize:10,background:'rgba(255,214,10,0.1)',color:'#ffd60a',padding:'2px 6px',borderRadius:4}}>System</span>}
                    </div>
                  </div>
                  {t.subject && <div style={{fontSize:12,color:'var(--mu)'}}>Subject: {t.subject}</div>}
                  <div style={{fontSize:12,color:'var(--mu)',background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'10px',lineHeight:1.6,maxHeight:80,overflow:'hidden',textOverflow:'ellipsis'}}>
                    {t.body}
                  </div>
                  <div style={{display:'flex',gap:8,marginTop:'auto'}}>
                    <button onClick={()=>selectTemplate(t)} style={{flex:2,background:'rgba(37,211,102,0.15)',color:'#25d366',border:'none',borderRadius:7,padding:'8px',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                      📤 Use Template
                    </button>
                    {!t.is_system && <>
                      <button onClick={()=>openEdit(t)} style={{flex:1,background:'rgba(108,140,255,0.12)',color:'#6c8cff',border:'none',borderRadius:7,padding:'8px',fontSize:12,cursor:'pointer'}}>Edit</button>
                      <button onClick={()=>deleteTemplate(t.id)} style={{background:'rgba(255,107,107,0.12)',color:'#ff6b6b',border:'none',borderRadius:7,padding:'8px 10px',fontSize:12,cursor:'pointer'}}>🗑</button>
                    </>}
                  </div>
                </div>
              ))}
              {/* Add new card */}
              <div onClick={openAdd} style={{...S.card,display:'flex',flexDirection:'column' as any,alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer',border:'1px dashed rgba(255,255,255,0.12)',minHeight:180,opacity:0.6,transition:'opacity .2s'}}
                onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
                onMouseLeave={e=>(e.currentTarget.style.opacity='0.6')}>
                <div style={{fontSize:28}}>+</div>
                <div style={{fontSize:13,color:'var(--mu)'}}>Create New Template</div>
              </div>
            </div>
          </>
        )}

        {/* ── SEND TAB ── */}
        {activeTab==='send' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:20}}>

            {/* Left — select template + candidates */}
            <div style={{display:'flex',flexDirection:'column' as any,gap:16}}>
              <div style={S.card}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>1. Select Template</div>
                {selectedTemplate ? (
                  <div style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <span style={{fontWeight:600,fontSize:13}}>{selectedTemplate.name}</span>
                      <button onClick={()=>setSelectedTemplate(null)} style={{background:'none',border:'none',color:'var(--mu)',cursor:'pointer',fontSize:11}}>Change</button>
                    </div>
                    <span style={{fontSize:11,background:`${TYPE_COLORS[selectedTemplate.type]||'var(--mu)'}22`,color:TYPE_COLORS[selectedTemplate.type]||'var(--mu)',padding:'2px 8px',borderRadius:5,textTransform:'capitalize' as any}}>{selectedTemplate.type}</span>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column' as any,gap:6}}>
                    {templates.map(t=>(
                      <div key={t.id} onClick={()=>selectTemplate(t)}
                        style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'10px 12px',cursor:'pointer',transition:'all .15s'}}
                        onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(108,140,255,0.4)')}
                        onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.06)')}>
                        <div style={{fontSize:13,fontWeight:500}}>{t.name}</div>
                        <div style={{fontSize:11,color:TYPE_COLORS[t.type]||'var(--mu)',marginTop:2,textTransform:'capitalize' as any}}>{t.type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={S.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <span style={{fontSize:13,fontWeight:600}}>2. Select Candidates ({selectedProfiles.length})</span>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={selectAll} style={{fontSize:11,color:'#6c8cff',background:'none',border:'none',cursor:'pointer'}}>All</button>
                    <button onClick={clearAll} style={{fontSize:11,color:'#ff6b6b',background:'none',border:'none',cursor:'pointer'}}>Clear</button>
                  </div>
                </div>
                <div style={{maxHeight:300,overflowY:'auto' as any,display:'flex',flexDirection:'column' as any,gap:4}}>
                  {profiles.map(p=>(
                    <div key={p.id} onClick={()=>toggleProfile(p.id)}
                      style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,cursor:'pointer',background:selectedProfiles.includes(p.id)?'rgba(108,140,255,0.1)':'transparent',border:`1px solid ${selectedProfiles.includes(p.id)?'rgba(108,140,255,0.3)':'transparent'}`,transition:'all .15s'}}>
                      <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${selectedProfiles.includes(p.id)?'#6c8cff':'rgba(255,255,255,0.2)'}`,background:selectedProfiles.includes(p.id)?'#6c8cff':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:10,color:'#fff'}}>
                        {selectedProfiles.includes(p.id)?'✓':''}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                        <div style={{fontSize:11,color:'var(--mu2)'}}>{p.mobile} · {p.city}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — preview + send */}
            <div style={{display:'flex',flexDirection:'column' as any,gap:16}}>
              <div style={S.card}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>3. Preview & Send</div>
                {!selectedTemplate ? (
                  <div style={{textAlign:'center',padding:'30px',color:'var(--mu2)'}}>
                    <div style={{fontSize:28,marginBottom:8}}>📋</div>
                    <div>Select a template on the left to preview</div>
                  </div>
                ) : selectedProfiles.length === 0 ? (
                  <div style={{textAlign:'center',padding:'30px',color:'var(--mu2)'}}>
                    <div style={{fontSize:28,marginBottom:8}}>👥</div>
                    <div>Select candidates on the left to send</div>
                  </div>
                ) : (
                  <>
                    <div style={{fontSize:12,color:'var(--mu)',marginBottom:12}}>{selectedProfiles.length} candidate(s) selected — click send button to open {selectedTemplate.type==='email'?'email client':'WhatsApp'}</div>
                    <div style={{maxHeight:400,overflowY:'auto' as any,display:'flex',flexDirection:'column' as any,gap:8}}>
                      {profiles.filter(p=>selectedProfiles.includes(p.id)).map(p=>(
                        <div key={p.id} style={{background:'rgba(255,255,255,0.03)',borderRadius:10,padding:12,border:'1px solid rgba(255,255,255,0.06)'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                            <div>
                              <span style={{fontWeight:600,fontSize:13}}>{p.name}</span>
                              <span style={{fontSize:11,color:'var(--mu2)',marginLeft:8}}>{p.mobile}</span>
                            </div>
                            <div style={{display:'flex',gap:6}}>
                              {(selectedTemplate.type==='whatsapp'||selectedTemplate.type==='both') && p.mobile && (
                                <button onClick={()=>openWhatsApp(p)} style={{background:'rgba(37,211,102,0.15)',color:'#25d366',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                                  💬 WhatsApp
                                </button>
                              )}
                              {(selectedTemplate.type==='email'||selectedTemplate.type==='both') && p.email && (
                                <button onClick={()=>openEmail(p)} style={{background:'rgba(108,140,255,0.15)',color:'#6c8cff',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                                  📧 Email
                                </button>
                              )}
                            </div>
                          </div>
                          <div style={{fontSize:11,color:'var(--mu)',background:'rgba(0,0,0,0.2)',borderRadius:6,padding:'8px',lineHeight:1.6,maxHeight:60,overflow:'hidden'}}>
                            {fillPreview(p).slice(0,120)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
          <div style={{background:'var(--bg2)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:28,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto' as any}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <span style={{fontSize:16,fontWeight:700}}>{editItem?'Edit Template':'+ New Template'}</span>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',color:'var(--mu)',fontSize:18,cursor:'pointer'}}>✕</button>
            </div>
            <label style={S.lbl}>Template Name *</label>
            <input placeholder="e.g. Interview Invitation" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={S.inp} />
            <label style={S.lbl}>Type</label>
            <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={S.inp}>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="email">📧 Email</option>
              <option value="both">📨 Both</option>
            </select>
            {(form.type==='email'||form.type==='both') && (
              <>
                <label style={S.lbl}>Email Subject</label>
                <input placeholder="Subject line..." value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} style={S.inp} />
              </>
            )}
            <label style={S.lbl}>Message Body *</label>
            <textarea rows={6} placeholder="Use {{name}}, {{role}}, {{company}}, {{recruiter}} as variables..." value={form.body} onChange={e=>setForm(p=>({...p,body:e.target.value}))} style={{...S.inp,resize:'vertical' as any,lineHeight:1.6}} />
            <div style={{fontSize:11,color:'var(--mu2)',marginBottom:12}}>Variables: {'{{name}} {{role}} {{company}} {{recruiter}} {{city}} {{date}} {{time}}'}</div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setShowModal(false)} style={{flex:1,background:'rgba(255,255,255,0.06)',color:'var(--tx)',border:'none',borderRadius:8,padding:'11px',fontSize:13,cursor:'pointer'}}>Cancel</button>
              <button onClick={saveTemplate} disabled={saving} style={{...S.btn,flex:2,padding:'11px'}}>
                {saving?'Saving...':editItem?'Update Template':'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
