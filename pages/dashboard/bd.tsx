import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import DashboardNav from '../../src/components/DashboardNav'

const STAGES = ['Lead','Prospect','Qualified','Proposal Sent','Negotiation','Won','Lost']

export default function BDPipeline() {
  const router = useRouter()
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    client_company:'', sector:'', city:'', state:'', additional_cities:'', pincode:'',
    spoc_name:'', spoc_contact:'', spoc_email:'',
    bd_name:'', bd_mobile:'',
    fee_type:'Flat', flat_value:'', percentage_value:'',
    stage:'Lead', remarks:''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data, error } = await supabase.from('bd_pipeline').select('*').order('created_at', { ascending: false })
    if (!error) setDeals(data || [])
    setLoading(false)
  }

  const saveDeal = async () => {
    if (!form.client_company) return alert("Company Name is mandatory!")
    setSaving(true)
    const { error } = await supabase.from('bd_pipeline').insert([form])
    if (error) {
      alert("Error: " + error.message)
    } else {
      setShowModal(false)
      loadData()
    }
    setSaving(false)
  }

  async function updateStage(id: string, stage: string) {
    const { error } = await supabase.from('bd_pipeline').update({ stage }).eq('id', id)
    if (!error) {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))
    } else {
      alert("Update Failed: " + error.message)
    }
  }

  if (loading) return <div style={{padding:50, background:'#0f1115', color:'#3dd68c', minHeight:'100vh'}}>Resetting ERP Engine...</div>

  return (
    <div style={{minHeight:'100vh', background:'#0f1115', color:'#e2e8f0', fontFamily:'Outfit, sans-serif'}}>
      <DashboardNav />
      <div style={{maxWidth:1400, margin:'0 auto', padding:'30px 20px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
          <h1 style={{margin:0}}>BD Enterprise Pipeline</h1>
          <button onClick={() => setShowModal(true)} style={{background:'#3dd68c', color:'#000', padding:'12px 28px', borderRadius:10, fontWeight:700, border:'none', cursor:'pointer'}}>+ New Mandate</button>
        </div>

        <div style={{background:'#1a1d24', borderRadius:16, border:'1px solid #2d333d', overflow:'hidden'}}>
          <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
            <thead style={{background:'#252932', color:'#94a3b8', fontSize:11}}>
              <tr>
                <th style={{padding:15}}>COMPANY</th>
                <th style={{padding:15}}>LOCATION</th>
                <th style={{padding:15}}>COMMERCIALS</th>
                <th style={{padding:15}}>AGREEMENT / MAIL</th>
                <th style={{padding:15}}>STAGE</th>
              </tr>
            </thead>
            <tbody>
              {deals.map(d => (
                <tr key={d.id} style={{borderBottom:'1px solid #2d333d'}}>
                  <td style={{padding:15}}>
                    <div style={{fontWeight:700}}>{d.client_company}</div>
                    <div style={{fontSize:11, color:'#64748b'}}>{d.spoc_name}</div>
                  </td>
                  <td style={{padding:15, fontSize:12}}>{d.city}, {d.state}</td>
                  <td style={{padding:15, color:'#ffd60a'}}>
                    {d.fee_type === 'Flat' ? `₹${d.flat_value}` : `${d.percentage_value}%`}
                  </td>
                  <td style={{padding:15}}>
                    <button style={{background:'#2d333d', color:'#fff', padding:'4px 8px', border:'none', borderRadius:4, fontSize:10, marginRight:5, cursor:'pointer'}} onClick={() => alert('Agreement Attachment Feature Coming Soon!')}>📎 Attach</button>
                    <button style={{background:'#2d333d', color:'#fff', padding:'4px 8px', border:'none', borderRadius:4, fontSize:10, cursor:'pointer'}} onClick={() => alert('Direct Mail Feature Coming Soon!')}>✉️ Mail</button>
                  </td>
                  <td style={{padding:15}}>
                    <select value={d.stage} onChange={e => updateStage(d.id, e.target.value)} style={{background:'#0f1115', color: d.stage==='Won'?'#3dd68c':'#fff', border:'1px solid #333', padding:6, borderRadius:6}}>
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20}}>
          <div style={{background:'#1a1d24', padding:30, borderRadius:20, width:'100%', maxWidth:850, maxHeight:'90vh', overflowY:'auto'}}>
            <h2 style={{color:'#3dd68c'}}>New Client Mandate</h2>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:15}}>
               <div style={{gridColumn:'span 2'}}><label style={{fontSize:10}}>COMPANY NAME</label><input style={{width:'100%', padding:10, background:'#0f1115', border:'1px solid #333', color:'#fff'}} value={form.client_company} onChange={e=>setForm({...form, client_company:e.target.value})} /></div>
               <div><label style={{fontSize:10}}>SECTOR</label><input style={{width:'100%', padding:10, background:'#0f1115', border:'1px solid #333', color:'#fff'}} value={form.sector} onChange={e=>setForm({...form, sector:e.target.value})} /></div>
               <div><label style={{fontSize:10}}>CITY</label><input style={{width:'100%', padding:10, background:'#0f1115', border:'1px solid #333', color:'#fff'}} value={form.city} onChange={e=>setForm({...form, city:e.target.value})} /></div>
               <div><label style={{fontSize:10}}>STATE</label><input style={{width:'100%', padding:10, background:'#0f1115', border:'1px solid #333', color:'#fff'}} value={form.state} onChange={e=>setForm({...form, state:e.target.value})} /></div>
               <div><label style={{fontSize:10}}>PINCODE</label><input style={{width:'100%', padding:10, background:'#0f1115', border:'1px solid #333', color:'#fff'}} value={form.pincode} onChange={e=>setForm({...form, pincode:e.target.value})} /></div>
               <div><label style={{fontSize:10}}>SPOC NAME</label><input style={{width:'100%', padding:10, background:'#0f1115', border:'1px solid #333', color:'#fff'}} value={form.spoc_name} onChange={e=>setForm({...form, spoc_name:e.target.value})} /></div>
               <div><label style={{fontSize:10}}>SPOC CONTACT</label><input style={{width:'100%', padding:10, background:'#0f1115', border:'1px solid #333', color:'#fff'}} value={form.spoc_contact} onChange={e=>setForm({...form, spoc_contact:e.target.value})} /></div>
               <div><label style={{fontSize:10}}>SPOC EMAIL</label><input style={{width:'100%', padding:10, background:'#0f1115', border:'1px solid #333', color:'#fff'}} value={form.spoc_email} onChange={e=>setForm({...form, spoc_email:e.target.value})} /></div>
               <div><label style={{fontSize:10}}>BD OWNER</label><input style={{width:'100%', padding:10, background:'#0f1115', border:'1px solid #333', color:'#fff'}} value={form.bd_name} onChange={e=>setForm({...form, bd_name:e.target.value})} /></div>
               <div><label style={{fontSize:10}}>COMMERCIAL TYPE</label>
                  <select style={{width:'100%', padding:10, background:'#0f1115', border:'1px solid #333', color:'#fff'}} value={form.fee_type} onChange={e=>setForm({...form, fee_type:e.target.value})}>
                    <option value="Flat">Flat Fee</option>
                    <option value="Percentage">Percentage (%)</option>
                  </select>
               </div>
               <div><label style={{fontSize:10}}>VALUE</label><input style={{width:'100%', padding:10, background:'#0f1115', border:'1px solid #333', color:'#fff'}} value={form.fee_type==='Flat'?form.flat_value:form.percentage_value} onChange={e=>setForm({...form, [form.fee_type==='Flat'?'flat_value':'percentage_value']:e.target.value})} /></div>
            </div>
            <div style={{marginTop:20, display:'flex', gap:15}}>
              <button onClick={saveDeal} disabled={saving} style={{flex:2, background:'#3dd68c', color:'#000', padding:15, borderRadius:10, fontWeight:700, cursor:'pointer'}}>{saving?'Saving...':'Confirm Mandate'}</button>
              <button onClick={()=>setShowModal(false)} style={{flex:1, background:'transparent', border:'1px solid #444', color:'#fff', borderRadius:10}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}