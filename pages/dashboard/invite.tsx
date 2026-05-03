import DashboardNav from '../../src/components/DashboardNav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import Layout from '../../src/components/Layout'

export default function InvitePage() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')
  const [saving, setSaving] = useState<string>('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/'); return }

    const { data: user } = await supabase.from('app_users').select('*').eq('id', session.user.id).single()
    if (!user) { router.push('/'); return }
    setAppUser(user)

    if (user.company_id) {
      const { data: co } = await supabase.from('companies').select('*').eq('id', user.company_id).single()
      setCompany(co)

      const { data: mems } = await supabase.from('app_users').select('*').eq('company_id', user.company_id).order('created_at')
      setMembers(mems || [])
    }
    setLoading(false)
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  async function approveMember(memberId: string) {
    setSaving(memberId)
    await supabase.from('app_users').update({ status: 'active' }).eq('id', memberId)
    await supabase.from('notifications').insert({
      user_id: memberId,
      company_id: appUser.company_id,
      title: 'Access Approved ✅',
      message: `Your access to ${company?.name} has been approved. Welcome to the team!`,
      type: 'success',
      is_read: false,
    })
    await load()
    setSaving('')
  }

  async function rejectMember(memberId: string) {
    if (!confirm('Remove this member request?')) return
    setSaving(memberId)
    await supabase.from('app_users').update({ status: 'rejected' }).eq('id', memberId)
    await load()
    setSaving('')
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remove this member from your company? They will lose access.')) return
    setSaving(memberId)
    await supabase.from('app_users').update({ company_id: null, status: 'inactive' }).eq('id', memberId)
    await load()
    setSaving('')
  }

  async function updateRole(memberId: string, role: string) {
    await supabase.from('app_users').update({ role }).eq('id', memberId)
    await load()
  }

  const inviteLink = company ? `${typeof window !== 'undefined' ? window.location.origin : 'https://smilingdbms.vercel.app'}/?code=${company.company_code}` : ''
  const pending = members.filter(m => m.status === 'pending')
  const active = members.filter(m => m.status === 'active' && m.id !== appUser?.id)

  const ROLES = ['recruiter','sr_recruiter','team_leader','team_manager','bd_executive','bd_manager','individual_recruiter']

  const BADGE: any = {
    active: {bg:'rgba(52,211,153,0.1)',color:'#34d399'},
    pending: {bg:'rgba(255,159,67,0.1)',color:'#ff9f43'},
    inactive: {bg:'rgba(100,100,120,0.2)',color:'#888'},
    rejected: {bg:'rgba(255,107,107,0.1)',color:'#ff6b6b'},
  }

  const S: any = {
    card: {background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:14,padding:20,marginBottom:16},
    label: {fontSize:10,fontWeight:700,color:'var(--mu)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'},
    row: {display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--bd)'},
    avatar: (name:string)=>({width:38,height:38,borderRadius:'50%',background:'var(--acbg)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'var(--ac)',fontSize:15,flexShrink:0}),
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg,#0e1117)'}}><div style={{width:36,height:36,border:'3px solid var(--ac,#6c8cff)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  return (
    <>
      <DashboardNav />
    <Layout appUser={appUser} unreadCount={0}>
      <div style={{flex:1,overflowY:'auto',padding:'20px'}}>
        <div style={{maxWidth:720,margin:'0 auto'}}>

          <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>👥 Team & Invites</div>
          <div style={{fontSize:12,color:'var(--mu)',marginBottom:20}}>Manage your company members, share invite links, and approve join requests.</div>

          {/* Company Code & Invite Link */}
          {company && (
            <div style={S.card}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>🏢 {company.name}</div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                {/* Company Code */}
                <div style={{background:'var(--bg3)',borderRadius:10,padding:14}}>
                  <span style={S.label}>Company Code</span>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{fontFamily:'monospace',fontSize:22,fontWeight:800,color:'var(--ac)',letterSpacing:3}}>
                      {company.company_code}
                    </div>
                    <button onClick={()=>copyToClipboard(company.company_code,'code')}
                      style={{padding:'4px 10px',borderRadius:6,background:'var(--acbg)',color:'var(--ac)',border:'1px solid var(--bd)',cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>
                      {copied==='code'?'✓ Copied!':'Copy'}
                    </button>
                  </div>
                  <div style={{fontSize:10,color:'var(--mu)',marginTop:6}}>Share this code with team members to join your company</div>
                </div>

                {/* Invite Link */}
                <div style={{background:'var(--bg3)',borderRadius:10,padding:14}}>
                  <span style={S.label}>Invite Link</span>
                  <div style={{display:'flex',gap:6}}>
                    <input readOnly value={inviteLink} style={{flex:1,background:'var(--bg4,#2a2f45)',border:'1px solid var(--bd)',borderRadius:6,padding:'6px 10px',color:'var(--mu)',fontSize:11,fontFamily:'monospace',outline:'none'}}/>
                    <button onClick={()=>copyToClipboard(inviteLink,'link')}
                      style={{padding:'4px 10px',borderRadius:6,background:'var(--acbg)',color:'var(--ac)',border:'1px solid var(--bd)',cursor:'pointer',fontSize:11,fontFamily:'inherit',whiteSpace:'nowrap'}}>
                      {copied==='link'?'✓ Copied!':'Copy Link'}
                    </button>
                  </div>
                  <div style={{fontSize:10,color:'var(--mu)',marginTop:6}}>Send this link — it auto-fills the company code</div>
                </div>
              </div>

              {/* WhatsApp Share */}
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`Hi! Join our team on RecruitBase Pro.\n\nCompany: ${company.name}\nCompany Code: ${company.company_code}\nSignup here: ${inviteLink}`)}`,'_blank')}
                  style={{padding:'8px 16px',borderRadius:8,background:'rgba(37,211,102,0.12)',color:'#25d366',border:'1px solid rgba(37,211,102,0.2)',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>
                  💬 Share via WhatsApp
                </button>
                <button onClick={()=>window.open(`mailto:?subject=Join ${company.name} on RecruitBase Pro&body=Hi,%0A%0AJoin our recruitment team on RecruitBase Pro.%0A%0ACompany: ${company.name}%0ACompany Code: ${company.company_code}%0ASignup: ${inviteLink}%0A%0ASee you there!`)}
                  style={{padding:'8px 16px',borderRadius:8,background:'var(--acbg)',color:'var(--ac)',border:'1px solid var(--bd)',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>
                  ✉ Share via Email
                </button>
              </div>
            </div>
          )}

          {/* Pending Approval */}
          {pending.length > 0 && (
            <div style={{...S.card,border:'1px solid rgba(255,159,67,0.3)',background:'rgba(255,159,67,0.04)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700}}>⏳ Pending Approval</div>
                <span style={{background:'rgba(255,159,67,0.15)',color:'#ff9f43',borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700}}>{pending.length}</span>
              </div>
              {pending.map(m => (
                <div key={m.id} style={S.row}>
                  <div style={{...S.avatar(m.full_name)}}>{(m.full_name||'?')[0].toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{m.full_name}</div>
                    <div style={{fontSize:11,color:'var(--mu)'}}>{m.email} · {m.role?.replace(/_/g,' ')}</div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>approveMember(m.id)} disabled={saving===m.id}
                      style={{padding:'6px 14px',borderRadius:8,background:'rgba(52,211,153,0.12)',color:'#34d399',border:'1px solid rgba(52,211,153,0.2)',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>
                      {saving===m.id?'…':'✓ Approve'}
                    </button>
                    <button onClick={()=>rejectMember(m.id)} disabled={saving===m.id}
                      style={{padding:'6px 10px',borderRadius:8,background:'transparent',color:'#ff6b6b',border:'1px solid rgba(255,107,107,0.2)',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Members */}
          <div style={S.card}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>
              ✅ Active Members
              <span style={{fontSize:11,color:'var(--mu)',fontWeight:400,marginLeft:8}}>{active.length + 1} total (including you)</span>
            </div>

            {/* Self row */}
            <div style={S.row}>
              <div style={{...S.avatar(appUser?.full_name)}}>{(appUser?.full_name||'?')[0].toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{appUser?.full_name} <span style={{fontSize:10,color:'var(--ac)',background:'var(--acbg)',padding:'1px 6px',borderRadius:4,marginLeft:4}}>YOU</span></div>
                <div style={{fontSize:11,color:'var(--mu)'}}>{appUser?.email} · Account Owner</div>
              </div>
              <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:'rgba(108,140,255,0.12)',color:'var(--ac)'}}>Account Owner</span>
            </div>

            {active.map(m => (
              <div key={m.id} style={S.row}>
                <div style={{...S.avatar(m.full_name)}}>{(m.full_name||'?')[0].toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{m.full_name}</div>
                  <div style={{fontSize:11,color:'var(--mu)'}}>{m.email}</div>
                </div>
                <select value={m.role} onChange={e=>updateRole(m.id,e.target.value)}
                  style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:6,padding:'4px 8px',color:'var(--tx)',fontSize:11,fontFamily:'inherit',cursor:'pointer'}}>
                  {ROLES.map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                </select>
                <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,...(BADGE[m.status]||BADGE.active)}}>{m.status}</span>
                <button onClick={()=>removeMember(m.id)}
                  style={{padding:'4px 10px',borderRadius:6,background:'transparent',color:'#ff6b6b',border:'1px solid rgba(255,107,107,0.2)',cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>
                  Remove
                </button>
              </div>
            ))}

            {active.length === 0 && (
              <div style={{textAlign:'center',padding:'24px 0',color:'var(--mu)',fontSize:12}}>
                No team members yet. Share your invite link above to get started!
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  </>
  )
}
