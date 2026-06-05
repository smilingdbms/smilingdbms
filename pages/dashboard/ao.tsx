// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';

const PLACED = ['Joined Successfully'];
const DEAD   = ['Contacted - Not Interested','Interview Done - Rejected','Offer Declined','Did Not Join'];

function sColor(s) {
  if (PLACED.includes(s)) return '#10B981';
  if ((s||'').match(/Rejected|Declined|Not Interest/)) return '#EF4444';
  if ((s||'').includes('Interview')) return '#3B82F6';
  if ((s||'').includes('Offer')) return '#A855F7';
  return '#F59E0B';
}

// ── SVG Donut chart (segments by type) ──────────────────────────
function DonutChart({ data }) {
  const total = data.reduce((s,d)=>s+d.v,0);
  if(!total) return <div style={{textAlign:'center',padding:'30px 0',color:'var(--mu)',fontSize:12}}>No data yet</div>;
  let cum = 0;
  const R=60,cx=70,cy=70,stroke=14;
  const slices = data.map(d=>{
    const pct = d.v/total;
    const start = cum; cum+=pct;
    const a1=start*2*Math.PI-Math.PI/2, a2=cum*2*Math.PI-Math.PI/2;
    const x1=cx+R*Math.cos(a1),y1=cy+R*Math.sin(a1);
    const x2=cx+R*Math.cos(a2),y2=cy+R*Math.sin(a2);
    const large=pct>0.5?1:0;
    return {...d,d:`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`,pct};
  });
  return (
    <div style={{display:'flex',alignItems:'center',gap:18,flexWrap:'wrap'}}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {slices.map((s,i)=><path key={i} d={s.d} fill={s.c} opacity={0.9}/>)}
        <circle cx={cx} cy={cy} r={R-stroke} fill="var(--bg2)"/>
        <text x={cx} y={cy-6} textAnchor="middle" fontSize={20} fontWeight={800} fill="var(--tx)">{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontSize={9} fill="var(--mu)">TOTAL</text>
      </svg>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {slices.map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:10,height:10,borderRadius:3,background:s.c,flexShrink:0}}/>
            <span style={{fontSize:12,color:'var(--mu)'}}>{s.label}</span>
            <span style={{fontSize:12,fontWeight:700,color:'var(--tx)',marginLeft:'auto',paddingLeft:12}}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SVG Funnel ───────────────────────────────────────────────────
function FunnelChart({ stages }) {
  const max = Math.max(...stages.map(s=>s.v),1);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      {stages.map((s,i)=>(
        <div key={i}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--mu)',marginBottom:3}}>
            <span>{s.label}</span><span style={{fontWeight:700,color:'var(--tx)'}}>{s.v}</span>
          </div>
          <div style={{height:24,background:'var(--bg3)',borderRadius:6,overflow:'hidden',border:'1px solid var(--bd)'}}>
            <div style={{height:'100%',width:`${(s.v/max)*100}%`,background:s.c,borderRadius:6,minWidth:s.v?4:0,transition:'width 0.6s ease'}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AccountOwnerWorkspace() {
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [company, setCompany] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total:0, mandates:0, interviews:0, placements:0, pipeline:0, team:0 });

  useEffect(()=>{
    let off=false;
    (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){router.replace('/');return;}
      const {data:au}=await supabase.from('app_users').select('*').eq('id',user.id).single();
      if(off||!au){router.replace('/');return;}
      if(au.role==='job_seeker'){router.replace('/jobseeker');return;}
      setMe(au);

      if(au.company_id){
        const {data:co}=await supabase.from('companies').select('*').eq('id',au.company_id).single();
        if(!off)setCompany(co);
      }

      let prof=[];
      if(au.company_id){
        const {data}=await supabase.from('profiles').select('*')
          .or(`company_id.eq.${au.company_id},assigned_to.eq.${au.id},created_by.eq.${au.id}`)
          .order('created_at',{ascending:false});
        prof=(data||[]).filter(p=>!p.type||p.type==='Candidate');
      }else{
        const {data}=await supabase.from('profiles').select('*').or(`created_by.eq.${au.id},assigned_to.eq.${au.id}`).order('created_at',{ascending:false});
        prof=(data||[]).filter(p=>!p.type||p.type==='Candidate');
      }
      if(off)return;
      setCandidates(prof);

      const cid=au.company_id;
      const cnt=async(table,build)=>{
        try{let q=supabase.from(table).select('id',{count:'exact',head:true});if(cid)q=q.eq('company_id',cid);if(build)q=build(q);const{count}=await q;return count||0;}catch{return 0;}
      };
      const mandates=await cnt('job_descriptions',q=>q.eq('status','Open'));
      const interviews=await cnt('interviews');
      let team=0;
      if(cid){try{const{count}=await supabase.from('app_users').select('id',{count:'exact',head:true}).eq('company_id',cid);team=count||0;}catch{}}
      const placements=prof.filter(p=>PLACED.includes(p.status)).length;
      const pipeline=prof.filter(p=>!PLACED.includes(p.status)&&!DEAD.includes(p.status)).length;
      if(!off)setStats({total:prof.length,mandates,interviews,placements,pipeline,team});
      setLoading(false);
    })();
    return()=>{off=true;};
  },[]);

  const filtered=candidates.filter(c=>{
    if(!search)return true;
    const q=search.toLowerCase();
    return[c.name,c.mobile,c.email,c.role,c.city,c.skills].some(v=>(v||'').toLowerCase().includes(q));
  });

  // Derived data for charts
  const seg = [
    {label:'Students',   v:candidates.filter(c=>c.segment==='pursuing').length,    c:'#3B82F6'},
    {label:'Freshers',   v:candidates.filter(c=>c.segment==='fresher').length,     c:'#A855F7'},
    {label:'Experienced',v:candidates.filter(c=>c.segment==='experienced').length, c:'#10B981'},
  ];

  const statusGroups={
    'New / Sourced':       candidates.filter(c=>['New','Sourced','Added'].includes(c.status)||!c.status).length,
    'Screened':            candidates.filter(c=>(c.status||'').includes('Screen')).length,
    'Interview':           candidates.filter(c=>(c.status||'').includes('Interview')).length,
    'Offer':               candidates.filter(c=>(c.status||'').includes('Offer')).length,
    'Placed':              stats.placements,
  };
  const funnel=[
    {label:'New / Sourced', v:statusGroups['New / Sourced'], c:'#64748B'},
    {label:'Screened',      v:statusGroups['Screened'],      c:'#3B82F6'},
    {label:'Interview',     v:statusGroups['Interview'],     c:'#F59E0B'},
    {label:'Offer',         v:statusGroups['Offer'],         c:'#A855F7'},
    {label:'Placed ✓',      v:statusGroups['Placed'],        c:'#10B981'},
  ];

  const KPI=[
    {label:'Total Candidates', v:stats.total,      icon:'👥', c:'#3B82F6'},
    {label:'Active Mandates',  v:stats.mandates,   icon:'📋', c:'#F59E0B'},
    {label:'Interviews',       v:stats.interviews, icon:'🗓️', c:'#06B6D4'},
    {label:'Placements',       v:stats.placements, icon:'🏆', c:'#10B981'},
    {label:'In Pipeline',      v:stats.pipeline,   icon:'🔄', c:'#A855F7'},
    {label:'Team Members',     v:stats.team,       icon:'👤', c:'#EC4899'},
  ];

  const TABS=[
    {k:'overview',label:'Overview'},
    {k:'ats',     label:'Candidates'},
    {k:'crm',     label:'Client CRM'},
    {k:'billing', label:'Billing'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:`
        .ao-tab{padding:8px 16px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--mu);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .15s;}
        .ao-tab:hover{background:var(--bg3);}
        .ao-tab.on{background:var(--acbg);color:var(--ac);border-color:var(--bd2);}
        .ao-kpi{background:var(--bg2);border:1px solid var(--bd);border-radius:12px;padding:20px;display:flex;align-items:center;gap:14px;transition:box-shadow .15s;}
        .ao-kpi:hover{box-shadow:0 2px 12px rgba(0,0,0,0.08);}
        .ao-card{background:var(--bg2);border:1px solid var(--bd);border-radius:12px;padding:20px;}
        .ao-tbl{width:100%;border-collapse:collapse;}
        .ao-tbl th{background:var(--bg3);padding:11px 14px;text-align:left;font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:0.4px;font-weight:700;}
        .ao-tbl td{padding:12px 14px;border-bottom:1px solid var(--bd);font-size:13px;color:var(--tx);}
        .ao-tbl tr:last-child td{border-bottom:none;}
        .ao-tbl tbody tr:hover{background:var(--bg3);}
        .ao-badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;}
        @media(max-width:700px){
          .ao-grid-kpi{grid-template-columns:1fr 1fr !important;}
          .ao-grid-charts{grid-template-columns:1fr !important;}
          .ao-tbl{display:block;overflow-x:auto;}
        }
        @media(max-width:400px){.ao-grid-kpi{grid-template-columns:1fr !important;}}
      `}}/>

      <div style={{padding:'4px 2px 48px',maxWidth:1100}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{margin:0,fontSize:20,fontWeight:800,color:'var(--tx)'}}>
              {company?.name || 'My Workspace'}
            </h1>
            <div style={{fontSize:13,color:'var(--mu)',marginTop:2}}>Account Owner Dashboard</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>router.push('/dashboard/add-profile')} style={{background:'var(--ac)',color:'#fff',border:'none',padding:'9px 16px',borderRadius:8,fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:13}}>+ Add Profile</button>
            <button onClick={()=>router.push('/dashboard/master')} style={{background:'var(--bg2)',color:'var(--tx)',border:'1px solid var(--bd2)',padding:'9px 14px',borderRadius:8,fontWeight:600,cursor:'pointer',fontFamily:'inherit',fontSize:13}}>All Candidates →</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:6,marginBottom:22,flexWrap:'wrap',borderBottom:'1px solid var(--bd)',paddingBottom:12}}>
          {TABS.map(t=>(
            <button key={t.k} className={`ao-tab${tab===t.k?' on':''}`} onClick={()=>setTab(t.k)}>{t.label}</button>
          ))}
        </div>

        {loading?(
          <div style={{textAlign:'center',padding:60,color:'var(--mu)'}}>Loading…</div>
        ):<>

        {/* ── OVERVIEW TAB ── */}
        {tab==='overview'&&(
          <div>
            {/* KPI Grid */}
            <div className="ao-grid-kpi" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
              {KPI.map((k,i)=>(
                <div key={i} className="ao-kpi">
                  <div style={{width:44,height:44,borderRadius:10,background:`${k.c}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{k.icon}</div>
                  <div>
                    <div style={{fontSize:11,color:'var(--mu)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.3px'}}>{k.label}</div>
                    <div style={{fontSize:28,fontWeight:900,color:k.c,lineHeight:1.1}}>{k.v}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="ao-grid-charts" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>

              {/* Candidate Breakdown donut */}
              <div className="ao-card">
                <div style={{fontSize:13,fontWeight:700,color:'var(--tx)',marginBottom:14}}>Candidate Breakdown</div>
                <DonutChart data={seg}/>
              </div>

              {/* Pipeline Funnel */}
              <div className="ao-card">
                <div style={{fontSize:13,fontWeight:700,color:'var(--tx)',marginBottom:14}}>Recruitment Funnel</div>
                <FunnelChart stages={funnel}/>
              </div>
            </div>

            {/* Recent candidates */}
            <div className="ao-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,color:'var(--tx)'}}>Recent Candidates</div>
                <button onClick={()=>setTab('ats')} style={{fontSize:12,color:'var(--ac)',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>View all →</button>
              </div>
              {candidates.length===0?(
                <div style={{textAlign:'center',padding:'30px 0',color:'var(--mu)',fontSize:13}}>No candidates yet. <span onClick={()=>router.push('/dashboard/add-profile')} style={{color:'var(--ac)',cursor:'pointer',fontWeight:600}}>Add one →</span></div>
              ):(
                <table className="ao-tbl">
                  <thead><tr><th>Name</th><th>Role</th><th>Location</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {candidates.slice(0,8).map(c=>(
                      <tr key={c.id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:9}}>
                            <div style={{width:30,height:30,borderRadius:'50%',background:`var(--bg3)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,overflow:'hidden',flexShrink:0}}>
                              {c.photo_url?<img src={c.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(c.name||'?').charAt(0)}
                            </div>
                            <span style={{fontWeight:600}}>{c.name||'Unnamed'}</span>
                          </div>
                        </td>
                        <td style={{color:'var(--mu)',fontSize:12}}>{c.role||'—'}</td>
                        <td style={{color:'var(--mu)',fontSize:12}}>📍 {c.city||'—'}</td>
                        <td><span className="ao-badge" style={{background:`${sColor(c.status)}18`,color:sColor(c.status)}}>{c.status||'New'}</span></td>
                        <td><button onClick={()=>router.push(`/dashboard/master?focus=${c.id}`)} style={{background:'none',border:'1px solid var(--bd2)',color:'var(--ac)',padding:'5px 11px',borderRadius:6,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:600}}>View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quick actions */}
            <div style={{display:'flex',gap:10,marginTop:16,flexWrap:'wrap'}}>
              {[
                {label:'➕ Add Profile',     fn:()=>router.push('/dashboard/add-profile')},
                {label:'📋 Manage Mandates', fn:()=>router.push('/dashboard/jobs')},
                {label:'🗓️ Interviews',      fn:()=>router.push('/dashboard/interviews')},
                {label:'👥 Team',            fn:()=>router.push('/dashboard/admin')},
                {label:'🏢 BD / Clients',   fn:()=>router.push('/dashboard/bd')},
              ].map((a,i)=>(
                <button key={i} onClick={a.fn} style={{background:'var(--bg2)',color:'var(--tx)',border:'1px solid var(--bd)',padding:'9px 15px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:600}}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── CANDIDATES TAB ── */}
        {tab==='ats'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:12}}>
              <div>
                <div style={{fontSize:16,fontWeight:700}}>Candidates</div>
                <div style={{fontSize:12,color:'var(--mu)',marginTop:2}}>{company?.name||'Your company'} — {candidates.length} total</div>
              </div>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, mobile, skill…" style={{background:'var(--bg2)',border:'1px solid var(--bd2)',padding:'9px 14px',borderRadius:8,color:'var(--tx)',width:240,fontFamily:'inherit',fontSize:13}}/>
            </div>

            {/* Mini segment pills */}
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              {[
                {label:`All (${candidates.length})`,        c:'#3B82F6'},
                {label:`Students (${seg[0].v})`,            c:'#3B82F6'},
                {label:`Freshers (${seg[1].v})`,            c:'#A855F7'},
                {label:`Experienced (${seg[2].v})`,         c:'#10B981'},
                {label:`Placed (${stats.placements})`,      c:'#10B981'},
              ].map((p,i)=>(
                <span key={i} style={{background:`${p.c}14`,color:p.c,border:`1px solid ${p.c}30`,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600}}>{p.label}</span>
              ))}
            </div>

            {filtered.length===0?(
              <div style={{textAlign:'center',padding:50,color:'var(--mu)',background:'var(--bg2)',borderRadius:12,border:'1px solid var(--bd)'}}>
                <div style={{fontSize:32,marginBottom:8}}>📋</div>
                <div style={{fontSize:14,fontWeight:600}}>No candidates found</div>
              </div>
            ):(
              <div className="ao-card" style={{padding:0,overflow:'hidden'}}>
                <table className="ao-tbl">
                  <thead>
                    <tr><th>Candidate</th><th>Experience / CTC</th><th>Skills</th><th>Location</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(c=>(
                      <tr key={c.id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:9}}>
                            <div style={{width:32,height:32,borderRadius:'50%',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,overflow:'hidden',flexShrink:0}}>
                              {c.photo_url?<img src={c.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(c.name||'?').charAt(0)}
                            </div>
                            <div>
                              <div style={{fontWeight:700,fontSize:13}}>{c.name||'Unnamed'}</div>
                              <div style={{fontSize:11,color:'var(--mu)'}}>{c.role||c.segment||'—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{fontWeight:600,fontSize:13}}>{c.experience?`${c.experience} yrs`:(c.segment==='pursuing'?'Student':c.segment==='fresher'?'Fresher':'—')}</div>
                          <div style={{fontSize:11,color:'var(--mu)'}}>{c.expected_ctc?`₹${c.expected_ctc} LPA`:'—'}</div>
                        </td>
                        <td style={{fontSize:12,color:'var(--mu)'}}>{(c.skills||'').split(',').slice(0,3).join(', ')||'—'}</td>
                        <td style={{fontSize:12}}>📍 {c.city||'—'}</td>
                        <td><span className="ao-badge" style={{background:`${sColor(c.status)}18`,color:sColor(c.status)}}>{c.status||'New'}</span></td>
                        <td><button onClick={()=>router.push(`/dashboard/master?focus=${c.id}`)} style={{background:'var(--ac)',color:'#fff',border:'none',padding:'6px 12px',borderRadius:6,fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:12}}>View →</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CRM / BILLING TABS ── */}
        {['crm','billing'].includes(tab)&&(
          <div style={{display:'flex',height:'45vh',alignItems:'center',justifyContent:'center',flexDirection:'column',color:'var(--mu)',background:'var(--bg2)',borderRadius:12,border:'1px solid var(--bd)'}}>
            <div style={{fontSize:44,marginBottom:14}}>🚧</div>
            <div style={{fontSize:16,fontWeight:700,color:'var(--tx)'}}>{tab==='crm'?'Client CRM':'Billing & Invoices'}</div>
            <div style={{fontSize:13,marginTop:8}}>Coming soon.</div>
            {tab==='crm'&&<button onClick={()=>router.push('/dashboard/companies')} style={{marginTop:16,background:'var(--ac)',color:'#fff',border:'none',padding:'9px 18px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Open Companies →</button>}
          </div>
        )}

        </>}
      </div>
    </>
  );
}
