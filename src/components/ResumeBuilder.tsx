// @ts-nocheck
/* eslint-disable */
import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import CVDocument from './CVDocument';
import { CV_COLORS, buildCV, BRAND } from '../lib/cvData';

// Clean Resume Builder: one premium design + color, contact-mask toggle,
// Download PDF (direct), and Share (creates a public /cv/<token> link + copies it).
function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`))return res(true);const s=document.createElement('script');s.src=src;s.onload=()=>res(true);s.onerror=()=>rej(new Error('fail'));document.body.appendChild(s)})}

export default function ResumeBuilder({ profile, onClose }){
  const [color,setColor]=useState('#4f46e5');
  const [mask,setMask]=useState(false);
  const [busy,setBusy]=useState(false);
  const [shareLink,setShareLink]=useState('');
  const [copied,setCopied]=useState(false);
  const ref=useRef(null);
  const fname=(profile?.name||'resume').replace(/\s+/g,'_');

  async function downloadPDF(){
    if(!ref.current)return; setBusy(true);
    try{
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const h2c=window.html2canvas; const {jsPDF}=window.jspdf;
      const canvas=await h2c(ref.current,{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false});
      const pdf=new jsPDF('p','mm','a4'); const Wmm=210,Hmm=297;
      const pxPerMm=canvas.width/Wmm; const pageHpx=Math.floor(Hmm*pxPerMm); const safe=Math.floor(8*pxPerMm);
      const total=canvas.height; let y=0,first=true;
      while(y<total){
        let sliceH=Math.min(pageHpx,total-y);
        if(y+sliceH<total) sliceH-=safe;
        const pc=document.createElement('canvas'); pc.width=canvas.width; pc.height=sliceH;
        const ctx=pc.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,pc.width,sliceH);
        ctx.drawImage(canvas,0,y,canvas.width,sliceH,0,0,canvas.width,sliceH);
        if(!first) pdf.addPage();
        pdf.addImage(pc.toDataURL('image/jpeg',0.96),'JPEG',0,0,Wmm,sliceH/pxPerMm);
        first=false; y+=sliceH;
      }
      pdf.save(`${fname}_CV.pdf`);
    }catch(e){ alert('PDF generate nahi hua. Dobara try karein.'); }
    setBusy(false);
  }

  async function makeShare(){
    if(!profile?.id){ alert('Profile save karein pehle.'); return; }
    setBusy(true);
    try{
      const { data:{ user } } = await supabase.auth.getUser();
      const token = (crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)).replace(/-/g,'');
      const { error } = await supabase.from('profile_shares').insert({ token, profile_id:profile.id, mask_contact:mask, created_by:user?.id });
      if(error){ alert('Share link nahi bana: '+error.message); setBusy(false); return; }
      const link = `${window.location.origin}/cv/${token}`;
      setShareLink(link);
      try{ await navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2500); }catch{}
    }catch(e){ alert('Share link nahi bana.'); }
    setBusy(false);
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:9999,display:'flex',flexDirection:'column'}}>
      <div style={{background:'#15151f',padding:'12px 18px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',borderBottom:'1px solid #2a2a40'}}>
        <strong style={{color:'#fff',fontSize:15}}>Resume</strong>
        <div style={{display:'flex',gap:5,alignItems:'center'}}>
          {CV_COLORS.map(c=>(
            <button key={c.hex} onClick={()=>setColor(c.hex)} title={c.name} style={{width:22,height:22,borderRadius:'50%',background:c.hex,border:color===c.hex?'3px solid #fff':'2px solid #444',cursor:'pointer',padding:0}}/>
          ))}
        </div>
        <label style={{display:'flex',alignItems:'center',gap:6,color:'#ccd',fontSize:13,cursor:'pointer'}}>
          <input type="checkbox" checked={mask} onChange={e=>{setMask(e.target.checked);setShareLink('')}} style={{width:16,height:16,cursor:'pointer'}}/>
          Hide contact details
        </label>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button onClick={downloadPDF} disabled={busy} style={{background:color,color:'#fff',border:'none',padding:'8px 18px',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:13,opacity:busy?0.6:1}}>{busy?'…':'⬇ Download PDF'}</button>
          <button onClick={makeShare} disabled={busy} style={{background:'#2a2a40',color:'#fff',border:'1px solid #3a3a55',padding:'8px 16px',borderRadius:8,fontWeight:600,cursor:'pointer',fontSize:13}}>🔗 Share Link</button>
          <button onClick={onClose} style={{background:'transparent',color:'#fff',border:'1px solid #3a3a55',padding:'8px 14px',borderRadius:8,cursor:'pointer',fontSize:13}}>Close</button>
        </div>
      </div>

      {shareLink && (
        <div style={{background:'#1c2a1c',color:'#cfe',padding:'10px 18px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',borderBottom:'1px solid #2a2a40'}}>
          <span style={{fontSize:13}}>{copied?'✅ Link copied!':'🔗 Public link:'}</span>
          <input readOnly value={shareLink} onFocus={e=>e.target.select()} style={{flex:1,minWidth:200,background:'#0d0d14',color:'#9fe',border:'1px solid #2a4',borderRadius:6,padding:'6px 10px',fontSize:12}}/>
          <button onClick={()=>{navigator.clipboard.writeText(shareLink);setCopied(true);setTimeout(()=>setCopied(false),2000)}} style={{background:'#2a4d2a',color:'#cfe',border:'none',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>Copy</button>
          <a href={shareLink} target="_blank" rel="noreferrer" style={{color:'#9fe',fontSize:12}}>Open ↗</a>
        </div>
      )}

      <div style={{flex:1,overflow:'auto',padding:'24px 12px',display:'flex',justifyContent:'center',background:'#454556'}}>
        <CVDocument profile={profile} color={color} mask={mask} innerRef={ref}/>
      </div>
    </div>
  );
}
