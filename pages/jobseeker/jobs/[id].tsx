// @ts-nocheck
// pages/jobseeker/jobs/[id].tsx
// ══════════════════════════════════════════════════════════
// JOB DETAIL PAGE v1.0 — Premium Naukri/LinkedIn style
// Shareable URL · 1-tap apply · Full description · Skills
// Works for logged-in JS + public shareable link
// ══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../../src/lib/supabase'
import { checkJobSeekerAuth } from '../../../src/lib/jobseeker-utils'

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatSalary(min, max) {
  if (!min && !max) return null
  const fmt = (n) => n >= 100 ? `₹${(n / 100).toFixed(1)}Cr` : `₹${n}L`
  if (min && max) return `${fmt(min)} – ${fmt(max)} PA`
  if (min) return `From ${fmt(min)} PA`
  return `Up to ${fmt(max)} PA`
}

function initials(name) {
  return (name || 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const ACCENT = '#6c8cff'
const BG = 'var(--bg)'
const BG2 = 'var(--bg)'
const BG3 = 'var(--bg2)'
const TX = 'var(--tx)'
const MUTED = 'var(--mu)'
const BD = 'rgba(255,255,255,0.07)'
const GREEN = '#3dd68c'
const YELLOW = '#ffd60a'
const RED = '#ff6b6b'

export default function JobDetail() {
  const router = useRouter()
  const { id } = router.query
  const [job, setJob] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [applied, setApplied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [applying, setApplying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [similarJobs, setSimilarJobs] = useState([])
  const [copied, setCopied] = useState(false)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (!id) return
    async function load() {
      // Load job (public — no auth required for viewing)
      const { data: jobData } = await supabase
        .from('job_descriptions')
        .select('*, companies(name, company_code)')
        .eq('id', id)
        .eq('is_public', true)
        .single()

      if (!jobData) { setLoading(false); return }
      setJob(jobData)

      // Load similar jobs
      const { data: similar } = await supabase
        .from('job_descriptions')
        .select('id, title, company_name, location, job_type, experience_min, experience_max, salary_min, salary_max, created_at')
        .eq('status', 'Open')
        .eq('is_public', true)
        .neq('id', id)
        .limit(4)
      setSimilarJobs(similar || [])

      // Check auth silently
      try {
        const { user: au } = await checkJobSeekerAuth()
        if (au) {
          setUser(au)
          const [{ data: prof }, { data: appCheck }, { data: savedCheck }] = await Promise.all([
            supabase.from('profiles').select('id, skills, experience, notice_period').eq('created_by', au.id).single(),
            supabase.from('job_applications').select('id').eq('job_id', id).eq('applicant_id', au.id).single(),
            supabase.from('saved_jobs').select('id').eq('job_id', id).eq('user_id', au.id).single(),
          ])
          if (prof) setProfile(prof)
          if (appCheck) setApplied(true)
          if (savedCheck) setSaved(true)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [id])

  async function handleApply() {
    if (!user) { router.push('/'); return }
    if (applied) { showToast('Already applied!', 'info'); return }
    if (!profile) { showToast('Complete your profile first!', 'error'); router.push('/jobseeker/profile'); return }
    setApplying(true)
    const { error } = await supabase.from('job_applications').insert({
      job_id: id,
      applicant_id: user.id,
      profile_id: profile.id,
      status: 'Applied',
      applied_at: new Date().toISOString(),
    })
    if (!error) {
      setApplied(true)
      showToast('🎉 Application submitted successfully!')
    } else {
      showToast('Could not apply. Try again.', 'error')
    }
    setApplying(false)
  }

  async function toggleSave() {
    if (!user) { router.push('/'); return }
    if (saved) {
      await supabase.from('saved_jobs').delete().eq('job_id', id).eq('user_id', user.id)
      setSaved(false)
      showToast('Removed from saved jobs')
    } else {
      await supabase.from('saved_jobs').insert({ job_id: id, user_id: user.id })
      setSaved(true)
      showToast('💾 Job saved!')
    }
  }

  function copyLink() {
    const url = window.location.href
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast('🔗 Link copied!')
  }

  function shareWhatsApp() {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Check out this job: ${job?.title} at ${job?.company_name || job?.company}\n`)
    window.open(`https://wa.me/?text=${text}${url}`, '_blank')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap')`}</style>
      <div style={{ textAlign: 'center', color: MUTED }}>
        <div style={{ fontSize: 40, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⚙️</div>
        <div style={{ fontSize: 15 }}>Loading job details...</div>
      </div>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ textAlign: 'center', color: TX, padding: 24 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Job Not Found</div>
        <div style={{ color: MUTED, fontSize: 14, marginBottom: 24 }}>This job may have been closed or the link is invalid.</div>
        <button onClick={() => router.push('/jobseeker')} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 15 }}>Browse Open Jobs →</button>
      </div>
    </div>
  )

  const companyName = job.company_name || job.company || job.companies?.name || 'Company'
  const salary = formatSalary(job.salary_min, job.salary_max)
  const expRange = job.experience_min !== null ? `${job.experience_min}–${job.experience_max || job.experience_min + 5} yrs` : null
  const skills = job.skills ? job.skills.split(',').map(s => s.trim()).filter(Boolean) : []

  return (
    <>
      <Head>
        <title>{job.title} at {companyName} — RecruitBase Pro</title>
        <meta name="description" content={`${job.title} at ${companyName}. ${job.location || ''}. Apply now on RecruitBase Pro.`} />
        <meta property="og:title" content={`${job.title} at ${companyName}`} />
        <meta property="og:description" content={job.description?.slice(0, 160) || ''} />
      </Head>

      <div style={{ minHeight: '100vh', background: BG, color: TX, fontFamily: "'Outfit',sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          a { color: ${ACCENT}; text-decoration: none; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
          .job-detail-card { animation: fadeUp 0.3s ease; }
          .similar-card:hover { border-color: ${ACCENT}44 !important; transform: translateY(-2px); }
          .similar-card { transition: all 0.2s; }
          @media (max-width: 768px) {
            .main-grid { flex-direction: column !important; }
            .sticky-sidebar { position: static !important; }
          }
        `}</style>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, background: toast.type === 'success' ? '#0d2a1a' : toast.type === 'info' ? '#0d1a2a' : '#2a0d0d', border: `1px solid ${toast.type === 'success' ? '#3dd68c55' : toast.type === 'info' ? ACCENT + '55' : '#ff505055'}`, color: toast.type === 'success' ? GREEN : toast.type === 'info' ? ACCENT : RED, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', maxWidth: 320 }}>
            {toast.msg}
          </div>
        )}

        {/* TOP NAV */}
        <div style={{ background: BG2, borderBottom: `1px solid ${BD}`, padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <button onClick={() => router.push('/jobseeker')} style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Jobs
          </button>
          <div style={{ fontWeight: 800, fontSize: 16, color: TX }}>RecruitBase <span style={{ color: ACCENT }}>Pro</span></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyLink} style={{ background: copied ? GREEN + '18' : 'rgba(255,255,255,0.04)', color: copied ? GREEN : MUTED, border: `1px solid ${BD}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              {copied ? '✓ Copied' : '🔗 Share'}
            </button>
            <button onClick={shareWhatsApp} style={{ background: 'rgba(37,211,102,0.08)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              📱 WhatsApp
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>
          <div className="main-grid" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            {/* ── LEFT: Main Content ── */}
            <div style={{ flex: 1, minWidth: 0 }} className="job-detail-card">

              {/* Company + Title Card */}
              <div style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 18, padding: 28, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                  {/* Company Logo / Initials */}
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${ACCENT}22, ${ACCENT}44)`, border: `1px solid ${ACCENT}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: ACCENT, flexShrink: 0, letterSpacing: 1 }}>
                    {initials(companyName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: TX, lineHeight: 1.3, marginBottom: 6 }}>{job.title}</h1>
                    <div style={{ fontSize: 15, color: ACCENT, fontWeight: 600, marginBottom: 4 }}>{companyName}</div>
                    <div style={{ fontSize: 13, color: MUTED }}>Posted {timeAgo(job.created_at)}{job.openings ? ` · ${job.openings} opening${job.openings > 1 ? 's' : ''}` : ''}</div>
                  </div>
                </div>

                {/* Key Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                  {[
                    { icon: '📍', label: 'Location', val: job.location || job.city || 'Not specified' },
                    { icon: '💼', label: 'Experience', val: expRange || 'Any level' },
                    { icon: '💰', label: 'Salary', val: salary || 'Not disclosed' },
                    { icon: '⏱️', label: 'Job Type', val: job.job_type || 'Full-time' },
                    { icon: '🎓', label: 'Qualification', val: job.qualification || 'Any' },
                    { icon: '🏭', label: 'Industry', val: job.industry || 'General' },
                  ].map(({ icon, label, val }) => (
                    <div key={label} style={{ background: BG3, borderRadius: 12, padding: '12px 14px', border: `1px solid ${BD}` }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                      <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, color: TX, fontWeight: 600 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Status Badge */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: GREEN + '18', color: GREEN, border: `1px solid ${GREEN}33`, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>🟢 Actively Hiring</span>
                  {job.job_type && <span style={{ background: ACCENT + '18', color: ACCENT, border: `1px solid ${ACCENT}33`, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600 }}>{job.job_type}</span>}
                  {job.openings > 0 && <span style={{ background: YELLOW + '18', color: YELLOW, border: `1px solid ${YELLOW}33`, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600 }}>{job.openings} Openings</span>}
                </div>
              </div>

              {/* Skills Required */}
              {skills.length > 0 && (
                <div style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 18, padding: 24, marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🛠️ Skills Required</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {skills.map(skill => (
                      <span key={skill} style={{ background: BG3, border: `1px solid ${BD}`, borderRadius: 8, padding: '6px 14px', fontSize: 13, color: TX, fontWeight: 500 }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Description */}
              <div style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 18, padding: 28, marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Job Description</div>
                <div style={{ fontSize: 14, color: 'var(--tx)', lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {job.description || 'No description provided.'}
                </div>
              </div>

              {/* Similar Jobs */}
              {similarJobs.length > 0 && (
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: TX }}>🔍 Similar Jobs</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                    {similarJobs.map(sj => (
                      <div key={sj.id} className="similar-card" onClick={() => router.push(`/jobseeker/jobs/${sj.id}`)} style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 14, padding: 18, cursor: 'pointer' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: TX }}>{sj.title}</div>
                        <div style={{ fontSize: 12, color: ACCENT, marginBottom: 8 }}>{sj.company_name || 'Company'}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {sj.location && <span style={{ fontSize: 11, color: MUTED }}>📍 {sj.location}</span>}
                          {sj.job_type && <span style={{ fontSize: 11, color: MUTED }}>· {sj.job_type}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>{timeAgo(sj.created_at)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Sticky Apply Sidebar ── */}
            <div className="sticky-sidebar" style={{ width: 300, flexShrink: 0, position: 'sticky', top: 78 }}>
              <div style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 18, padding: 24, marginBottom: 16 }}>

                {/* Apply Button */}
                <button onClick={handleApply} disabled={applying || applied} style={{ width: '100%', padding: '15px', borderRadius: 12, fontSize: 15, fontWeight: 800, fontFamily: 'inherit', background: applied ? GREEN : `linear-gradient(135deg, ${ACCENT}, #8b6cff)`, color: '#fff', border: 'none', cursor: applied ? 'default' : 'pointer', opacity: applying ? 0.7 : 1, marginBottom: 12, letterSpacing: 0.3, boxShadow: applied ? 'none' : `0 4px 20px ${ACCENT}44`, transition: 'all 0.2s' }}>
                  {applying ? '⏳ Submitting...' : applied ? '✅ Applied Successfully' : user ? '⚡ 1-Tap Apply' : '🔐 Login to Apply'}
                </button>

                {/* Save Button */}
                <button onClick={toggleSave} style={{ width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', background: saved ? YELLOW + '12' : 'rgba(255,255,255,0.03)', color: saved ? YELLOW : MUTED, border: `1px solid ${saved ? YELLOW + '44' : BD}`, cursor: 'pointer', marginBottom: 12, transition: 'all 0.2s' }}>
                  {saved ? '💛 Saved' : '🤍 Save Job'}
                </button>

                {/* Share Buttons */}
                <div style={{ borderTop: `1px solid ${BD}`, paddingTop: 16, marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 10 }}>Share This Job</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={copyLink} style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.04)', color: copied ? GREEN : TX, border: `1px solid ${BD}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {copied ? '✓ Copied' : '🔗 Copy Link'}
                    </button>
                    <button onClick={shareWhatsApp} style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'rgba(37,211,102,0.08)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      📱 WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* Company Info Card */}
              <div style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 18, padding: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TX, marginBottom: 14 }}>🏢 About the Company</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ACCENT}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: ACCENT, flexShrink: 0 }}>{initials(companyName)}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TX }}>{companyName}</div>
                    {job.industry && <div style={{ fontSize: 12, color: MUTED }}>{job.industry}</div>}
                  </div>
                </div>
                {job.location && (
                  <div style={{ fontSize: 12, color: MUTED, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span>📍</span><span>{job.location || job.city}</span>
                  </div>
                )}
                <div style={{ marginTop: 14, padding: '10px 14px', background: BG3, borderRadius: 10, border: `1px solid ${BD}` }}>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Job Ref</div>
                  <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600, fontFamily: 'monospace', wordBreak: 'break-all' }}>{id}</div>
                </div>
              </div>

              {/* Not logged in CTA */}
              {!user && (
                <div style={{ marginTop: 16, background: `${ACCENT}10`, border: `1px solid ${ACCENT}33`, borderRadius: 14, padding: 18, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🚀</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TX, marginBottom: 6 }}>Create Free Account</div>
                  <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>Sign up to apply and track your applications</div>
                  <button onClick={() => router.push('/')} style={{ width: '100%', padding: '10px', borderRadius: 10, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13 }}>
                    Sign Up Free →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
