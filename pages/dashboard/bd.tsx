import Layout from '../../src/components/Layout'
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      loadData()
    })
  }, [router])

  async function loadData() {
    setLoading(true)
    const { data: ds, error } = await supabase.from('bd_pipeline').select('*').order('created_at', { ascending: false })
    if (!error) setDeals(ds || [])
    setLoading(false)
  }

  const saveDeal = async () => {
    if (!form.client_company) return alert("Company Name is mandatory!")
    setSaving(true)
    const { error } = await supabase.from('bd_pipeline').insert([form])
    if (error) alert("Error saving: " + error.message)
    setSaving(false); setShowModal(false); loadData();
  }

  async function updateStage(id: string, stage: string) {
    const { error } = await supabase.from('bd_pipeline').update({ stage }).eq('id', id)
    if (!error) {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))
    } else {
      alert("Update failed: " + error.message)
    }
  }

  if (loading) return <div style={{padding:50, background:'#0f1115', color:'#3dd68c', minHeight:'100vh'}}>Loading Enterprise ERP...</div>

  return (
    <div style={{minHeight:'100vh', background:'#0f1115', color:'#e2e8f0', fontFamily:'Outfit, sans-serif'}}>
      <DashboardNav />
      <div style={{maxWidth:1400, margin:'0 auto', padding:'30px 20px'}}>
        
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
          <div>
            <h1 style={{margin:0, fontSize:28, fontWeight:700, color:'#fff'}}>BD Mandates & Clients</h1>
            <p style={{margin:5, color:'#94a3b8', fontSize:14}}>Manage company onboarding, SPOC details, and commercials.</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{background:'#3dd68c', color:'#000', padding:'12px 28px', borderRadius:10, fontWeight:700, border:'none', cursor:'pointer', boxShadow:'0 4px 15px rgba(61,214,140,0.3)'}}>+ New Mandate</button>
        </div>

        <div style={{background:'#1a1d24', borderRadius:16, overflow:'hidden', border:'1px solid #2d333d', boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
          <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
            <thead>
              <tr style={{background:'#252932', color:'#94a3b8', fontSize:11, textTransform:'uppercase', letterSpacing:'1px'}}>
                <th style={{padding:15}}>Company & Location</th>
                <th style={{padding:15}}>SPOC Details</th>
                <th style={{padding:15}}>Commercials</th>
                <th style={{padding:15}}>BD Owner</th>
                <th style={{padding:15}}>Stage</th>
              </tr>
            </thead>
            <tbody>
              {deals.map(d => (
                <tr key={d.id} style={{borderBottom:'1px solid #2d333d', transition:'0.2s'}} onMouseEnter={e=>e.currentTarget.style.background='#22262f'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:15}}>
                    <div style={{fontWeight:700, color:'#fff', fontSize:14}}>{d.client_company}</div>
                    <div style={{fontSize:11, color:'#64748b', marginTop:3}}>{d.city}, {d.state} {d.additional_cities && `| +${d.additional_cities}`}</div>
                  </td>
                  <td style={{padding:15}}>
                    <div style={{fontSize:13}}>{d.spoc_name}</div>
                    <div style={{fontSize:11, color:'#64748b'}}>{d.spoc_contact}</div>
                  </td>
                  <td style={{padding:15}}>
                    <div style={{color:'#ffd60a', fontWeight:600}}>{d.fee_type === 'Flat' ? `₹${Number(d.flat_value).toLocaleString()}` : `${d.percentage_value}% of CTC`}</div>
                    <div style={{fontSize:10, color:'#64748b'}}>{d.sector}</div>
                  </td>
                  <td style={{padding:15, fontSize:13}}>{d.bd_name}</td>
                  <td style={{padding:15}}>
                    <select value={d.stage} onChange={e => updateStage(d.id, e.target.value)} style={{background:'#0f1115', color: d.stage === 'Won' ? '#3dd68c' : '#fff', border:'1px solid #333', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {deals.length === 0 && <div style={{padding:50, textAlign:'center', color:'#64748b'}}>No mandates found. Start by adding a new one.</div>}
        </div>
      </div>

      {showModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20}}>
          <div style={{background:'#1a1d24', padding:35, borderRadius:20, width:'100%', maxWidth:900, maxHeight:'90vh', overflowY:'auto', border:'1px solid #3dd68c33'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:25}}>
              <h2 style={{margin:0, color:'#3dd68c'}}>New Client Mandate Form</h2>
              <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', color:'#64748b', fontSize:20, cursor:'pointer'}}>✕</button>
            </div>
            
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20}}>
               <div style={{gridColumn:'span 2'}}>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>COMPANY NAME *</label>
                 <input style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} placeholder="e.g. Reliance Industries" value={form.client_company} onChange={e=>setForm({...form, client_company:e.target.value})} />
               </div>
               <div>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>SECTOR</label>
                 <input style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} placeholder="e.g. IT/Manufacturing" value={form.sector} onChange={e=>setForm({...form, sector:e.target.value})} />
               </div>

               <div>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>PRIMARY CITY</label>
                 <input style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} placeholder="Mumbai" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} />
               </div>
               <div>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>STATE</label>
                 <input style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} placeholder="Maharashtra" value={form.state} onChange={e=>setForm({...form, state:e.target.value})} />
               </div>
               <div>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>PINCODE</label>
                 <input style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} placeholder="400001" value={form.pincode} onChange={e=>setForm({...form, pincode:e.target.value})} />
               </div>

               <div style={{gridColumn:'span 3'}}>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>ADDITIONAL RECRUITMENT CITIES</label>
                 <input style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} placeholder="Pune, Bangalore, Delhi (Comma separated)" value={form.additional_cities} onChange={e=>setForm({...form, additional_cities:e.target.value})} />
               </div>

               <div>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>SPOC NAME</label>
                 <input style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} placeholder="HR Manager Name" value={form.spoc_name} onChange={e=>setForm({...form, spoc_name:e.target.value})} />
               </div>
               <div>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>SPOC CONTACT</label>
                 <input style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} placeholder="Phone Number" value={form.spoc_contact} onChange={e=>setForm({...form, spoc_contact:e.target.value})} />
               </div>
               <div>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>SPOC EMAIL</label>
                 <input style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} placeholder="hr@company.com" value={form.spoc_email} onChange={e=>setForm({...form, spoc_email:e.target.value})} />
               </div>

               <div>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>BD OWNER</label>
                 <input style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} placeholder="Your Name" value={form.bd_name} onChange={e=>setForm({...form, bd_name:e.target.value})} />
               </div>
               <div>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>FEE STRUCTURE</label>
                 <select style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} value={form.fee_type} onChange={e=>setForm({...form, fee_type:e.target.value})}>
                   <option value="Flat">Flat Fee (₹)</option>
                   <option value="Percentage">Percentage (% of CTC)</option>
                 </select>
               </div>
               <div>
                 <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>COMMERCIAL VALUE</label>
                 <input type="number" style={{width:'100%', padding:12, background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff'}} placeholder={form.fee_type === 'Flat' ? "50000" : "8.33"} value={form.fee_type === 'Flat' ? form.flat_value : form.percentage_value} onChange={e => setForm({...form, [form.fee_type === 'Flat' ? 'flat_value' : 'percentage_value']: e.target.value})} />
               </div>
            </div>
            
            <div style={{marginTop:20}}>
              <label style={{fontSize:11, color:'#94a3b8', display:'block', marginBottom:8}}>AGREEMENT TERMS / REMARKS</label>
              <textarea style={{width:'100%', background:'#0f1115', border:'1px solid #2d333d', borderRadius:8, color:'#fff', padding:12}} rows={3} placeholder="Add any special conditions or remarks..." value={form.remarks} onChange={e=>setForm({...form, remarks:e.target.value})} />
            </div>
            
            <div style={{marginTop:30, display:'flex', gap:15}}>
              <button onClick={() => setShowModal(false)} style={{flex:1, background:'transparent', border:'1px solid #2d333d', color:'#fff', padding:15, borderRadius:10, cursor:'pointer'}}>Cancel</button>
              <button onClick={saveDeal} disabled={saving} style={{flex:2, background:'#3dd68c', color:'#000', border:'none', padding:15, borderRadius:10, fontWeight:700, cursor:'pointer'}}>{saving ? 'Saving...' : 'Confirm & Save Mandate'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}