import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import { checkJobSeekerAuth, getNightModePreference, setNightModePreference } from '../../src/lib/jobseeker-utils'
import type { AppUser, JobApplication, VibeMode } from '../../src/types/jobseeker'
import JobSeekerSidebar from '../../src/components/JobSeekerSidebar'

// ══════════════════════════════════════════════════════════
// MY APPLICATIONS v2.0 — Production Grade
// Single auth, sidebar, proper types, skeleton, mobile-first
// ══════════════════════════════════════════════════════════

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
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
  const [user, setUser] = useState<AppUser | null>(null)
  const [apps, setApps] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [nightMode, setNightMode] = useState(false)
  const [vibeMode, setVibeMode] = useState<VibeMode>('fun')

  useEffect(() => { setNightMode(getNightModePreference()) }, [])

  function toggleNightMode(enabled: boolean) {
    setNightMode(enabled)
    setNightModePreference(enabled)
  }

  async function switchVibe(v: VibeMode) {
    setVibeMode(v)
    if (user) supabase.from('app_users').update({ vibe_mode: v }).eq('id', user.id)
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const { user: au, redirect } = await checkJobSeekerAuth()
        if (cancelled) return
        if (redirect) { router.push(redirect); return }
        if (!au) return

        setUser(au)
        setVibeMode(au.vibe_mode || 'fun')

        const { data, error: fetchErr } = await supabase
          .from('job_applications')
          .select('*, job_descriptions(title, location, city, salary_min, salary_max, experience_min, job_type, companies(name))')
          .eq('applicant_id', au.id)
          .order('created_at', { ascending: false })

        if (cancelled) return
        if (fetchErr) { setError('Could not load applications. Please refresh.'); setLoading(false); return }
        setApps((data || []) as JobApplication[])
        setLoading(false)
      } catch {
        if (!cancelled) { setError('Something went wrong. Please refresh.'); setLoading(false) }
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  const filteredApps = filter === 'all' ? apps : apps.filter(a => a.status === filter)
  const statusCounts: Record<string, number> = {}
  Object.keys(STATUS_COLORS).forEach(s => { statusCounts[s] = apps.filter(a => a.status === s).length })

  const theme = nightMode
    ? { bg: 'var(--bg)', bg2: 'var(--bg)', bg3: 'var(--bg2)', tx: 'var(--tx)', bd: 'rgba(255,255,255,0.05)' }
    : { bg: 'var(--bg)', bg2: 'var(--bg2)', bg3: 'var(--bg2)', tx: 'var(--tx)', bd: 'rgba(255,255,255,0.06)' }

  // SKELETON
  if (loading) return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: "'Outfit',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.skel{background:linear-gradient(90deg,${theme.bg3} 25%,${theme.bg2} 50%,${theme.bg3} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}`}</style>
      <div style={{ padding: '60px 20px', maxWidth: 760, margin: '0 auto' }}>
        <div className="skel" style={{ height: 28, width: 180, marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skel" style={{ height: 36, width: 80 }} />)}
        </div>
        <div className="skel" style={{ height: 120, marginBottom: 10 }} />
        <div className="skel" style={{ height: 120, marginBottom: 10 }} />
        <div className="skel" style={{ height: 120, marginBottom: 10 }} />
      </div>
    </div>
  )

  // ERROR
  if (error) return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: theme.tx }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ background: '#6c8cff', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Refresh Page</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.tx, fontFamily: "'Outfit',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.fade-in{animation:fadeIn 0.25s ease}`}</style>

      {/* SIDEBAR */}
      <JobSeekerSidebar
        userName={user?.full_name || ''}
        xp={user?.xp_points || 0}
        streak={user?.streak_count || 0}
        vibeMode={vibeMode}
        onVibeChange={switchVibe}
        nightMode={nightMode}
        onNightModeChange={toggleNightMode}
      />

      <div style={{ padding: '16px 20px', maxWidth: 760, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>My Applications</div>
          <div style={{ color: 'var(--mu)', fontSize: 13, marginTop: 4 }}>{apps.length} total</div>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 20 }}>
          <button onClick={() => setFilter('all')} style={{
            background: filter === 'all' ? 'rgba(108,140,255,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${filter === 'all' ? 'rgba(108,140,255,0.3)' : theme.bd}`,
            borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            color: filter === 'all' ? '#6c8cff' : 'var(--mu)',
          }}>All ({apps.length})</button>
          {Object.entries(STATUS_COLORS).map(([status, sc]) => (
            <button key={status} onClick={() => setFilter(filter === status ? 'all' : status)} style={{
              background: filter === status ? sc.bg : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filter === status ? sc.color + '44' : theme.bd}`,
              borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              color: filter === status ? sc.color : 'var(--mu2)',
            }}>{status} ({statusCounts[status] || 0})</button>
          ))}
        </div>

        {/* Applications */}
        {filteredApps.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: 60, color: 'var(--mu2)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{filter === 'all' ? 'No applications yet' : `No ${filter} applications`}</div>
            <div style={{ fontSize: 13, marginTop: 6, marginBottom: 16 }}>Start applying to jobs!</div>
            <button onClick={() => router.push('/jobseeker')} style={{ background: '#6c8cff', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Browse Jobs →</button>
          </div>
        ) : (
          filteredApps.map(a => {
            const j = a.job_descriptions
            const sc = STATUS_COLORS[a.status] || STATUS_COLORS['Applied']
            const appliedDate = a.applied_at || a.created_at
            const currentIdx = STEPS.indexOf(a.status)
            const isRejected = a.status === 'Rejected'

            return (
              <div key={a.id} className="fade-in" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: `1px solid ${theme.bd}`, padding: '16px 18px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' as const }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{j?.title || 'Job Title'}</div>
                    <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 8 }}>{j?.companies?.name || 'Company'}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, fontSize: 11, color: 'var(--mu2)' }}>
                      {(j?.location || j?.city) && <span>📍 {j?.location || j?.city}</span>}
                      {j?.salary_min && <span style={{ color: '#3dd68c' }}>₹{j?.salary_min}{j?.salary_max ? `–${j?.salary_max}` : '+'} LPA</span>}
                      {j?.job_type && <span>{j?.job_type}</span>}
                    </div>
                    {(a.cover_note || a.cover_letter) && (
                      <div style={{ fontSize: 12, color: 'var(--mu2)', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', borderLeft: '2px solid rgba(108,140,255,0.3)', marginTop: 8 }}>
                        "{a.cover_note || a.cover_letter}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color, padding: '4px 14px', borderRadius: 20 }}>{a.status}</span>
                    <span style={{ fontSize: 11, color: 'var(--mu2)' }}>{new Date(appliedDate).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${theme.bd}` }}>
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
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff',
                            }}>{isDone ? '✓' : ''}</div>
                            <div style={{ fontSize: 9, color: isCurrent ? (isRejected ? '#ff6b6b' : '#3dd68c') : 'var(--mu2)', marginTop: 3, whiteSpace: 'nowrap' as const }}>{s}</div>
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
