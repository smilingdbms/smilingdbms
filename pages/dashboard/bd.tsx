import Layout from '../../src/components/Layout'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import DashboardNav from '../../src/components/DashboardNav'

const STAGES = ['Lead','Prospect','Qualified','Proposal Sent','Negotiation','Won','Lost']
const STAGE_COLORS: Record<string,string> = { 'Lead':'#7ab3ff','Prospect':'#ffb347','Qualified':'#c77dff','Proposal Sent':'#48cae4','Negotiation':'#ffd60a','Won':'#3dd68c','Lost':'#ff6b6b' }
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
  
  const [form, setForm] = useState({ client_name:'', client_email:'', client_phone:'', client_company:'', client_industry:'', stage:'Lead', deal_value:'', notes:'', assigned_to:'', follow_up_date:'', candidate_name:'', position_role:'', client_address:'' })

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

  function openAdd() { setEditDeal(null); setForm({ client_name:'', client_email:'', client_phone:'', client_company:'', client_industry:'', stage:'Lead', deal_value:'', notes:'', assigned_to:'', follow_up_date:'', candidate_name:'', position_role:'', client_address:'' }); setShowModal(true) }

  function openEdit(d: any) { setEditDeal(d); setForm({ client_name: d.client_name||'', client_email: d.client_email||'', client_phone: d.client_phone||'', client_company: d.client_company||'', client_industry: d.client_industry||'', stage: d.stage||'Lead', deal_value: d.deal_value||'', notes: d.notes||'', assigned_to: d.assigned_to||'', follow_up_date: d.follow_up_date||'', candidate_name: d.candidate_name||'', position_role: d.position_role||'', client_address: d.client_address||'' }); setShowModal(true) }

  async function saveDeal() {
    if (!form.client_name.trim() || !form.client_company.trim()) return alert("Client Name aur Company zaroori hai!")
    setSaving(true)
    const payload = { client_name: form.client_name, client_email: form.client_email, client_phone: form.client_phone, client_company: form.client_company, client_industry: form.client_industry, stage: form.stage, deal_value: form.deal_value ? parseFloat(form.deal_value) : 0, notes: form.notes, assigned_to: form.assigned_to || null, follow_up_date: form.follow_up_date || null, company_id: appUser?.company_id || null, created_by: appUser?.id, candidate_name: form.candidate_name, position_role: form.position_role, client_address: form.client_address }
    if (editDeal) { await supabase.from('bd_pipeline').update(payload).eq('id', editDeal.id) } 
    else { await supabase.from('bd_pipeline').insert(payload) }
    setSaving(false); setShowModal(false); loadData({ id: appUser.id })
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

  const S: any = {
    page: { minHeight:'100vh', background:'var(--bg)', color:'var(--tx)', fontFamily:'Outfit,sans-serif' },
    nav: { background:'var(--nb)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky' as any, top:0, zIndex:50 },
    card: { background:'var(--bg2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'20px' },
    btn: { background:'#3dd68c', color:'#000', border:'none', borderRadius:8, padding:'10px 20px', fontSize:14, fontWeight:700, cursor:'pointer' },
    inp: { width:'100%', background:'var(--bg3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--tx)', outline:'none', marginBottom:10 },
    lbl: { fontSize:11, color:'var(--mu)', marginBottom:4, display:'block', fontWeight:600, textTransform:'uppercase' as any, letterSpacing:'0.8px' },
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',color:'var(--tx)'}}>Loading BD Pipeline...</div>

  return (
    <div style={S.page}>
      <DashboardNav />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');*{box-sizing:border-box}select option{background:#22262f}`}</style>

      <div style={{maxWidth:1300,margin:'0 auto',padding:'24px 20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div><h1 style={{margin:0,fontSize:24}}>BD Pipeline</h1></div>
          <button onClick={openAdd} style={S.btn}>+ Add New Deal</button>
        </div>

        <div style={S.card}>
          <div style={{overflowX:'auto' as any}}>
            <table style={{width:'100%',borderCollapse:'collapse' as any,fontSize:13}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                  {['Client','Stage','Actions'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',color:'var(--mu2)'}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <td style={{padding:'10px'}}>{d.client_company || d.client_name}</td>
                    <td style={{padding:'10px'}}>
                      <select value={d.stage} onChange={e=>updateStage(d.id,e.target.value)} style={{background:'#22262f',color:'#fff',padding:'4px 8px',borderRadius:6}}>
                        {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{padding:'10px'}}>
                      <button onClick={()=>openEdit(d)} style={{background:'transparent',color:'#6c8cff',border:'none',cursor:'pointer'}}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--bg2)',padding:28,borderRadius:16,width:'100%',maxWidth:500}}>
            <h2>{editDeal ? 'Edit Deal' : '+ Add Deal'}</h2>
            <input placeholder="Client Name" value={form.client_name} onChange={e=>setForm(p=>({...p,client_name:e.target.value}))} style={S.inp} />
            <input placeholder="Company Name" value={form.client_company} onChange={e=>setForm(p=>({...p,client_company:e.target.value}))} style={S.inp} />
            <button onClick={saveDeal} disabled={saving} style={{...S.btn, width:'100%', marginTop:10}}>{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={()=>setShowModal(false)} style={{width:'100%',marginTop:10,background:'transparent',border:'1px solid gray',color:'white',padding:'10px',borderRadius:8}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}