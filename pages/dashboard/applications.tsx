import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import { logApplicationStatusChanged, startIdleTracking } from '../../src/lib/activityLogger'

const STATUSES = ['Applied','Reviewing','Shortlisted','Interview','Rejected','Hired']
const STATUS_COLORS: any = {
  Applied: { bg: 'rgba(108,140,255,0.15)', color: '#6c8cff' },
  Reviewing: { bg: 'rgba(255,159,67,0.15)', color: '#ff9f43' },
  Shortlisted: { bg: 'rgba(72,202,228,0.15)', color: '#48cae4' },
  Interview: { bg: 'rgba(199,125,255,0.15)', color: '#c77dff' },
  Rejected: { bg: 'rgba(255,80,80,0.15)', color: '#ff5050' },
  Hired: { bg: 'rgba(61,214,140,0.15)', color: '#3dd68c' },
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{msg:string,type:'success'|'error'}|null>(null)

  // Filters
  const [filterJd, setFilterJd] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest'|'oldest'>('newest')

  // Expanded application
  const [expanded, setExpanded] = useState<string|null>(null)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: au } = await supabase.from('app_users').select('*').eq('id', user.id).single()
    if (!au) { router.push('/'); return }
    if (au.role === 'job_seeker') { router.push('/jobseeker'); return }
    setAppUser(au)
    await loadData(au)
    setLoading(false)
  }

  async function loadData(au: any) {
    // Load JDs for this company (or all for super admin)
    let jdQuery = supabase.from('job_descriptions').select('id, title, company_id').order('created_at', { ascending: false })
    if (au.role !== 'super_admin' && au.company_id) {
      jdQuery = jdQuery.eq('company_id', au.company_id)
    }
    const { data: jdData } = await jdQuery
    setJobs(jdData || [])

    // Load applications
    let appQuery = supabase.from('job_applications').select('*').order('created_at', { ascending: false })
    if (au.role !== 'super_admin' && au.company_id) {
      appQuery = appQuery.eq('company_id', au.company_id)
    }
    const { data: appData } = await appQuery
    setApplications(appData || [])
  }

  function showToast(msg: string, type: 'success'|'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function updateStatus(appId: string, newStatus: string) {
    const { error } = await supabase.from('job_applications').update({ 
      status: newStatus, 
      updated_at: new Date().toISOString(),
      reviewed_by: appUser?.id 
    }).eq('id', appId)
    
    if (error) { showToast('Failed to update: ' + error.message, 'error'); return }
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus, reviewed_by: appUser?.id } : a))
    showToast('Status updated to ' + newStatus)
  }

  // Filter logic
  const filtered = applications.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || 
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.mobile || '').toLowerCase().includes(q)
    const matchJd = !filterJd || a.job_id === filterJd
    const matchStatus = !filterStatus || a.status === filterStatus
    return matchSearch && matchJd && matchStatus
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  // Stats
  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    reviewing: applications.filter(a => a.status === 'Reviewing').length,
    shortlisted: applications.filter(a => a.status === 'Shortlisted').length,
    interview: applications.filter(a => a.status === 'Interview').length,
    hired: applications.filter(a => a.status === 'Hired').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
  }

  function getJdTitle(jobId: string): string {
    const jd = jobs.find(j => j.id === jobId)
    return jd?.title || 'Unknown JD'
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return mins + 'm ago'
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return hrs + 'h ago'
    const days = Math.floor(hrs / 24)
    if (days < 30) return days + 'd ago'
    return new Date(dateStr).toLocaleDateString('en-IN')
  }

  const S = {
    page: { minHeight: '100vh', background: '#111318', color: '#e8eaf0', fontFamily: "'Outfit',sans-serif" },
    nav: { background: '#0d0f14', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 50 },
    body: { padding: '24px', maxWidth: 1300, margin: '0 auto' },
    card: { background: '#1a1d24', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: 20, marginBottom: 14 },
    inp: { background: '#22262f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#e8eaf0', fontSize: 13, fontFamily: 'inherit', outline: 'none' },
    btn: (bg: string, col: string) => ({ background: bg, color: col, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as const),
  }

  if (loading) return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#7a7f90' }}>Loading applications...</span></div>

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        .app-row:hover{background:rgba(255,255,255,0.02)!important}
        select option{background:#22262f}
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: toast.type === 'success' ? '#0d2a1a' : '#2a0d0d', border: `1px solid ${toast.type === 'success' ? '#3dd68c' : '#ff5050'}`, color: toast.type === 'success' ? '#3dd68c' : '#ff5050', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{toast.msg}</div>
      )}

      {/* Nav */}
      <nav style={S.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(108,140,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#6c8cff', fontSize: 14 }}>R</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>RecruitBase Pro</div>
            <div style={{ fontSize: 9, color: '#505468', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Recruitment OS</div>
          </div>
          <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}>Applications</span>
        </div>
        <button style={S.btn('rgba(108,140,255,0.1)', '#6c8cff')} onClick={() => router.push('/dashboard')}>← Dashboard</button>
      </nav>

      <div style={S.body}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Job Applications</div>
          <div style={{ color: '#7a7f90', fontSize: 13, marginTop: 4 }}>
            {stats.total} total applications across {jobs.length} job descriptions
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total', value: stats.total, color: '#e8eaf0' },
            { label: 'New', value: stats.applied, color: '#6c8cff' },
            { label: 'Reviewing', value: stats.reviewing, color: '#ff9f43' },
            { label: 'Shortlisted', value: stats.shortlisted, color: '#48cae4' },
            { label: 'Interview', value: stats.interview, color: '#c77dff' },
            { label: 'Hired', value: stats.hired, color: '#3dd68c' },
            { label: 'Rejected', value: stats.rejected, color: '#ff5050' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', borderTop: `2px solid ${s.color}` }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#7a7f90', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ ...S.card, padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' }}>
            <input style={{ ...S.inp, flex: 1, minWidth: 180 }} placeholder="Search name, email, mobile..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={S.inp} value={filterJd} onChange={e => setFilterJd(e.target.value)}>
              <option value="">All Job Descriptions</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <select style={S.inp} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select style={S.inp} value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <span style={{ color: '#505468', fontSize: 12 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Applications List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: 60, color: '#505468' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No applications yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Applications will appear here when job seekers apply to your JDs</div>
          </div>
        ) : (
          <div style={S.card}>
            <div style={{ overflowX: 'auto' as const }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Applicant', 'Contact', 'Applied For', 'Applied On', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, color: '#505468', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.8px', whiteSpace: 'nowrap' as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => {
                    const sc = STATUS_COLORS[a.status] || STATUS_COLORS.Applied
                    const isExpanded = expanded === a.id
                    return (
                      <>
                        <tr key={a.id} className="app-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : a.id)}>
                          {/* Applicant */}
                          <td style={{ padding: '14px', fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,140,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6c8cff', fontSize: 14, flexShrink: 0 }}>
                                {(a.full_name || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{a.full_name || 'Unknown'}</div>
                                <div style={{ fontSize: 11, color: '#505468' }}>{a.email || ''}</div>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {a.mobile && (
                                <a href={`tel:${a.mobile}`} style={{ fontSize: 11, background: 'rgba(61,214,140,0.1)', color: '#3dd68c', padding: '3px 8px', borderRadius: 6, textDecoration: 'none' }}>📞 Call</a>
                              )}
                              {a.mobile && (
                                <a href={`https://wa.me/${(a.mobile||'').replace(/[^0-9]/g,'')}`} target="_blank" style={{ fontSize: 11, background: 'rgba(37,211,102,0.1)', color: '#25d366', padding: '3px 8px', borderRadius: 6, textDecoration: 'none' }}>💬 WhatsApp</a>
                              )}
                              {a.email && (
                                <a href={`mailto:${a.email}`} style={{ fontSize: 11, background: 'rgba(108,140,255,0.1)', color: '#6c8cff', padding: '3px 8px', borderRadius: 6, textDecoration: 'none' }}>📧 Email</a>
                              )}
                            </div>
                          </td>

                          {/* Applied For */}
                          <td style={{ padding: '14px' }}>
                            <span style={{ fontSize: 12, color: '#e8eaf0', fontWeight: 500 }}>{getJdTitle(a.job_id)}</span>
                          </td>

                          {/* Applied On */}
                          <td style={{ padding: '14px', color: '#7a7f90', fontSize: 12, whiteSpace: 'nowrap' as const }}>
                            {timeAgo(a.created_at)}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px' }}>
                            <span style={{ fontSize: 11, background: sc.bg, color: sc.color, padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>{a.status}</span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px' }} onClick={e => e.stopPropagation()}>
                            <select 
                              value={a.status}
                              onChange={e => updateStatus(a.id, e.target.value)}
                              style={{ ...S.inp, padding: '5px 8px', fontSize: 11, minWidth: 120 }}
                            >
                              {STATUSES.map(s => (
                                <option key={s} value={s}>{s === 'Hired' ? '✅ ' + s : s === 'Rejected' ? '❌ ' + s : s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>

                        {/* Expanded Row — Cover Note + Details */}
                        {isExpanded && (
                          <tr key={a.id + '_exp'} style={{ background: 'rgba(255,255,255,0.01)' }}>
                            <td colSpan={6} style={{ padding: '14px 14px 14px 70px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                  <div style={{ fontSize: 11, color: '#505468', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>Cover Note</div>
                                  <div style={{ fontSize: 13, color: '#e8eaf0', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', minHeight: 60 }}>
                                    {a.cover_letter || a.cover_note || 'No cover note provided'}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, color: '#505468', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>Details</div>
                                  <div style={{ fontSize: 12, color: '#7a7f90', lineHeight: 2 }}>
                                    <div>Full Name: <span style={{ color: '#e8eaf0' }}>{a.full_name || '—'}</span></div>
                                    <div>Email: <span style={{ color: '#e8eaf0' }}>{a.email || '—'}</span></div>
                                    <div>Mobile: <span style={{ color: '#e8eaf0' }}>{a.mobile || '—'}</span></div>
                                    <div>Applied: <span style={{ color: '#e8eaf0' }}>{new Date(a.created_at).toLocaleString('en-IN')}</span></div>
                                    {a.source_platform && <div>Source: <span style={{ color: '#48cae4' }}>{a.source_platform}</span></div>}
                                    {a.resume_url && (
                                      <div><a href={a.resume_url} target="_blank" style={{ color: '#6c8cff', textDecoration: 'none' }}>📄 View Resume</a></div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Quick Action Buttons */}
                              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                                <button style={S.btn('rgba(61,214,140,0.12)', '#3dd68c')} onClick={() => updateStatus(a.id, 'Shortlisted')}>✅ Shortlist</button>
                                <button style={S.btn('rgba(199,125,255,0.12)', '#c77dff')} onClick={() => updateStatus(a.id, 'Interview')}>📅 Schedule Interview</button>
                                <button style={S.btn('rgba(61,214,140,0.12)', '#3dd68c')} onClick={() => updateStatus(a.id, 'Hired')}>🎉 Mark Hired</button>
                                <button style={S.btn('rgba(255,80,80,0.1)', '#ff5050')} onClick={() => updateStatus(a.id, 'Rejected')}>❌ Reject</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
