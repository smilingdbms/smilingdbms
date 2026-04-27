import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import {
  calculateMatch, calculateProfileStrength, shareJob, getDailyTip,
  updateStreak, awardXP, isAdSlot, saveUserLocation,
  checkJobSeekerAuth, paginate,
  getNightModePreference, setNightModePreference,
} from '../../src/lib/jobseeker-utils'
import type { AppUser, Job, Profile, VibeMode, Segment } from '../../src/types/jobseeker'
import JobSeekerSidebar from '../../src/components/JobSeekerSidebar'

// ══════════════════════════════════════════════════════════
// JOB SEEKER PORTAL v3.0 — Production Grade Rewrite
// Single auth, pagination, skeleton loading, share fix,
// sidebar, mobile-first, debounced search, proper types
// ══════════════════════════════════════════════════════════

const SEG_LABELS: Record<Segment, string> = {
  intern: 'Intern (College)',
  fresher: 'Fresher (0-6 months)',
  junior: 'Junior (6m-2yr)',
  experienced: 'Experienced (2yr+)',
}

const VIBE_LABELS: Record<VibeMode, string> = {
  fun: 'Fun & Social — Card swipe, colors, animations',
  professional: 'Professional — Clean list, formal layout',
  focus: 'Quick Apply — Minimal, just jobs and apply',
}

const VIBE_ICONS: Record<VibeMode, string> = { fun: '🎮', professional: '💼', focus: '🎯' }
const PAGE_SIZE = 20

export default function JobSeekerPortal() {
  const router = useRouter()
  const [user, setUser] = useState<AppUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<string[]>([])
  const [savedJobs, setSavedJobs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [showApply, setShowApply] = useState<Job | null>(null)
  const [coverNote, setCoverNote] = useState('')
  const [applying, setApplying] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
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
  const [nightMode, setNightMode] = useState(false)
  const confettiDone = useRef(false)

  // ── Toast helper ───────────────────────────────────────
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Debounced search ───────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // ── Night mode init ────────────────────────────────────
  useEffect(() => {
    setNightMode(getNightModePreference())
  }, [])

  function toggleNightMode(enabled: boolean) {
    setNightMode(enabled)
    setNightModePreference(enabled)
  }

  // ── SINGLE Auth + Data Load ────────────────────────────
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
        setSegment(au.experience_segment || 'fresher')

        if (!au.onboarded) {
          setShowOnboarding(true)
        } else if (!confettiDone.current) {
          const s = await updateStreak(au.id)
          if (!cancelled) setStreak(s)
        }

        // Load profile
        const { data: prof } = await supabase
          .from('profiles').select('*').eq('created_by', au.id).single()
        if (!cancelled) {
          setProfile(prof as Profile | null)
          setProfileStrength(calculateProfileStrength(prof || au as unknown as Partial<Profile>))
        }

        // Parallel data load
        const [jobsRes, appsRes, savedRes, tip] = await Promise.all([
          supabase.from('job_descriptions')
            .select('*, companies(name, company_code)')
            .eq('status', 'Open').eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(500),
          supabase.from('job_applications').select('job_id').eq('applicant_id', au.id),
          supabase.from('saved_jobs').select('job_id').eq('user_id', au.id),
          getDailyTip(au.experience_segment || 'fresher'),
        ])

        if (cancelled) return
        setAllJobs((jobsRes.data || []) as Job[])
        setApplications((appsRes.data || []).map((a: { job_id: string }) => a.job_id))
        setSavedJobs((savedRes.data || []).map((s: { job_id: string }) => s.job_id))
        setDailyTip(tip)

        // Save location silently (GPS + IP fallback)
        if (!au.latitude) saveUserLocation(au.id)

        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError('Something went wrong. Please refresh the page.')
          setLoading(false)
        }
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  // ── Onboarding Complete ────────────────────────────────
  async function completeOnboarding() {
    if (!user) return
    await supabase.from('app_users').update({
      experience_segment: segment,
      vibe_mode: vibeMode,
      onboarded: true,
    }).eq('id', user.id)
    setShowOnboarding(false)
    setShowConfetti(true)
    confettiDone.current = true
    await awardXP(user.id, 3)
    setTimeout(() => setShowConfetti(false), 3500)
    const s = await updateStreak(user.id)
    setStreak(s)
  }

  // ── Switch Vibe Mode ───────────────────────────────────
  async function switchVibe(v: VibeMode) {
    setVibeMode(v)
    if (user) supabase.from('app_users').update({ vibe_mode: v }).eq('id', user.id)
  }

  // ── Apply (with modal) ─────────────────────────────────
  async function applyJob() {
    if (!showApply || !user) return
    setApplying(true)
    const { error: err } = await supabase.from('job_applications').insert({
      job_id: showApply.id,
      applicant_id: user.id,
      full_name: user.full_name || profile?.name || '',
      email: user.email || profile?.email || '',
      cover_note: coverNote.trim() || null,
      cover_letter: coverNote.trim() || null,
      status: 'Applied',
      company_id: showApply.company_id || null,
    })
    setApplying(false)
    if (err) { showToast('Application failed. Please try again.', 'error'); return }
    setApplications(prev => [...prev, showApply.id])
    setShowApply(null)
    setCoverNote('')
    await awardXP(user.id, 3)
    showToast('Application submitted successfully!')
  }

  // ── 1-Tap Apply ────────────────────────────────────────
  async function quickApply(job: Job) {
    if (!user) return
    if (profileStrength.score < 50) {
      showToast('Complete your profile (50%+) to use 1-tap apply.', 'error')
      return
    }
    const { error: err } = await supabase.from('job_applications').insert({
      job_id: job.id,
      applicant_id: user.id,
      full_name: user.full_name || profile?.name || '',
      email: user.email || profile?.email || '',
      status: 'Applied',
      company_id: job.company_id || null,
    })
    if (err) { showToast('Application failed. Please try again.', 'error'); return }
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
    } else {
      await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: jobId })
      setSavedJobs(prev => [...prev, jobId])
    }
  }

  // ── Filter + Paginate ──────────────────────────────────
  const filtered = allJobs.filter(j => {
    const q = debouncedSearch.toLowerCase()
    const matchSearch = !q ||
      (j.title || '').toLowerCase().includes(q) ||
      (j.companies?.name || j.company_name || '').toLowerCase().includes(q) ||
      (j.skills || '').toLowerCase().includes(q) ||
      (j.location || j.city || '').toLowerCase().includes(q)
    const matchCity = !filterCity || (j.location || j.city || '') === filterCity
    const matchType = !filterType || j.job_type === filterType
    if (showSaved) return matchSearch && matchCity && matchType && savedJobs.includes(j.id)
    return matchSearch && matchCity && matchType
  })

  const { data: pageJobs, totalPages, hasNext, hasPrev } = paginate(filtered, page, PAGE_SIZE)
  const cities = [...new Set(allJobs.map(j => j.location || j.city).filter(Boolean))] as string[]
  const types = [...new Set(allJobs.map(j => j.job_type).filter(Boolean))] as string[]
  const userSkills = profile?.skills || user?.designation || ''
  const userExp = profile?.experience ? parseFloat(String(profile.experience)) : null

  // ── Theme ──────────────────────────────────────────────
  const theme = nightMode
    ? { bg: '#080a0f', bg2: '#0e1018', bg3: '#151820', tx: '#c8cad0', bd: 'rgba(255,255,255,0.05)' }
    : { bg: '#0f1117', bg2: '#161921', bg3: '#1e2230', tx: '#e8eaf0', bd: 'rgba(255,255,255,0.06)' }

  // ── SKELETON LOADING ───────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: "'Outfit',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.skel{background:linear-gradient(90deg,${theme.bg3} 25%,${theme.bg2} 50%,${theme.bg3} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}`}</style>
      <div style={{ padding: '60px 20px', maxWidth: 760, margin: '0 auto' }}>
        <div className="skel" style={{ height: 32, width: 200, marginBottom: 24 }} />
        <div className="skel" style={{ height: 48, marginBottom: 16 }} />
        <div className="skel" style={{ height: 140, marginBottom: 12 }} />
        <div className="skel" style={{ height: 140, marginBottom: 12 }} />
        <div className="skel" style={{ height: 140, marginBottom: 12 }} />
      </div>
    </div>
  )

  // ── ERROR STATE ────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: theme.tx }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ background: '#6c8cff', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Refresh Page</button>
      </div>
    </div>
  )

  // ── MAIN RENDER ────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.tx, fontFamily: "'Outfit',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}select option{background:${theme.bg3}}
.jcard{transition:transform 0.15s,border-color 0.2s}.jcard:hover{border-color:rgba(108,140,255,0.35)!important;transform:translateY(-1px)}
@keyframes confetti-fall{0%{transform:translateY(-100vh) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.fade-in{animation:fadeIn 0.25s ease}
.share-menu{position:absolute;right:0;top:36px;background:${theme.bg3};border:1px solid ${theme.bd};border-radius:10px;padding:6px;z-index:60;display:flex;flex-direction:column;gap:2px;min-width:150px;box-shadow:0 8px 32px rgba(0,0,0,0.4)}
.share-menu button{background:none;border:none;cursor:pointer;font-size:13px;padding:10px 14px;text-align:left;border-radius:6px;font-family:inherit}
.share-menu button:hover{background:rgba(108,140,255,0.1)}
.page-btn{background:rgba(255,255,255,0.04);border:1px solid ${theme.bd};border-radius:8px;padding:8px 16px;color:${theme.tx};cursor:pointer;font-size:13px;font-family:inherit}
.page-btn:hover{background:rgba(108,140,255,0.1);border-color:rgba(108,140,255,0.2)}
.page-btn:disabled{opacity:0.3;cursor:default}
`}</style>

      {/* Confetti */}
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${Math.random() * 100}%`, top: '-5%',
              width: 8 + Math.random() * 6, height: 8 + Math.random() * 6,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              background: ['#6c8cff', '#3dd68c', '#ffd60a', '#ff6b6b', '#48cae4', '#c77dff'][i % 6],
              animation: `confetti-fall ${2 + Math.random() * 2}s linear ${Math.random() * 0.5}s forwards`,
            }} />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fade-in" style={{ position: 'fixed', top: 16, right: 16, zIndex: 999, background: toast.type === 'success' ? '#0d2a1a' : '#2a0d0d', border: `1px solid ${toast.type === 'success' ? '#3dd68c55' : '#ff505055'}`, color: toast.type === 'success' ? '#3dd68c' : '#ff5050', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: 320 }}>
          {toast.msg}
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="fade-in" style={{ background: theme.bg2, border: `1px solid ${theme.bd}`, borderRadius: 20, padding: '36px 28px', maxWidth: 460, width: '100%', textAlign: 'center' }}>
            {onboardStep === 1 && (<>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Welcome to RecruitBase!</div>
              <div style={{ fontSize: 14, color: '#7a7f90', marginBottom: 24 }}>Tell us about your experience level</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {(['intern', 'fresher', 'junior', 'experienced'] as Segment[]).map(s => (
                  <button key={s} onClick={() => setSegment(s)} style={{
                    padding: '14px 16px', borderRadius: 12, textAlign: 'left' as const, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, transition: 'all 0.15s',
                    border: `1.5px solid ${segment === s ? '#6c8cff' : theme.bd}`,
                    background: segment === s ? 'rgba(108,140,255,0.12)' : 'rgba(255,255,255,0.03)',
                    color: segment === s ? '#6c8cff' : theme.tx,
                  }}>{SEG_LABELS[s]}</button>
                ))}
              </div>
              <button onClick={() => setOnboardStep(2)} style={{ width: '100%', marginTop: 20, padding: 14, borderRadius: 12, background: '#6c8cff', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Continue →</button>
            </>)}

            {onboardStep === 2 && (<>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>How do you like your feed?</div>
              <div style={{ fontSize: 14, color: '#7a7f90', marginBottom: 24 }}>You can change this anytime</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {(['fun', 'professional', 'focus'] as VibeMode[]).map(v => (
                  <button key={v} onClick={() => setVibeMode(v)} style={{
                    padding: 16, borderRadius: 12, textAlign: 'left' as const, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    border: `1.5px solid ${vibeMode === v ? '#6c8cff' : theme.bd}`,
                    background: vibeMode === v ? 'rgba(108,140,255,0.12)' : 'rgba(255,255,255,0.03)',
                    color: vibeMode === v ? theme.tx : '#7a7f90',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{VIBE_ICONS[v]} {v.charAt(0).toUpperCase() + v.slice(1)}</div>
                    <div style={{ fontSize: 12, color: '#505468' }}>{VIBE_LABELS[v].split(' — ')[1]}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setOnboardStep(1)} style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: '#7a7f90', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>← Back</button>
                <button onClick={completeOnboarding} style={{ flex: 2, padding: 14, borderRadius: 12, background: '#6c8cff', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Let's Go! 🚀</button>
              </div>
            </>)}
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApply && !applying && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="fade-in" style={{ background: theme.bg2, border: `1px solid ${theme.bd}`, borderRadius: 20, padding: '28px 24px', maxWidth: 460, width: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Apply for {showApply.title}</div>
            <div style={{ fontSize: 13, color: '#7a7f90', marginBottom: 20 }}>{showApply.companies?.name || showApply.company_name}</div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#7a7f90', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>Cover Note (optional)</label>
            <textarea rows={4} value={coverNote} onChange={e => setCoverNote(e.target.value)} placeholder="Tell the recruiter why you're a great fit..."
              style={{ width: '100%', background: theme.bg3, border: `1px solid ${theme.bd}`, borderRadius: 10, padding: '10px 14px', color: theme.tx, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none' as const, boxSizing: 'border-box' as const, marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowApply(null); setCoverNote('') }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: '#7a7f90', border: 'none', borderRadius: 10, padding: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
              <button onClick={applyJob} style={{ flex: 2, background: '#6c8cff', color: '#fff', border: 'none', borderRadius: 10, padding: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700 }}>Submit Application</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR / NAV */}
      <JobSeekerSidebar
        userName={user?.full_name || ''}
        xp={user?.xp_points || 0}
        streak={streak}
        vibeMode={vibeMode}
        onVibeChange={switchVibe}
        nightMode={nightMode}
        onNightModeChange={toggleNightMode}
      />

      {/* MAIN CONTENT */}
      <div style={{ padding: '16px 20px', maxWidth: 760, margin: '0 auto' }}>

        {/* Streak + XP (fun mode) */}
        {vibeMode === 'fun' && streak > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' as const }}>
            <div style={{ background: 'rgba(255,159,67,0.1)', border: '1px solid rgba(255,159,67,0.2)', borderRadius: 10, padding: '6px 12px', fontSize: 13, color: '#ff9f43', fontWeight: 600 }}>🔥 {streak} day streak</div>
            <div style={{ background: 'rgba(108,140,255,0.1)', border: '1px solid rgba(108,140,255,0.2)', borderRadius: 10, padding: '6px 12px', fontSize: 13, color: '#6c8cff', fontWeight: 600 }}>⭐ {user?.xp_points || 0} XP</div>
          </div>
        )}

        {/* Daily Tip */}
        {dailyTip && (
          <div className="fade-in" style={{ background: 'rgba(108,140,255,0.06)', border: '1px solid rgba(108,140,255,0.12)', borderRadius: 14, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6c8cff', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 3 }}>Daily Career Tip</div>
              <div style={{ fontSize: 13, color: '#c8cad0', lineHeight: 1.5 }}>{dailyTip}</div>
            </div>
          </div>
        )}

        {/* Profile Strength */}
        {profileStrength.score < 80 && (
          <div className="fade-in" style={{ background: 'rgba(255,214,10,0.06)', border: '1px solid rgba(255,214,10,0.12)', borderRadius: 14, padding: '12px 16px', marginBottom: 14, cursor: 'pointer' }} onClick={() => router.push('/jobseeker/profile')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ffd60a' }}>Profile Strength: {profileStrength.score}%</span>
              <span style={{ fontSize: 11, color: '#7a7f90' }}>Complete to unlock 1-tap apply →</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${profileStrength.score}%`, background: profileStrength.score > 60 ? '#3dd68c' : '#ffd60a', borderRadius: 3, transition: 'width 0.5s' }} />
            </div>
            {profileStrength.missing.length > 0 && (
              <div style={{ fontSize: 11, color: '#7a7f90', marginTop: 4 }}>Missing: {profileStrength.missing.slice(0, 3).join(', ')}{profileStrength.missing.length > 3 ? ` +${profileStrength.missing.length - 3} more` : ''}</div>
            )}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 16, textAlign: vibeMode === 'fun' ? 'center' as const : 'left' as const }}>
          <div style={{ fontSize: vibeMode === 'fun' ? 24 : 20, fontWeight: 800, marginBottom: 4 }}>
            {vibeMode === 'fun' ? <>Find Your Next <span style={{ color: '#6c8cff' }}>Opportunity</span></> : 'Open Positions'}
          </div>
          <div style={{ color: '#7a7f90', fontSize: 13 }}>{filtered.length} {showSaved ? 'saved' : 'open'} positions</div>
        </div>

        {/* Search + Filters */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: `1px solid ${theme.bd}`, padding: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
            <input
              style={{ flex: 1, minWidth: 160, background: theme.bg3, border: `1px solid ${theme.bd}`, borderRadius: 10, padding: '10px 14px', color: theme.tx, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
              placeholder="Search role, company, skill, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {cities.length > 0 && (
              <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setPage(1) }}
                style={{ background: theme.bg3, border: `1px solid ${theme.bd}`, borderRadius: 10, padding: '10px 12px', color: theme.tx, fontSize: 13, fontFamily: 'inherit', outline: 'none', minWidth: 110 }}>
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {types.length > 0 && (
              <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}
                style={{ background: theme.bg3, border: `1px solid ${theme.bd}`, borderRadius: 10, padding: '10px 12px', color: theme.tx, fontSize: 13, fontFamily: 'inherit', outline: 'none', minWidth: 100 }}>
                <option value="">All Types</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <button onClick={() => { setShowSaved(!showSaved); setPage(1) }}
              style={{ background: showSaved ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showSaved ? 'rgba(255,107,107,0.3)' : theme.bd}`, borderRadius: 10, padding: '10px 14px', color: showSaved ? '#ff6b6b' : '#7a7f90', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, whiteSpace: 'nowrap' as const }}>
              {showSaved ? '❤️' : '🤍'} Saved ({savedJobs.length})
            </button>
          </div>
        </div>

        {/* JOB FEED */}
        {pageJobs.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: 60, color: '#505468' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No {showSaved ? 'saved ' : ''}jobs found</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{showSaved ? 'Save jobs by tapping the heart icon' : 'Try different keywords or clear filters'}</div>
          </div>
        ) : (
          <div>
            {pageJobs.map((j, idx) => {
              const applied = applications.includes(j.id)
              const isSaved = savedJobs.includes(j.id)
              const matchPct = calculateMatch(userSkills, userExp, j)
              const mapLink = j.location || j.city ? `https://www.google.com/maps/search/${encodeURIComponent(j.location || j.city || '')}` : ''
              const globalIdx = (page - 1) * PAGE_SIZE + idx

              return (
                <div key={j.id}>
                  {/* Ad Slot */}
                  {isAdSlot(globalIdx) && (
                    <div style={{ background: 'rgba(255,214,10,0.04)', border: '1px solid rgba(255,214,10,0.1)', borderRadius: 14, padding: '14px 18px', marginBottom: 10, textAlign: 'center' as const }}>
                      <div style={{ fontSize: 10, color: '#7a7f90', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 4 }}>Sponsored</div>
                      <div style={{ fontSize: 13, color: '#505468' }}>Ad space available</div>
                    </div>
                  )}

                  {/* FOCUS MODE */}
                  {vibeMode === 'focus' ? (
                    <div className="jcard" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.bd}`, borderRadius: 10, marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{j.title}</div>
                        <div style={{ fontSize: 12, color: '#7a7f90' }}>{j.companies?.name || j.company_name}{j.location || j.city ? ` · ${j.location || j.city}` : ''}</div>
                      </div>
                      {matchPct > 0 && <span style={{ fontSize: 11, color: matchPct > 70 ? '#3dd68c' : '#6c8cff', fontWeight: 700 }}>{matchPct}%</span>}
                      <button onClick={() => toggleSave(j.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 2 }}>{isSaved ? '❤️' : '🤍'}</button>
                      {applied ? (
                        <span style={{ fontSize: 11, color: '#3dd68c', fontWeight: 700 }}>Applied ✓</span>
                      ) : (
                        <button onClick={() => profileStrength.score >= 50 ? quickApply(j) : setShowApply(j)}
                          style={{ background: '#6c8cff', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Apply</button>
                      )}
                    </div>
                  ) : (
                    /* FUN + PROFESSIONAL MODE */
                    <div className="jcard fade-in" style={{
                      background: 'rgba(255,255,255,0.02)', borderRadius: vibeMode === 'fun' ? 16 : 12,
                      border: `1px solid ${applied ? 'rgba(61,214,140,0.25)' : theme.bd}`,
                      padding: vibeMode === 'fun' ? 18 : '14px 16px', marginBottom: 10,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,140,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6c8cff', fontSize: 15, flexShrink: 0 }}>
                              {(j.companies?.name || j.company_name || 'C')[0]}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{j.title}</div>
                              <div style={{ fontSize: 12, color: '#7a7f90' }}>{j.companies?.name || j.company_name || 'Company'}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                            {(j.location || j.city) && (
                              <a href={mapLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.bd}`, borderRadius: 6, padding: '3px 8px', color: '#7a7f90', textDecoration: 'none' }}>📍 {j.location || j.city}</a>
                            )}
                            {j.experience_min != null && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.bd}`, borderRadius: 6, padding: '3px 8px', color: '#7a7f90' }}>💼 {j.experience_min}{j.experience_max ? `–${j.experience_max}` : '+'} yrs</span>}
                            {j.salary_min && <span style={{ fontSize: 11, background: 'rgba(61,214,140,0.08)', border: '1px solid rgba(61,214,140,0.15)', borderRadius: 6, padding: '3px 8px', color: '#3dd68c' }}>₹{j.salary_min}{j.salary_max ? `–${j.salary_max}` : '+'} LPA</span>}
                            {j.job_type && <span style={{ fontSize: 11, background: 'rgba(108,140,255,0.08)', border: '1px solid rgba(108,140,255,0.15)', borderRadius: 6, padding: '3px 8px', color: '#6c8cff' }}>{j.job_type}</span>}
                          </div>
                          {vibeMode === 'fun' && j.description && (
                            <div style={{ fontSize: 12, color: '#7a7f90', lineHeight: 1.6, marginBottom: 8 }}>{j.description.slice(0, 120)}{j.description.length > 120 ? '...' : ''}</div>
                          )}
                          {j.skills && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                              {j.skills.split(',').slice(0, 4).map((sk: string) => (
                                <span key={sk.trim()} style={{ fontSize: 10, background: 'rgba(255,255,255,0.04)', color: '#505468', padding: '2px 7px', borderRadius: 20, border: `1px solid ${theme.bd}` }}>{sk.trim()}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          {matchPct > 0 && (
                            <div style={{ fontSize: 12, fontWeight: 700, color: matchPct > 70 ? '#3dd68c' : matchPct > 40 ? '#6c8cff' : '#7a7f90', background: matchPct > 70 ? 'rgba(61,214,140,0.1)' : 'rgba(108,140,255,0.1)', padding: '3px 10px', borderRadius: 8 }}>{matchPct}% match</div>
                          )}
                          <div style={{ fontSize: 10, color: '#505468' }}>{new Date(j.created_at).toLocaleDateString('en-IN')}</div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button onClick={() => toggleSave(j.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 2, transition: 'transform 0.2s' }} title={isSaved ? 'Remove from saved' : 'Save job'}>{isSaved ? '❤️' : '🤍'}</button>
                            <div style={{ position: 'relative' }}>
                              <button onClick={(e) => { e.stopPropagation(); setShowShareMenu(showShareMenu === j.id ? null : j.id) }}
                                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.bd}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, padding: '4px 10px', color: '#7a7f90', fontFamily: 'inherit' }}>Share</button>
                              {showShareMenu === j.id && (
                                <div className="share-menu" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => { shareJob(j, 'whatsapp'); setShowShareMenu(null) }} style={{ color: '#25d366' }}>WhatsApp</button>
                                  <button onClick={() => { const ok = shareJob(j, 'copy'); setShowShareMenu(null); if (ok) showToast('Link copied!') }} style={{ color: '#7a7f90' }}>Copy Link</button>
                                  {typeof navigator !== 'undefined' && navigator.share && (
                                    <button onClick={() => { shareJob(j, 'native'); setShowShareMenu(null) }} style={{ color: '#6c8cff' }}>Share...</button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {applied ? (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#3dd68c', background: 'rgba(61,214,140,0.1)', border: '1px solid rgba(61,214,140,0.2)', borderRadius: 10, padding: '8px 14px' }}>Applied ✓</span>
                          ) : profileStrength.score >= 50 ? (
                            <button onClick={() => quickApply(j)} style={{ background: '#6c8cff', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⚡ 1-Tap Apply</button>
                          ) : (
                            <button onClick={() => setShowApply(j)} style={{ background: '#6c8cff', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Apply Now</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 20 }}>
                <button className="page-btn" disabled={!hasPrev} onClick={() => setPage(p => p - 1)}>← Previous</button>
                <span style={{ fontSize: 13, color: '#7a7f90' }}>Page {page} of {totalPages}</span>
                <button className="page-btn" disabled={!hasNext} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Close share menu overlay */}
      {showShareMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setShowShareMenu(null)} />}
    </div>
  )
}
