// @ts-nocheck
/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../src/lib/supabase';
import { buildCV, snapshot, eduLine, period, bullets, listText, shade, BRAND } from '../../src/lib/cvData';
import CVDocument from '../../src/components/CVDocument';

// PUBLIC shareable CV / portfolio website. No login required.
// Reads via SECURITY DEFINER rpc get_shared_cv (only shared profiles exposed).
// Shows a premium portfolio site + an invite banner (growth loop) + Download PDF.

function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`))return res(true);const s=document.createElement('script');s.src=src;s.onload=()=>res(true);s.onerror=()=>rej(new Error('fail'));document.body.appendChild(s)})}

export default function PublicCV(){
  const router=useRouter();
  const { token }=router.query;
  const [d,setD]=useState(null);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState(false);
  const [busy,setBusy]=useState(false);
  const c='#4f46e5';
  const docRef=useRef(null);

  useEffect(()=>{
    if(!token)return;
    (async()=>{
      try{
        const { data, error }=await supabase.rpc('get_shared_cv',{ p_token:String(token) });
        if(error||!data){ setErr(true); }
        else setD(buildCV(data, data.email===undefined));
      }catch(e){ setErr(true); }
      setLoading(false);
    })();
  },[token]);

  async function downloadPDF(){
    if(!docRef.current)return; setBusy(true);
    try{
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const h2c=window.html2canvas; const {jsPDF}=window.jspdf;
      const canvas=await h2c(docRef.current,{scale:2,useCORS:true,backgroundColor:'#fff',logging:false});
      const pdf=new jsPDF('p','mm','a4'); const Wmm=210,Hmm=297;
      const ppm=canvas.width/Wmm; const ph=Math.floor(Hmm*ppm); const safe=Math.floor(8*ppm);
      const total=canvas.height; let y=0,first=true;
      while(y<total){ let sh=Math.min(ph,total-y); if(y+sh<total) sh-=safe;
        const pc=document.createElement('canvas'); pc.width=canvas.width; pc.height=sh;
        const ctx=pc.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,pc.width,sh);
        ctx.drawImage(canvas,0,y,canvas.width,sh,0,0,canvas.width,sh);
        if(!first) pdf.addPage(); pdf.addImage(pc.toDataURL('image/jpeg',0.96),'JPEG',0,0,Wmm,sh/ppm); first=false; y+=sh; }
      pdf.save(`${(d.name||'cv').replace(/\s+/g,'_')}_CV.pdf`);
    }catch(e){ alert('PDF nahi bana.'); }
    setBusy(false);
  }

  if(loading) return <Center>Loading…</Center>;
  if(err||!d) return <Center>This CV link is invalid or has been removed.</Center>;

  const dark=shade(c,-0.4);
  const snap=snapshot(d);
  const contacts=[
    d.email&&['✉ '+d.email,'mailto:'+d.email],
    d.mobile&&['📞 '+d.mobile,'tel:'+d.mobile.replace(/\s/g,'')],
    d.linkedin&&['LinkedIn', d.linkedin.startsWith('http')?d.linkedin:'https://'+d.linkedin],
    d.github&&['GitHub', d.github.startsWith('http')?d.github:'https://'+d.github],
  ].filter(Boolean);

  return (
    <>
      <Head><title>{d.name} — Portfolio</title></Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1f2430;line-height:1.6}
        a{text-decoration:none}
        .inv{position:sticky;top:0;z-index:60;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;gap:14px;padding:9px 16px;font-size:13px;flex-wrap:wrap}
        .inv b{color:#a5b4fc}.inv a.btn{background:${c};color:#fff;padding:6px 16px;border-radius:20px;font-weight:600}
        .hero{background:linear-gradient(135deg,${c},${dark});color:#fff;padding:64px 6% 54px;text-align:center}
        .hero img{width:148px;height:148px;border-radius:50%;object-fit:cover;border:5px solid rgba(255,255,255,0.5);margin-bottom:16px}
        .hero h1{font-size:40px;font-weight:800}.hero .role{font-size:19px;opacity:0.95;margin-top:5px}
        .hero .sum{max-width:660px;margin:16px auto 0;font-size:15px;opacity:0.95}
        .hero .cta{margin-top:20px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .hero .cta a,.hero .cta button{background:rgba(255,255,255,0.18);color:#fff;border:none;padding:10px 20px;border-radius:30px;font-size:14px;font-weight:600;cursor:pointer}
        .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;max-width:1000px;margin:-38px auto 0;padding:0 6%;position:relative}
        .fact{background:#fff;border-radius:14px;padding:15px;box-shadow:0 6px 22px rgba(0,0,0,0.09);text-align:center}
        .fact .fk{font-size:11px;color:#999;text-transform:uppercase;font-weight:700}.fact .fv{font-size:15px;font-weight:800;margin-top:3px;color:#222}
        section{max-width:1000px;margin:0 auto;padding:46px 6%}
        section h2{font-size:25px;font-weight:800;color:${c};margin-bottom:20px;padding-bottom:8px;position:relative}
        section h2:after{content:'';position:absolute;left:0;bottom:0;width:48px;height:3px;background:${c};border-radius:2px}
        .item{margin-bottom:20px;padding-left:18px;border-left:3px solid ${c}}
        .itop{display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px}.itop h3{font-size:16px}.per{font-size:13px;color:#888}
        .org{color:${c};font-weight:600;font-size:14px;margin-bottom:5px}.item ul{margin-left:18px;color:#555;font-size:14px}.item li{margin-bottom:3px}
        .tags{display:flex;flex-wrap:wrap;gap:9px}.tag{background:${c}18;color:${c};padding:7px 15px;border-radius:30px;font-weight:600;font-size:14px}
        ul.plain{list-style:none}ul.plain li{padding:7px 0 7px 22px;position:relative;color:#444}ul.plain li:before{content:'▹';position:absolute;left:0;color:${c}}
        footer{text-align:center;padding:30px;color:#aaa;font-size:12px;border-top:1px solid #eee}
        @media(max-width:600px){.hero h1{font-size:30px}}
      `}</style>

      <div className="inv">
        <span>This portfolio was built with <b>{BRAND}</b> — a smarter way to manage hiring & talent.</span>
        <a className="btn" href="/" target="_blank">Sign up free →</a>
      </div>

      <header className="hero">
        {d.photo && <img src={d.photo} alt=""/>}
        <h1>{d.name}</h1>
        {d.role && <div className="role">{d.role}</div>}
        {d.summary && <p className="sum">{d.summary}</p>}
        <div className="cta">
          {contacts.map(([t,h],i)=><a key={i} href={h} target="_blank" rel="noreferrer">{t}</a>)}
          <button onClick={downloadPDF} disabled={busy}>{busy?'…':'⬇ Download PDF'}</button>
        </div>
      </header>

      {snap.length>0 && <div className="facts">{snap.map((s,i)=><div className="fact" key={i}><div className="fk">{s.k}</div><div className="fv">{s.v}</div></div>)}</div>}

      {d.summary && <section><h2>About</h2><p style={{fontSize:15,color:'#444'}}>{d.summary}</p></section>}

      {d.work.length>0 && <section><h2>Experience</h2>{d.work.map((w,i)=>{const bl=bullets(w);return(
        <div className="item" key={i}><div className="itop"><h3>{w.role}</h3><span className="per">{period(w)}</span></div>
        <div className="org">{w.company}</div>{bl.length>0&&<ul>{bl.map((b,j)=><li key={j}>{b}</li>)}</ul>}</div>);})}</section>}

      {d.skills.length>0 && <section><h2>Skills</h2><div className="tags">{d.skills.map((s,i)=><span className="tag" key={i}>{s}</span>)}</div></section>}

      {d.education.length>0 && <section><h2>Education</h2>{d.education.map((ed,i)=>{const e=eduLine(ed);return(
        <div className="item" key={i}><div className="itop"><h3>{e.t}</h3><span className="per">{e.yr}</span></div><div className="org">{e.inst}{e.grade?' · '+e.grade:''}</div></div>);})}</section>}

      {d.achievements.length>0 && <section><h2>Achievements</h2><ul className="plain">{d.achievements.map((a,i)=><li key={i}>{listText(a)}</li>)}</ul></section>}
      {d.certifications.length>0 && <section><h2>Certifications</h2><ul className="plain">{d.certifications.map((a,i)=><li key={i}>{listText(a)}</li>)}</ul></section>}
      {d.languages.length>0 && <section><h2>Languages</h2><div className="tags">{d.languages.map((s,i)=><span className="tag" key={i}>{s}</span>)}</div></section>}

      <footer>Built with {BRAND} · <a href="/" style={{color:c}}>Create yours free</a></footer>

      {/* hidden document for PDF */}
      <div style={{position:'fixed',left:-9999,top:0}}><CVDocument data={d} color={c} innerRef={docRef}/></div>
    </>
  );
}

function Center({children}){return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial',color:'#666',fontSize:15,padding:20,textAlign:'center'}}>{children}</div>}
