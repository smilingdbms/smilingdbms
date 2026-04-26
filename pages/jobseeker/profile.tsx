import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import { calculateProfileStrength, compressImage, validateFileSize, getUserLocation } from '../../src/lib/jobseeker-utils'

// ══════════════════════════════════════════════════════════
// JOB SEEKER PROFILE v2.0 — Sprint 1
// Profile strength, geo, image compression, segment/vibe settings
// No CV parsing needed — data directly from backend
// ══════════════════════════════════════════════════════════

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Noida', 'Gurgaon', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi', 'Nagpur', 'Indore', 'Bhopal', 'Surat', 'Vadodara', 'Patna', 'Ranchi', 'Coimbatore', 'Visakhapatnam', 'Bhubaneswar', 'Other']
const QUALIFICATIONS = ['B.Tech', 'M.Tech', 'MCA', 'BCA', 'MBA', 'PGDM', 'B.Sc', 'M.Sc', 'BBA', 'B.Com', 'M.Com', 'BA', 'MA', 'MBBS', 'BDS', 'CA', 'CS', 'LLB', 'PhD', 'Diploma', 'ITI', '12th Pass', '10th Pass', 'Graduate', 'Post Graduate', 'Other']
const NOTICE_PERIODS = ['Immediate', '7 days', '15 days', '1 month', '2 months', '3 months']
const WORK_MODES = ['WFH', 'Office', 'Hybrid', 'Flexible']
const SEGMENTS = [
  { value: 'intern', label: 'Intern (College student)' },
  { value: 'fresher', label: 'Fresher (0-6 months)' },
  { value: 'junior', label: 'Junior (6 months - 2 years)' },
  { value: 'experienced', label: 'Experienced (2+ years)' },
]
const VIBE_MODES = [
  { value: 'fun', label: '🎮 Fun & Social', desc: 'Card swipe, colors, animations' },
  { value: 'professional', label: '💼 Professional', desc: 'Clean list, formal layout' },
  { value: 'focus', label: '🎯 Quick Apply', desc: 'Minimal, just jobs and apply' },
]

export default function JobSeekerProfile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileStrength, setProfileStrength] = useState({ score: 0, missing: [] as string[] })
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null)
  const [userSettings, setUserSettings] = useState<{ segment: string, vibe: string }>({ segment: 'fresher', vibe: 'fun' })

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/'); return }
      const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
      if (!au) { await supabase.auth.signOut(); router.push('/'); return }
      if (au.status === 'disabled') { await supabase.auth.signOut(); router.push('/'); return }
      if (!['job_seeker', 'super_admin'].includes(au.role)) { router.push('/dashboard'); return }

      setUser(au)
      setUserSettings({ segment: au.experience_segment || 'fresher', vibe: au.vibe_mode || 'fun' })

      const { data: profile } = await supabase.from('profiles').select('*').eq('created_by', u.id).single()
      if (profile) {
        setForm(profile)
        setProfileStrength(calculateProfileStrength(profile))
      } else {
        const initial = { name: au.full_name || '', email: au.email || '', mobile: au.mobile || '', city: au.city || '', segment: 'experienced' }
        setForm(initial)
        setProfileStrength(calculateProfileStrength(initial))
      }
      setLoading(false)
    }
    init()
  }, [])

  const sf = (k: string, v: any) => {
    const updated = { ...form, [k]: v }
    setForm(updated)
    setProfileStrength(calculateProfileStrength(updated))
  }

  async function saveProfile() {
    if (!form.name?.trim()) { showToast('Name is required.', 'error'); return }
    setSaving(true)

    const payload: any = {
      name: form.name || '',
      email: form.email || '',
      mobile: (form.mobile || '').replace(/\D/g, '').slice(0, 15),
      role: form.role || '',
      qualification: form.qualification || '',
      skills: form.skills || '',
      experience: form.experience ? parseFloat(form.experience) : null,
      current_ctc: form.current_ctc ? parseFloat(form.current_ctc) : null,
      expected_ctc: form.expected_ctc ? parseFloat(form.expected_ctc) : null,
      notice_period: form.notice_period || '',
      work_mode: form.work_mode || '',
      city: form.city || '',
      linkedin: form.linkedin || '',
      segment: form.segment || 'experienced',
      status: form.status || 'New',
      source: 'Job Portal',
      created_by: user.id,
    }

    // Remove undefined/empty UUID fields
    Object.keys(payload).forEach(k => {
      if (payload[k] === '' && ['company_id', 'team_id', 'assigned_to'].includes(k)) {
        payload[k] = null
      }
    })

    let error
    if (form.id) {
      const res = await supabase.from('profiles').update(payload).eq('id', form.id)
      error = res.error
    } else {
      const res = await supabase.from('profiles').insert(payload).select().single()
      error = res.error
      if (res.data) setForm(res.data)
    }

    if (error) {
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
      vibe_mode: userSettings.vibe
    }).eq('id', user.id)
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

      const { error: upErr } = await supabase.storage.from('uploads').upload(path, uploadBlob, { upsert: true, contentType: file.type.startsWith('image/') ? 'image/jpeg' : file.type })
      if (upErr) { showToast('Upload failed. Please try again.', 'error'); setUploading(false); return }

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
      if (urlData?.publicUrl) {
        sf('photo_url', urlData.publicUrl)
        await supabase.from('app_users').update({ photo_url: urlData.publicUrl }).eq('id', user.id)
        showToast('Photo uploaded!')
      }
    } catch (err) {
      showToast('Upload error. File may be too large.', 'error')
    }
    setUploading(false)
  }

  async function detectLocation() {
    showToast('Detecting location...')
    const loc = await getUserLocation()
    if (loc) {
      await supabase.from('app_users').update({ latitude: loc.lat, longitude: loc.lng }).eq('id', user.id)
      showToast('Location saved!')
    } else {
      showToast('Could not detect location. Please enable GPS.', 'error')
    }
  }

  const S: Record<string, any> = {
    page: { minHeight: '100vh', background: 'var(--bg,#0f1117)', color: 'var(--tx,#e8eaf0)', fontFamily: "'Outfit',sans-serif" },
    nav: { background: 'var(--bg2,#161921)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 50 },
    body: { padding: '16px 20px', maxWidth: 700, margin: '0 auto' },
    card: { background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: 22, marginBottom: 16 },
    inp: { width: '100%', background: 'var(--bg3,#1e2230)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', color: 'var(--tx,#e8eaf0)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const },
    label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#7a7f90', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 5, marginTop: 14 },
    btn: (bg: string, col: string) => ({ background: bg, color: col, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
  }

  if (loading) return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#7a7f90' }}>Loading profile...</div></div>

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}select option{background:#1e2230}input:focus,select:focus,textarea:focus{border-color:#6c8cff!important}`}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 999, background: toast.type === 'success' ? '#0d2a1a' : '#2a0d0d', border: `1px solid ${toast.type === 'success' ? '#3dd68c55' : '#ff505055'}`, color: toast.type === 'success' ? '#3dd68c' : '#ff5050', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
          {toast.msg}
        </div>
      )}

      <nav style={S.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(108,140,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#6c8cff', fontSize: 15 }}>R</div>
          <div><div style={{ fontWeight: 700, fontSize: 15 }}>RecruitBase</div><div style={{ fontSize: 9, color: '#505468', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Job Portal</div></div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={S.btn('rgba(108,140,255,0.1)', '#6c8cff')} onClick={() => router.push('/jobseeker')}>Browse Jobs</button>
          <button style={S.btn('rgba(255,159,67,0.1)', '#ff9f43')} onClick={() => router.push('/jobseeker/applications')}>Applications</button>
          <button style={S.btn('rgba(255,255,255,0.04)', '#7a7f90')} onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Sign Out</button>
        </div>
      </nav>

      <div style={S.body}>
        {/* Header + Strength */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>My Profile</div>
          <div style={{ color: '#7a7f90', fontSize: 13, marginTop: 4 }}>Keep your profile updated — recruiters find you through this data</div>
        </div>

        {/* Profile Strength Meter */}
        <div style={{ ...S.card, borderLeft: `3px solid ${profileStrength.score >= 80 ? '#3dd68c' : profileStrength.score >= 50 ? '#ffd60a' : '#ff6b6b'}` }}>
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
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Profile Photo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(108,140,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid rgba(108,140,255,0.2)', flexShrink: 0 }}>
              {form.photo_url || user?.photo_url ? (
                <img src={form.photo_url || user?.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 24, color: '#6c8cff', fontWeight: 700 }}>{(form.name || user?.full_name || '?')[0]}</span>
              )}
            </div>
            <div>
              <label style={{ ...S.btn('rgba(108,140,255,0.12)', '#6c8cff'), display: 'inline-block', cursor: 'pointer', opacity: uploading ? 0.5 : 1 }}>
                {uploading ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
              <div style={{ fontSize: 11, color: '#505468', marginTop: 4 }}>Max 1MB. Auto-compressed.</div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Personal Information</div>
          <label style={S.label}>Full Name *</label>
          <input style={S.inp} value={form.name || ''} onChange={e => sf('name', e.target.value)} placeholder="Your full name" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={S.label}>Mobile</label><input style={S.inp} value={form.mobile || ''} onChange={e => sf('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" /></div>
            <div><label style={S.label}>Email</label><input style={S.inp} type="email" value={form.email || ''} onChange={e => sf('email', e.target.value)} placeholder="your@email.com" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>City</label>
              <select style={S.inp} value={form.city || ''} onChange={e => sf('city', e.target.value)}>
                <option value="">Select City</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>LinkedIn</label>
              <input style={S.inp} value={form.linkedin || ''} onChange={e => sf('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={detectLocation} style={{ ...S.btn('rgba(108,140,255,0.08)', '#6c8cff'), fontSize: 12, padding: '8px 14px' }}>
              📍 Detect My Location
            </button>
            {user?.latitude && <span style={{ fontSize: 11, color: '#3dd68c', marginLeft: 8 }}>Location saved ✓</span>}
          </div>
        </div>

        {/* Professional Details */}
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Professional Details</div>
          <label style={S.label}>Current Role / Designation</label>
          <input style={S.inp} value={form.role || ''} onChange={e => sf('role', e.target.value)} placeholder="e.g. Software Engineer, HR Manager" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={S.label}>Experience (years)</label><input style={S.inp} type="number" step="0.5" min="0" value={form.experience || ''} onChange={e => sf('experience', e.target.value)} placeholder="e.g. 3.5" /></div>
            <div>
              <label style={S.label}>Qualification</label>
              <select style={S.inp} value={form.qualification || ''} onChange={e => sf('qualification', e.target.value)}>
                <option value="">Select</option>
                {QUALIFICATIONS.map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={S.label}>Current CTC (₹ LPA)</label><input style={S.inp} type="number" step="0.5" min="0" value={form.current_ctc || ''} onChange={e => sf('current_ctc', e.target.value)} placeholder="e.g. 8" /></div>
            <div><label style={S.label}>Expected CTC (₹ LPA)</label><input style={S.inp} type="number" step="0.5" min="0" value={form.expected_ctc || ''} onChange={e => sf('expected_ctc', e.target.value)} placeholder="e.g. 12" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Notice Period</label>
              <select style={S.inp} value={form.notice_period || ''} onChange={e => sf('notice_period', e.target.value)}>
                <option value="">Select</option>
                {NOTICE_PERIODS.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Work Mode</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                {WORK_MODES.map(w => (
                  <button key={w} onClick={() => sf('work_mode', form.work_mode === w ? '' : w)} style={{
                    flex: 1, padding: '9px 4px', borderRadius: 8,
                    border: `1px solid ${form.work_mode === w ? '#6c8cff' : 'rgba(255,255,255,0.08)'}`,
                    background: form.work_mode === w ? 'rgba(108,140,255,0.12)' : 'rgba(255,255,255,0.03)',
                    color: form.work_mode === w ? '#6c8cff' : '#7a7f90', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                  }}>{w}</button>
                ))}
              </div>
            </div>
          </div>
          <label style={S.label}>Skills (comma separated)</label>
          <textarea rows={2} style={{ ...S.inp, resize: 'none' as const }} value={form.skills || ''} onChange={e => sf('skills', e.target.value)} placeholder="e.g. React, Node.js, Python, Sales, Communication..." />
        </div>

        {/* Feed Preferences */}
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Feed Preferences</div>
          <div style={{ fontSize: 12, color: '#7a7f90', marginBottom: 12 }}>Customize your job feed experience</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Experience Level</label>
              <select style={S.inp} value={userSettings.segment} onChange={e => setUserSettings(p => ({ ...p, segment: e.target.value }))}>
                {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Feed Style</label>
              <select style={S.inp} value={userSettings.vibe} onChange={e => setUserSettings(p => ({ ...p, vibe: e.target.value }))}>
                {VIBE_MODES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveSettings} style={{ ...S.btn('rgba(108,140,255,0.12)', '#6c8cff'), marginTop: 12, width: '100%', padding: 12, borderRadius: 12 }}>Save Preferences</button>
        </div>

        {/* Save Profile */}
        <button onClick={saveProfile} disabled={saving} style={{
          width: '100%', padding: 14, borderRadius: 14,
          background: saved ? '#3dd68c' : '#6c8cff', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
          opacity: saving ? 0.6 : 1, transition: 'all 0.2s'
        }}>
          {saving ? 'Saving...' : saved ? 'Profile Saved! ✓' : 'Save Profile'}
        </button>

        <div style={{ textAlign: 'center' as const, marginTop: 12, fontSize: 12, color: '#505468' }}>
          Your profile data is used directly by recruiters — no CV parsing needed.
        </div>
      </div>
    </div>
  )
}
