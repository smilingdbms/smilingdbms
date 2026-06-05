import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import { PERMISSION_GROUPS, companyAllowedKeys, getPackage } from '../../src/lib/permissions-catalog'

export default function PermissionsPage() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [selected, setSelected] = useState<string>('')
  const [grants, setGrants] = useState<Record<string, Record<string, boolean>>>({})
  const [allowed, setAllowed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/'); return }

    const { data: user } = await supabase.from('app_users').select('*').eq('id', session.user.id).single()
    if (!user || !['account_owner', 'admin', 'super_admin'].includes(user.role)) {
      router.push('/dashboard'); return
    }
    setAppUser(user)

    // Company package → effective allowed catalog keys (perm_override wins for Enterprise)
    const { data: co } = await supabase.from('companies').select('*').eq('id', user.company_id).single()
    setCompany(co)
    setAllowed(companyAllowedKeys(co?.package_code, co?.perm_override))

    // Active team members (excluding self)
    const { data: mems } = await supabase
      .from('app_users')
      .select('*')
      .eq('company_id', user.company_id)
      .neq('id', user.id)
      .eq('status', 'active')
      .order('full_name')
    setMembers(mems || [])
    if (mems && mems.length) setSelected(mems[0].id)

    // Existing grants (catalog-keyed)
    const { data: rows } = await supabase
      .from('user_permission_keys')
      .select('*')
      .eq('company_id', user.company_id)
    const map: Record<string, Record<string, boolean>> = {}
    rows?.forEach(r => { (map[r.user_id] ||= {})[r.permission_key] = r.is_enabled })
    setGrants(map)

    setLoading(false)
  }

  function isOn(key: string) { return !!grants[selected]?.[key] }

  function toggle(key: string) {
    if (!allowed.includes(key)) return // locked → cannot grant beyond company package
    setGrants(prev => ({
      ...prev,
      [selected]: { ...prev[selected], [key]: !prev[selected]?.[key] }
    }))
  }

  function setAllAllowed(val: boolean) {
    if (!selected) return
    setGrants(prev => {
      const cur = { ...(prev[selected] || {}) }
      allowed.forEach(k => { cur[k] = val })
      return { ...prev, [selected]: cur }
    })
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    const cur = grants[selected] || {}
    // Only persist company-allowed keys (enforces user ⊆ company)
    const rows = allowed.map(key => ({
      company_id: appUser.company_id,
      user_id: selected,
      permission_key: key,
      is_enabled: !!cur[key],
      granted_by: appUser.id,
      updated_at: new Date().toISOString(),
    }))
    if (rows.length) {
      await supabase.from('user_permission_keys').upsert(rows, { onConflict: 'user_id,permission_key' })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const pkg = getPackage(company?.package_code)
  const seatLimit = company?.seat_limit || pkg.seats
  const seatsUsed = members.length + 1 // active members + the Account Owner
  const allowedCount = allowed.length
  const lockedCount = PERMISSION_GROUPS.reduce((n, g) => n + g.perms.filter(p => !allowed.includes(p.key)).length, 0)
  const selMember = members.find(m => m.id === selected)

  const S: any = {
    card: { background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 14, padding: 20, marginBottom: 16 },
    chip: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: 'var(--mu)' },
    toggle: (on: boolean, locked: boolean) => ({
      width: 42, height: 24, borderRadius: 12,
      background: locked ? 'var(--bg4,var(--bg3))' : (on ? 'var(--ac)' : 'var(--bg4,var(--bg3))'),
      border: `1px solid ${locked ? 'var(--bd)' : (on ? 'var(--ac)' : 'var(--bd)')}`,
      cursor: locked ? 'not-allowed' : 'pointer', position: 'relative' as const,
      transition: 'all 0.2s', flexShrink: 0, opacity: locked ? 0.45 : 1,
    }),
    dot: (on: boolean) => ({
      position: 'absolute' as const, top: 3, left: on ? 20 : 3,
      width: 16, height: 16, borderRadius: '50%', background: '#fff',
      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    }),
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--ac,#6c8cff)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>⚙️ Employee Permissions</div>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>Grant access per team member. Locked items need a plan upgrade.</div>
            </div>
            <button onClick={save} disabled={saving || !selected}
              style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--ac)', color: '#fff', border: 'none', cursor: selected ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', opacity: (saving || !selected) ? 0.7 : 1 }}>
              {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save'}
            </button>
          </div>

          {/* Plan summary chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ ...S.chip, color: 'var(--ac)', borderColor: 'var(--ac)' }}>📦 {pkg.name} plan</span>
            <span style={S.chip}>🪑 {seatsUsed} / {seatLimit} seats used</span>
            <span style={S.chip}>✅ {allowedCount} permissions available</span>
            {lockedCount > 0 && <span style={S.chip}>🔒 {lockedCount} locked</span>}
          </div>

          {members.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No team members yet</div>
              <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 16 }}>Invite members first, then set their permissions here.</div>
              <button onClick={() => router.push('/dashboard/invite')}
                style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--acbg)', color: 'var(--ac)', border: '1px solid var(--bd)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                Go to Invite Page →
              </button>
            </div>
          ) : (
            <>
              {/* Member selector */}
              <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--acbg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--ac)', fontSize: 16, flexShrink: 0 }}>
                  {(selMember?.full_name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 4 }}>Editing permissions for</div>
                  <select value={selected} onChange={e => setSelected(e.target.value)}
                    style={{ width: '100%', maxWidth: 320, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 10px', color: 'var(--tx)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name} — {m.role?.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setAllAllowed(true)}
                    style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--acbg)', color: 'var(--ac)', border: '1px solid var(--bd)', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                    Enable all
                  </button>
                  <button onClick={() => setAllAllowed(false)}
                    style={{ padding: '6px 12px', borderRadius: 8, background: 'transparent', color: 'var(--mu)', border: '1px solid var(--bd)', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                    Clear all
                  </button>
                </div>
              </div>

              {/* Permission groups */}
              {selected && PERMISSION_GROUPS.map(group => (
                <div key={group.group} style={S.card}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{group.group}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {group.perms.map(perm => {
                      const locked = !allowed.includes(perm.key)
                      const on = isOn(perm.key)
                      return (
                        <div key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--bd)', opacity: locked ? 0.7 : 1 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {locked && <span title="Upgrade plan to unlock">🔒</span>}
                              {perm.label}
                            </div>
                            {locked && (
                              <div style={{ fontSize: 10, color: 'var(--ac)', marginTop: 2 }}>
                                Upgrade your plan to unlock this
                              </div>
                            )}
                          </div>
                          <div style={S.toggle(on, locked)} onClick={() => toggle(perm.key)}>
                            {!locked && <div style={S.dot(on)} />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Bottom save */}
              <button onClick={save} disabled={saving || !selected}
                style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'var(--ac)', color: '#fff', border: 'none', cursor: selected ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', marginBottom: 20, opacity: (saving || !selected) ? 0.7 : 1 }}>
                {saving ? '⏳ Saving permissions...' : saved ? '✅ Permissions saved!' : '💾 Save Permissions'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
