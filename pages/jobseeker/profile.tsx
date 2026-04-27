import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import {
  checkJobSeekerAuth, calculateProfileStrength, compressImage,
  validateFileSize, saveUserLocation,
  getNightModePreference, setNightModePreference,
} from '../../src/lib/jobseeker-utils'
import type { AppUser, Profile, VibeMode, Segment } from '../../src/types/jobseeker'
import JobSeekerSidebar from '../../src/components/JobSeekerSidebar'

// ══════════════════════════════════════════════════════════
// JOB SEEKER PROFILE v2.0 — Production Grade
// Single auth, sidebar, skeleton, location fix, types,
// image compression, profile strength, mobile-first
// No CV parsing — data directly from backend
// ══════════════════════════════════════════════════════════

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Noida', 'Gurgaon', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi', 'Nagpur', 'Indore', 'Bhopal', 'Surat', 'Vadodara', 'Patna', 'Ranchi', 'Coimbatore', 'Visakhapatnam', 'Bhubaneswar', 'Other']
const QUALIFICATIONS = ['B.Tech', 'M.Tech', 'MCA', 'BCA', 'MBA', 'PGDM', 'B.Sc', 'M.Sc', 'BBA', 'B.Com', 'M.Com', 'BA', 'MA', 'MBBS', 'BDS', 'CA', 'CS', 'LLB', 'PhD', 'Diploma', 'ITI', '12th Pass', '10th Pass', 'Graduate', 'Post Graduate', 'Other']
const NOTICE_PERIODS = ['Immediate', '7 days', '15 days', '1 month', '2 months', '3 months']
const WORK_MODES = ['WFH', 'Office', 'Hybrid', 'Flexible']
const SEGMENTS: { value: Segment; label: string }[] = [
  { value: 'intern', label: 'Intern (College student)' },
  { value: 'fresher', label: 'Fresher (0-6 months)' },
  { value: 'junior', label: 'Junior (6 months - 2 years)' },
  { value: 'experienced', label: 'Experienced (2+ years)' },
]
const VIBE_MODES: { value: VibeMode; label: string }[] = [
  { value: 'fun', label: '🎮 Fun & Social' },
  { value: 'professional', label: '💼 Professional' },
  { value: 'focus', label: '🎯 Quick Apply' },
]

export default function JobSeekerProfile() {
  const router = useRouter()
  const [user, setUser] = useState<AppUser | null>(null)
  const [form, setForm] = useState<Partial<Profile>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileStrength, setProfileStrength] = useState({ score: 0, missing: [] as string[] })
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [userSettings, setUserSettings] = useState({ segment: 'fresher' as string, vibe: 'fun' as string })
  const [nightMode, setNightMode] = useState(false)
  const [vibeMode, setVibeMode] = useState<VibeMode>('fun')
  const [locSaved, setLocSaved] = useState(false)
  const [locLoading, setLocLoading] = useState(false)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => { setNightMode(getNightModePreference()) }, [])

  function toggleNightMode(enabled: boolean) {
    setNightMode(enabled)
    setNightModePreference(enabled)
  }

  async function switchVibe(v: VibeMode) {
    setVibeMode(v)
    if (user) supabase.from('app_users').update({ vibe_mode: v }).eq('id', user.id)
  }

  // Single auth + data load
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
        setUserSettings({ segment: au.experience_segment || 'fresher', vibe: au.vibe_mode || 'fun' })
        setLocSaved(!!au.latitude)

        const { data: profile } = await supabase
          .from('profiles').select('*').eq('created_by', au.id).single()

        if (cancelled) return
        if (profile) {
          setForm(profile as Partial<Profile>)
          setProfileStrength(calculateProfileStrength(profile as Partial<Profile>))
        } else {
          const initial: Partial<Profile> = {
            name: au.full_name || '',
            email: au.email || '',
            mobile: au.mobile || '',
            city: au.city || '',
            segment: 'experienced',
          }
          setForm(initial)
          setProfileStrength(calculateProfileStrength(initial))
        }
        setLoading(false)
      } catch {
        if (!cancelled) { setError('Something went wrong. Please refresh.'); setLoading(false) }
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  const sf = (k: string, v: string | number | null) => {
    const updated = { ...form, [k]: v }
    setForm(updated)
    setProfileStrength(calculateProfileStrength(updated))
  }

  async function saveProfile() {
    if (!form.name?.trim()) { showToast('Name is required.', 'error'); return }
    if (!user) return
    setSaving(true)

    const payload: Record<string, unknown> = {
      name: form.name || '',
      email: form.email || '',
      mobile: (form.mobile || '').replace(/\D/g, '').slice(0, 15),
      role: form.role || '',
      qualification: form.qualification || '',
      skills: form.skills || '',
      experience: form.experience ? parseFloat(String(form.experience)) : null,
      current_ctc: form.current_ctc ? parseFloat(String(form.current_ctc)) : null,
      expected_ctc: form.expected_ctc ? parseFloat(String(form.expected_ctc)) : null,
      notice_period: form.notice_period || '',
      work_mode: form.work_mode || '',
      city: form.city || '',
      linkedin: form.linkedin || '',
      segment: form.segment || 'experienced',
      status: 'New',
      source: 'Job Portal',
      created_by: user.id,
    }

    let saveError
    if ((form as Record<string, unknown>).id) {
      const res = await supabase.from('profiles').update(payload).eq('id', (form as Record<string, unknown>).id)
      saveError = res.error
    } else {
      const res = await supabase.from('profiles').insert(payload).select().single()
      saveError = res.error
      if (res.data) setForm(res.data as Partial<Profile>)
    }

    if (saveError) {
      showToast('Could not save profile. Please try again.', 'error')
    } else {
      setSaved(true)
      showToast('Profile saved!')
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  async function saveSettings() {
    if (!user) return
    await supabase.from('app_users').update({
      experience_segment: userSettings.segment,
      vibe_mode: userSettings.vibe,
    }).eq('id', user.id)
    setVibeMode(userSettings.vibe as VibeMode)
    showToast('Preferences saved!')
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const sizeCheck = validateFileSize(file, 1)
    if (!sizeCheck.ok) { showToast(sizeCheck.msg, 'error'); return }

    setUploading(true)
    try {
      let uploadBlob: Blob = file
      if (file.type.startsWith('image/')) {
        uploadBlob = await compressImage(file, 250, 600)
      }

      const ext = file.name.split('.').pop() || 'jpg'
      const path = `profiles/${user.id}/photo.${ext}`

      const { error: upErr } = await supabase.storage
        .from('uploads')
        .upload(path, uploadBlob, { upsert: true, contentType: 'image/jpeg' })

      if (upErr) { showToast('Upload failed. Please try again.', 'error'); setUploading(false); return }

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
      if (urlData?.publicUrl) {
        sf('photo_url', urlData.publicUrl)
        await supabase.from('app_users').update({ photo_url: urlData.publicUrl }).eq('id', user.id)
        showToast('Photo uploaded!')
      }
    } catch {
      showToast('Upload error. File may be too large.', 'error')
    }
    setUploading(false)
  }

  async function detectLocation() {
    if (!user) return
    setLocLoading(true)
    const loc = await saveUserLocation(user.id)
    setLocLoading(false)
    if (loc) {
      setLocSaved(true)
      showToast(`Location saved via ${loc.source === 'gps' ? 'GPS' : 'IP detection'}!`)
    } else {
      showToast('Could not detect location. Please check GPS settings.', 'error')
    }
  }

  const theme = nightMode
    ? { bg: '#080a0f', bg2: '#0e1018', bg3: '#151820', tx: '#c8cad0', bd: 'rgba(255,255,255,0.05)' }
    : { bg: '#0f1117', bg2: '#161921', bg3: '#1e2230', tx: '#e8eaf0', bd: 'rgba(255,255,255,0.06)' }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: theme.bg3, border: `1px solid ${theme.bd}`,
    borderRadius: 10, padding: '10px 14px', color: theme.tx, fontSize: 14,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#7a7f90',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, marginTop: 14,
  }
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)', borderRadius: 14,
    border: `1px solid ${theme.bd}`, padding: 22, marginBottom: 16,
  }

  // SKELETON
  if (loading) return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: "'Outfit',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.skel{background:linear-gradient(90deg,${theme.bg3} 25%,${theme.bg2} 50%,${theme.bg3} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}`}</style>
      <div style={{ padding: '60px 20px', maxWidth: 700, margin: '0 auto' }}>
        <div className="skel" style={{ height: 28, width: 160, marginBottom: 20 }} />
        <div className="skel" style={{ height: 80, marginBottom: 16 }} />
        <div className="skel" style={{ height: 200, marginBottom: 16 }} />
        <div className="skel" style={{ height: 250, marginBottom: 16 }} />
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
*{box-sizing:border-box;margin:0;padding:0}select option{background:${theme.bg3}}
input:focus,select:focus,textarea:focus{border-color:#6c8cff!important}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 999, background: toast.type === 'success' ? '#0d2a1a' : '#2a0d0d', border: `1px solid ${toast.type === 'success' ? '#3dd68c55' : '#ff505055'}`, color: toast.type === 'success' ? '#3dd68c' : '#ff5050', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, maxWidth: 320 }}>
          {toast.msg}
        </div>
      )}

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

      <div style={{ padding: '16px 20px', maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>My Profile</div>
          <div style={{ color: '#7a7f90', fontSize: 13, marginTop: 4 }}>Keep your profile updated — recruiters find you through this data</div>
        </div>

        {/* Profile Strength */}
        <div style={{ ...cardStyle, borderLeft: `3px solid ${profileStrength.score >= 80 ? '#3dd68c' : profileStrength.score >= 50 ? '#ffd60a' : '#ff6b6b'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Profile Strength</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: profileStrength.score >= 80 ? '#3dd68c' : profileStrength.score >= 50 ? '#ffd60a' : '#ff6b6b' }}>{profileStrength.score}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${profileStrength.score}%`, background: profileStrength.score >= 80 ? '#3dd68c' : profileStrength.score >= 50 ? '#ffd60a' : '#ff6b6b', borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
          {profileStrength.score >= 80 ? (
            <div style={{ fontSize: 12, color: '#3dd68c' }}>Great profile! 1-tap apply is unlocked.</div>
          ) : profileStrength.score >= 50 ? (
            <div style={{ fontSize: 12, color: '#ffd60a' }}>Good start! Add {profileStrength.missing.slice(0, 2).join(', ')} to unlock 1-tap apply.</div>
          ) : (
            <div style={{ fontSize: 12, color: '#ff6b6b' }}>Add {profileStrength.missing.slice(0, 3).join(', ')} to improve visibility.</div>
          )}
        </div>

        {/* Photo Upload */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Profile Photo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(108,140,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid rgba(108,140,255,0.2)', flexShrink: 0 }}>
              {(form as Record<string, unknown>).photo_url || user?.photo_url ? (
                <img src={String((form as Record<string, unknown>).photo_url || user?.photo_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 24, color: '#6c8cff', fontWeight: 700 }}>{(form.name || user?.full_name || '?')[0]}</span>
              )}
            </div>
            <div>
              <label style={{ background: 'rgba(108,140,255,0.12)', color: '#6c8cff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-block', opacity: uploading ? 0.5 : 1 }}>
                {uploading ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
              <div style={{ fontSize: 11, color: '#505468', marginTop: 4 }}>Max 1MB. Auto-compressed to 250KB.</div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Personal Information</div>
          <label style={labelStyle}>Full Name *</label>
          <input style={inputStyle} value={form.name || ''} onChange={e => sf('name', e.target.value)} placeholder="Your full name" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Mobile</label><input style={inputStyle} value={form.mobile || ''} onChange={e => sf('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" /></div>
            <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" value={form.email || ''} onChange={e => sf('email', e.target.value)} placeholder="your@email.com" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>City</label>
              <select style={inputStyle} value={form.city || ''} onChange={e => sf('city', e.target.value)}>
                <option value="">Select City</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>LinkedIn</label>
              <input style={inputStyle} value={form.linkedin || ''} onChange={e => sf('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={detectLocation} disabled={locLoading} style={{
              background: 'rgba(108,140,255,0.08)', color: '#6c8cff', border: `1px solid rgba(108,140,255,0.2)`,
              borderRadius: 10, padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              opacity: locLoading ? 0.5 : 1,
            }}>
              {locLoading ? 'Detecting...' : '📍 Detect My Location'}
            </button>
            {locSaved && <span style={{ fontSize: 11, color: '#3dd68c' }}>Location saved ✓</span>}
          </div>
        </div>

        {/* Professional Details */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Professional Details</div>
          <label style={labelStyle}>Current Role / Designation</label>
          <input style={inputStyle} value={form.role || ''} onChange={e => sf('role', e.target.value)} placeholder="e.g. Software Engineer, HR Manager" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Experience (years)</label><input style={inputStyle} type="number" step="0.5" min="0" value={form.experience || ''} onChange={e => sf('experience', e.target.value ? parseFloat(e.target.value) : null)} placeholder="e.g. 3.5" /></div>
            <div>
              <label style={labelStyle}>Qualification</label>
              <select style={inputStyle} value={form.qualification || ''} onChange={e => sf('qualification', e.target.value)}>
                <option value="">Select</option>
                {QUALIFICATIONS.map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Current CTC (₹ LPA)</label><input style={inputStyle} type="number" step="0.5" min="0" value={form.current_ctc || ''} onChange={e => sf('current_ctc', e.target.value ? parseFloat(e.target.value) : null)} placeholder="e.g. 8" /></div>
            <div><label style={labelStyle}>Expected CTC (₹ LPA)</label><input style={inputStyle} type="number" step="0.5" min="0" value={form.expected_ctc || ''} onChange={e => sf('expected_ctc', e.target.value ? parseFloat(e.target.value) : null)} placeholder="e.g. 12" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Notice Period</label>
              <select style={inputStyle} value={form.notice_period || ''} onChange={e => sf('notice_period', e.target.value)}>
                <option value="">Select</option>
                {NOTICE_PERIODS.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Work Mode</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                {WORK_MODES.map(w => (
                  <button key={w} onClick={() => sf('work_mode', form.work_mode === w ? '' : w)} style={{
                    flex: 1, padding: '9px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                    border: `1px solid ${form.work_mode === w ? '#6c8cff' : theme.bd}`,
                    background: form.work_mode === w ? 'rgba(108,140,255,0.12)' : 'rgba(255,255,255,0.03)',
                    color: form.work_mode === w ? '#6c8cff' : '#7a7f90',
                  }}>{w}</button>
                ))}
              </div>
            </div>
          </div>
          <label style={labelStyle}>Skills (comma separated)</label>
          <textarea rows={2} style={{ ...inputStyle, resize: 'none' as const }} value={form.skills || ''} onChange={e => sf('skills', e.target.value)} placeholder="e.g. React, Node.js, Python, Sales, Communication..." />
        </div>

        {/* Feed Preferences */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Feed Preferences</div>
          <div style={{ fontSize: 12, color: '#7a7f90', marginBottom: 12 }}>Customize your job feed experience</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Experience Level</label>
              <select style={inputStyle} value={userSettings.segment} onChange={e => setUserSettings(p => ({ ...p, segment: e.target.value }))}>
                {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Feed Style</label>
              <select style={inputStyle} value={userSettings.vibe} onChange={e => setUserSettings(p => ({ ...p, vibe: e.target.value }))}>
                {VIBE_MODES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveSettings} style={{
            width: '100%', marginTop: 12, padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 600,
            background: 'rgba(108,140,255,0.12)', color: '#6c8cff', border: `1px solid rgba(108,140,255,0.2)`,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Save Preferences</button>
        </div>

        {/* Save Profile */}
        <button onClick={saveProfile} disabled={saving} style={{
          width: '100%', padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
          background: saved ? '#3dd68c' : '#6c8cff', color: '#fff', border: 'none',
          cursor: 'pointer', opacity: saving ? 0.6 : 1, transition: 'all 0.2s',
        }}>
          {saving ? 'Saving...' : saved ? 'Profile Saved! ✓' : 'Save Profile'}
        </button>

        <div style={{ textAlign: 'center' as const, marginTop: 12, marginBottom: 20, fontSize: 12, color: '#505468' }}>
          Your profile data is used directly by recruiters — no CV parsing needed.
        </div>
      </div>
    </div>
  )
}
