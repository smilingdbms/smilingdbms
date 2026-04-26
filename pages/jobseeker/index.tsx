import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import { calculateMatch, calculateProfileStrength, shareJob, getDailyTip, updateStreak, awardXP, isAdSlot, getUserLocation } from '../../src/lib/jobseeker-utils'

// ══════════════════════════════════════════════════════════
// JOB SEEKER PORTAL v2.0 — Sprint 1 Fresh Build
// Onboarding → 3 Vibe Modes → All Sprint 1 Features
// ══════════════════════════════════════════════════════════

type VibeMode = 'fun' | 'professional' | 'focus'
type Segment = 'intern' | 'fresher' | 'junior' | 'experienced'

const VIBE_ICONS: Record<VibeMode, string> = { fun: '🎮', professional: '💼', focus: '🎯' }
const VIBE_LABELS: Record<VibeMode, string> = { fun: 'Fun & Social', professional: 'Professional', focus: 'Quick Apply' }
const SEG_LABELS: Record<Segment, string> = { intern: 'Intern (College)', fresher: 'Fresher (0-6 months)', junior: 'Junior (6m-2yr)', experienced: 'Experienced (2yr+)' }

export default function JobSeekerPortal() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<string[]>([])
  const [savedJobs, setSavedJobs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showApply, setShowApply] = useState<any>(null)
  const [coverNote, setCoverNote] = useState('')
  const [applying, setApplying] = useState(false)
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null)
  const [vibeMode, setVibeMode] = useState<VibeMode>('fun')
  const [segment, setSegment] = useState<Segment>('fresher')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardStep, setOnboardStep] = useState(1)
  const [dailyTip, setDailyTip] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [profileStrength, setProfileStrength] = useState({ score: 0, missing: [] as string[] })
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const confettiRef = useRef(false)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Auth + Data Load ───────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/'); return }
      const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
      if (!au) { await supabase.auth.signOut(); router.push('/'); return }
      if (au.status === 'disabled') { await supabase.auth.signOut(); router.push('/'); return }
      if (!['job_seeker', 'super_admin'].includes(au.role)) { router.push('/dashboard'); return }

      setUser(au)
      setVibeMode(au.vibe_mode || 'fun')
      setSegment(au.experience_segment || 'fresher')

      // Check onboarding
      if (!au.onboarded) { setShowOnboarding(true) }
      else if (!confettiRef.current) {
        // Welcome back — update streak
        const s = await updateStreak(u.id)
        setStreak(s)
      }

      // Load profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('created_by', u.id).single()
      setProfile(prof)
      if (prof) setProfileStrength(calculateProfileStrength(prof))
      else setProfileStrength(calculateProfileStrength(au))

      // Load jobs, applications, saved, tip in parallel
      const [jobsRes, appsRes, savedRes, tip] = await Promise.all([
        supabase.from('job_descriptions').select('*, companies(name, company_code)').eq('status', 'Open').eq('is_public', true).order('created_at', { ascending: false }),
        supabase.from('job_applications').select('job_id').eq('applicant_id', u.id),
        supabase.from('saved_jobs').select('job_id').eq('user_id', u.id),
        getDailyTip(au.experience_segment || 'fresher')
      ])

      setJobs(jobsRes.data || [])
      setApplications((appsRes.data || []).map((a: any) => a.job_id))
      setSavedJobs((savedRes.data || []).map((s: any) => s.job_id))
      setDailyTip(tip)

      // Get geolocation silently
      getUserLocation().then(loc => {
        if (loc && !au.latitude) {
          supabase.from('app_users').update({ latitude: loc.lat, longitude: loc.lng }).eq('id', u.id)
        }
      })

      setLoading(false)
    }
    init()
  }, [])

  // ── Onboarding Complete ────────────────────────────────
  async function completeOnboarding() {
    if (!user) return
    await supabase.from('app_users').update({
      experience_segment: segment,
      vibe_mode: vibeMode,
      onboarded: true
    }).eq('id', user.id)
    setShowOnboarding(false)
    setShowConfetti(true)
    confettiRef.current = true
    await awardXP(user.id, 3)
    setTimeout(() => setShowConfetti(false), 3500)
    const s = await updateStreak(user.id)
    setStreak(s)
  }

  // ── Switch Vibe Mode ───────────────────────────────────
  async function switchVibe(v: VibeMode) {
    setVibeMode(v)
    if (user) {
      await supabase.from('app_users').update({ vibe_mode: v }).eq('id', user.id)
    }
  }

  // ── Apply ──────────────────────────────────────────────
  async function applyJob(oneClick: boolean = false) {
    if (!showApply && !oneClick) return
    const job = showApply
    if (!job || !user) return
    setApplying(true)
    const { error } = await supabase.from('job_applications').insert({
      job_id: job.id,
      applicant_id: user.id,
      full_name: user.full_name || profile?.name || '',
      email: user.email || profile?.email || '',
      cover_note: oneClick ? null : coverNote.trim() || null,
      cover_letter: oneClick ? null : coverNote.trim() || null,
      status: 'Applied',
      company_id: job.company_id || null,
    })
    setApplying(false)
    if (error) { showToast('Application failed. Please try again.', 'error'); return }
    setApplications(prev => [...prev, job.id])
    setShowApply(null)
    setCoverNote('')
    await awardXP(user.id, 3)
    showToast('Application submitted successfully!')
  }

  // ── 1-Tap Apply ────────────────────────────────────────
  async function quickApply(job: any) {
    if (!user) return
    if (profileStrength.score < 50) {
      showToast('Complete your profile (50%+) to use 1-tap apply.', 'error')
      return
    }
    setShowApply(job)
    // Immediately apply
    setApplying(true)
    const { error } = await supabase.from('job_applications').insert({
      job_id: job.id,
      applicant_id: user.id,
      full_name: user.full_name || profile?.name || '',
      email: user.email || profile?.email || '',
      status: 'Applied',
      company_id: job.company_id || null,
    })
    setApplying(false)
    setShowApply(null)
    if (error) { showToast('Application failed. Please try again.', 'error'); return }
    setApplications(prev => [...prev, job.id])
    await awardXP(user.id, 3)
    showToast('Applied with 1-tap!')
  }

  // ── Save/Unsave Job ────────────────────────────────────
  async function toggleSave(jobId: string) {
    if (!user) return
    if (savedJobs.includes(jobId)) {
      await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId)
      setSavedJobs(prev => prev.filter(id => id !== jobId))
      showToast('Removed from saved.')
    } else {
      await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: jobId })
      setSavedJobs(prev => [...prev, jobId])
      // no XP for saves
      showToast('Job saved!')
    }
  }

  // ── Filter ─────────────────────────────────────────────
  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchSearch = !q || (j.title || '').toLowerCase().includes(q) ||
      (j.companies?.name || j.company_name || '').toLowerCase().includes(q) ||
      (j.skills || '').toLowerCase().includes(q) ||
      (j.location || j.city || '').toLowerCase().includes(q)
    const matchCity = !filterCity || (j.location || j.city || '') === filterCity
    const matchType = !filterType || j.job_type === filterType
    if (showSaved) return matchSearch && matchCity && matchType && savedJobs.includes(j.id)
    return matchSearch && matchCity && matchType
  })

  const cities = [...new Set(jobs.map(j => j.location || j.city).filter(Boolean))]
  const types = [...new Set(jobs.map(j => j.job_type).filter(Boolean))]
  const userSkills = profile?.skills || user?.designation || ''
  const userExp = profile?.experience ? parseFloat(profile.experience) : null

  // ── STYLES ─────────────────────────────────────────────
  const isDark = true // future: theme toggle
  const S: Record<string, any> = {
    page: { minHeight: '100vh', background: 'var(--bg,#0f1117)', color: 'var(--tx,#e8eaf0)', fontFamily: "'Outfit',sans-serif" },
    nav: { background: 'var(--bg2,#161921)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 50 },
    body: { padding: '16px 20px', maxWidth: 760, margin: '0 auto' },
    inp: { background: 'var(--bg3,#1e2230)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', color: 'var(--tx,#e8eaf0)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    btn: (bg: string, col: string) => ({ background: bg, color: col, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }),
  }

  // ── LOADING ────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>R</div>
        <div style={{ color: '#7a7f90', fontSize: 14 }}>Finding opportunities for you...</div>
      </div>
    </div>
  )

  // ── RENDER ─────────────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}select option{background:#1e2230}
.jcard{transition:transform 0.15s,border-color 0.2s}.jcard:hover{border-color:rgba(108,140,255,0.35)!important;transform:translateY(-1px)}
.vbtn{transition:all 0.15s}.vbtn:hover{transform:scale(1.05)}
@keyframes confetti-fall{0%{transform:translateY(-100vh) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.fade-in{animation:fadeIn 0.3s ease}
.heart-btn{transition:all 0.2s}.heart-btn:hover{transform:scale(1.2)}
`}</style>

      {/* ── CONFETTI (one-time, 3 sec) ── */}
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: '-5%',
              width: 8 + Math.random() * 8,
              height: 8 + Math.random() * 8,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              background: ['#6c8cff', '#3dd68c', '#ffd60a', '#ff6b6b', '#48cae4', '#c77dff'][i % 6],
              animation: `confetti-fall ${2 + Math.random() * 2}s linear ${Math.random() * 0.5}s forwards`,
            }} />
          ))}
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 999, background: toast.type === 'success' ? '#0d2a1a' : '#2a0d0d', border: `1px solid ${toast.type === 'success' ? '#3dd68c55' : '#ff505055'}`, color: toast.type === 'success' ? '#3dd68c' : '#ff5050', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── ONBOARDING MODAL ── */}
      {/* ══════════════════════════════════════════════════ */}
      {showOnboarding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="fade-in" style={{ background: '#161921', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px 32px', maxWidth: 480, width: '100%', textAlign: 'center' }}>

            {/* Step 1: Segment */}
            {onboardStep === 1 && (<>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Welcome to RecruitBase!</div>
              <div style={{ fontSize: 14, color: '#7a7f90', marginBottom: 28 }}>Tell us about your experience level</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {(['intern', 'fresher', 'junior', 'experienced'] as Segment[]).map(s => (
                  <button key={s} className="vbtn" onClick={() => setSegment(s)} style={{
                    padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${segment === s ? '#6c8cff' : 'rgba(255,255,255,0.08)'}`,
                    background: segment === s ? 'rgba(108,140,255,0.12)' : 'rgba(255,255,255,0.03)',
                    color: segment === s ? '#6c8cff' : '#e8eaf0', cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', textAlign: 'left' as const,
                  }}>
                    {SEG_LABELS[s]}
                  </button>
                ))}
              </div>
              <button onClick={() => setOnboardStep(2)} style={{ ...S.btn('#6c8cff', '#fff'), width: '100%', marginTop: 20, padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12 }}>
                Continue →
              </button>
            </>)}

            {/* Step 2: Vibe Mode */}
            {onboardStep === 2 && (<>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>How do you like your feed?</div>
              <div style={{ fontSize: 14, color: '#7a7f90', marginBottom: 28 }}>You can change this anytime</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {(['fun', 'professional', 'focus'] as VibeMode[]).map(v => (
                  <button key={v} className="vbtn" onClick={() => setVibeMode(v)} style={{
                    padding: '16px', borderRadius: 12, border: `1.5px solid ${vibeMode === v ? '#6c8cff' : 'rgba(255,255,255,0.08)'}`,
                    background: vibeMode === v ? 'rgba(108,140,255,0.12)' : 'rgba(255,255,255,0.03)',
                    color: vibeMode === v ? '#e8eaf0' : '#7a7f90', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const,
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{VIBE_ICONS[v]} {VIBE_LABELS[v]}</div>
                    <div style={{ fontSize: 12, color: '#505468' }}>
                      {v === 'fun' ? 'Card-based feed with animations and colors' : v === 'professional' ? 'Clean list view, formal layout' : 'Minimal UI, just jobs and apply buttons'}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setOnboardStep(1)} style={{ ...S.btn('rgba(255,255,255,0.06)', '#7a7f90'), flex: 1, padding: '14px', borderRadius: 12 }}>← Back</button>
                <button onClick={completeOnboarding} style={{ ...S.btn('#6c8cff', '#fff'), flex: 2, padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12 }}>
                  Let's Go! 🚀
                </button>
              </div>
            </>)}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── APPLY MODAL ── */}
      {/* ══════════════════════════════════════════════════ */}
      {showApply && !applying && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="fade-in" style={{ background: '#161921', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Apply for {showApply.title}</div>
            <div style={{ fontSize: 13, color: '#7a7f90', marginBottom: 20 }}>{showApply.companies?.name || showApply.company_name}</div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a7f90', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>Cover Note (optional)</label>
            <textarea rows={4} value={coverNote} onChange={e => setCoverNote(e.target.value)} placeholder="Tell the recruiter why you're a great fit..." style={{ ...S.inp, resize: 'none' as const, marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={S.btn('rgba(255,255,255,0.06)', '#7a7f90')} onClick={() => { setShowApply(null); setCoverNote('') }}>Cancel</button>
              <button style={{ ...S.btn('#6c8cff', '#fff'), flex: 1 }} onClick={() => applyJob(false)}>Submit Application</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── NAV ── */}
      {/* ══════════════════════════════════════════════════ */}
      <nav style={S.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(108,140,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#6c8cff', fontSize: 15 }}>R</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>RecruitBase</div>
            <div style={{ fontSize: 9, color: '#505468', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Job Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Vibe Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['fun', 'professional', 'focus'] as VibeMode[]).map(v => (
              <button key={v} className="vbtn" onClick={() => switchVibe(v)} title={VIBE_LABELS[v]} style={{
                padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
                background: vibeMode === v ? 'rgba(108,140,255,0.2)' : 'transparent',
                color: vibeMode === v ? '#6c8cff' : '#505468', fontFamily: 'inherit',
              }}>
                {VIBE_ICONS[v]}
              </button>
            ))}
          </div>
          <button style={S.btn('rgba(108,140,255,0.1)', '#6c8cff')} onClick={() => router.push('/jobseeker/applications')}>Applications</button>
          <button style={S.btn('rgba(61,214,140,0.1)', '#3dd68c')} onClick={() => router.push('/jobseeker/profile')}>Profile</button>
          <button style={S.btn('rgba(255,255,255,0.04)', '#7a7f90')} onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Sign Out</button>
        </div>
      </nav>

      <div style={S.body}>
        {/* ── Streak + XP (fun mode only) ── */}
        {vibeMode === 'fun' && streak > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(255,159,67,0.1)', border: '1px solid rgba(255,159,67,0.2)', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#ff9f43', fontWeight: 600 }}>
              🔥 {streak} day streak
            </div>
            <div style={{ background: 'rgba(108,140,255,0.1)', border: '1px solid rgba(108,140,255,0.2)', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#6c8cff', fontWeight: 600 }}>
              ⭐ {user?.xp_points || 0} XP
            </div>
          </div>
        )}

        {/* ── Daily Tip ── */}
        {dailyTip && (
          <div style={{ background: 'rgba(108,140,255,0.06)', border: '1px solid rgba(108,140,255,0.12)', borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6c8cff', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Daily Career Tip</div>
              <div style={{ fontSize: 13, color: '#c8cad0', lineHeight: 1.5 }}>{dailyTip}</div>
            </div>
          </div>
        )}

        {/* ── Profile Strength ── */}
        {profileStrength.score < 80 && (
          <div style={{ background: 'rgba(255,214,10,0.06)', border: '1px solid rgba(255,214,10,0.12)', borderRadius: 14, padding: '14px 18px', marginBottom: 16, cursor: 'pointer' }} onClick={() => router.push('/jobseeker/profile')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ffd60a' }}>Profile Strength: {profileStrength.score}%</span>
              <span style={{ fontSize: 11, color: '#7a7f90' }}>Complete to unlock 1-tap apply →</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${profileStrength.score}%`, background: profileStrength.score > 60 ? '#3dd68c' : '#ffd60a', borderRadius: 3, transition: 'width 0.5s' }} />
            </div>
            {profileStrength.missing.length > 0 && (
              <div style={{ fontSize: 11, color: '#7a7f90', marginTop: 6 }}>Missing: {profileStrength.missing.slice(0, 3).join(', ')}{profileStrength.missing.length > 3 ? ` +${profileStrength.missing.length - 3} more` : ''}</div>
            )}
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ marginBottom: 20, textAlign: vibeMode === 'fun' ? 'center' as const : 'left' as const }}>
          <div style={{ fontSize: vibeMode === 'fun' ? 26 : 20, fontWeight: 800, marginBottom: 4 }}>
            {vibeMode === 'fun' ? <>Find Your Next <span style={{ color: '#6c8cff' }}>Opportunity</span></> : 'Open Positions'}
          </div>
          <div style={{ color: '#7a7f90', fontSize: 13 }}>
            {filtered.length} {showSaved ? 'saved' : 'open'} positions
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
            <input style={{ ...S.inp, flex: 1, minWidth: 180 }} placeholder="Search role, company, skill, city..." value={search} onChange={e => setSearch(e.target.value)} />
            {cities.length > 0 && (
              <select style={{ ...S.inp, width: 'auto', minWidth: 120 }} value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {types.length > 0 && (
              <select style={{ ...S.inp, width: 'auto', minWidth: 110 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <button className="vbtn" onClick={() => setShowSaved(!showSaved)} style={{
              ...S.btn(showSaved ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.04)', showSaved ? '#ff6b6b' : '#7a7f90'),
              padding: '10px 14px', fontSize: 14, borderRadius: 10
            }}>
              {showSaved ? '❤️' : '🤍'} {savedJobs.length}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── JOB FEED ── */}
        {/* ══════════════════════════════════════════════════ */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: 60, color: '#505468' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No {showSaved ? 'saved ' : ''}jobs found</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{showSaved ? 'Save jobs by tapping the heart icon' : 'Try different keywords or clear filters'}</div>
          </div>
        ) : (
          <div>
            {filtered.map((j, idx) => {
              const applied = applications.includes(j.id)
              const isSaved = savedJobs.includes(j.id)
              const matchPct = calculateMatch(userSkills, userExp, j)
              const mapLink = j.latitude && j.longitude
                ? `https://www.google.com/maps?q=${j.latitude},${j.longitude}`
                : j.location || j.city ? `https://www.google.com/maps/search/${encodeURIComponent(j.location || j.city)}` : ''

              return (
                <div key={j.id}>
                  {/* ── AD SLOT ── */}
                  {isAdSlot(idx) && (
                    <div style={{ background: 'rgba(255,214,10,0.04)', border: '1px solid rgba(255,214,10,0.1)', borderRadius: 14, padding: '16px 20px', marginBottom: 12, textAlign: 'center' as const }}>
                      <div style={{ fontSize: 10, color: '#7a7f90', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6 }}>Sponsored</div>
                      <div style={{ fontSize: 14, color: '#505468' }}>Ad space available — promote your job here</div>
                    </div>
                  )}

                  {/* ── JOB CARD ── */}
                  {vibeMode === 'focus' ? (
                    /* ── FOCUS MODE: Minimal row ── */
                    <div className="jcard" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 6, cursor: 'pointer' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                        <div style={{ fontSize: 12, color: '#7a7f90' }}>{j.companies?.name || j.company_name}{j.location || j.city ? ` · ${j.location || j.city}` : ''}</div>
                      </div>
                      {matchPct > 0 && <span style={{ fontSize: 11, color: matchPct > 70 ? '#3dd68c' : '#6c8cff', fontWeight: 700, flexShrink: 0 }}>{matchPct}%</span>}
                      <button className="heart-btn" onClick={() => toggleSave(j.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 }}>{isSaved ? '❤️' : '🤍'}</button>
                      {applied ? (
                        <span style={{ fontSize: 11, color: '#3dd68c', fontWeight: 700 }}>Applied ✓</span>
                      ) : (
                        <button style={S.btn('#6c8cff', '#fff')} onClick={() => profileStrength.score >= 50 ? quickApply(j) : setShowApply(j)}>Apply</button>
                      )}
                    </div>
                  ) : (
                    /* ── FUN + PROFESSIONAL MODE: Card ── */
                    <div className="jcard fade-in" style={{
                      background: vibeMode === 'fun' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
                      borderRadius: vibeMode === 'fun' ? 16 : 12,
                      border: `1px solid ${applied ? 'rgba(61,214,140,0.25)' : 'rgba(255,255,255,0.06)'}`,
                      padding: vibeMode === 'fun' ? 20 : 16,
                      marginBottom: 12,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Company + Title */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(108,140,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6c8cff', fontSize: 15, flexShrink: 0 }}>
                              {(j.companies?.name || j.company_name || 'C')[0]}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                              <div style={{ fontSize: 12, color: '#7a7f90' }}>{j.companies?.name || j.company_name || 'Company'}</div>
                            </div>
                          </div>

                          {/* Tags */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                            {(j.location || j.city) && (
                              <a href={mapLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 8px', color: '#7a7f90', textDecoration: 'none' }}>
                                📍 {j.location || j.city}
                              </a>
                            )}
                            {j.experience_min != null && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 8px', color: '#7a7f90' }}>💼 {j.experience_min}{j.experience_max ? `–${j.experience_max}` : '+'} yrs</span>}
                            {j.salary_min && <span style={{ fontSize: 11, background: 'rgba(61,214,140,0.08)', border: '1px solid rgba(61,214,140,0.15)', borderRadius: 6, padding: '3px 8px', color: '#3dd68c' }}>₹{j.salary_min}{j.salary_max ? `–${j.salary_max}` : '+'} LPA</span>}
                            {j.job_type && <span style={{ fontSize: 11, background: 'rgba(108,140,255,0.08)', border: '1px solid rgba(108,140,255,0.15)', borderRadius: 6, padding: '3px 8px', color: '#6c8cff' }}>{j.job_type}</span>}
                          </div>

                          {/* Description */}
                          {vibeMode === 'fun' && j.description && (
                            <div style={{ fontSize: 12, color: '#7a7f90', lineHeight: 1.6, marginBottom: 8 }}>{j.description.slice(0, 120)}{j.description.length > 120 ? '...' : ''}</div>
                          )}

                          {/* Skills */}
                          {j.skills && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                              {j.skills.split(',').slice(0, 4).map((sk: string) => (
                                <span key={sk} style={{ fontSize: 10, background: 'rgba(255,255,255,0.04)', color: '#505468', padding: '2px 7px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>{sk.trim()}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right side: actions */}
                        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          {/* Match % */}
                          {matchPct > 0 && (
                            <div style={{ fontSize: 12, fontWeight: 700, color: matchPct > 70 ? '#3dd68c' : matchPct > 40 ? '#6c8cff' : '#7a7f90', background: matchPct > 70 ? 'rgba(61,214,140,0.1)' : 'rgba(108,140,255,0.1)', padding: '3px 10px', borderRadius: 8 }}>
                              {matchPct}% match
                            </div>
                          )}

                          <div style={{ fontSize: 10, color: '#505468' }}>{new Date(j.created_at).toLocaleDateString('en-IN')}</div>

                          {/* Save + Share */}
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button className="heart-btn" onClick={() => toggleSave(j.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 2 }} title={isSaved ? 'Remove from saved' : 'Save job'}>
                              {isSaved ? '❤️' : '🤍'}
                            </button>
                            <div style={{ position: 'relative' }}>
                              <button onClick={() => setShowShareMenu(showShareMenu === j.id ? null : j.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 2, color: '#7a7f90' }}>↗</button>
                              {showShareMenu === j.id && (
                                <div style={{ position: 'absolute', right: 0, top: 28, background: '#1e2230', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 6, zIndex: 60, display: 'flex', flexDirection: 'column' as const, gap: 2, minWidth: 140 }}>
                                  <button onClick={() => { shareJob(j, 'whatsapp'); setShowShareMenu(null) }} style={{ background: 'none', border: 'none', color: '#25d366', cursor: 'pointer', fontSize: 13, padding: '8px 12px', textAlign: 'left' as const, borderRadius: 6, fontFamily: 'inherit' }}>WhatsApp</button>
                                  <button onClick={() => { shareJob(j, 'copy'); setShowShareMenu(null); showToast('Link copied!') }} style={{ background: 'none', border: 'none', color: '#7a7f90', cursor: 'pointer', fontSize: 13, padding: '8px 12px', textAlign: 'left' as const, borderRadius: 6, fontFamily: 'inherit' }}>Copy Link</button>
                                  {typeof navigator !== 'undefined' && navigator.share && (
                                    <button onClick={() => { shareJob(j, 'native'); setShowShareMenu(null) }} style={{ background: 'none', border: 'none', color: '#6c8cff', cursor: 'pointer', fontSize: 13, padding: '8px 12px', textAlign: 'left' as const, borderRadius: 6, fontFamily: 'inherit' }}>Share...</button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Apply Button */}
                          {applied ? (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#3dd68c', background: 'rgba(61,214,140,0.1)', border: '1px solid rgba(61,214,140,0.2)', borderRadius: 10, padding: '8px 16px' }}>Applied ✓</span>
                          ) : profileStrength.score >= 50 ? (
                            <button className="vbtn" style={{ ...S.btn('#6c8cff', '#fff'), animation: vibeMode === 'fun' ? 'pulse 2s infinite' : 'none' }} onClick={() => quickApply(j)}>⚡ 1-Tap Apply</button>
                          ) : (
                            <button className="vbtn" style={S.btn('#6c8cff', '#fff')} onClick={() => setShowApply(j)}>Apply Now</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Close share menu on outside click */}
      {showShareMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setShowShareMenu(null)} />}
    </div>
  )
}
