import Layout from '../../src/components/Layout'
import { useEffect, useState } from 'react'
import { applyTheme, getSavedTheme, THEME_LIST, THEMES } from '../../src/lib/theme'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import DashboardNav from '../../src/components/DashboardNav'

const STAGES = ['Lead','Prospect','Qualified','Proposal Sent','Negotiation','Won','Lost']
const STAGE_COLORS: Record<string,string> = {
  'Lead':'#7ab3ff','Prospect':'#ffb347','Qualified':'#c77dff',
  'Proposal Sent':'#48cae4','Negotiation':'#ffd60a','Won':'#3dd68c','Lost':'#ff6b6b'
}
const INDUSTRIES = ['IT / Software','BFSI / Banking','Healthcare','Manufacturing','Real Estate','E-commerce','Education','Consulting','Media','Pharma','Logistics','Legal','Hospitality','Telecom','Automobile','Other']

export default function BDPipeline() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [deals, setDeals] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editDeal, setEditDeal] = useState<any>(null)
  const [filterStage, setFilterStage] = useState('All')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_name:'', client_email:'', client_phone:'', client_company:'',
    client_industry:'', stage:'Lead', deal_value:'', notes:'',
    assigned_to:'', follow_up_date:''
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
    const { data: ds } = await supabase.from('bd_pipeline').select('*, assigned_user:app_users!bd_pipeline_assigned_to_fkey(full_name)').order('created_at', { ascending: false })
    setDeals(ds || [])
    const { data: us } = await supabase.from('app_users').select('id,full_name,role').in('role',['bd_manager','bd_executive','recruiter','admin','account_owner','individual_bd'])
    setUsers(us || [])
    setLoading(false)
  }

  function openAdd() {
    setEditDeal(null)
    setForm({ client_name:'', client_email:'', client_phone:'', client_company:'', client_industry:'', stage:'Lead', deal_value:'', notes:'', assigned_to:'', follow_up_date:'' })
    setShowModal(true)
  }

  function openEdit(d: any) {
    setEditDeal(d)
    setForm({
      client_name: d.client_name||'', client_email: d.client_email||'',
      client_phone: d.client_phone||'', client_company: d.client_company||'',
      client_industry: d.client_industry||'', stage: d.stage||'Lead',
      deal_value: d.deal_value||'', notes: d.notes||'',
      assigned_to: d.assigned_to||'', follow_up_date: d.follow_up_date||''
    })
    setShowModal(true)
  }

  async function saveDeal() {
    if (!form.client_name.trim()) return
    setSaving(true)
    const payload = {
      client_name: form.client_name, client_email: form.client_email,
      client_phone: form.client_phone, client_company: form.client_company,
      client_industry: form.client_industry, stage: form.stage,
      deal_value: form.deal_value ? parseFloat(form.deal_value) : 0,
      notes: form.notes, assigned_to: form.assigned_to || null,
      follow_up_date: form.follow_up_date || null,
      company_id: appUser?.company_id || null,
      created_by: appUser?.id
    }
    if (editDeal) {
      await supabase.from('bd_pipeline').update(payload).eq('id', editDeal.id)
    } else {
      await supabase.from('bd_pipeline').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    loadData({ id: appUser.id })
  }

  async function updateStage(id: string, stage: string) {
    await supabase.from('bd_pipeline').update({ stage }).eq('id', id)
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))
  }

  async function deleteDeal(id: string) {
    if (!confirm('Delete this deal?')) return
    await supabase.from('bd_pipeline').delete().eq('id', id)
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  const filtered = deals.filter(d => {
    const matchStage = filterStage === 'All' || d.stage === filterStage
    const matchSearch = !search || d.client_name?.toLowerCase().includes(search.toLowerCase()) || d.client_company?.toLowerCase().includes(search.toLowerCase())
    return matchStage && matchSearch
  })

  const totalValue = deals.filter(d => d.stage === 'Won').reduce((s, d) => s + (d.deal_value || 0), 0)
  const pipelineValue = deals.filter(d => !['Won','Lost'].includes(d.stage)).reduce((s, d) => s + (d.deal_value || 0), 0)
  const wonCount = deals.filter(d => d.stage === 'Won').length
  const activeCount = deals.filter(d => !['Won','Lost'].includes(d.stage)).length

  const S: any = {
    page: { minHeight:'100vh', background:'var(--bg)', color:'var(--tx)', fontFamily:'Outfit,sans-serif' },
    nav: { background:'var(--nb)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky' as any, top:0, zIndex:50 },
    card: { background:'var(--bg2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'20px' },
    btn: { background:'#6c8cff', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer' },
    inp: { width:'100%', background:'var(--bg3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--tx)', outline:'none', marginBottom:10 },
    lbl: { fontSize:11, color:'var(--mu)', marginBottom:4, display:'block', fontWeight:600, textTransform:'uppercase' as any, letterSpacing:'0.8px' },
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',color:'var(--tx)',fontSize:14}}>Loading BD Pipeline...</div>

  return (
    <div style={S.page}>
      <DashboardNav />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');*{box-sizing:border-box}select option{background:#22262f}`}</style>

      {/* NAV */}
      <nav style={S.nav}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:30,height:30,borderRadius:8,background:'rgba(108,140,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'#6c8cff',fontSize:14}}>R</div>
          <span style={{fontWeight:700,fontSize:15}}>RecruitBase Pro</span>
          <span style={{fontSize:12,padding:'2px 10px',borderRadius:20,background:'rgba(72,202,228,0.1)',color:'#48cae4'}}>💼 BD Pipeline</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={() => router.push('/dashboard')} style={{background:'rgba(255,255,255,0.06)',color:'var(--tx)',border:'none',borderRadius:7,padding:'7px 14px',fontSize:12,cursor:'pointer'}}>← Dashboard</button>
          <button onClick={openAdd} style={S.btn}>+ Add Deal</button>
        </div>
      </nav>

      <div style={{maxWidth:1300,margin:'0 auto',padding:'24px 20px'}}>

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:24}}>
          {[
            { label:'Total Deals', value:deals.length, color:'#6c8cff', icon:'📋' },
            { label:'Active Deals', value:activeCount, color:'#48cae4', icon:'🔄' },
            { label:'Won Deals', value:wonCount, color:'#3dd68c', icon:'🏆' },
            { label:'Revenue Won', value:`₹${(totalValue/1000).toFixed(0)}K`, color:'#ffd60a', icon:'💰' },
            { label:'Pipeline Value', value:`₹${(pipelineValue/1000).toFixed(0)}K`, color:'#c77dff', icon:'📈' },
          ].map(s => (
            <div key={s.label} style={{...S.card,textAlign:'center'}}>
              <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
              <div style={{fontSize:11,color:'var(--mu)',marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* STAGE SUMMARY */}
        <div style={{...S.card,marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:14,color:'var(--tx)'}}>Pipeline by Stage</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap' as any}}>
            {STAGES.map(st => {
              const count = deals.filter(d => d.stage === st).length
              const val = deals.filter(d => d.stage === st).reduce((s,d) => s+(d.deal_value||0),0)
              return (
                <div key={st} onClick={() => setFilterStage(filterStage === st ? 'All' : st)}
                  style={{flex:1,minWidth:100,background:filterStage===st?`${STAGE_COLORS[st]}22`:'rgba(255,255,255,0.03)',border:`1px solid ${filterStage===st?STAGE_COLORS[st]:'rgba(255,255,255,0.07)'}`,borderRadius:10,padding:'12px 10px',cursor:'pointer',textAlign:'center',transition:'all .2s'}}>
                  <div style={{fontSize:18,fontWeight:700,color:STAGE_COLORS[st]}}>{count}</div>
                  <div style={{fontSize:10,color:'var(--mu)',marginTop:2}}>{st}</div>
                  {val > 0 && <div style={{fontSize:10,color:STAGE_COLORS[st],marginTop:3}}>₹{(val/1000).toFixed(0)}K</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* FILTERS */}
        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' as any}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search client or company..." style={{...S.inp,marginBottom:0,flex:1,minWidth:200}} />
          <select value={filterStage} onChange={e=>setFilterStage(e.target.value)} style={{...S.inp,marginBottom:0,width:'auto'}}>
            <option value="All">All Stages</option>
            {STAGES.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>

        {/* DEALS TABLE */}
        <div style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:600}}>{filtered.length} Deals</span>
            <span style={{fontSize:11,color:'var(--mu)'}}>Click stage badge to update</span>
          </div>
          {filtered.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px 0',color:'var(--mu2)'}}>
              <div style={{fontSize:32,marginBottom:8}}>💼</div>
              <div style={{fontSize:14}}>No deals yet. Add your first deal!</div>
            </div>
          ) : (
            <div style={{overflowX:'auto' as any}}>
              <table style={{width:'100%',borderCollapse:'collapse' as any,fontSize:13}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                    {['Client','Company','Industry','Stage','Deal Value','Follow Up','Assigned To','Actions'].map(h=>(
                      <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,color:'var(--mu2)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',transition:'background .15s'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <td style={{padding:'10px 10px'}}>
                        <div style={{fontWeight:600,color:'var(--tx)'}}>{d.client_name}</div>
                        {d.client_email && <div style={{fontSize:11,color:'var(--mu2)'}}>{d.client_email}</div>}
                        {d.client_phone && <div style={{fontSize:11,color:'var(--mu2)'}}>{d.client_phone}</div>}
                      </td>
                      <td style={{padding:'10px 10px',color:'var(--mu)'}}>{d.client_company||'—'}</td>
                      <td style={{padding:'10px 10px',color:'var(--mu)'}}>{d.client_industry||'—'}</td>
                      <td style={{padding:'10px 10px'}}>
                        <select value={d.stage} onChange={e=>updateStage(d.id,e.target.value)}
                          style={{background:`${STAGE_COLORS[d.stage]}22`,color:STAGE_COLORS[d.stage],border:`1px solid ${STAGE_COLORS[d.stage]}55`,borderRadius:6,padding:'4px 8px',fontSize:11,fontWeight:600,cursor:'pointer',outline:'none'}}>
                          {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{padding:'10px 10px',color:'#ffd60a',fontWeight:600}}>
                        {d.deal_value > 0 ? `₹${Number(d.deal_value).toLocaleString()}` : '—'}
                      </td>
                      <td style={{padding:'10px 10px',color: d.follow_up_date && new Date(d.follow_up_date) < new Date() ? '#ff6b6b' : '#7a7f90',fontSize:12}}>
                        {d.follow_up_date ? new Date(d.follow_up_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{padding:'10px 10px',fontSize:12,color:'var(--mu)'}}>
                        {d.assigned_user?.full_name || '—'}
                      </td>
                      <td style={{padding:'10px 10px'}}>
                        <div style={{display:'flex',gap:6}}>
                          <button onClick={()=>openEdit(d)} style={{background:'rgba(108,140,255,0.15)',color:'#6c8cff',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,cursor:'pointer'}}>Edit</button>
                          <button onClick={()=>deleteDeal(d.id)} style={{background:'rgba(255,107,107,0.12)',color:'#ff6b6b',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,cursor:'pointer'}}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
          <div style={{background:'var(--bg2)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:28,width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto' as any}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <span style={{fontSize:16,fontWeight:700}}>{editDeal ? 'Edit Deal' : '+ New Deal'}</span>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',color:'var(--mu)',fontSize:18,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[
                {lbl:'Client Name *',key:'client_name',type:'text',placeholder:'John Smith'},
                {lbl:'Client Email',key:'client_email',type:'email',placeholder:'john@company.com'},
                {lbl:'Phone',key:'client_phone',type:'text',placeholder:'+91 98765 43210'},
                {lbl:'Company Name',key:'client_company',type:'text',placeholder:'ABC Corp'},
              ].map(f=>(
                <div key={f.key}>
                  <label style={S.lbl}>{f.lbl}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={S.inp} />
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={S.lbl}>Industry</label>
                <select value={form.client_industry} onChange={e=>setForm(p=>({...p,client_industry:e.target.value}))} style={S.inp}>
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Stage</label>
                <select value={form.stage} onChange={e=>setForm(p=>({...p,stage:e.target.value}))} style={S.inp}>
                  {STAGES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Deal Value (₹)</label>
                <input type="number" placeholder="50000" value={form.deal_value}
                  onChange={e=>setForm(p=>({...p,deal_value:e.target.value}))} style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>Follow Up Date</label>
                <input type="date" value={form.follow_up_date}
                  onChange={e=>setForm(p=>({...p,follow_up_date:e.target.value}))} style={S.inp} />
              </div>
            </div>
            <div>
              <label style={S.lbl}>Assign To</label>
              <select value={form.assigned_to} onChange={e=>setForm(p=>({...p,assigned_to:e.target.value}))} style={S.inp}>
                <option value="">Unassigned</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
              </select>
            </div>
            <div>
              <label style={S.lbl}>Notes</label>
              <textarea rows={3} placeholder="Deal notes, next steps..." value={form.notes}
                onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                style={{...S.inp,resize:'vertical' as any}} />
            </div>
            <div style={{display:'flex',gap:10,marginTop:6}}>
              <button onClick={()=>setShowModal(false)} style={{flex:1,background:'rgba(255,255,255,0.06)',color:'var(--tx)',border:'none',borderRadius:8,padding:'11px',fontSize:13,cursor:'pointer'}}>Cancel</button>
              <button onClick={saveDeal} disabled={saving} style={{...S.btn,flex:2,padding:'11px'}}>
                {saving ? 'Saving...' : editDeal ? 'Update Deal' : 'Add Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
