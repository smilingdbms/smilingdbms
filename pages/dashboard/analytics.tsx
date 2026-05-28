// @ts-nocheck
import { applyTheme, getSavedTheme } from '../../src/components/theme'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

export default function Analytics() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      loadData(session.user)
    })
  }, [router])

  async function loadData(u: any) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)
    // Profiles: Super Admin sees all, others see their company only
    let q = supabase.from('profiles').select('*')
    if (!['super_admin', 'platform_admin'].includes(au?.role)) {
      q = q.eq('company_id', au?.company_id)
    }
    const { data: ps } = await q

    // Leaderboard: Super Admin sees all, others see their company only
    let uq = supabase.from('app_users').select('*').order('points', { ascending: false })
    if (!['super_admin', 'platform_admin'].includes(au?.role)) {
      uq = uq.eq('company_id', au?.company_id)
    }
    const { data: us } = await uq
    setProfiles(ps || [])
    setUsers(us || [])
    setLoading(false)
  }

  const total = profiles.length
  const byStatus = profiles.reduce((acc: any, p) => { acc[p.status||'New'] = (acc[p.status||'New']||0)+1; return acc }, {})
  const byIndustry = profiles.reduce((acc: any, p) => { if(p.industry) acc[p.industry] = (acc[p.industry]||0)+1; return acc }, {})
  const byCity = profiles.reduce((acc: any, p) => { if(p.city) acc[p.city] = (acc[p.city]||0)+1; return acc }, {})
  const placed = byStatus['Placed']||0
  const placementRate = total > 0 ? Math.round((placed/total)*100) : 0

  const STATUS_C: any = { 'New':'var(--mu)','Contacted':'#7ab3ff','Screening':'#ffb347','Shortlisted':'#3dd68c','Interview Scheduled':'#48cae4','Offer Made':'#c77dff','Placed':'#6fcf6f','Rejected':'#ff6b6b','On Hold':'var(--mu)' }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',color:'var(--tx)'}}>Loading...</div>

  return (
    <>
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--tx)',fontFamily:'Outfit,Inter,sans-serif'}}>
      
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box}`}</style>
      

      <div style={{padding:'24px',maxWidth:1200,margin:'0 auto'}}>
        <h1 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Analytics & Reports</h1>
        <p style={{fontSize:13,color:'var(--mu)',marginBottom:24}}>Performance overview for your recruitment pipeline</p>

        {/* Key Metrics */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
          {[
            {l:'Total Profiles',v:total,c:'#6c8cff',icon:'👥'},
            {l:'Placed',v:placed,c:'#3dd68c',icon:'🎉'},
            {l:'Placement Rate',v:placementRate+'%',c:'#ffd60a',icon:'📈'},
            {l:'In Pipeline',v:(byStatus['Screening']||0)+(byStatus['Interview Scheduled']||0)+(byStatus['Offer Made']||0),c:'#48cae4',icon:'⚡'},
          ].map(s=>(
            <div key={s.l} style={{background:'var(--bg2)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:20}}>
              <div style={{fontSize:24,marginBottom:8}}>{s.icon}</div>
              <div style={{fontSize:28,fontWeight:700,color:s.c,marginBottom:4}}>{s.v}</div>
              <div style={{fontSize:11,fontWeight:600,color:'var(--mu)',textTransform:'uppercase',letterSpacing:1}}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          {/* Status Breakdown */}
          <div style={{background:'var(--bg2)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Pipeline by Status</div>
            {Object.entries(byStatus).sort((a,b)=>b[1]-a[1]).map(([status, count]: any) => (
              <div key={status} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:12,color:STATUS_C[status]||'var(--mu)'}}>{status}</span>
                  <span style={{fontSize:12,fontWeight:600}}>{count} ({Math.round(count/total*100)}%)</span>
                </div>
                <div style={{height:6,background:'rgba(255,255,255,0.06)',borderRadius:3}}>
                  <div style={{height:'100%',borderRadius:3,background:STATUS_C[status]||'var(--mu)',width:`${Math.round(count/total*100)}%`,transition:'width 0.5s'}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Team Leaderboard */}
          <div style={{background:'var(--bg2)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>🏆 Team Leaderboard</div>
            {users.slice(0,8).map((u, i) => (
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:i===0?'rgba(255,214,10,0.2)':i===1?'rgba(200,200,200,0.15)':i===2?'rgba(180,100,0,0.2)':'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:i===0?'#ffd60a':i===1?'#ccc':i===2?'#cd7f32':'var(--mu)'}}>
                  {i+1}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{u.full_name}</div>
                  <div style={{fontSize:11,color:'var(--mu)'}}>{u.role}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#ffd60a'}}>{u.points||0}</div>
                  <div style={{fontSize:10,color:'var(--mu)'}}>pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          {/* Top Industries */}
          <div style={{background:'var(--bg2)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Top Industries</div>
            {Object.entries(byIndustry).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([ind, count]: any) => (
              <div key={ind} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:13}}>
                <span style={{color:'var(--tx)'}}>{ind}</span>
                <span style={{color:'#6c8cff',fontWeight:600}}>{count}</span>
              </div>
            ))}
            {Object.keys(byIndustry).length===0&&<div style={{color:'var(--mu2)',fontSize:13}}>No industry data yet</div>}
          </div>

          {/* Top Cities */}
          <div style={{background:'var(--bg2)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Top Cities</div>
            {Object.entries(byCity).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([city, count]: any) => (
              <div key={city} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:13}}>
                <span style={{color:'var(--tx)'}}>{city}</span>
                <span style={{color:'#3dd68c',fontWeight:600}}>{count}</span>
              </div>
            ))}
            {Object.keys(byCity).length===0&&<div style={{color:'var(--mu2)',fontSize:13}}>No city data yet</div>}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
