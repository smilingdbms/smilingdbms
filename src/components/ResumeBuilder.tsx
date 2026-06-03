// @ts-nocheck
/* eslint-disable */
import React, { useState, useRef } from 'react';

// ══════════════════════════════════════════════════════════════════
// RESUME BUILDER v2 — 6 premium templates, full candidate detail,
// recruitment snapshot, color themes, live preview, PDF export.
// Shared by jobseeker (own) + recruiter (candidate). Client-side only.
// jsPDF + html2canvas from CDN (no npm install). Brand = one constant.
// ══════════════════════════════════════════════════════════════════

const BRAND = 'RecruitBase Pro';

const COLORS = [
  { name: 'Indigo', hex: '#4f46e5' }, { name: 'Royal', hex: '#2563eb' },
  { name: 'Teal', hex: '#0d9488' },   { name: 'Emerald', hex: '#059669' },
  { name: 'Violet', hex: '#7c3aed' }, { name: 'Rose', hex: '#e11d48' },
  { name: 'Amber', hex: '#d97706' },  { name: 'Cyan', hex: '#0891b2' },
  { name: 'Slate', hex: '#334155' },  { name: 'Crimson', hex: '#be123c' },
];

const TEMPLATES = [
  { id: 'executive',   name: 'Executive' },
  { id: 'aurora',      name: 'Aurora' },
  { id: 'timeline',    name: 'Timeline' },
  { id: 'compact',     name: 'Compact Pro' },
  { id: 'minimal',     name: 'Minimal' },
  { id: 'bold',        name: 'Bold Header' },
];

// ---------- helpers ----------
function arr(v){return Array.isArray(v)?v:[]}
function csv(v){return (v||'').split(',').map(s=>s.trim()).filter(Boolean)}
function val(v,d=''){return (v===null||v===undefined||v==='')?d:v}
function shade(hex,p){ // darken/lighten hex by p (-1..1)
  try{const n=parseInt(hex.slice(1),16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  r=Math.round(r+(p<0?r:255-r)*p);g=Math.round(g+(p<0?g:255-g)*p);b=Math.round(b+(p<0?b:255-b)*p);
  return `rgb(${r},${g},${b})`}catch{return hex}}
function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`))return res(true);const s=document.createElement('script');s.src=src;s.onload=()=>res(true);s.onerror=()=>rej(new Error('fail'));document.body.appendChild(s)})}

const MONTHS=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function period(w){
  const f=[MONTHS[+w.from_month]||'', w.from_year||''].filter(Boolean).join(' ');
  const t=w.current?'Present':[MONTHS[+w.to_month]||'', w.to_year||''].filter(Boolean).join(' ');
  return [f,t].filter(Boolean).join(' – ');
}
function eduLine(e){
  const course=e.course==='Other'?(e.course_custom||'Other'):(e.course||e.level||'');
  const branch=e.branch==='Other'?(e.branch_custom||''):(e.branch||'');
  const t=[course,branch].filter(Boolean).join(' — ');
  const yr=e.year||(e.study_status==='pursuing'?(e.current_period||'Pursuing'):'');
  const grade=e.percentage_or_cgpa||'';
  return {t,inst:e.institution||'',yr,grade};
}
function bullets(w){
  if(Array.isArray(w.bullets)) return w.bullets.filter(Boolean);
  if(typeof w.bullets==='string'&&w.bullets.trim()) return w.bullets.split('\n').map(s=>s.replace(/^[•\-\s]+/,'').trim()).filter(Boolean);
  if(w.desc||w.description) return [w.desc||w.description];
  return [];
}

// build full data from profile
function build(p){
  const ctc=(v)=>{ if(!v&&v!==0)return ''; return `₹${v} LPA` };
  return {
    name:val(p.name,'Your Name'), role:val(p.role||p.designation),
    email:val(p.email), mobile:p.mobile?`${p.country_code||''} ${p.mobile}`.trim():'',
    city:val(p.city)===' Other'?val(p.other_city):val(p.city||p.other_city),
    state:val(p.state), address:val(p.address), pincode:val(p.pincode),
    linkedin:val(p.linkedin), github:val(p.github), age:val(p.age), gender:val(p.gender),
    summary:val(p.ai_summary||p.summary),
    segment:val(p.segment),
    experience:val(p.experience||p.total_experience),
    relevant:val(p.relevant_experience),
    current_company:val(p.current_company),
    current_ctc:ctc(p.current_ctc), expected_ctc:ctc(p.expected_ctc),
    notice:val(p.notice_period), industry:val(p.industry),
    emp_type:val(p.employment_type), job_type:val(p.job_type),
    work_mode:val(p.work_mode), availability:val(p.availability),
    relocate:p.willing_to_relocate?'Yes':'', reason:val(p.reason_for_change),
    looking_for:val(p.looking_for), internship_dur:val(p.internship_duration),
    stipend:val(p.stipend_expected_range||p.stipend_expected),
    immediate:p.available_immediately?'Immediate':'',
    skills:csv(p.skills), languages:csv(p.languages),
    work:arr(p.work_experiences), education:arr(p.education),
    achievements:arr(p.achievements),
    certifications:typeof p.certifications==='string'?csv(p.certifications):arr(p.certifications),
    qualification:val(p.qualification), college:val(p.college),
    graduation_year:val(p.graduation_year),
    internship_details:val(p.internship_details),
    photo:val(p.photo_url),
  };
}

// recruitment snapshot key-values (only non-empty), segment-aware
function snapshot(d){
  const out=[];
  const add=(k,v)=>{ if(v) out.push({k,v}) };
  add('Experience', d.experience?`${d.experience} yrs`:'');
  add('Current Company', d.current_company);
  add('Industry', d.industry);
  add('Current CTC', d.current_ctc);
  add('Expected CTC', d.expected_ctc);
  add('Notice Period', d.notice);
  add('Location', [d.city,d.state].filter(Boolean).join(', '));
  add('Work Mode', d.work_mode);
  add('Employment', d.emp_type);
  add('Job Type', d.job_type);
  add('Availability', d.availability||d.immediate);
  add('Relocate', d.relocate);
  add('Looking For', d.looking_for);
  add('Duration', d.internship_dur);
  add('Stipend', d.stipend);
  return out;
}
function contactItems(d){ return [d.email,d.mobile,[d.city,d.state].filter(Boolean).join(', '),d.linkedin,d.github,d.age?`Age: ${d.age}`:'',d.gender].filter(Boolean) }

// ══════════════════════════ MAIN ══════════════════════════
export default function ResumeBuilder({ profile, onClose }){
  const d = build(profile||{});
  const [tpl,setTpl]=useState('executive');
  const [color,setColor]=useState('#4f46e5');
  const [busy,setBusy]=useState(false);
  const [menu,setMenu]=useState(false);
  const ref=useRef(null);

  const fname=(d.name||'resume').replace(/\s+/g,'_');

  function downloadPDF(){
    setMenu(false);
    const inner=ref.current?.outerHTML||'';
    const w=window.open('','_blank');
    if(!w){ alert('Popup block hua. Browser me popups allow karein.'); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset='utf-8'><title>${d.name} CV</title>
      <style>
        @page{ size:A4; margin:0; }
        *{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
        html,body{ margin:0; padding:0; background:#fff; }
        .sheet{ width:794px; margin:0 auto; }
        @media print{ .sheet{ width:100%; } }
      </style></head>
      <body><div class="sheet">${inner}</div>
      <script>window.onload=function(){ setTimeout(function(){ window.print(); }, 350); };</script>
      </body></html>`);
    w.document.close();
  }

  function downloadWord(){
    const html=`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${d.name} CV</title></head><body>${ref.current?.innerHTML||''}</body></html>`;
    const blob=new Blob(['\ufeff'+html],{type:'application/msword'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${fname}_CV.doc`; a.click(); URL.revokeObjectURL(url); setMenu(false);
  }

  function downloadWebsite(){
    const inner=ref.current?.outerHTML||'';
    const html=`<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>${d.name} — CV</title><style>body{margin:0;background:#e9e9ef;display:flex;justify-content:center;padding:24px 8px;font-family:Arial,Helvetica,sans-serif}</style></head><body>${inner}</body></html>`;
    const blob=new Blob([html],{type:'text/html'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${fname}_CV.html`; a.click(); URL.revokeObjectURL(url); setMenu(false);
  }

  async function downloadPPTX(){
    setMenu(false); setBusy(true);
    try{
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.js');
      const P=window.PptxGenJS||window.pptxgen;
      if(!P) throw new Error('lib');
      const pptx=new P();
      const W=10, Ht=5.63; // default 10x5.63 inches (16:9)
      const hex=color.replace('#','');
      const head=(s,title)=>{ s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:W,h:0.7,fill:{color:hex}}); s.addText(title,{x:0.4,y:0.1,w:W-0.8,h:0.5,fontSize:20,bold:true,color:'FFFFFF'}); };
      let s=pptx.addSlide(); s.background={color:hex};
      s.addText(d.name,{x:0.5,y:1.7,w:9,h:0.9,fontSize:40,bold:true,color:'FFFFFF'});
      if(d.role) s.addText(d.role,{x:0.5,y:2.6,w:9,h:0.5,fontSize:18,color:'FFFFFF'});
      s.addText(contactItems(d).join('   |   '),{x:0.5,y:4.9,w:9,h:0.4,fontSize:10,color:'FFFFFF'});
      const snap=snapshot(d);
      if(snap.length||d.summary){ s=pptx.addSlide(); head(s,'Overview');
        if(d.summary) s.addText(d.summary,{x:0.4,y:0.9,w:9.2,h:1.3,fontSize:12,color:'333333',valign:'top'});
        if(snap.length){ const rows=snap.map(x=>[{text:x.k+':',options:{bold:true,color:hex}},{text:String(x.v),options:{color:'333333'}}]);
          s.addTable(rows,{x:0.4,y:2.3,w:9.2,fontSize:11,colW:[2.4,6.8],border:{type:'solid',color:'EEEEEE',pt:1}}); } }
      if(d.work.length){ s=pptx.addSlide(); head(s,'Experience'); let y=0.9;
        d.work.forEach(w=>{ if(y>5)return; s.addText(`${w.role||''} — ${w.company||''}`,{x:0.4,y,w:7,h:0.3,fontSize:13,bold:true,color:'222222'});
          s.addText(period(w),{x:7.4,y,w:2.2,h:0.3,fontSize:10,color:'888888',align:'right'}); y+=0.35;
          const bl=bullets(w).slice(0,5); if(bl.length){ s.addText(bl.map(b=>({text:b,options:{bullet:true,fontSize:10,color:'444444'}})),{x:0.6,y,w:9,h:bl.length*0.26}); y+=bl.length*0.27+0.08; } }); }
      if(d.education.length||d.skills.length){ s=pptx.addSlide(); head(s,'Education & Skills'); let y=0.9;
        d.education.forEach(ed=>{ const e=eduLine(ed); s.addText(e.t,{x:0.4,y,w:9,h:0.3,fontSize:13,bold:true}); s.addText(`${e.inst} ${e.yr} ${e.grade?'· '+e.grade:''}`,{x:0.4,y:y+0.28,w:9,h:0.26,fontSize:10,color:'666666'}); y+=0.65; });
        if(d.skills.length){ s.addText('Skills',{x:0.4,y:y+0.1,w:9,h:0.3,fontSize:14,bold:true,color:hex}); s.addText(d.skills.join('   •   '),{x:0.4,y:y+0.5,w:9.2,h:1,fontSize:11,color:'333333'}); } }
      if(d.achievements.length){ s=pptx.addSlide(); head(s,'Achievements'); s.addText(d.achievements.map(a=>({text:listText(a),options:{bullet:true,fontSize:12,color:'333333'}})),{x:0.5,y:0.9,w:9,h:4}); }
      await pptx.writeFile({fileName:`${fname}_CV.pptx`});
    }catch(e){ alert('Presentation generate nahi hua. Dobara try karein ya PDF/Word use karein.'); }
    setBusy(false);
  }

  const T={executive:Executive,aurora:Aurora,timeline:Timeline,compact:Compact,minimal:Minimal,bold:Bold}[tpl];

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:9999,display:'flex',flexDirection:'column'}}>
      <div style={{background:'#15151f',padding:'12px 18px',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',borderBottom:'1px solid #2a2a40'}}>
        <strong style={{color:'#fff',fontSize:15}}>Resume Builder</strong>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {TEMPLATES.map(t=>(
            <button key={t.id} onClick={()=>setTpl(t.id)} style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${tpl===t.id?color:'#3a3a55'}`,background:tpl===t.id?color:'transparent',color:tpl===t.id?'#fff':'#aab',cursor:'pointer',fontSize:12,fontWeight:600}}>{t.name}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:5,alignItems:'center'}}>
          {COLORS.map(c=>(
            <button key={c.hex} onClick={()=>setColor(c.hex)} title={c.name} style={{width:22,height:22,borderRadius:'50%',background:c.hex,border:color===c.hex?'3px solid #fff':'2px solid #444',cursor:'pointer',padding:0}}/>
          ))}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8,position:'relative'}}>
          <button onClick={()=>setMenu(m=>!m)} disabled={busy} style={{background:color,color:'#fff',border:'none',padding:'8px 18px',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:13,opacity:busy?0.6:1}}>{busy?'Generating…':'⬇ Download ▾'}</button>
          {menu&&<div style={{position:'absolute',top:42,right:42,background:'#1e1e2e',border:'1px solid #3a3a55',borderRadius:10,padding:6,minWidth:180,zIndex:20,boxShadow:'0 8px 30px rgba(0,0,0,0.5)'}}>
            {[['📄 PDF',downloadPDF],['📝 Word (.doc)',downloadWord],['🌐 Website (.html)',downloadWebsite],['📊 Presentation (.pptx)',downloadPPTX]].map(([label,fn]:any,i)=>(
              <button key={i} onClick={fn} style={{display:'block',width:'100%',textAlign:'left',background:'transparent',color:'#dde',border:'none',padding:'9px 12px',borderRadius:7,cursor:'pointer',fontSize:13,fontFamily:'inherit'}} onMouseEnter={e=>e.currentTarget.style.background='#2a2a40'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{label}</button>
            ))}
          </div>}
          <button onClick={onClose} style={{background:'transparent',color:'#fff',border:'1px solid #3a3a55',padding:'8px 14px',borderRadius:8,cursor:'pointer',fontSize:13}}>Close</button>
        </div>
      </div>
      <div style={{flex:1,overflow:'auto',padding:'24px 12px',display:'flex',justifyContent:'center',background:'#454556'}}>
        <div ref={ref} style={{width:794,minHeight:1123,background:'#fff',color:'#1f2430',fontFamily:'Arial,Helvetica,sans-serif'}}>
          <T d={d} c={color}/>
        </div>
      </div>
    </div>
  );
}

// ──────────── shared bits ────────────
function Foot(){return <div style={{textAlign:'center',fontSize:8,color:'#c2c2cc',padding:'10px 0 6px',letterSpacing:0.5}}>Created with {BRAND}</div>}
function Work({d,c,light}){ if(!d.work.length)return null; return d.work.map((w,i)=>{
  const bl=bullets(w);
  return (<div key={i} style={{marginBottom:11}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8}}>
      <div style={{fontSize:12.5,fontWeight:700}}>{w.role||'Role'}</div>
      <div style={{fontSize:10.5,color:light?'rgba(255,255,255,0.8)':'#888',whiteSpace:'nowrap'}}>{period(w)}</div>
    </div>
    {w.company&&<div style={{fontSize:11.5,color:c,fontWeight:600,marginTop:1}}>{w.company}</div>}
    {bl.map((b,j)=><div key={j} style={{fontSize:11,color:light?'rgba(255,255,255,0.85)':'#444',marginTop:3,lineHeight:1.45,paddingLeft:10,position:'relative'}}><span style={{position:'absolute',left:0,color:c}}>•</span>{b}</div>)}
  </div>);
})}
function Edu({d,c}){ if(!d.education.length)return null; return d.education.map((ed,i)=>{const e=eduLine(ed);return(
  <div key={i} style={{marginBottom:8}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:8}}><b style={{fontSize:12}}>{e.t}</b><span style={{fontSize:10.5,color:'#888',whiteSpace:'nowrap'}}>{e.yr}</span></div>
    {(e.inst||e.grade)&&<div style={{fontSize:11,color:'#666'}}>{e.inst}{e.grade?` · ${e.grade}`:''}</div>}
  </div>);})}
function listText(a){return typeof a==='string'?a:(a.title||a.text||a.name||'')}

// ──────────── 1. EXECUTIVE ────────────
function Executive({d,c}){
  const snap=snapshot(d);
  const H=({children})=><div style={{fontSize:12.5,fontWeight:800,color:c,letterSpacing:1,textTransform:'uppercase',borderBottom:`2px solid ${c}`,paddingBottom:3,margin:'15px 0 8px'}}>{children}</div>;
  return (<div style={{padding:'40px 46px',fontFamily:'Georgia,serif',display:'flex',flexDirection:'column',minHeight:1123}}>
    <div style={{flex:1}}>
      <div style={{borderBottom:`3px double ${c}`,paddingBottom:12,marginBottom:4}}>
        <div style={{fontSize:30,fontWeight:800,letterSpacing:1}}>{d.name}</div>
        {d.role&&<div style={{fontSize:14,color:c,fontWeight:600,marginTop:2,fontStyle:'italic'}}>{d.role}</div>}
        <div style={{marginTop:8,fontSize:11,color:'#555',lineHeight:1.7,fontFamily:'Arial'}}>{contactItems(d).join('   |   ')}</div>
      </div>
      {snap.length>0&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px 24px',margin:'12px 0',padding:'12px 16px',background:`${c}0e`,borderRadius:8,fontFamily:'Arial'}}>
        {snap.map((s,i)=><div key={i} style={{fontSize:11,padding:'2px 0'}}><span style={{color:'#888'}}>{s.k}: </span><b>{s.v}</b></div>)}
      </div>}
      {d.summary&&<><H>Profile</H><div style={{fontSize:11.5,lineHeight:1.6,color:'#333',fontFamily:'Arial'}}>{d.summary}</div></>}
      {d.work.length>0&&<><H>Professional Experience</H><div style={{fontFamily:'Arial'}}><Work d={d} c={c}/></div></>}
      {d.education.length>0&&<><H>Education</H><div style={{fontFamily:'Arial'}}><Edu d={d} c={c}/></div></>}
      {d.skills.length>0&&<><H>Core Skills</H><div style={{display:'flex',flexWrap:'wrap',gap:6,fontFamily:'Arial'}}>{d.skills.map((s,i)=><span key={i} style={{fontSize:11,background:`${c}16`,color:c,padding:'3px 11px',borderRadius:4,fontWeight:600}}>{s}</span>)}</div></>}
      {d.achievements.length>0&&<><H>Achievements</H><div style={{fontFamily:'Arial'}}>{d.achievements.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#333',marginBottom:3,paddingLeft:10,position:'relative'}}><span style={{position:'absolute',left:0,color:c}}>•</span>{listText(a)}</div>)}</div></>}
      {d.certifications.length>0&&<><H>Certifications</H><div style={{fontFamily:'Arial'}}>{d.certifications.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#333',marginBottom:3}}>• {listText(a)}</div>)}</div></>}
      {d.languages.length>0&&<><H>Languages</H><div style={{fontSize:11.5,color:'#333',fontFamily:'Arial'}}>{d.languages.join('  ·  ')}</div></>}
    </div>
    <Foot/>
  </div>);
}

// ──────────── 2. AURORA (gradient sidebar) ────────────
function Aurora({d,c}){
  const snap=snapshot(d);
  const SH=({children})=><div style={{fontSize:10.5,fontWeight:800,color:'#fff',textTransform:'uppercase',letterSpacing:1.2,margin:'16px 0 7px',opacity:0.95}}>{children}</div>;
  const MH=({children})=><div style={{fontSize:13,fontWeight:800,color:c,textTransform:'uppercase',letterSpacing:0.5,margin:'15px 0 7px',display:'flex',alignItems:'center',gap:8}}><span style={{width:18,height:3,background:c,borderRadius:2}}/>{children}</div>;
  return (<div style={{display:'flex',minHeight:1123}}>
    <div style={{width:262,background:`linear-gradient(160deg, ${c}, ${shade(c,-0.4)})`,color:'#fff',padding:'34px 22px',display:'flex',flexDirection:'column'}}>
      <div style={{flex:1}}>
        {d.photo&&<img src={d.photo} crossOrigin="anonymous" style={{width:104,height:104,borderRadius:'50%',objectFit:'cover',border:'3px solid rgba(255,255,255,0.55)',marginBottom:14}}/>}
        <SH>Contact</SH><div style={{fontSize:11,lineHeight:1.8}}>{contactItems(d).map((x,i)=><div key={i} style={{wordBreak:'break-word'}}>{x}</div>)}</div>
        {snap.length>0&&<><SH>Quick Facts</SH>{snap.slice(0,8).map((s,i)=><div key={i} style={{fontSize:10.5,marginBottom:5}}><div style={{opacity:0.7}}>{s.k}</div><b>{s.v}</b></div>)}</>}
        {d.skills.length>0&&<><SH>Skills</SH>{d.skills.map((s,i)=><div key={i} style={{fontSize:11,marginBottom:4,paddingLeft:10,position:'relative'}}><span style={{position:'absolute',left:0}}>›</span>{s}</div>)}</>}
        {d.languages.length>0&&<><SH>Languages</SH>{d.languages.map((s,i)=><div key={i} style={{fontSize:11,marginBottom:3}}>{s}</div>)}</>}
      </div>
    </div>
    <div style={{flex:1,padding:'34px 30px',display:'flex',flexDirection:'column'}}>
      <div style={{flex:1}}>
        <div style={{fontSize:28,fontWeight:800}}>{d.name}</div>
        {d.role&&<div style={{fontSize:14,color:c,fontWeight:600,marginTop:1}}>{d.role}</div>}
        {d.summary&&<><MH>Profile</MH><div style={{fontSize:11.5,lineHeight:1.6,color:'#333'}}>{d.summary}</div></>}
        {d.work.length>0&&<><MH>Experience</MH><Work d={d} c={c}/></>}
        {d.education.length>0&&<><MH>Education</MH><Edu d={d} c={c}/></>}
        {d.achievements.length>0&&<><MH>Achievements</MH>{d.achievements.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#333',marginBottom:3,paddingLeft:10,position:'relative'}}><span style={{position:'absolute',left:0,color:c}}>•</span>{listText(a)}</div>)}</>}
        {d.certifications.length>0&&<><MH>Certifications</MH>{d.certifications.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#333',marginBottom:3}}>• {listText(a)}</div>)}</>}
      </div>
      <Foot/>
    </div>
  </div>);
}

// ──────────── 3. TIMELINE ────────────
function Timeline({d,c}){
  const snap=snapshot(d);
  const H=({children})=><div style={{fontSize:13,fontWeight:800,color:c,textTransform:'uppercase',letterSpacing:0.8,margin:'18px 0 10px'}}>{children}</div>;
  return (<div style={{padding:'38px 44px',display:'flex',flexDirection:'column',minHeight:1123}}>
    <div style={{flex:1}}>
      <div style={{display:'flex',alignItems:'center',gap:18,paddingBottom:14,borderBottom:`1px solid #e5e5e5`}}>
        {d.photo&&<img src={d.photo} crossOrigin="anonymous" style={{width:84,height:84,borderRadius:12,objectFit:'cover'}}/>}
        <div style={{flex:1}}>
          <div style={{fontSize:28,fontWeight:800}}>{d.name}</div>
          {d.role&&<div style={{fontSize:14,color:c,fontWeight:600}}>{d.role}</div>}
          <div style={{marginTop:5,fontSize:10.5,color:'#666'}}>{contactItems(d).join('  ·  ')}</div>
        </div>
      </div>
      {snap.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:8,margin:'12px 0'}}>{snap.map((s,i)=><div key={i} style={{fontSize:10.5,background:`${c}12`,color:shade(c,-0.2),padding:'4px 11px',borderRadius:20,fontWeight:600}}>{s.k}: {s.v}</div>)}</div>}
      {d.summary&&<><H>Profile</H><div style={{fontSize:11.5,lineHeight:1.6,color:'#333'}}>{d.summary}</div></>}
      {d.work.length>0&&<><H>Experience</H><div style={{position:'relative',paddingLeft:20}}>
        <div style={{position:'absolute',left:4,top:4,bottom:4,width:2,background:`${c}40`}}/>
        {d.work.map((w,i)=>{const bl=bullets(w);return(
          <div key={i} style={{position:'relative',marginBottom:14}}>
            <div style={{position:'absolute',left:-20,top:3,width:10,height:10,borderRadius:'50%',background:c,border:'2px solid #fff'}}/>
            <div style={{display:'flex',justifyContent:'space-between',gap:8}}><b style={{fontSize:12.5}}>{w.role}</b><span style={{fontSize:10.5,color:'#888'}}>{period(w)}</span></div>
            {w.company&&<div style={{fontSize:11.5,color:c,fontWeight:600}}>{w.company}</div>}
            {bl.map((b,j)=><div key={j} style={{fontSize:11,color:'#444',marginTop:3,lineHeight:1.45,paddingLeft:10,position:'relative'}}><span style={{position:'absolute',left:0,color:c}}>•</span>{b}</div>)}
          </div>);})}
      </div></>}
      {d.education.length>0&&<><H>Education</H><Edu d={d} c={c}/></>}
      {d.skills.length>0&&<><H>Skills</H><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{d.skills.map((s,i)=><span key={i} style={{fontSize:11,background:`${c}16`,color:c,padding:'3px 11px',borderRadius:4,fontWeight:600}}>{s}</span>)}</div></>}
      {d.achievements.length>0&&<><H>Achievements</H>{d.achievements.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#333',marginBottom:3,paddingLeft:10,position:'relative'}}><span style={{position:'absolute',left:0,color:c}}>•</span>{listText(a)}</div>)}</>}
      {d.certifications.length>0&&<><H>Certifications</H>{d.certifications.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#333',marginBottom:3}}>• {listText(a)}</div>)}</>}
    </div>
    <Foot/>
  </div>);
}

// ──────────── 4. COMPACT PRO (recruiter, dense) ────────────
function Compact({d,c}){
  const snap=snapshot(d);
  const H=({children})=><div style={{fontSize:11.5,fontWeight:800,color:c,textTransform:'uppercase',letterSpacing:0.5,margin:'12px 0 6px',borderBottom:`1px solid ${c}30`,paddingBottom:2}}>{children}</div>;
  return (<div style={{padding:'30px 36px',display:'flex',flexDirection:'column',minHeight:1123}}>
    <div style={{flex:1}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:14}}>
        <div>
          <div style={{fontSize:25,fontWeight:800}}>{d.name}</div>
          {d.role&&<div style={{fontSize:13.5,color:c,fontWeight:600}}>{d.role}</div>}
          <div style={{marginTop:4,fontSize:10.5,color:'#666'}}>{contactItems(d).join('  ·  ')}</div>
        </div>
        {d.photo&&<img src={d.photo} crossOrigin="anonymous" style={{width:70,height:70,borderRadius:8,objectFit:'cover'}}/>}
      </div>
      {snap.length>0&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'3px 16px',margin:'10px 0',padding:'10px 14px',background:'#f5f6f9',borderRadius:8,borderLeft:`3px solid ${c}`}}>
        {snap.map((s,i)=><div key={i} style={{fontSize:10.5}}><span style={{color:'#999'}}>{s.k}</span><br/><b>{s.v}</b></div>)}
      </div>}
      {d.summary&&<><H>Summary</H><div style={{fontSize:11,lineHeight:1.5,color:'#333'}}>{d.summary}</div></>}
      {d.work.length>0&&<><H>Experience</H><Work d={d} c={c}/></>}
      <div style={{display:'flex',gap:24}}>
        <div style={{flex:1}}>{d.education.length>0&&<><H>Education</H><Edu d={d} c={c}/></>}</div>
        <div style={{flex:1}}>{d.skills.length>0&&<><H>Skills</H><div style={{display:'flex',flexWrap:'wrap',gap:5}}>{d.skills.map((s,i)=><span key={i} style={{fontSize:10.5,background:`${c}14`,color:c,padding:'2px 9px',borderRadius:4,fontWeight:600}}>{s}</span>)}</div></>}</div>
      </div>
      {d.achievements.length>0&&<><H>Achievements</H>{d.achievements.map((a,i)=><div key={i} style={{fontSize:11,color:'#333',marginBottom:2,paddingLeft:10,position:'relative'}}><span style={{position:'absolute',left:0,color:c}}>•</span>{listText(a)}</div>)}</>}
      {(d.certifications.length>0||d.languages.length>0)&&<div style={{display:'flex',gap:24}}>
        <div style={{flex:1}}>{d.certifications.length>0&&<><H>Certifications</H>{d.certifications.map((a,i)=><div key={i} style={{fontSize:11,color:'#333',marginBottom:2}}>• {listText(a)}</div>)}</>}</div>
        <div style={{flex:1}}>{d.languages.length>0&&<><H>Languages</H><div style={{fontSize:11,color:'#333'}}>{d.languages.join(', ')}</div></>}</div>
      </div>}
    </div>
    <Foot/>
  </div>);
}

// ──────────── 5. MINIMAL ────────────
function Minimal({d,c}){
  const snap=snapshot(d);
  const H=({children})=><div style={{fontSize:10.5,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:2.5,margin:'22px 0 9px'}}>{children}</div>;
  return (<div style={{padding:'52px 58px',display:'flex',flexDirection:'column',minHeight:1123}}>
    <div style={{flex:1}}>
      <div style={{fontSize:34,fontWeight:300,letterSpacing:1.5}}>{d.name}</div>
      {d.role&&<div style={{fontSize:14,color:c,marginTop:3,letterSpacing:0.5}}>{d.role}</div>}
      <div style={{marginTop:10,fontSize:11,color:'#777',display:'flex',gap:16,flexWrap:'wrap'}}>{contactItems(d).map((x,i)=><span key={i}>{x}</span>)}</div>
      <div style={{height:1,background:'#ececec',margin:'18px 0'}}/>
      {snap.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:'4px 22px',marginBottom:6}}>{snap.map((s,i)=><div key={i} style={{fontSize:10.5,color:'#666'}}>{s.k} — <b style={{color:'#222'}}>{s.v}</b></div>)}</div>}
      {d.summary&&<div style={{fontSize:12,lineHeight:1.7,color:'#444',marginTop:8}}>{d.summary}</div>}
      {d.work.length>0&&<><H>Experience</H><Work d={d} c={c}/></>}
      {d.education.length>0&&<><H>Education</H><Edu d={d} c={c}/></>}
      {d.skills.length>0&&<><H>Skills</H><div style={{fontSize:12,color:'#444',lineHeight:1.9}}>{d.skills.join('   ·   ')}</div></>}
      {d.achievements.length>0&&<><H>Achievements</H>{d.achievements.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#444',marginBottom:3}}>— {listText(a)}</div>)}</>}
      {d.certifications.length>0&&<><H>Certifications</H>{d.certifications.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#444',marginBottom:3}}>— {listText(a)}</div>)}</>}
      {d.languages.length>0&&<><H>Languages</H><div style={{fontSize:12,color:'#444'}}>{d.languages.join('   ·   ')}</div></>}
    </div>
    <Foot/>
  </div>);
}

// ──────────── 6. BOLD HEADER ────────────
function Bold({d,c}){
  const snap=snapshot(d);
  const H=({children})=><div style={{fontSize:13,fontWeight:800,color:c,textTransform:'uppercase',letterSpacing:0.6,margin:'16px 0 8px'}}>{children}</div>;
  return (<div style={{display:'flex',flexDirection:'column',minHeight:1123}}>
    <div style={{background:`linear-gradient(120deg, ${c}, ${shade(c,-0.35)})`,color:'#fff',padding:'34px 44px'}}>
      <div style={{display:'flex',alignItems:'center',gap:20}}>
        {d.photo&&<img src={d.photo} crossOrigin="anonymous" style={{width:88,height:88,borderRadius:'50%',objectFit:'cover',border:'3px solid rgba(255,255,255,0.6)'}}/>}
        <div style={{flex:1}}>
          <div style={{fontSize:30,fontWeight:800}}>{d.name}</div>
          {d.role&&<div style={{fontSize:15,opacity:0.95,marginTop:2}}>{d.role}</div>}
          <div style={{marginTop:7,fontSize:10.5,opacity:0.9,display:'flex',gap:14,flexWrap:'wrap'}}>{contactItems(d).map((x,i)=><span key={i}>{x}</span>)}</div>
        </div>
      </div>
      {snap.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:14}}>{snap.map((s,i)=><div key={i} style={{fontSize:10.5,background:'rgba(255,255,255,0.18)',padding:'4px 11px',borderRadius:20,fontWeight:600}}>{s.k}: {s.v}</div>)}</div>}
    </div>
    <div style={{padding:'24px 44px',flex:1,display:'flex',flexDirection:'column'}}>
      <div style={{flex:1}}>
        {d.summary&&<><H>Profile</H><div style={{fontSize:11.5,lineHeight:1.6,color:'#333'}}>{d.summary}</div></>}
        {d.work.length>0&&<><H>Experience</H><Work d={d} c={c}/></>}
        <div style={{display:'flex',gap:28}}>
          <div style={{flex:1}}>{d.education.length>0&&<><H>Education</H><Edu d={d} c={c}/></>}</div>
          <div style={{flex:1}}>{d.skills.length>0&&<><H>Skills</H><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{d.skills.map((s,i)=><span key={i} style={{fontSize:11,background:`${c}16`,color:c,padding:'3px 11px',borderRadius:4,fontWeight:600}}>{s}</span>)}</div></>}</div>
        </div>
        {d.achievements.length>0&&<><H>Achievements</H>{d.achievements.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#333',marginBottom:3,paddingLeft:10,position:'relative'}}><span style={{position:'absolute',left:0,color:c}}>•</span>{listText(a)}</div>)}</>}
        {(d.certifications.length>0||d.languages.length>0)&&<div style={{display:'flex',gap:28}}>
          <div style={{flex:1}}>{d.certifications.length>0&&<><H>Certifications</H>{d.certifications.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#333',marginBottom:3}}>• {listText(a)}</div>)}</>}</div>
          <div style={{flex:1}}>{d.languages.length>0&&<><H>Languages</H><div style={{fontSize:11.5,color:'#333'}}>{d.languages.join(', ')}</div></>}</div>
        </div>}
      </div>
      <Foot/>
    </div>
  </div>);
}
