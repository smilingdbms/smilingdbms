import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ══════════════════════════════════════════════════════════
// MY APPLICATIONS v2.0 — Bug fixes + clean UI
// Fixed: applied_at, cover_note/cover_letter, status timeline
// ══════════════════════════════════════════════════════════

const STATUS_COLORS: Record<string, { bg: string, color: string }> = {
  Applied: { bg: 'rgba(108,140,255,0.12)', color: '#6c8cff' },
  Reviewing: { bg: 'rgba(255,159,67,0.12)', color: '#ff9f43' },
  Shortlisted: { bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  Interview: { bg: 'rgba(72,202,228,0.12)', color: '#48cae4' },
  Rejected: { bg: 'rgba(255,107,107,0.12)', color: '#ff6b6b' },
  Hired: { bg: 'rgba(111,207,111,0.15)', color: '#6fcf6f' },
}

const STEPS = ['Applied', 'Reviewing', 'Shortlisted', 'Interview', 'Hired']

export default function MyApplications() {
  const router = useRouter()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/'); return }
      const { data: au } = await supabase.from('app_users').select('role,status').eq('id', u.id).single()
      if (!au) { await supabase.auth.signOut(); router.push('/'); return }
      if (au.status === 'disabled') { await supabase.auth.signOut(); router.push('/'); return }
      if (!['job_seeker', 'super_admin'].includes(au.role)) { router.push('/dashboard'); return }

      const { data } = await supabase.from('job_applications')
        .select('*, job_descriptions(title, location, city, salary_min, salary_max, experience_min, job_type, companies(name))')
        .eq('applicant_id', u.id)
        .order('created_at', { ascending: false })
      setApps(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const filteredApps = filter === 'all' ? apps : apps.filter(a => a.status === filter)
  const statusCounts = Object.keys(STATUS_COLORS).reduce((acc: any, s) => {
    acc[s] = apps.filter(a => a.status === s).length; return acc
  }, {} as Record<string, number>)

  const S: Record<string, any> = {
    page: { minHeight: '100vh', background: 'var(--bg,#0f1117)', color: 'var(--tx,#e8eaf0)', fontFamily: "'Outfit',sans-serif" },
    nav: { background: 'var(--bg2,#161921)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 50 },
    body: { padding: '16px 20px', maxWidth: 760, margin: '0 auto' },
    card: { background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: 18, marginBottom: 10 },
    btn: (bg: string, col: string) => ({ background: bg, color: col, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
  }

  if (loading) return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#7a7f90' }}>Loading applications...</div></div>

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      <nav style={S.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(108,140,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#6c8cff', fontSize: 15 }}>R</div>
          <div><div style={{ fontWeight: 700, fontSize: 15 }}>RecruitBase</div><div style={{ fontSize: 9, color: '#505468', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Job Portal</div></div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={S.btn('rgba(108,140,255,0.1)', '#6c8cff')} onClick={() => router.push('/jobseeker')}>Browse Jobs</button>
          <button style={S.btn('rgba(61,214,140,0.1)', '#3dd68c')} onClick={() => router.push('/jobseeker/profile')}>Profile</button>
          <button style={S.btn('rgba(255,255,255,0.04)', '#7a7f90')} onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Sign Out</button>
        </div>
      </nav>

      <div style={S.body}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>My Applications</div>
          <div style={{ color: '#7a7f90', fontSize: 13, marginTop: 4 }}>{apps.length} total</div>
        </div>

        {/* Status Cards */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 20 }}>
          <button onClick={() => setFilter('all')} style={{ ...S.btn(filter === 'all' ? 'rgba(108,140,255,0.15)' : 'rgba(255,255,255,0.03)', filter === 'all' ? '#6c8cff' : '#7a7f90'), border: `1px solid ${filter === 'all' ? 'rgba(108,140,255,0.3)' : 'rgba(255,255,255,0.06)'}`, padding: '8px 14px', borderRadius: 10 }}>
            All ({apps.length})
          </button>
          {Object.entries(STATUS_COLORS).map(([status, sc]) => (
            <button key={status} onClick={() => setFilter(filter === status ? 'all' : status)} style={{
              ...S.btn(filter === status ? sc.bg : 'rgba(255,255,255,0.03)', filter === status ? sc.color : '#505468'),
              border: `1px solid ${filter === status ? sc.color + '44' : 'rgba(255,255,255,0.06)'}`, padding: '8px 14px', borderRadius: 10,
            }}>
              {status} ({statusCounts[status] || 0})
            </button>
          ))}
        </div>

        {/* Applications */}
        {filteredApps.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: 60, color: '#505468' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{filter === 'all' ? 'No applications yet' : `No ${filter} applications`}</div>
            <div style={{ fontSize: 13, marginTop: 6, marginBottom: 16 }}>Start applying to jobs!</div>
            <button style={S.btn('#6c8cff', '#fff')} onClick={() => router.push('/jobseeker')}>Browse Jobs →</button>
          </div>
        ) : (
          filteredApps.map(a => {
            const j = a.job_descriptions
            const sc = STATUS_COLORS[a.status] || STATUS_COLORS['Applied']
            const appliedDate = a.applied_at || a.created_at
            const currentIdx = STEPS.indexOf(a.status)
            const isRejected = a.status === 'Rejected'

            return (
              <div key={a.id} style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{j?.title || 'Job Title'}</div>
                    <div style={{ fontSize: 13, color: '#7a7f90', marginBottom: 8 }}>{j?.companies?.name || 'Company'}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, fontSize: 11, color: '#505468' }}>
                      {(j?.location || j?.city) && <span>📍 {j?.location || j?.city}</span>}
                      {j?.salary_min && <span style={{ color: '#3dd68c' }}>₹{j?.salary_min}{j?.salary_max ? `–${j?.salary_max}` : '+'} LPA</span>}
                      {j?.job_type && <span>{j?.job_type}</span>}
                    </div>
                    {(a.cover_note || a.cover_letter) && (
                      <div style={{ fontSize: 12, color: '#505468', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', borderLeft: '2px solid rgba(108,140,255,0.3)', marginTop: 8 }}>
                        "{a.cover_note || a.cover_letter}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color, padding: '4px 14px', borderRadius: 20 }}>{a.status}</span>
                    <span style={{ fontSize: 11, color: '#505468' }}>{new Date(appliedDate).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {STEPS.map((s, i) => {
                      const isDone = isRejected ? false : i <= currentIdx
                      const isCurrent = s === a.status
                      return (
                        <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', flex: 0 }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%',
                              background: isRejected && isCurrent ? '#ff6b6b' : isDone ? '#3dd68c' : 'rgba(255,255,255,0.06)',
                              border: `2px solid ${isRejected && isCurrent ? '#ff6b6b' : isDone ? '#3dd68c' : 'rgba(255,255,255,0.1)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff'
                            }}>
                              {isDone ? '✓' : ''}
                            </div>
                            <div style={{ fontSize: 9, color: isCurrent ? (isRejected ? '#ff6b6b' : '#3dd68c') : '#505468', marginTop: 3, whiteSpace: 'nowrap' as const }}>{s}</div>
                          </div>
                          {i < 4 && <div style={{ height: 2, flex: 1, background: isDone && i < currentIdx ? '#3dd68c' : 'rgba(255,255,255,0.06)', margin: '0 4px', marginBottom: 16 }} />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
