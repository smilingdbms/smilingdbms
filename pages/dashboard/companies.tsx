import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import DashboardNav from '../../src/components/DashboardNav'

const PLANS = ['basic','seeker','pro','elite']
const PLAN_COLORS: any = {
  basic: { bg: 'rgba(100,100,120,0.2)', color: '#7a7f90' },
  seeker: { bg: 'rgba(108,140,255,0.15)', color: '#6c8cff' },
  pro: { bg: 'rgba(61,214,140,0.15)', color: '#3dd68c' },
  elite: { bg: 'rgba(255,214,10,0.15)', color: '#ffd60a' },
}
const FEATURES = [
  { key: 'bd_pipeline', label: 'BD Pipeline' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'communications', label: 'Communications' },
  { key: 'import', label: 'Bulk Import' },
  { key: 'job_portal', label: 'Job Portal' },
]

export default function CompaniesPage() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [userCounts, setUserCounts] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string|null>(null)
  const [saving, setSaving] = useState<string|null>(null)
  const [toast, setToast] = useState<{msg:string,type:'success'|'error'}|null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: au } = await supabase.from('app_users').select('*').eq('id', user.id).single()
    if (!au || au.role !== 'super_admin') { router.push('/dashboard'); return }
    setAppUser(au)
    await loadCompanies()
    setLoading(false)
  }

  async function loadCompanies() {
    const { data: cos } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
    setCompanies(cos || [])
    // Load user counts per company
    const { data: users } = await supabase.from('app_users').select('company_id').not('company_id', 'is', null)
    const counts: any = {}
    ;(users || []).forEach((u: any) => { counts[u.company_id] = (counts[u.company_id] || 0) + 1 })
    setUserCounts(counts)
  }

  function showToast(msg: string, type: 'success'|'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  async function updateCompany(id: string, field: string, value: any) {
    setSaving(id + field)
    const { error } = await supabase.from('companies').update({ [field]: value }).eq('id', id)
    setSaving(null)
    if (error) { showToast('Failed: ' + error.message, 'error'); return }
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    showToast('Updated successfully')
  }

  async function toggleFeature(companyId: string, featureKey: string, currentFeatures: any) {
    const newFeatures = { ...currentFeatures, [featureKey]: !currentFeatures?.[featureKey] }
    await updateCompany(companyId, 'features', newFeatures)
  }

  async function toggleCompanyActive(id: string, current: boolean) {
    await updateCompany(id, 'is_active', !current)
  }

  const filtered = companies.filter(c =>
    !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.company_code || '').toLowerCase().includes(search.toLowerCase())
  )

  const S = {
    page: { minHeight: '100vh', background: '#111318', color: '#e8eaf0', fontFamily: "'Outfit',sans-serif" },
    nav: { background: '#0d0f14', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 50 },
    body: { padding: '24px', maxWidth: 1100, margin: '0 auto' },
    card: { background: '#1a1d24', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10, overflow: 'hidden' },
    inp: { background: '#22262f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 12px', color: '#e8eaf0', fontSize: 12, fontFamily: 'inherit', outline: 'none' },
    btn: (bg: string, col: string) => ({ background: bg, color: col, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as const),
  }

  if (loading) return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#7a7f90' }}>Loading...</div></div>

  return (
    <div style={S.page}>
      <DashboardNav />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        select option{background:#22262f}
        .tog{position:relative;width:42px;height:24px;flex-shrink:0;cursor:pointer}
        .tog input{opacity:0;width:0;height:0}
        .sl{position:absolute;inset:0;border-radius:24px;transition:.2s;cursor:pointer}
        .sl:before{content:'';position:absolute;height:18px;width:18px;left:3px;bottom:3px;border-radius:50%;transition:.2s}
        .tog input:checked+.sl{background:rgba(61,214,140,0.25)}
        .tog input:checked+.sl:before{transform:translateX(18px);background:#3dd68c}
        .tog input:not(:checked)+.sl{background:rgba(255,80,80,0.2)}
        .tog input:not(:checked)+.sl:before{background:#ff5050}
        .co-row:hover{background:rgba(255,255,255,0.01)}
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: toast.type === 'success' ? '#0d2a1a' : '#2a0d0d', border: `1px solid ${toast.type === 'success' ? '#3dd68c' : '#ff5050'}`, color: toast.type === 'success' ? '#3dd68c' : '#ff5050', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{toast.msg}</div>
      )}

      <nav style={S.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(108,140,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#6c8cff', fontSize: 14 }}>R</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>RecruitBase Pro</div>
            <div style={{ fontSize: 9, color: '#505468', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Recruitment OS</div>
          </div>
          <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}>🏢 Companies</span>
        </div>
        <button style={S.btn('rgba(108,140,255,0.1)', '#6c8cff')} onClick={() => router.push('/dashboard')}>← Dashboard</button>
      </nav>

      <div style={S.body}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' as const, gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Companies</div>
            <div style={{ color: '#7a7f90', fontSize: 13, marginTop: 4 }}>
              {companies.length} companies · {companies.filter(c => c.is_active !== false).length} active
            </div>
          </div>
          <input style={{ ...S.inp, width: 260 }} placeholder="🔍  Search company or code..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {PLANS.map(p => {
            const pc = PLAN_COLORS[p]
            const count = companies.filter(c => (c.plan || 'basic') === p).length
            return (
              <div key={p} style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px', borderTop: `2px solid ${pc.color}` }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: pc.color }}>{count}</div>
                <div style={{ fontSize: 11, color: '#7a7f90', marginTop: 2, textTransform: 'capitalize' as const }}>{p} plan</div>
              </div>
            )
          })}
        </div>

        {/* Company list */}
        {filtered.map(co => {
          const isExpanded = expanded === co.id
          const pc = PLAN_COLORS[co.plan || 'basic']
          const features = co.features || { bd_pipeline: true, interviews: true, analytics: true, communications: true, import: true, job_portal: true }
          const isActive = co.is_active !== false

          return (
            <div key={co.id} style={S.card}>
              {/* Company header row */}
              <div className="co-row" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : co.id)}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(108,140,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6c8cff', fontSize: 16, flexShrink: 0 }}>
                  {(co.name || 'C')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{co.name}</span>
                    <span style={{ fontSize: 10, background: pc.bg, color: pc.color, padding: '1px 7px', borderRadius: 4, fontWeight: 700, textTransform: 'capitalize' as const }}>{co.plan || 'basic'}</span>
                    {!isActive && <span style={{ fontSize: 10, background: 'rgba(255,80,80,0.15)', color: '#ff5050', padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>Disabled</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#505468', marginTop: 2 }}>
                    Code: <span style={{ color: '#7a7f90', fontWeight: 600 }}>{co.company_code}</span>
                    · {userCounts[co.id] || 0} users
                    · {new Date(co.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>

                {/* Quick controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={e => e.stopPropagation()}>
                  {/* Plan dropdown */}
                  <select value={co.plan || 'basic'} onChange={e => updateCompany(co.id, 'plan', e.target.value)} style={{ ...S.inp, background: pc.bg, color: pc.color, fontWeight: 700, textTransform: 'capitalize' as const }}>
                    {PLANS.map(p => <option key={p} value={p} style={{ background: '#22262f', color: '#e8eaf0', textTransform: 'capitalize' }}>{p}</option>)}
                  </select>
                  {/* Active toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: isActive ? '#3dd68c' : '#ff5050', fontWeight: 700 }}>{isActive ? 'Active' : 'Off'}</span>
                    <label className="tog" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isActive} onChange={() => toggleCompanyActive(co.id, isActive)} />
                      <span className="sl" />
                    </label>
                  </div>
                </div>
                <span style={{ color: '#505468', fontSize: 14 }}>{isExpanded ? '▲' : '▼'}</span>
              </div>

              {/* Expanded controls */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7a7f90', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 14 }}>Feature Access</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                    {FEATURES.map(f => {
                      const enabled = features[f.key] !== false
                      return (
                        <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</div>
                            <div style={{ fontSize: 10, color: enabled ? '#3dd68c' : '#ff5050', marginTop: 2 }}>{enabled ? 'Enabled' : 'Disabled'}</div>
                          </div>
                          <label className="tog">
                            <input type="checkbox" checked={enabled} onChange={() => toggleFeature(co.id, f.key, features)} />
                            <span className="sl" />
                          </label>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                    <button style={S.btn('rgba(108,140,255,0.1)', '#6c8cff')} onClick={() => router.push(`/dashboard/admin?company=${co.id}`)}>👥 View Members</button>
                    <button style={S.btn('rgba(61,214,140,0.1)', '#3dd68c')} onClick={() => {
                      FEATURES.forEach(f => toggleFeature(co.id, f.key, Object.fromEntries(FEATURES.map(ft => [ft.key, false]))))
                    }}>✅ Enable All Features</button>
                    <button style={S.btn('rgba(255,80,80,0.08)', '#ff5050')} onClick={() => {
                      FEATURES.forEach(f => toggleFeature(co.id, f.key, Object.fromEntries(FEATURES.map(ft => [ft.key, true]))))
                    }}>⏸ Disable All Features</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center' as const, padding: 60, color: '#505468' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
            <div>No companies found</div>
          </div>
        )}
      </div>
    </div>
  )
}
