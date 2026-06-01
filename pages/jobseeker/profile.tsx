// @ts-nocheck
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import {
  checkJobSeekerAuth, calculateProfileStrength, compressImage,
  validateFileSize, saveUserLocation,
  getNightModePreference, setNightModePreference,
} from '../../src/lib/jobseeker-utils'
import JobSeekerSidebar from '../../src/components/JobSeekerSidebar'
import LocationPicker from '../../src/components/LocationPicker'
import { EDUCATION_LEVELS, coursesForLevel, branchesForCourse, snapToLevel } from '../../src/lib/courseBranches'

// ══════════════════════════════════════════════════════════
// JOB SEEKER PROFILE v4.0
// - Fully theme-aware (CSS vars only — works in all themes)
// - Adaptive: Under College (Pursuing) vs Passed Out (Professional)
// - Experience as Years + Months dropdowns -> auto Fresher/Experienced
// - CTC as Lakhs + Thousands dropdowns
// - Education (College/Course/Branch) right after basic details
// - Aligned with recruiter side (segment + qualification_branch)
// ══════════════════════════════════════════════════════════

const CITIES = ['Delhi','Mumbai','Bangalore','Hyderabad','Pune','Chennai','Noida','Gurgaon','Kolkata','Ahmedabad','Jaipur','Lucknow','Chandigarh','Kochi','Nagpur','Indore','Bhopal','Surat','Vadodara','Patna','Ranchi','Coimbatore','Visakhapatnam','Bhubaneswar','Other']
const QUALIFICATIONS = ['B.Tech/B.E.','M.Tech/M.E.','MCA','BCA','MBA/PGDM','B.Sc','M.Sc','BBA','B.Com','M.Com','BA','MA','MBBS','BDS','B.Pharm','M.Pharm','CA','CS','CMA/ICWA','LLB','LLM','PhD','Diploma','ITI','12th Pass','10th Pass','Other']
const NOTICE_PERIODS = ['Immediate','7 days','15 days','1 month','2 months','3 months']
const WORK_MODES = ['WFH','WFO','Hybrid']
const JOB_TYPES = ['Full Time','Part Time']
const EMP_TYPES = ['Permanent','Temporary','Contractual']
const LOOKING_FOR = ['Internship / Training','Live Project','Part-time Job','Full-time Job','Just Exploring']
const NEEDS_DURATION = ['Internship / Training','Live Project']
const DURATIONS = ['1 month','2 months','3 months','4 months','5 months','6 months','7 months','8 months','9 months','10 months','11 months','12 months','Flexible']
const STIPEND_RANGES = ['Unpaid OK','Below ₹5,000','₹5,000–10,000','₹10,000–20,000','₹20,000+']
const AVAILABILITY = ['Immediately','Within 15 days','Within 1 month','After graduation']
const CATEGORIES = [
  { key: 'student',      icon: '🎓', title: 'Student',               sub: 'Currently studying' },
  { key: 'fresher',      icon: '🌱', title: 'Fresher',               sub: 'Graduated · no job yet' },
  { key: 'professional', icon: '💼', title: 'Working Professional',  sub: 'Have work experience' },
]
const VIBE_MODES = [
  { value: 'fun', label: '🎮 Fun & Social' },
  { value: 'professional', label: '💼 Professional' },
  { value: 'focus', label: '🎯 Quick Apply' },
]

// ── Experience & CTC dropdown helpers (storage stays decimal) ──
const EXP_YEARS = Array.from({ length: 51 }, (_, i) => i)
const EXP_MONTHS = Array.from({ length: 12 }, (_, i) => i)
const CTC_LAKHS = Array.from({ length: 101 }, (_, i) => i)
const CTC_THOUSANDS = Array.from({ length: 20 }, (_, i) => i * 5)
function decToYM(v) { const d = parseFloat(v) || 0; const y = Math.floor(d); let m = Math.round((d - y) * 12); return m === 12 ? { y: y + 1, m: 0 } : { y, m } }
function ymToDec(y, m) { return +(y + m / 12).toFixed(4) }
function decToLT(v) { const d = parseFloat(v) || 0; const l = Math.floor(d); let t = Math.round(Math.round((d - l) * 100) / 5) * 5; return t >= 100 ? { l: l + 1, t: 0 } : { l, t } }
function ltToDec(l, t) { return +(l + t / 100).toFixed(2) }
function deriveSegment(expDec) { return (parseFloat(expDec) || 0) > 0 ? 'experienced' : 'fresher' }

const MOTIVATION = [
  "🚀 Profiles with photos get 3x more recruiter views!",
  "💡 Add your skills — recruiters search by skills first.",
  "📈 Complete profiles rank higher in search results.",
  "🎯 Add your expected CTC to get relevant offers only.",
  "⚡ Recruiters spend avg 6 seconds on a profile — make it count!",
  "🔥 Candidates with LinkedIn get 2x more direct messages.",
  "🌟 Keep your notice period updated always.",
  "📱 Add your mobile number so recruiters can reach you instantly.",
  "🎓 Add your qualification — it filters into top searches.",
  "💼 Your current role tells recruiters what you can do now.",
  "🏆 Top 10% profiles have all fields filled — are you there yet?",
  "📍 Add your city — location-based jobs match better.",
  "🤝 Profiles with work mode preference get faster responses.",
  "📄 Download your auto-generated CV — share it anywhere!",
  "🔔 Recruiters shortlist faster when they see your college name.",
  "💰 Profiles with CTC details skip the salary negotiation stage.",
  "🌐 Add your GitHub/Portfolio — it sets you apart instantly.",
  "🎯 Employment type preference helps match contract/permanent jobs.",
  "⭐ Update your profile every 30 days for better reach.",
  "📧 Verified email = priority placement in recruiter inboxes.",
]

function multiToggle(current, val) {
  const arr = current ? current.split(',').map(s => s.trim()).filter(Boolean) : []
  const idx = arr.indexOf(val)
  if (idx === -1) arr.push(val); else arr.splice(idx, 1)
  return arr.join(', ')
}
function hasVal(current, val) { return (current || '').split(',').map(s => s.trim()).includes(val) }
function multiToggleMax(current, val, max) {
  const arr = current ? current.split(',').map(s => s.trim()).filter(Boolean) : []
  const idx = arr.indexOf(val)
  if (idx !== -1) { arr.splice(idx, 1) }
  else { if (arr.length >= max) return current; arr.push(val) }
  return arr.join(', ')
}

function generateCV(user, form, stage) {
  const line = (label, val) => val ? `${label}: ${val}\n` : ''
  const { y, m } = decToYM(form.experience)
  const expStr = (y || m) ? `${y}y ${m}m` : ''
  return `
========================================
   CURRICULUM VITAE
========================================

${(user?.full_name || '').toUpperCase()}
${line('Email', user?.email)}${line('Mobile', form.mobile)}${line('City', form.city)}${line('LinkedIn', form.linkedin)}${line('GitHub/Portfolio', form.github)}
${stage === 'student' ? `
-- STATUS --------------------------------
Currently: Student (Under College)
${line('Looking for', form.looking_for)}${line('Preferred Duration', form.internship_duration)}${line('Work Preference', form.work_mode)}${line('Expected Stipend', form.stipend_expected ? '₹' + form.stipend_expected + '/month' : '')}` : `
-- PROFESSIONAL SUMMARY ------------------
${line('Current Role', form.role)}${line('Total Experience', expStr)}${line('Notice Period', form.notice_period)}${line('Current CTC', form.current_ctc ? '₹' + form.current_ctc + ' LPA' : '')}${line('Expected CTC', form.expected_ctc ? '₹' + form.expected_ctc + ' LPA' : '')}${line('Work Mode', form.work_mode)}${line('Job Type', form.job_type)}`}
-- EDUCATION -----------------------------
${line('Qualification', form.qualification)}${line('Branch / Specialization', form.branch)}${line('College / University', form.college)}${line('Graduation Year', form.graduation_year)}${line('Certifications', form.certifications_text)}
-- SKILLS --------------------------------
${form.skills || 'Not added'}

----------------------------------------
Generated by RecruitBase Pro | ${new Date().toLocaleDateString('en-IN')}
`.trim()
}

export default function JobSeekerProfile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({})
  const [stage, setStage] = useState('fresher') // 'student' | 'fresher' | 'professional'
  const [workExp, setWorkExp] = useState([])     // [{title, org, from, to, current, desc}]
  const [achievements, setAchievements] = useState([]) // [string]
  const [profileId, setProfileId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profileStrength, setProfileStrength] = useState({ score: 0, missing: [] })
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)
  const [nightMode, setNightMode] = useState(false)
  const [vibeMode, setVibeMode] = useState('fun')
  const [locSaved, setLocSaved] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [userSettings, setUserSettings] = useState({ vibe: 'fun' })
  const [motiveTip] = useState(() => MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)])
  const [showShare, setShowShare] = useState(false)
  const photoRef = useRef(null)

  function showToast(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function showModal(title, msg, type = 'error') { setModal({ title, msg, type }) }
  function sf(k, v) { const updated = { ...form, [k]: v }; setForm(updated); setProfileStrength(calculateProfileStrength(updated)) }

  useEffect(() => { setNightMode(getNightModePreference()) }, [])

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
        setUserSettings({ vibe: au.vibe_mode || 'fun' })
        setStage(au.experience_segment === 'intern' ? 'student' : (au.experience_segment === 'experienced' || au.experience_segment === 'junior' ? 'professional' : 'fresher'))
        setLocSaved(!!au.latitude)

        const { data: profile } = await supabase
          .from('profiles').select('*').eq('created_by', au.id)
          .order('created_at', { ascending: true }).limit(1).single()

        if (cancelled) return
        if (profile) {
          setProfileId(profile.id)
          const ed = (Array.isArray(profile.education) && profile.education[0]) || {}
          setForm({
            ...profile, name: au.full_name || '', email: au.email || '', mobile: au.mobile || profile.mobile || '',
            edu_level: ed.level || snapToLevel(profile.qualification || '') || '',
            edu_course: ed.course || profile.qualification || '',
            branch: ed.branch || profile.branch || profile.qualification_branch || '',
            current_period: ed.current_period || profile.current_period || '',
            current_period_type: profile.current_period_type || (ed.current_period?.startsWith('Sem') ? 'sem' : (ed.current_period ? 'year' : '')),
          })
          setProfileStrength(calculateProfileStrength({ ...profile, name: au.full_name, email: au.email }))
          if (profile.segment === 'pursuing') setStage('student')
          else if (profile.segment === 'experienced') setStage('professional')
          else if (profile.segment === 'fresher') setStage('fresher')
          setWorkExp(Array.isArray(profile.work_experiences) ? profile.work_experiences : (() => { try { return JSON.parse(profile.work_experiences || '[]') } catch { return [] } })())
          setAchievements(Array.isArray(profile.achievements) ? profile.achievements : (() => { try { return JSON.parse(profile.achievements || '[]') } catch { return [] } })())
        } else {
          const initF = { name: au.full_name || '', email: au.email || '', mobile: au.mobile || '' }
          setForm(initF)
          setProfileStrength(calculateProfileStrength(initF))
        }
        setLoading(false)
      } catch (e) {
        if (!cancelled) { setError('Something went wrong loading your profile.'); setLoading(false) }
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  async function saveProfile() {
    if (!form.mobile?.trim()) { showModal('Mobile Required', 'Please add your mobile number so recruiters can contact you.'); return }
    if (!user) return
    setSaving(true)

    const segment = stage === 'student' ? 'pursuing' : (stage === 'professional' ? 'experienced' : 'fresher')
    const expSeg = stage === 'student' ? 'intern' : (stage === 'professional' ? 'experienced' : 'fresher')

    const payload = {
      name: user.full_name || '',
      email: user.email || '',
      mobile: (form.mobile || '').replace(/\D/g, '').slice(0, 15),
      role: stage === 'student' ? '' : (form.role || ''),
      qualification: (form.edu_course === 'Other' ? (form.edu_course_custom || '') : (form.edu_course || form.qualification || '')),
      branch: (form.branch === 'Other' ? (form.branch_custom || '') : (form.branch || '')),
      qualification_branch: (form.branch === 'Other' ? (form.branch_custom || '') : (form.branch || '')),
      education: [{
        level: form.edu_level || '',
        course: (form.edu_course === 'Other' ? (form.edu_course_custom || '') : (form.edu_course || '')),
        branch: (form.branch === 'Other' ? (form.branch_custom || '') : (form.branch || '')),
        study_status: stage === 'student' ? 'pursuing' : 'completed',
        institution: form.college || '',
        year: form.graduation_year || '',
        cgpa: form.cgpa || '',
        current_period: stage === 'student' ? (form.current_period || '') : '',
      }],
      current_period: stage === 'student' ? (form.current_period || '') : '',
      current_period_type: stage === 'student' ? (form.current_period_type || '') : '',
      college: form.college || '',
      graduation_year: form.graduation_year || null,
      cgpa: form.cgpa || '',
      certifications_text: form.certifications_text || '',
      skills: form.skills || '',
      work_experiences: workExp,
      achievements: achievements,
      experience: stage === 'professional' ? (form.experience ? parseFloat(String(form.experience)) : 0) : 0,
      current_ctc: stage === 'professional' ? (form.current_ctc ? parseFloat(String(form.current_ctc)) : null) : null,
      expected_ctc: stage === 'professional' ? (form.expected_ctc ? parseFloat(String(form.expected_ctc)) : null) : null,
      notice_period: stage === 'professional' ? (form.notice_period || '') : '',
      availability: stage !== 'professional' ? (form.availability || '') : '',
      work_mode: form.work_mode || '',
      job_type: form.job_type || '',
      employment_type: form.employment_type || '',
      looking_for: stage === 'student' ? (form.looking_for || '') : (stage === 'fresher' ? (form.looking_for || 'Full-time Job') : ''),
      internship_duration: stage === 'student' ? (form.internship_duration || '') : '',
      stipend_expected_range: stage === 'student' ? (form.stipend_expected_range || '') : '',
      city: form.city || '',
      state: form.state || '',
      pincode: form.pincode || '',
      address: form.address || '',
      google_maps_url: form.google_maps_url || '',
      latitude: (form.latitude === '' || form.latitude === undefined) ? null : form.latitude,
      longitude: (form.longitude === '' || form.longitude === undefined) ? null : form.longitude,
      linkedin: form.linkedin || '',
      github: form.github || '',
      photo_url: form.photo_url || user.photo_url || '',
      segment,
      status: 'New',
      source: 'Job Portal',
      created_by: user.id,
      type: 'Candidate',
    }

    // keep app_users segment in sync (for tips + onboarding)
    try { await supabase.from('app_users').update({ experience_segment: expSeg }).eq('id', user.id) } catch (_) {}

    let saveError
    if (profileId) {
      const res = await supabase.from('profiles').update(payload).eq('id', profileId)
      saveError = res.error
    } else {
      const { data: existing } = await supabase.from('profiles').select('id').eq('created_by', user.id).limit(1).single()
      if (existing) {
        setProfileId(existing.id)
        const res = await supabase.from('profiles').update(payload).eq('id', existing.id)
        saveError = res.error
      } else {
        const res = await supabase.from('profiles').insert(payload).select().single()
        saveError = res.error
        if (res.data) setProfileId(res.data.id)
      }
    }

    if (saveError) showModal('Save Failed', 'Could not save your profile: ' + (saveError.message || 'Please try again.'))
    else { setSaved(true); showToast('✅ Profile saved! Recruiters can now find you.'); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const blob = file.type.startsWith('image/') ? await compressImage(file, 250, 600) : file
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `profiles/${user.id}/photo.${ext}`
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (upErr) { showModal('Upload Failed', 'Could not upload photo. Please try a different image.'); setUploading(false); return }
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
      if (urlData?.publicUrl) {
        const photoUrl = urlData.publicUrl
        sf('photo_url', photoUrl)
        await supabase.from('app_users').update({ photo_url: photoUrl }).eq('id', user.id)
        if (profileId) await supabase.from('profiles').update({ photo_url: photoUrl }).eq('id', profileId)
        setUser(u => ({ ...u, photo_url: photoUrl }))
        showToast('📸 Photo updated everywhere!')
      }
    } catch { showModal('Upload Error', 'File could not be processed. Please try a JPG or PNG image.') }
    setUploading(false)
  }

  async function detectLocation() {
    if (!user) return
    setLocLoading(true)
    const loc = await saveUserLocation(user.id)
    setLocLoading(false)
    if (loc) { setLocSaved(true); showToast(`📍 Location saved via ${loc.source === 'gps' ? 'GPS' : 'IP'}!`) }
    else showModal('Location Error', 'Could not detect location. Please allow location access in your browser settings.')
  }

  async function saveSettings() {
    if (!user) return
    await supabase.from('app_users').update({ vibe_mode: userSettings.vibe }).eq('id', user.id)
    setVibeMode(userSettings.vibe)
    showToast('Preferences saved!')
  }

  function downloadCV() {
    const text = generateCV(user, form, stage)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${(user?.full_name || 'CV').replace(/\s+/g, '_')}_Resume.txt`; a.click()
    URL.revokeObjectURL(url); showToast('📄 CV downloaded!')
  }

  function shareProfile() {
    const text = `Hey! I found this awesome job portal. Check out RecruitBase Pro — it connects candidates directly with top recruiters!\n\nhttps://smilingdbms.vercel.app/jobseeker`
    if (navigator.share) navigator.share({ title: 'Join RecruitBase Pro', text, url: 'https://smilingdbms.vercel.app/jobseeker' }).catch(() => {})
    else { navigator.clipboard?.writeText(text); showToast('🔗 Referral link copied!') }
    setShowShare(false)
  }
  function shareWhatsApp() {
    const text = encodeURIComponent(`Hey! Check out RecruitBase Pro — best platform to find jobs and connect with recruiters directly.\n👉 https://smilingdbms.vercel.app/jobseeker`)
    window.open(`https://wa.me/?text=${text}`, '_blank'); setShowShare(false)
  }

  // ── Theme tokens — ALL via CSS vars (works in every theme) ──
  const T = {
    bg: 'var(--bg)', bg2: 'var(--bg2)', bg3: 'var(--bg3)', tx: 'var(--tx)',
    mu: 'var(--mu)', mu2: 'var(--mu2)', bd: 'var(--bd)', bd2: 'var(--bd2)',
    ac: 'var(--ac)', acbg: 'var(--acbg)', gn: 'var(--gn)', gnbg: 'var(--gnbg)',
    gd: 'var(--gd)', gdbg: 'var(--gdbg)', rd: 'var(--rd)', rdbg: 'var(--rdbg)',
    or: 'var(--or)', orbg: 'var(--orbg)', sh: 'var(--sh)', shl: 'var(--shl)',
  }
  const inp = { width: '100%', background: T.bg3, border: `1px solid ${T.bd2}`, borderRadius: 10, padding: '10px 13px', color: T.tx, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
  const inpRO = { ...inp, opacity: 0.6, cursor: 'not-allowed', background: T.bg2 }
  const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: T.mu, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, marginTop: 14 }
  const card = { background: T.bg2, borderRadius: 16, border: `1px solid ${T.bd}`, padding: 20, marginBottom: 16, boxShadow: T.sh }
  const secTitle = (icon, txt) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ width: 4, height: 18, borderRadius: 4, background: T.ac, display: 'inline-block' }} />
      <span style={{ fontSize: 15, fontWeight: 700, color: T.tx }}>{icon} {txt}</span>
    </div>
  )
  const chipBtn = (val, current, onToggle) => (
    <button key={val} onClick={() => onToggle(val)} style={{ padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', border: `1px solid ${hasVal(current, val) ? T.ac : T.bd2}`, background: hasVal(current, val) ? T.acbg : T.bg3, color: hasVal(current, val) ? T.ac : T.mu, transition: 'all 0.15s', marginBottom: 6 }}>{val}</button>
  )

  const photoSrc = form.photo_url || user?.photo_url || null
  const { y: expY, m: expM } = decToYM(form.experience)
  const CAT = CATEGORIES.find(c => c.key === stage) || CATEGORIES[1]
  const levelLabel = `${CAT.icon} ${CAT.title}`
  const levelColor = stage === 'student' ? T.gd : (stage === 'professional' ? T.ac : T.gn)
  const needsDuration = NEEDS_DURATION.some(v => hasVal(form.looking_for || '', v))

  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ textAlign: 'center', color: T.mu }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>Loading your profile...
      </div>
    </div>
  )
  if (error) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ textAlign: 'center', color: T.tx, padding: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <div style={{ marginBottom: 16 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ background: T.ac, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Refresh Page</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.tx, fontFamily: "'Outfit',sans-serif" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input:focus,select:focus,textarea:focus{border-color:var(--ac)!important;box-shadow:0 0 0 2px var(--acbg)}select option{background:var(--bg2);color:var(--tx)}
.jsp-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.jsp-wrap{padding:16px 20px;max-width:720px;margin:0 auto}
.jsp-row2{display:flex;gap:10px}
.jsp-chips{display:flex;gap:8px;flex-wrap:wrap}
@media (max-width:720px){
  .jsp-wrap{padding:14px 14px 40px}
  .jsp-2col{grid-template-columns:1fr;gap:10px}
  .jsp-row2{flex-wrap:wrap}
  .jsp-row2>select,.jsp-row2>input{flex:1 1 100%!important;min-width:0}
}
@media (max-width:640px){
  .jsp-wrap input,.jsp-wrap select,.jsp-wrap textarea{font-size:16px!important;min-height:44px}
  .jsp-wrap button{min-height:42px}
  .jsp-hero{flex-direction:column;align-items:flex-start!important}
  .jsp-hero-actions{width:100%}
  .jsp-hero-actions button{flex:1}
  .leaflet-container{height:240px!important}
}
@media (max-width:380px){
  .jsp-hero-actions button{font-size:11px}
}`}</style>


      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, background: toast.type === 'success' ? T.gnbg : T.rdbg, border: `1px solid ${toast.type === 'success' ? T.gn : T.rd}`, color: toast.type === 'success' ? T.gn : T.rd, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, maxWidth: 320, boxShadow: T.shl }}>
          {toast.msg}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: T.bg2, border: `1px solid ${modal.type === 'error' ? T.rd : T.gn}`, borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: T.shl }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>{modal.type === 'error' ? '⚠️' : '✅'}</div>
            <div style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: T.tx }}>{modal.title}</div>
            <div style={{ fontSize: 13, color: T.mu, textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>{modal.msg}</div>
            <button onClick={() => setModal(null)} style={{ width: '100%', padding: 11, borderRadius: 10, background: modal.type === 'error' ? T.rdbg : T.gnbg, color: modal.type === 'error' ? T.rd : T.gn, border: `1px solid ${modal.type === 'error' ? T.rd : T.gn}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 14 }}>Close</button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', boxShadow: T.shl }}>
            <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 8 }}>🎉 Refer a Friend</div>
            <div style={{ fontSize: 13, color: T.mu, textAlign: 'center', marginBottom: 20 }}>Share RecruitBase Pro with friends looking for jobs!</div>
            <button onClick={shareWhatsApp} style={{ width: '100%', padding: 12, borderRadius: 10, background: T.gnbg, color: T.gn, border: `1px solid ${T.gn}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, marginBottom: 10 }}>📱 Share on WhatsApp</button>
            <button onClick={shareProfile} style={{ width: '100%', padding: 12, borderRadius: 10, background: T.acbg, color: T.ac, border: `1px solid ${T.ac}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, marginBottom: 10 }}>🔗 Copy Referral Link</button>
            <button onClick={() => setShowShare(false)} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'transparent', color: T.mu, border: `1px solid ${T.bd}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <JobSeekerSidebar
        userName={user?.full_name || ''}
        photoUrl={photoSrc}
        xp={user?.xp_points || 0}
        streak={user?.streak_count || 0}
        vibeMode={vibeMode}
        onVibeChange={(v) => { setVibeMode(v); if (user) supabase.from('app_users').update({ vibe_mode: v }).eq('id', user.id) }}
        nightMode={nightMode}
        onNightModeChange={(v) => { setNightMode(v); setNightModePreference(v) }}
      />

      <div className="jsp-wrap">

        {/* HERO HEADER */}
        <div className="jsp-hero" style={{ borderRadius: 18, padding: '20px 22px', marginBottom: 16, background: `linear-gradient(135deg, ${T.acbg}, transparent)`, border: `1px solid ${T.bd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: T.acbg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `2px solid ${T.ac}`, flexShrink: 0 }}>
              {photoSrc ? <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24, color: T.ac, fontWeight: 700 }}>{(user?.full_name || '?')[0].toUpperCase()}</span>}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{user?.full_name || 'My Profile'}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 5, padding: '3px 11px', borderRadius: 20, background: T.bg2, border: `1px solid ${levelColor}`, color: levelColor, fontSize: 12, fontWeight: 700 }}>{levelLabel}</div>
            </div>
          </div>
          <div className="jsp-hero-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={downloadCV} style={{ padding: '8px 14px', borderRadius: 10, background: T.gnbg, color: T.gn, border: `1px solid ${T.gn}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12 }}>📄 Download CV</button>
            <button onClick={() => setShowShare(true)} style={{ padding: '8px 14px', borderRadius: 10, background: T.gdbg, color: T.gd, border: `1px solid ${T.gd}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12 }}>🎉 Refer Friend</button>
          </div>
        </div>

        {/* Motivational tip */}
        <div style={{ background: T.acbg, border: `1px solid ${T.bd2}`, borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: T.ac, lineHeight: 1.5, fontWeight: 500 }}>{motiveTip}</div>

        {/* CANDIDATE STATUS SELECTOR */}
        <div style={card}>
          {secTitle('🧭', 'I am a...')}
          <div style={{ fontSize: 12, color: T.mu, marginTop: 4, marginBottom: 12 }}>This decides what we ask next and how recruiters find you.</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {CATEGORIES.map(opt => {
              const active = stage === opt.key
              const c = opt.key === 'student' ? T.gd : (opt.key === 'professional' ? T.ac : T.gn)
              return (
                <button key={opt.key} onClick={() => setStage(opt.key)} style={{ flex: 1, minWidth: 150, textAlign: 'left', padding: '13px 15px', borderRadius: 13, border: `1.5px solid ${active ? c : T.bd2}`, background: active ? T.acbg : T.bg3, color: active ? c : T.mu, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 19 }}>{opt.icon}</span>{opt.title}</div>
                  <div style={{ fontSize: 11.5, marginTop: 4, opacity: 0.9 }}>{opt.sub}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* PROFILE STRENGTH */}
        <div style={{ ...card, borderLeft: `3px solid ${profileStrength.score >= 80 ? T.gn : profileStrength.score >= 50 ? T.gd : T.rd}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Profile Strength</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: profileStrength.score >= 80 ? T.gn : profileStrength.score >= 50 ? T.gd : T.rd }}>{profileStrength.score}%</span>
          </div>
          <div style={{ height: 8, background: T.bg3, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${profileStrength.score}%`, background: profileStrength.score >= 80 ? T.gn : profileStrength.score >= 50 ? T.gd : T.rd, borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
          {profileStrength.score >= 80
            ? <div style={{ fontSize: 12, color: T.gn }}>🎉 Great profile! 1-tap apply is unlocked.</div>
            : <div style={{ fontSize: 12, color: T.gd }}>Add: <b>{profileStrength.missing.slice(0, 3).join(', ')}</b> to improve visibility.</div>}
        </div>

        {/* PHOTO */}
        <div style={card}>
          {secTitle('📸', 'Profile Photo')}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: T.acbg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `2px solid ${T.ac}`, flexShrink: 0 }}>
              {photoSrc ? <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, color: T.ac, fontWeight: 700 }}>{(user?.full_name || '?')[0].toUpperCase()}</span>}
            </div>
            <div>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
              <button onClick={() => photoRef.current?.click()} disabled={uploading} style={{ background: T.acbg, color: T.ac, border: `1px solid ${T.ac}`, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: uploading ? 0.5 : 1 }}>{uploading ? 'Uploading...' : '📸 Upload Photo'}</button>
              <div style={{ fontSize: 11, color: T.mu, marginTop: 5 }}>Any size · Auto-compressed · JPG/PNG · Reflects everywhere</div>
            </div>
          </div>
        </div>

        {/* PERSONAL INFO */}
        <div style={card}>
          {secTitle('👤', 'Personal Information')}
          <label style={lbl}>Full Name <span style={{ color: T.gd, fontSize: 10 }}>(from your account · contact support to change)</span></label>
          <input style={inpRO} value={user?.full_name || ''} readOnly />
          <div className="jsp-2col">
            <div>
              <label style={lbl}>Email <span style={{ color: T.gd, fontSize: 10 }}>(locked)</span></label>
              <input style={inpRO} value={user?.email || ''} readOnly />
            </div>
            <div>
              <label style={lbl}>Mobile *</label>
              <input style={inp} value={form.mobile || ''} onChange={e => sf('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" />
            </div>
          </div>
          <label style={lbl}>📍 Location <span style={{ color: T.mu2, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>(use GPS or drop a pin — auto-fills city, state &amp; pincode below)</span></label>
          <LocationPicker
            value={{ latitude: form.latitude, longitude: form.longitude, address: form.address, google_maps_url: form.google_maps_url }}
            onChange={(loc) => { const u = { ...form, ...loc }; setForm(u); setProfileStrength(calculateProfileStrength(u)) }}
          />
          <div className="jsp-2col">
            <div>
              <label style={lbl}>City</label>
              <input style={inp} value={form.city || ''} onChange={e => sf('city', e.target.value)} placeholder="City (auto-filled from map)" />
            </div>
            <div>
              <label style={lbl}>State</label>
              <input style={inp} value={form.state || ''} onChange={e => sf('state', e.target.value)} placeholder="State" />
            </div>
          </div>
          <div className="jsp-2col">
            <div>
              <label style={lbl}>Pincode</label>
              <input style={inp} value={form.pincode || ''} onChange={e => sf('pincode', e.target.value)} placeholder="Pincode" />
            </div>
            <div>
              <label style={lbl}>LinkedIn URL</label>
              <input style={inp} value={form.linkedin || ''} onChange={e => sf('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
            </div>
          </div>
          <label style={lbl}>Portfolio / GitHub / Other Link</label>
          <input style={inp} value={form.github || ''} onChange={e => sf('github', e.target.value)} placeholder="Any link — portfolio, GitHub, Behance, LinkedIn, etc." />
        </div>

        {/* EDUCATION — right after basics */}
        <div style={card}>
          {secTitle('🎓', 'Education')}
          <div style={{ fontSize: 12, color: T.mu, marginTop: 4, marginBottom: 4 }}>Pick your level, then course, then specialization.</div>
          <div className="jsp-2col">
            <div>
              <label style={lbl}>{stage === 'student' ? 'Currently Pursuing (Level)' : 'Highest Level'}</label>
              <select style={inp} value={form.edu_level || ''} onChange={e => setForm(f => { const u = { ...f, edu_level: e.target.value, edu_course: '', edu_course_custom: '', branch: '', branch_custom: '' }; setProfileStrength(calculateProfileStrength(u)); return u })}>
                <option value="">Select Level</option>{EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Course / Degree</label>
              <select style={inp} value={form.edu_course || ''} disabled={!form.edu_level} onChange={e => setForm(f => { const u = { ...f, edu_course: e.target.value, branch: '', branch_custom: '' }; setProfileStrength(calculateProfileStrength(u)); return u })}>
                <option value="">{form.edu_level ? 'Select Course' : 'Select level first'}</option>
                {coursesForLevel(form.edu_level || '').map(c => <option key={c}>{c}</option>)}
                <option value="Other">Other (type below)</option>
              </select>
            </div>
          </div>
          {form.edu_course === 'Other' && (
            <><label style={lbl}>Course Name (custom)</label>
            <input style={inp} value={form.edu_course_custom || ''} onChange={e => sf('edu_course_custom', e.target.value)} placeholder="Type your course / degree" /></>
          )}
          <div className="jsp-2col">
            <div>
              <label style={lbl}>Branch / Specialization</label>
              {(() => { const opts = branchesForCourse(form.edu_course || ''); return opts.length ? (
                <select style={inp} value={form.branch || ''} disabled={!form.edu_course} onChange={e => sf('branch', e.target.value)}>
                  <option value="">{form.edu_course ? 'Select Branch' : 'Select course first'}</option>
                  {opts.map(b => <option key={b}>{b}</option>)}
                  <option value="Other">Other (type below)</option>
                </select>
              ) : (
                <input style={inp} value={form.branch || ''} onChange={e => sf('branch', e.target.value)} placeholder="e.g. CSE, Finance, Marketing" />
              ) })()}
            </div>
            <div>
              <label style={lbl}>{stage === 'student' ? 'Expected Graduation Year' : 'Graduation Year'}</label>
              <select style={inp} value={form.graduation_year || ''} onChange={e => sf('graduation_year', e.target.value)}><option value="">Select Year</option>{Array.from({ length: 33 }, (_, i) => 2030 - i).map(y => <option key={y}>{y}</option>)}</select>
            </div>
          </div>
          {stage === 'student' && (
            <div className="jsp-2col">
              <div>
                <label style={lbl}>Currently In — Type</label>
                <select style={inp} value={form.current_period_type || ''} onChange={e => setForm(f => { const u = { ...f, current_period_type: e.target.value, current_period: '' }; setProfileStrength(calculateProfileStrength(u)); return u })}>
                  <option value="">Select</option>
                  <option value="year">Year-based</option>
                  <option value="sem">Semester-based</option>
                </select>
              </div>
              <div>
                <label style={lbl}>{form.current_period_type === 'sem' ? 'Current Semester' : 'Current Year'}</label>
                <select style={inp} value={form.current_period || ''} disabled={!form.current_period_type} onChange={e => sf('current_period', e.target.value)}>
                  <option value="">{form.current_period_type ? 'Select' : 'Pick type first'}</option>
                  {form.current_period_type === 'sem'
                    ? Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={`Semester ${n}`}>{`Semester ${n}`}</option>)
                    : Array.from({ length: 5 }, (_, i) => i + 1).map(n => <option key={n} value={`Year ${n}`}>{`Year ${n}`}</option>)}
                </select>
              </div>
            </div>
          )}
          {form.branch === 'Other' && (
            <><label style={lbl}>Branch Name (custom)</label>
            <input style={inp} value={form.branch_custom || ''} onChange={e => sf('branch_custom', e.target.value)} placeholder="Type your branch / specialization" /></>
          )}
          <label style={lbl}>College / University</label>
          <input style={inp} value={form.college || ''} onChange={e => sf('college', e.target.value)} placeholder="College / school / university name" />
          <label style={lbl}>{stage === 'student' ? 'Current CGPA / %' : 'CGPA / Percentage'}</label>
          <input style={inp} value={form.cgpa || ''} onChange={e => sf('cgpa', e.target.value)} placeholder="e.g. 8.5 or 85%" />
          <label style={lbl}>Certifications <span style={{ color: T.mu2, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>(comma-separated, optional)</span></label>
          <input style={inp} value={form.certifications_text || ''} onChange={e => sf('certifications_text', e.target.value)} placeholder="e.g. AWS Certified, Google Data Analytics, NPTEL..." />
        </div>

        {/* ADAPTIVE: STUDENT */}
        {stage === 'student' && (
          <div style={card}>
            {secTitle('🔎', 'What You Are Looking For')}
            <label style={lbl}>I am looking for <span style={{ color: T.mu2, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>(pick up to 2)</span></label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {LOOKING_FOR.map(l => chipBtn(l, form.looking_for || '', (v) => sf('looking_for', multiToggleMax(form.looking_for || '', v, 2))))}
            </div>
            {needsDuration && (
              <>
                <label style={lbl}>Preferred Duration</label>
                <select style={inp} value={form.internship_duration || ''} onChange={e => sf('internship_duration', e.target.value)}>
                  <option value="">Select</option>{DURATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </>
            )}
            <label style={lbl}>Work Preference</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {WORK_MODES.map(w => chipBtn(w, form.work_mode || '', (v) => sf('work_mode', multiToggle(form.work_mode || '', v))))}
            </div>
            <label style={lbl}>Expected Stipend</label>
            <select style={inp} value={form.stipend_expected_range || ''} onChange={e => sf('stipend_expected_range', e.target.value)}>
              <option value="">Select</option>{STIPEND_RANGES.map(s => <option key={s}>{s}</option>)}
            </select>
            <label style={lbl}>Available From</label>
            <select style={inp} value={form.availability || ''} onChange={e => sf('availability', e.target.value)}>
              <option value="">Select</option>{AVAILABILITY.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        )}

        {/* ADAPTIVE: FRESHER */}
        {stage === 'fresher' && (
          <div style={card}>
            {secTitle('🌱', 'Job Preferences')}
            <label style={lbl}>Role You Want</label>
            <input style={inp} value={form.role || ''} onChange={e => sf('role', e.target.value)} placeholder="e.g. Software Developer, Sales Executive, Analyst" />
            <label style={lbl}>Looking for <span style={{ color: T.mu2, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>(pick up to 2)</span></label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {LOOKING_FOR.map(l => chipBtn(l, form.looking_for || '', (v) => sf('looking_for', multiToggleMax(form.looking_for || '', v, 2))))}
            </div>
            {needsDuration && (
              <>
                <label style={lbl}>Preferred Duration</label>
                <select style={inp} value={form.internship_duration || ''} onChange={e => sf('internship_duration', e.target.value)}>
                  <option value="">Select</option>{DURATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </>
            )}
            <label style={lbl}>Work Mode</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{WORK_MODES.map(w => chipBtn(w, form.work_mode || '', (v) => sf('work_mode', multiToggle(form.work_mode || '', v))))}</div>
            <label style={lbl}>Job Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{JOB_TYPES.map(j => chipBtn(j, form.job_type || '', (v) => sf('job_type', multiToggle(form.job_type || '', v))))}</div>
            <label style={lbl}>Expected CTC (₹)</label>
            {(() => { const { l, t } = decToLT(form.expected_ctc); return (
              <div className="jsp-row2">
                <select style={{ ...inp, flex: 1 }} value={l} onChange={e => sf('expected_ctc', ltToDec(+e.target.value, t))}>{CTC_LAKHS.map(n => <option key={n} value={n}>{n} Lakh</option>)}</select>
                <select style={{ ...inp, flex: 1 }} value={t} onChange={e => sf('expected_ctc', ltToDec(l, +e.target.value))}>{CTC_THOUSANDS.map(n => <option key={n} value={n}>{n} Th</option>)}</select>
              </div>
            ) })()}
            <label style={lbl}>Available From</label>
            <select style={inp} value={form.availability || ''} onChange={e => sf('availability', e.target.value)}>
              <option value="">Select</option>{AVAILABILITY.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        )}

        {/* ADAPTIVE: PROFESSIONAL */}
        {stage === 'professional' && (
          <div style={card}>
            {secTitle('💼', 'Professional Details')}
            <label style={lbl}>Current Role / Designation</label>
            <input style={inp} value={form.role || ''} onChange={e => sf('role', e.target.value)} placeholder="e.g. Software Engineer, HR Manager, Sales Executive" />
            <label style={lbl}>Current Company</label>
            <input style={inp} value={form.current_company || ''} onChange={e => sf('current_company', e.target.value)} placeholder="Current employer name" />
            <label style={lbl}>Total Experience</label>
            <div className="jsp-row2">
              <select style={{ ...inp, flex: 1 }} value={expY} onChange={e => sf('experience', ymToDec(+e.target.value, expM))}>{EXP_YEARS.map(n => <option key={n} value={n}>{n} yr</option>)}</select>
              <select style={{ ...inp, flex: 1 }} value={expM} onChange={e => sf('experience', ymToDec(expY, +e.target.value))}>{EXP_MONTHS.map(n => <option key={n} value={n}>{n} mo</option>)}</select>
            </div>
            <label style={lbl}>Current CTC (₹)</label>
            {(() => { const { l, t } = decToLT(form.current_ctc); return (
              <div className="jsp-row2">
                <select style={{ ...inp, flex: 1 }} value={l} onChange={e => sf('current_ctc', ltToDec(+e.target.value, t))}>{CTC_LAKHS.map(n => <option key={n} value={n}>{n} Lakh</option>)}</select>
                <select style={{ ...inp, flex: 1 }} value={t} onChange={e => sf('current_ctc', ltToDec(l, +e.target.value))}>{CTC_THOUSANDS.map(n => <option key={n} value={n}>{n} Th</option>)}</select>
              </div>
            ) })()}
            <label style={lbl}>Expected CTC (₹)</label>
            {(() => { const { l, t } = decToLT(form.expected_ctc); return (
              <div className="jsp-row2">
                <select style={{ ...inp, flex: 1 }} value={l} onChange={e => sf('expected_ctc', ltToDec(+e.target.value, t))}>{CTC_LAKHS.map(n => <option key={n} value={n}>{n} Lakh</option>)}</select>
                <select style={{ ...inp, flex: 1 }} value={t} onChange={e => sf('expected_ctc', ltToDec(l, +e.target.value))}>{CTC_THOUSANDS.map(n => <option key={n} value={n}>{n} Th</option>)}</select>
              </div>
            ) })()}
            <label style={lbl}>Notice Period</label>
            <select style={inp} value={form.notice_period || ''} onChange={e => sf('notice_period', e.target.value)}><option value="">Select</option>{NOTICE_PERIODS.map(n => <option key={n}>{n}</option>)}</select>
            <label style={lbl}>Work Mode (select all that apply)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{WORK_MODES.map(w => chipBtn(w, form.work_mode || '', (v) => sf('work_mode', multiToggle(form.work_mode || '', v))))}</div>
            <label style={lbl}>Job Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{JOB_TYPES.map(j => chipBtn(j, form.job_type || '', (v) => sf('job_type', multiToggle(form.job_type || '', v))))}</div>
            <label style={lbl}>Employment Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{EMP_TYPES.map(em => chipBtn(em, form.employment_type || '', (v) => sf('employment_type', multiToggle(form.employment_type || '', v))))}</div>
          </div>
        )}

        {/* WORK / INTERNSHIP EXPERIENCE — for everyone (resume) */}
        <div style={card}>
          {secTitle('🧳', stage === 'student' ? 'Internships / Projects' : 'Work Experience')}
          <div style={{ fontSize: 12, color: T.mu, marginTop: 4, marginBottom: 10 }}>Add jobs, internships or projects — these build your resume.</div>
          {workExp.map((w, i) => (
            <div key={i} style={{ border: `1px solid ${T.bd2}`, borderRadius: 12, padding: 12, marginBottom: 10, background: T.bg3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.mu }}>#{i + 1}</span>
                <button onClick={() => setWorkExp(workExp.filter((_, j) => j !== i))} style={{ background: T.rdbg, color: T.rd, border: `1px solid ${T.rd}`, borderRadius: 8, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
              </div>
              <div className="jsp-2col">
                <input style={inp} value={w.title || ''} onChange={e => setWorkExp(workExp.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Role / Title" />
                <input style={inp} value={w.org || ''} onChange={e => setWorkExp(workExp.map((x, j) => j === i ? { ...x, org: e.target.value } : x))} placeholder="Company / Organization" />
              </div>
              <div className="jsp-2col" style={{ marginTop: 10 }}>
                <input style={inp} value={w.from || ''} onChange={e => setWorkExp(workExp.map((x, j) => j === i ? { ...x, from: e.target.value } : x))} placeholder="From (e.g. Jan 2024)" />
                <input style={inp} value={w.to || ''} onChange={e => setWorkExp(workExp.map((x, j) => j === i ? { ...x, to: e.target.value } : x))} placeholder="To (e.g. Present)" />
              </div>
              <textarea rows={2} style={{ ...inp, resize: 'none', marginTop: 10 }} value={w.desc || ''} onChange={e => setWorkExp(workExp.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} placeholder="What you did / key achievements" />
            </div>
          ))}
          <button onClick={() => setWorkExp([...workExp, { title: '', org: '', from: '', to: '', desc: '' }])} style={{ background: T.acbg, color: T.ac, border: `1px dashed ${T.ac}`, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>+ Add {stage === 'student' ? 'Internship / Project' : 'Experience'}</button>
        </div>

        {/* ACHIEVEMENTS — for everyone */}
        <div style={card}>
          {secTitle('🏆', 'Achievements & Awards')}
          <div style={{ fontSize: 12, color: T.mu, marginTop: 4, marginBottom: 10 }}>Hackathons, awards, publications, leadership roles — anything notable.</div>
          {achievements.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={inp} value={a} onChange={e => setAchievements(achievements.map((x, j) => j === i ? e.target.value : x))} placeholder="e.g. Winner — Smart India Hackathon 2024" />
              <button onClick={() => setAchievements(achievements.filter((_, j) => j !== i))} style={{ background: T.rdbg, color: T.rd, border: `1px solid ${T.rd}`, borderRadius: 8, padding: '0 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
            </div>
          ))}
          <button onClick={() => setAchievements([...achievements, ''])} style={{ background: T.acbg, color: T.ac, border: `1px dashed ${T.ac}`, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>+ Add Achievement</button>
        </div>

        {/* SKILLS */}
        <div style={card}>
          {secTitle('⚡', 'Skills')}
          <div style={{ fontSize: 12, color: T.mu, marginTop: 4, marginBottom: 8 }}>Comma-separated · Recruiters search by skills first</div>
          <textarea rows={3} style={{ ...inp, resize: 'none' }} value={form.skills || ''} onChange={e => sf('skills', e.target.value)} placeholder="e.g. React, Node.js, Python, Leadership, Sales, Excel, Tally..." />
        </div>

        {/* FEED PREFERENCES */}
        <div style={card}>
          {secTitle('🎛️', 'Feed Style Preference')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ ...lbl, marginTop: 0 }}>Feed Style</label>
              <select style={inp} value={userSettings.vibe} onChange={e => setUserSettings(p => ({ ...p, vibe: e.target.value }))}>{VIBE_MODES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}</select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={saveSettings} style={{ width: '100%', padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600, background: T.acbg, color: T.ac, border: `1px solid ${T.ac}`, cursor: 'pointer', fontFamily: 'inherit' }}>Save Preferences</button>
            </div>
          </div>
        </div>

        {/* SAVE */}
        <button onClick={saveProfile} disabled={saving} style={{ width: '100%', padding: 16, borderRadius: 14, fontSize: 16, fontWeight: 700, fontFamily: 'inherit', background: saved ? T.gn : T.ac, color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1, transition: 'all 0.2s', marginBottom: 32, boxShadow: T.sh }}>
          {saving ? 'Saving...' : saved ? '✅ Profile Saved!' : '💾 Save Profile'}
        </button>

      </div>
    </div>
  )
}
