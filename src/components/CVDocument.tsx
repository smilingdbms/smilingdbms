// @ts-nocheck
/* eslint-disable */
import React from 'react';
import { buildCV, snapshot, eduLine, period, bullets, listText, contactItems, shade, BRAND } from '../lib/cvData';

// Premium A4 résumé document — single refined design, color-themed.
// Used in ResumeBuilder preview + PDF, and on the public page's "Download PDF".
// Pass either `profile` (raw) or pre-built `data`. mask hides contact.
export default function CVDocument({ profile, data, color='#4f46e5', mask=false, innerRef }){
  const d = data || buildCV(profile||{}, mask);
  const c = color;
  const snap = snapshot(d);
  const H = ({children}) => (
    <div style={{display:'flex',alignItems:'center',gap:10,margin:'18px 0 9px'}}>
      <span style={{fontSize:12.5,fontWeight:800,color:c,textTransform:'uppercase',letterSpacing:1.2}}>{children}</span>
      <span style={{flex:1,height:2,background:`${c}33`,borderRadius:2}}/>
    </div>
  );
  return (
    <div ref={innerRef} style={{width:794,minHeight:1123,background:'#fff',color:'#1f2430',fontFamily:'Arial,Helvetica,sans-serif',display:'flex',flexDirection:'column'}}>
      {/* Header band */}
      <div style={{background:`linear-gradient(120deg, ${c}, ${shade(c,-0.35)})`,color:'#fff',padding:'34px 44px',display:'flex',alignItems:'center',gap:22}}>
        {d.photo && <img src={d.photo} crossOrigin="anonymous" style={{width:96,height:96,borderRadius:'50%',objectFit:'cover',border:'3px solid rgba(255,255,255,0.6)',flexShrink:0}}/>}
        <div style={{flex:1}}>
          <div style={{fontSize:30,fontWeight:800,letterSpacing:0.5}}>{d.name}</div>
          {d.role && <div style={{fontSize:15,opacity:0.95,marginTop:3}}>{d.role}</div>}
          <div style={{marginTop:8,fontSize:11,opacity:0.92,display:'flex',gap:14,flexWrap:'wrap'}}>
            {contactItems(d).map((x,i)=><span key={i}>{x}</span>)}
            {d.masked && <span style={{fontStyle:'italic',opacity:0.85}}>Contact via {BRAND}</span>}
          </div>
        </div>
      </div>

      <div style={{padding:'8px 44px 0',flex:1,display:'flex',flexDirection:'column'}}>
        <div style={{flex:1}}>
          {/* Snapshot */}
          {snap.length>0 && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px 22px',margin:'14px 0',padding:'14px 18px',background:'#f5f6f9',borderRadius:10,borderLeft:`3px solid ${c}`}}>
              {snap.map((s,i)=><div key={i} style={{fontSize:10.8}}><span style={{color:'#999'}}>{s.k}</span><br/><b style={{color:'#222',fontSize:11.5}}>{s.v}</b></div>)}
            </div>
          )}
          {d.summary && <><H>Profile</H><div style={{fontSize:11.5,lineHeight:1.6,color:'#333'}}>{d.summary}</div></>}

          {d.work.length>0 && <><H>Experience</H>{d.work.map((w,i)=>{const bl=bullets(w);return(
            <div key={i} style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8}}>
                <div style={{fontSize:13,fontWeight:700}}>{w.role||'Role'}</div>
                <div style={{fontSize:10.5,color:'#888',whiteSpace:'nowrap'}}>{period(w)}</div>
              </div>
              {w.company && <div style={{fontSize:11.5,color:c,fontWeight:600,marginTop:1}}>{w.company}</div>}
              {bl.map((b,j)=><div key={j} style={{fontSize:11,color:'#444',marginTop:3,lineHeight:1.45,paddingLeft:12,position:'relative'}}><span style={{position:'absolute',left:0,color:c}}>•</span>{b}</div>)}
            </div>);})}</>}

          <div style={{display:'flex',gap:30}}>
            <div style={{flex:1}}>
              {d.education.length>0 && <><H>Education</H>{d.education.map((ed,i)=>{const e=eduLine(ed);return(
                <div key={i} style={{marginBottom:9}}>
                  <div style={{fontSize:12,fontWeight:700}}>{e.t}</div>
                  <div style={{fontSize:10.8,color:'#666'}}>{e.inst}{e.yr?` · ${e.yr}`:''}{e.grade?` · ${e.grade}`:''}</div>
                </div>);})}</>}
            </div>
            <div style={{flex:1}}>
              {d.skills.length>0 && <><H>Skills</H><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{d.skills.map((s,i)=><span key={i} style={{fontSize:11,background:`${c}16`,color:c,padding:'3px 11px',borderRadius:5,fontWeight:600}}>{s}</span>)}</div></>}
            </div>
          </div>

          {d.achievements.length>0 && <><H>Achievements</H>{d.achievements.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#333',marginBottom:3,paddingLeft:12,position:'relative'}}><span style={{position:'absolute',left:0,color:c}}>•</span>{listText(a)}</div>)}</>}

          <div style={{display:'flex',gap:30}}>
            <div style={{flex:1}}>{d.certifications.length>0 && <><H>Certifications</H>{d.certifications.map((a,i)=><div key={i} style={{fontSize:11.5,color:'#333',marginBottom:3}}>• {listText(a)}</div>)}</>}</div>
            <div style={{flex:1}}>{d.languages.length>0 && <><H>Languages</H><div style={{fontSize:11.5,color:'#333'}}>{d.languages.join('  ·  ')}</div></>}</div>
          </div>
        </div>
        <div style={{textAlign:'center',fontSize:8,color:'#c2c2cc',padding:'14px 0 8px',letterSpacing:0.5}}>Created with {BRAND}</div>
      </div>
    </div>
  );
}
