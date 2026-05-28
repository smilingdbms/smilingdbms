// @ts-nocheck
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

export default function AITools() {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:16}}>
      <div style={{fontSize:60}}>🤖</div>
      <h2 style={{color:'#fff',margin:0}}>AI Tools</h2>
      <p style={{color:'var(--mu)',fontSize:14,textAlign:'center',maxWidth:400}}>
        Gemini AI Chat, CV Parser, Smart Match, and Resume Builder coming soon.
      </p>
      <div style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:12,padding:'16px 24px',color:'#60A5FA',fontSize:13,marginTop:8}}>
        🚀 Phase 2 — Under Development
      </div>
    </div>
  )
}
