import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../src/lib/supabase'
import { applyTheme, getSavedTheme, THEME_LIST } from '../src/lib/theme'

const APP_STATUS_C: any = {
  'Applied': '#7ab3ff', 'Shortlisted': '#3dd68c', 'Interview Scheduled': '#48cae4',
  'Selected': '#ffd60a', 'Rejected': '#ff6b6b', 'On Hold': '#ffb347', 'Offer Made': '#c77dff'
}

export default function JobSeekerDashboard() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('applications')
  const [theme, setTheme] = useState('dark')
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [editProfile, setEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = getSavedTheme(); setTheme(t); applyTheme(t)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      loadData(session.user)
    })
  }, [router])

  async function loadData(u: any) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)
    setProfileForm(au || {})
    const { data: apps } = await supabase.from('job_applications')
      .select('*, job:job_descriptions(title, company, location, industry)')
      .eq('applicant_id', u.id)
      .order('created_at', { ascending: false })
    setApplications(apps || [])
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.from('app_users').update({
      full_name: profileForm.full_name,
      phone: profileForm.phone,
      bio: profileForm.bio,
      linkedin_url: profileForm.linkedin_url,
      title: profileForm.title,
    }).eq('id', appUser.id)
    setAppUser((prev: any) => ({ ...prev, ...profileForm }))
    setEditProfile(false)
    setSaving(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const cur = THEME_LIST.find(t => t.id === theme) || THEME_LIST[1]

  const S: any = {
    page: { minHeight: '100vh', background: 'var(--bg)', color: 'var(--tx)', fontFamily: 'Outfit,sans-serif' },
    card: { background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 12, padding: 20 },
    inp: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--tx)', outline: 'none', marginBottom: 10, fontFamily: 'Outfit,sans-serif' },
    btn: { background: 'var(--ac)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    lbl: { fontSize: 11, color: 'var(--mu)', marginBottom: 4, display: 'block', fontWeight: 600, textTransform: 'uppercase' as any, letterSpacing: '0.8px' },
    tab: (a: boolean) => ({ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Outfit,sans-serif', background: a ? 'var(--acbg)' : 'transparent', color: a ? 'var(--ac)' : 'var(--mu)' }),
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--tx)', fontFamily: 'Outfit,sans-serif' }}>Loading...</div>

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');*{box-sizing:border-box}select option{background:var(--bg3)}`}</style>

      {/* NAV */}
      <nav style={{ background: 'var(--nb)', borderBottom: '1px solid var(--nbr)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as any, top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => router.push('/jobs')}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--acbg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--ac)', fontSize: 14 }}>R</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>RecruitBase Pro</div>
            <div style={{ fontSize: 9, color: 'var(--mu)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Job Seeker Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => router.push('/jobs')} style={{ background: 'var(--acbg)', color: 'var(--ac)', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>🎯 Browse Jobs</button>
          {/* Theme picker */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowThemePicker(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 20, background: 'var(--bg2)', border: '1px solid var(--bd)', cursor: 'pointer', fontSize: 12, color: 'var(--tx)', fontFamily: 'Outfit,sans-serif' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: cur.color, display: 'inline-block' }} />{cur.emoji} ▼
            </button>
            {showThemePicker && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 10, padding: 8, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', minWidth: 140 }}>
                {THEME_LIST.map(t => (
                  <div key={t.id} onClick={() => { setTheme(t.id); applyTheme(t.id); localStorage.setItem('rbp_theme', t.id); setShowThemePicker(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, cursor: 'pointer', background: theme === t.id ? 'var(--acbg)' : 'transparent' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: theme === t.id ? 'var(--ac)' : 'var(--tx)' }}>{t.emoji} {t.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={signOut} style={{ background: 'var(--rdbg)', color: 'var(--rd)', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* PROFILE HEADER */}
        <div style={{ ...S.card, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as any }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--acbg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--ac)', flexShrink: 0 }}>
            {appUser?.full_name?.[0]?.toUpperCase() || 'J'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{appUser?.full_name}</div>
            <div style={{ fontSize: 13, color: 'var(--ac)', marginTop: 2 }}>{appUser?.title || 'Job Seeker'}</div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>{appUser?.email}</div>
            {appUser?.bio && <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>{appUser.bio}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <div style={{ textAlign: 'center', background: 'var(--acbg)', borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ac)' }}>{applications.length}</div>
              <div style={{ fontSize: 10, color: 'var(--mu)' }}>Applied</div>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--gnbg)', borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gn)' }}>{applications.filter(a => a.status === 'Shortlisted').length}</div>
              <div style={{ fontSize: 10, color: 'var(--mu)' }}>Shortlisted</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,214,10,0.1)', borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gd)' }}>{applications.filter(a => a.status === 'Selected').length}</div>
              <div style={{ fontSize: 10, color: 'var(--mu)' }}>Selected</div>
            </div>
          </div>
          <button onClick={() => setEditProfile(true)} style={{ ...S.btn, background: 'var(--bg3)', color: 'var(--tx)', flexShrink: 0 }}>✏️ Edit Profile</button>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 4, borderRadius: 10, marginBottom: 20, width: 'fit-content' }}>
          <button onClick={() => setActiveTab('applications')} style={S.tab(activeTab === 'applications')}>📋 My Applications</button>
          <button onClick={() => setActiveTab('profile')} style={S.tab(activeTab === 'profile')}>👤 Profile</button>
        </div>

        {/* APPLICATIONS TAB */}
        {activeTab === 'applications' && (
          <div>
            {applications.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No Applications Yet</div>
                <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 20 }}>Browse open jobs and apply to get started</div>
                <button onClick={() => router.push('/jobs')} style={S.btn}>🎯 Browse Jobs</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' as any, gap: 12 }}>
                {applications.map(app => (
                  <div key={app.id} style={{ ...S.card, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' as any }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{app.job?.title || 'Position'}</div>
                      <div style={{ fontSize: 13, color: 'var(--ac)', marginBottom: 6 }}>{app.job?.company}</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as any }}>
                        {app.job?.location && <span style={{ fontSize: 11, color: 'var(--mu)' }}>📍 {app.job.location}</span>}
                        {app.job?.industry && <span style={{ fontSize: 11, color: 'var(--mu)' }}>🏭 {app.job.industry}</span>}
                      </div>
                      {app.cover_letter && (
                        <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 8, fontStyle: 'italic', borderLeft: '2px solid var(--bd)', paddingLeft: 8 }}>
                          "{app.cover_letter.slice(0, 100)}{app.cover_letter.length > 100 ? '...' : ''}"
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as any, alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, background: `${APP_STATUS_C[app.status] || '#888'}22`, color: APP_STATUS_C[app.status] || '#888', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
                        {app.status}
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--mu2)' }}>Applied {new Date(app.created_at).toLocaleDateString('en-IN')}</div>
                      {app.notes && <div style={{ fontSize: 11, color: 'var(--mu)', maxWidth: 200, textAlign: 'right' }}>📝 {app.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Personal Information</div>
              {[
                { lbl: 'Full Name', key: 'full_name', type: 'text' },
                { lbl: 'Job Title / Role', key: 'title', type: 'text' },
                { lbl: 'Phone', key: 'phone', type: 'text' },
                { lbl: 'LinkedIn URL', key: 'linkedin_url', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={S.lbl}>{f.lbl}</label>
                  <input type={f.type} value={profileForm[f.key] || ''} onChange={e => setProfileForm((p: any) => ({ ...p, [f.key]: e.target.value }))} disabled={!editProfile} style={{ ...S.inp, opacity: editProfile ? 1 : 0.7 }} />
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>About Me</div>
              <label style={S.lbl}>Bio / Summary</label>
              <textarea rows={5} value={profileForm.bio || ''} onChange={e => setProfileForm((p: any) => ({ ...p, bio: e.target.value }))} disabled={!editProfile} placeholder="Write a short bio about yourself..." style={{ ...S.inp, resize: 'vertical' as any, opacity: editProfile ? 1 : 0.7 }} />
              <div style={{ marginTop: 8, padding: 12, background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 4 }}>Account Info</div>
                <div style={{ fontSize: 13 }}>Email: <span style={{ color: 'var(--ac)' }}>{appUser?.email}</span></div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Role: <span style={{ color: 'var(--ac)' }}>{appUser?.role}</span></div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Member since: <span style={{ color: 'var(--mu)' }}>{appUser?.created_at ? new Date(appUser.created_at).toLocaleDateString('en-IN') : '—'}</span></div>
              </div>
              {editProfile && (
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={() => setEditProfile(false)} style={{ flex: 1, background: 'var(--bg3)', color: 'var(--tx)', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveProfile} disabled={saving} style={{ ...S.btn, flex: 2, padding: '10px' }}>{saving ? 'Saving...' : '💾 Save Profile'}</button>
                </div>
              )}
              {!editProfile && (
                <button onClick={() => setEditProfile(true)} style={{ ...S.btn, width: '100%', marginTop: 16, background: 'var(--acbg)', color: 'var(--ac)' }}>✏️ Edit Profile</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
