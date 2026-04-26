import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ══════════════════════════════════════════════════════════
// ADMIN PAGE v2.0 — FRESH REWRITE (25 April 2026)
// 3 sections: Pending (Approve/Reject), Active (Toggle), Disabled (Re-enable)
// Theme-aware, universal, no hardcoded emails
// ══════════════════════════════════════════════════════════

const ALL_ROLES = [
  'account_owner','team_manager','team_leader','sr_recruiter',
  'recruiter','bd_manager','bd_executive','admin','freelancer',
  'client','job_seeker','super_admin'
]

const ROLE_COLORS: Record<string,string> = {
  super_admin:'#ff6b6b', account_owner:'#ffd60a', admin:'#ff9f43',
  team_manager:'#c77dff', team_leader:'#6c8cff', sr_recruiter:'#48cae4',
  recruiter:'#3dd68c', bd_manager:'#ff9f43', bd_executive:'#ffb347',
  freelancer:'#a0d995', client:'#7a7f90', job_seeker:'#b0b0b0'
}

const STATUS_COLORS: Record<string,string> = {
  active:'#3dd68c', pending:'#ffd60a', disabled:'#ff6b6b'
}

type AppUser = {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  company_id: string | null
  points: number
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [members, setMembers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{msg:string,type:'ok'|'err'} | null>(null)

  // Toast helper
  function showToast(msg: string, type: 'ok'|'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Load current user + company members ──────────────────
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }

      // Get current user
      const { data: me } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!me) { router.push('/'); return }

      // Only account_owner, admin, super_admin can access
      if (!['account_owner','admin','super_admin'].includes(me.role)) {
        router.push('/dashboard')
        return
      }

      setCurrentUser(me)

      // Load company members
      let query = supabase.from('app_users').select('*')

      if (me.role === 'super_admin') {
        // Super admin sees everyone
      } else if (me.company_id) {
        query = query.eq('company_id', me.company_id)
      } else {
        setMembers([])
        setLoading(false)
        return
      }

      const { data: users } = await query.order('created_at', { ascending: true })
      setMembers(users || [])
    } catch (err) {
      console.error('Admin load error:', err)
    }
    setLoading(false)
  }

  // ── Approve user ─────────────────────────────────────────
  async function approveUser(userId: string) {
    setActionLoading(userId)
    const { error } = await supabase
      .from('app_users')
      .update({ status: 'active' })
      .eq('id', userId)

    if (error) {
      showToast('Could not approve this member. Please try again.', 'err')
    } else {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, status: 'active' } : m))
      showToast('Member approved successfully!')
    }
    setActionLoading(null)
  }

  // ── Reject user (delete completely) ──────────────────────
  async function rejectUser(userId: string, name: string) {
    if (!confirm(`Reject and remove "${name}" from your company? This cannot be undone.`)) return
    setActionLoading(userId)

    // Try RPC first, fallback to direct delete
    const { error: rpcErr } = await supabase.rpc('delete_user_completely', { target_user_id: userId })
    if (rpcErr) {
      // Fallback — delete from app_users (trigger handles auth.users)
      const { error: delErr } = await supabase.from('app_users').delete().eq('id', userId)
      if (delErr) {
        showToast('Could not remove this member. Please try again.', 'err')
        setActionLoading(null)
        return
      }
    }

    setMembers(prev => prev.filter(m => m.id !== userId))
    showToast('Member rejected and removed.')
    setActionLoading(null)
  }

  // ── Disable user ─────────────────────────────────────────
  async function disableUser(userId: string) {
    setActionLoading(userId)
    const { error } = await supabase
      .from('app_users')
      .update({ status: 'disabled' })
      .eq('id', userId)

    if (error) {
      showToast('Could not disable this member. Please try again.', 'err')
    } else {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, status: 'disabled' } : m))
      showToast('Member disabled.')
    }
    setActionLoading(null)
  }

  // ── Re-enable user ───────────────────────────────────────
  async function enableUser(userId: string) {
    setActionLoading(userId)
    const { error } = await supabase
      .from('app_users')
      .update({ status: 'active' })
      .eq('id', userId)

    if (error) {
      showToast('Could not re-enable this member. Please try again.', 'err')
    } else {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, status: 'active' } : m))
      showToast('Member re-enabled!')
    }
    setActionLoading(null)
  }

  // ── Change role ──────────────────────────────────────────
  async function changeRole(userId: string, newRole: string) {
    const { error } = await supabase
      .from('app_users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      showToast('Could not change role. Please try again.', 'err')
    } else {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m))
      showToast(`Role changed to ${newRole.replace(/_/g,' ')}.`)
    }
  }

  // ── Delete user permanently ──────────────────────────────
  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This removes them from the platform completely and cannot be undone.`)) return
    setActionLoading(userId)

    const { error: rpcErr } = await supabase.rpc('delete_user_completely', { target_user_id: userId })
    if (rpcErr) {
      const { error: delErr } = await supabase.from('app_users').delete().eq('id', userId)
      if (delErr) {
        showToast('Could not delete this member. Please try again.', 'err')
        setActionLoading(null)
        return
      }
    }

    setMembers(prev => prev.filter(m => m.id !== userId))
    showToast('Member permanently deleted.')
    setActionLoading(null)
  }

  // ── Filter members ───────────────────────────────────────
  const filtered = members.filter(m => {
    if (search) {
      const q = search.toLowerCase()
      if (!m.full_name?.toLowerCase().includes(q) && !m.email?.toLowerCase().includes(q)) return false
    }
    if (roleFilter !== 'all' && m.role !== roleFilter) return false
    if (statusFilter !== 'all' && m.status !== statusFilter) return false
    return true
  })

  // Group by status
  const pending = filtered.filter(m => m.status === 'pending')
  const active = filtered.filter(m => m.status === 'active')
  const disabled = filtered.filter(m => m.status === 'disabled')

  // Counts (unfiltered)
  const totalPending = members.filter(m => m.status === 'pending').length
  const totalActive = members.filter(m => m.status === 'active').length
  const totalDisabled = members.filter(m => m.status === 'disabled').length

  // Helper: is this user protected from actions?
  function isProtected(m: AppUser) {
    return m.role === 'super_admin' || m.id === currentUser?.id
  }

  // ── STYLES ───────────────────────────────────────────────
  const S: Record<string,any> = {
    page: { minHeight:'100vh', background:'var(--bg,#111318)', color:'var(--tx,#e8eaf0)', fontFamily:'Outfit,sans-serif', padding:'24px 28px' },
    header: { marginBottom: 24 },
    title: { fontSize:24, fontWeight:800, margin:0 },
    subtitle: { fontSize:13, marginTop:4, display:'flex', gap:16 },
    filterBar: { display:'flex', gap:10, flexWrap:'wrap' as const, alignItems:'center', background:'var(--bg2,#1a1d24)', border:'1px solid var(--bd,rgba(255,255,255,0.07))', borderRadius:12, padding:'14px 18px', marginBottom:20 },
    searchInput: { flex:1, minWidth:200, background:'var(--bg3,#22262f)', border:'1px solid var(--bd,rgba(255,255,255,0.07))', borderRadius:8, padding:'9px 14px', fontSize:13, color:'var(--tx,#e8eaf0)', outline:'none', fontFamily:'inherit' },
    select: { background:'var(--bg3,#22262f)', border:'1px solid var(--bd,rgba(255,255,255,0.07))', borderRadius:8, padding:'9px 14px', fontSize:13, color:'var(--tx,#e8eaf0)', outline:'none', fontFamily:'inherit', cursor:'pointer', minWidth:130 },
    section: { marginBottom:24 },
    sectionTitle: { fontSize:15, fontWeight:700, padding:'10px 0', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid var(--bd,rgba(255,255,255,0.07))', marginBottom:12 },
    card: { background:'var(--bg2,#1a1d24)', border:'1px solid var(--bd,rgba(255,255,255,0.07))', borderRadius:12, overflow:'hidden' },
    row: { display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:'1px solid var(--bd,rgba(255,255,255,0.04))', flexWrap:'wrap' as const },
    name: { fontWeight:600, fontSize:14, minWidth:150 },
    email: { fontSize:12, color:'var(--mu,#7a7f90)', minWidth:200 },
    roleBadge: (role: string) => ({ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:6, background:`${ROLE_COLORS[role]||'#888'}22`, color:ROLE_COLORS[role]||'#888', textTransform:'capitalize' as const, whiteSpace:'nowrap' as const }),
    statusDot: (status: string) => ({ width:8, height:8, borderRadius:'50%', background:STATUS_COLORS[status]||'#888', display:'inline-block', marginRight:5 }),
    points: { fontSize:13, fontWeight:700, color:'#ffd60a', minWidth:50, textAlign:'center' as const },
    date: { fontSize:12, color:'var(--mu2,#505468)', minWidth:80 },
    actions: { display:'flex', gap:8, marginLeft:'auto', flexWrap:'wrap' as const, alignItems:'center' },
    btnApprove: { background:'rgba(61,214,140,0.15)', color:'#3dd68c', border:'1px solid rgba(61,214,140,0.3)', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 },
    btnReject: { background:'rgba(255,107,107,0.12)', color:'#ff6b6b', border:'1px solid rgba(255,107,107,0.25)', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 },
    btnEnable: { background:'rgba(108,140,255,0.15)', color:'#6c8cff', border:'1px solid rgba(108,140,255,0.3)', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
    btnDisable: { background:'rgba(255,159,67,0.12)', color:'#ff9f43', border:'1px solid rgba(255,159,67,0.25)', borderRadius:8, padding:'7px 14px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
    btnDelete: { background:'rgba(255,107,107,0.08)', color:'#ff6b6b', border:'none', borderRadius:6, padding:'6px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit', opacity:0.7 },
    youBadge: { fontSize:10, fontWeight:700, background:'rgba(108,140,255,0.2)', color:'#6c8cff', padding:'2px 7px', borderRadius:4, marginLeft:6 },
    alwaysOn: { fontSize:12, color:'#3dd68c', fontWeight:600 },
    pendingBadge: { fontSize:11, fontWeight:700, background:'rgba(255,214,10,0.15)', color:'#ffd60a', padding:'3px 10px', borderRadius:6 },
    disabledBadge: { fontSize:11, fontWeight:700, background:'rgba(255,107,107,0.12)', color:'#ff6b6b', padding:'3px 10px', borderRadius:6 },
    empty: { padding:20, textAlign:'center' as const, color:'var(--mu,#7a7f90)', fontSize:13, fontStyle:'italic' },
    toast: (type: 'ok'|'err') => ({ position:'fixed' as const, bottom:24, right:24, background:type==='ok'?'#1a3d2a':'#3d1a1a', color:type==='ok'?'#3dd68c':'#ff6b6b', border:`1px solid ${type==='ok'?'#3dd68c55':'#ff6b6b55'}`, borderRadius:10, padding:'12px 20px', fontSize:13, fontWeight:600, zIndex:9999, fontFamily:'inherit', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }),
  }

  // ── RENDER ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ ...S.page, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:16, color:'var(--mu,#7a7f90)' }}>Loading team...</div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      {/* ── TOAST ── */}
      {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}

      {/* ── HEADER ── */}
      <div style={S.header}>
        <h1 style={S.title}>Team Management</h1>
        <div style={S.subtitle}>
          <span>{members.length} total</span>
          <span style={{color:'#ffd60a'}}>{totalPending} pending</span>
          <span style={{color:'#3dd68c'}}>{totalActive} active</span>
          <span style={{color:'#ff6b6b'}}>{totalDisabled} disabled</span>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div style={S.filterBar}>
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={S.searchInput}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={S.select}>
          <option value="all">All Roles</option>
          {ALL_ROLES.map(r => (
            <option key={r} value={r}>{r.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={S.select}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <span style={{ fontSize:12, color:'var(--mu,#7a7f90)' }}>{filtered.length} result{filtered.length!==1?'s':''}</span>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── SECTION 1: PENDING APPROVAL ── */}
      {/* ══════════════════════════════════════════════════════ */}
      {(statusFilter === 'all' || statusFilter === 'pending') && (
        <div style={S.section}>
          <div style={S.sectionTitle}>
            <span style={{ ...S.statusDot('pending') }} />
            <span>Pending Approval</span>
            <span style={{ fontSize:12, color:'#ffd60a', fontWeight:400 }}>({pending.length})</span>
          </div>
          <div style={S.card}>
            {pending.length === 0 ? (
              <div style={S.empty}>No pending members{statusFilter === 'pending' ? '' : ' — all caught up!'}</div>
            ) : (
              pending.map(m => (
                <div key={m.id} style={S.row}>
                  <div style={S.name}>
                    {m.full_name || 'Unnamed'}
                    {isProtected(m) && <span style={S.youBadge}>You</span>}
                  </div>
                  <div style={S.email}>{m.email}</div>
                  <span style={S.roleBadge(m.role)}>{m.role.replace(/_/g,' ')}</span>
                  <span style={S.pendingBadge}>Pending</span>
                  <div style={S.date}>{m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN') : '—'}</div>
                  <div style={S.actions}>
                    <button
                      style={S.btnApprove}
                      onClick={() => approveUser(m.id)}
                      disabled={actionLoading === m.id}
                    >
                      {actionLoading === m.id ? '...' : '✅ Approve'}
                    </button>
                    <button
                      style={S.btnReject}
                      onClick={() => rejectUser(m.id, m.full_name || m.email)}
                      disabled={actionLoading === m.id}
                    >
                      {actionLoading === m.id ? '...' : '❌ Reject'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── SECTION 2: ACTIVE MEMBERS ── */}
      {/* ══════════════════════════════════════════════════════ */}
      {(statusFilter === 'all' || statusFilter === 'active') && (
        <div style={S.section}>
          <div style={S.sectionTitle}>
            <span style={{ ...S.statusDot('active') }} />
            <span>Active Members</span>
            <span style={{ fontSize:12, color:'#3dd68c', fontWeight:400 }}>({active.length})</span>
          </div>
          <div style={S.card}>
            {active.length === 0 ? (
              <div style={S.empty}>No active members found.</div>
            ) : (
              active.map(m => (
                <div key={m.id} style={S.row}>
                  {/* Checkbox placeholder for future bulk actions */}
                  <div style={S.name}>
                    {m.full_name || 'Unnamed'}
                    {m.id === currentUser?.id && <span style={S.youBadge}>You</span>}
                  </div>
                  <div style={S.email}>{m.email}</div>

                  {/* Role — editable dropdown for non-protected users */}
                  {isProtected(m) ? (
                    <span style={S.roleBadge(m.role)}>{m.role.replace(/_/g,' ')}</span>
                  ) : (
                    <select
                      value={m.role}
                      onChange={e => changeRole(m.id, e.target.value)}
                      style={{
                        ...S.roleBadge(m.role),
                        cursor:'pointer', outline:'none', border:`1px solid ${ROLE_COLORS[m.role]||'#888'}44`,
                        fontFamily:'inherit'
                      }}
                    >
                      {ALL_ROLES.filter(r => r !== 'super_admin' && r !== 'job_seeker').map(r => (
                        <option key={r} value={r}>{r.replace(/_/g,' ')}</option>
                      ))}
                    </select>
                  )}

                  {/* Status — Always On for AO/SA, toggle for others */}
                  {(m.role === 'account_owner' || m.role === 'super_admin' || m.id === currentUser?.id) ? (
                    <span style={S.alwaysOn}>● Always On</span>
                  ) : (
                    <button
                      style={S.btnDisable}
                      onClick={() => disableUser(m.id)}
                      disabled={actionLoading === m.id}
                    >
                      {actionLoading === m.id ? '...' : 'Disable'}
                    </button>
                  )}

                  <div style={S.points}>{m.points || 0}</div>
                  <div style={S.date}>{m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN') : '—'}</div>

                  {/* Delete — only for non-protected */}
                  <div style={{ marginLeft:'auto' }}>
                    {!isProtected(m) && (
                      <button
                        style={S.btnDelete}
                        onClick={() => deleteUser(m.id, m.full_name || m.email)}
                        disabled={actionLoading === m.id}
                        title="Permanently delete"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── SECTION 3: DISABLED MEMBERS ── */}
      {/* ══════════════════════════════════════════════════════ */}
      {(statusFilter === 'all' || statusFilter === 'disabled') && (
        <div style={S.section}>
          <div style={S.sectionTitle}>
            <span style={{ ...S.statusDot('disabled') }} />
            <span>Disabled</span>
            <span style={{ fontSize:12, color:'#ff6b6b', fontWeight:400 }}>({disabled.length})</span>
          </div>
          <div style={S.card}>
            {disabled.length === 0 ? (
              <div style={S.empty}>No disabled members.</div>
            ) : (
              disabled.map(m => (
                <div key={m.id} style={S.row}>
                  <div style={S.name}>{m.full_name || 'Unnamed'}</div>
                  <div style={S.email}>{m.email}</div>
                  <span style={S.roleBadge(m.role)}>{m.role.replace(/_/g,' ')}</span>
                  <span style={S.disabledBadge}>Disabled</span>
                  <div style={S.date}>{m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN') : '—'}</div>
                  <div style={S.actions}>
                    <button
                      style={S.btnEnable}
                      onClick={() => enableUser(m.id)}
                      disabled={actionLoading === m.id}
                    >
                      {actionLoading === m.id ? '...' : 'Re-enable'}
                    </button>
                    <button
                      style={S.btnDelete}
                      onClick={() => deleteUser(m.id, m.full_name || m.email)}
                      disabled={actionLoading === m.id}
                      title="Permanently delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
