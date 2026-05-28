import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../src/lib/supabase'

// ═══════════════════════════════════════════════════════════
// RecruitBase Pro — Login / Signup Page v7.0
// 
// APPROACH: Direct INSERT into app_users (no RPC dependency)
// Session cleanup before every action
// Ghost detection + auto-cleanup
// Company code verified BEFORE auth signup
// Rollback on any failure
// ═══════════════════════════════════════════════════════════

const ACCOUNT_TYPES = [
  {
    id: 'owner', icon: '🏢', title: 'I Run a Company',
    desc: 'Create your recruitment firm workspace. You become the Account Owner.',
    color: '#6c8cff',
    roles: [
      { value: 'account_owner', label: 'Recruitment / Staffing Firm' },
      { value: 'account_owner', label: 'Corporate HR / Talent Acquisition' },
    ]
  },
  {
    id: 'freelancer', icon: '🧑‍💻', title: 'I am a Freelancer',
    desc: 'Work solo — no company needed. Your own workspace.',
    color: '#3dd68c',
    roles: [
      { value: 'individual_recruiter', label: 'Independent Recruiter' },
      { value: 'individual_bd', label: 'Independent BD Professional' },
    ]
  },
  {
    id: 'join', icon: '👥', title: 'Joining a Company',
    desc: 'Enter the Company Code your Account Owner shared.',
    color: '#ff9f43',
    roles: [
      { value: 'recruiter', label: 'Recruiter' },
      { value: 'sr_recruiter', label: 'Senior Recruiter' },
      { value: 'team_leader', label: 'Team Leader' },
      { value: 'team_manager', label: 'Team Manager' },
      { value: 'bd', label: 'BD Executive' },
      { value: 'bd_manager', label: 'BD Manager' },
    ]
  },
  {
    id: 'jobseeker', icon: '🎓', title: 'I am a Job Seeker',
    desc: 'Find jobs, apply instantly, track your applications.',
    color: '#48cae4',
    roles: [
      { value: 'job_seeker', label: 'Looking for a Job' },
      { value: 'job_seeker', label: 'Fresh Graduate / Student' },
    ]
  },
]

function generateCode(name: string): string {
  const prefix = (name || 'COMP').replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase()
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return prefix + suffix
}

function generateSlug(name: string): string {
  return (name || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)
}

export default function AuthPage() {
  const router = useRouter()

  const [screen, setScreen] = useState<'login' | 'choose' | 'signup'>('login')
  const [chosenType, setChosenType] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedRoleLabel, setSelectedRoleLabel] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setCheckingAuth(false); return }
        const { data: au } = await supabase.from('app_users').select('role,status').eq('id', user.id).single()
        if (!au) {
          await supabase.auth.signOut()
          setCheckingAuth(false)
          return
        }
        if (au.status === 'disabled') {
          await supabase.auth.signOut()
          setCheckingAuth(false)
          setError('Your account has been disabled. Please contact your administrator.')
          return
        }
        if (au.status === 'pending') {
          await supabase.auth.signOut()
          setCheckingAuth(false)
          setError('Your account is pending approval. Your Account Owner will approve your access shortly.')
          return
        }
        redirectUser(au.role)
      } catch(e) {
        await supabase.auth.signOut()
        setCheckingAuth(false)
      }
    }
    init()

    const code = new URLSearchParams(window.location.search).get('code')
    if (code) { setCompanyCode(code); setChosenType('join'); setScreen('signup') }
  }, [])

  function redirectUser(role: string) {
    if (role === 'job_seeker') router.push('/jobseeker')
    else if (role === 'platform_admin') router.push('/admin')
    else router.push('/dashboard')
  }

  function clearForm() { setError(''); setSuccess('') }
  function goToChoose() { clearForm(); setScreen('choose') }

  function selectType(typeId: string) {
    setChosenType(typeId)
    const type = ACCOUNT_TYPES.find(t => t.id === typeId)
    if (type && type.roles.length > 0) {
      setSelectedRole(type.roles[0].value)
      setSelectedRoleLabel(type.roles[0].label)
    }
    clearForm(); setScreen('signup')
  }

  function goBackToLogin() {
    clearForm(); setScreen('login'); setChosenType(''); setSelectedRole('')
  }

  // ════════════════════════════════════════════════
  // LOGIN
  // ════════════════════════════════════════════════
  async function handleForgotPassword() {
    setError('')
    const emailToReset = resetEmail.trim() || email.trim()
    if (!emailToReset) { setError('Please enter your email address.'); return }
    setResetLoading(true)
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(emailToReset, {
      redirectTo: window.location.origin + '/reset-password'
    })
    if (resetErr) {
      setError('Could not send reset email. Please check your email address and try again.')
    } else {
      setResetSent(true)
      setError('')
    }
    setResetLoading(false)
  }

  async function handleLogin() {
    if (!email.trim()) { setError('Please enter your email'); return }
    if (!password) { setError('Please enter your password'); return }
    setLoading(true); clearForm()

    try { await supabase.auth.signOut() } catch(e) {}

    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim(), password,
    })

    if (authErr) {
      const msg = authErr.message.toLowerCase()
      if (msg.includes('invalid') || msg.includes('credentials')) setError('Wrong email or password. Please try again.')
      else if (msg.includes('not confirmed') || msg.includes('confirm')) setError('Email not verified yet. Please wait a moment and try again.')
      else if (msg.includes('rate') || msg.includes('too many')) setError('Too many attempts. Please wait a few minutes.')
      else setError('Login failed. Please try again.')
      setLoading(false); return
    }

    if (!data.user) { setError('Login failed. Please try again.'); setLoading(false); return }

    const { data: au } = await supabase.from('app_users').select('role,status').eq('id', data.user.id).single()

    if (!au) {
      // Ghost user — delete from auth and prompt re-signup
      try { await supabase.rpc('delete_ghost_auth_user', { p_email: email.trim().toLowerCase() }) } catch(e) {}
      await supabase.auth.signOut()
      setError('Your previous signup was incomplete. Please create your account again.')
      setLoading(false); return
    }

    if (au.status === 'disabled') {
      await supabase.auth.signOut()
      setError('Your account has been disabled. Please contact your administrator.')
      setLoading(false); return
    }

    if (au.status === 'pending') {
      await supabase.auth.signOut()
      setError('Your account is pending approval. Your Account Owner will approve your access shortly.')
      setLoading(false); return
    }

    setLoading(false)
    redirectUser(au.role)
  }

  // ════════════════════════════════════════════════
  // SIGNUP — v7.0 Direct INSERT (no RPC)
  // ════════════════════════════════════════════════
  async function handleSignup() {
    if (!fullName.trim()) { setError('Please enter your full name'); return }
    if (!email.trim()) { setError('Please enter your email'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (chosenType === 'owner' && !companyName.trim()) { setError('Company name is required'); return }
    if (chosenType === 'join' && !companyCode.trim()) { setError('Company Code is required'); return }

    setLoading(true); clearForm()

    // ═══ STEP 0: Clear stale session ═══
    try { await supabase.auth.signOut() } catch(e) {}

    // ═══ STEP 1: Validate BEFORE auth signup ═══
    let verifiedCompany: any = null

    if (chosenType === 'join') {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name')
        .eq('company_code', companyCode.trim().toUpperCase())
        .single()

      if (!company) {
        setError('Company Code not found. Please check with your Account Owner.')
        setLoading(false); return
      }
      verifiedCompany = company
    }

    // ═══ STEP 2: Create auth user ═══
    const { data: signupData, error: authErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } }
    })

    if (authErr) {
      const msg = authErr.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists')) {
        // Ghost detection — try login with same password
        const { data: loginCheck } = await supabase.auth.signInWithPassword({
          email: email.trim(), password
        })
        if (loginCheck?.user) {
          const { data: appCheck } = await supabase.from('app_users').select('id').eq('id', loginCheck.user.id).single()
          if (!appCheck) {
            // Ghost — cleanup
            try { await supabase.rpc('delete_ghost_auth_user', { p_email: email.trim().toLowerCase() }) } catch(e) {}
            await supabase.auth.signOut()
            setError('Cleaned up incomplete previous attempt. Please try again now.')
          } else {
            await supabase.auth.signOut()
            setError('This email is already registered. Please sign in instead.')
          }
        } else {
          try { await supabase.rpc('delete_ghost_auth_user', { p_email: email.trim().toLowerCase() }) } catch(e) {}
          setError('Cleaned up incomplete previous attempt. Please try again now.')
        }
        setLoading(false); return
      }
      if (msg.includes('rate') || msg.includes('too many')) {
        setError('Too many attempts. Please wait 5 minutes and try again.')
        setLoading(false); return
      }
      if (msg.includes('password')) {
        setError('Password must be at least 6 characters with uppercase, lowercase, number and symbol.')
        setLoading(false); return
      }
      setError('Could not create account: ' + authErr.message)
      setLoading(false); return
    }

    if (!signupData.user) {
      setError('Could not create account. Please try again.')
      setLoading(false); return
    }

    const uid = signupData.user.id

    // ═══ STEP 3: Sign in immediately to get proper session ═══
    const { data: sessionData, error: loginErr } = await supabase.auth.signInWithPassword({
      email: email.trim(), password,
    })

    if (loginErr || !sessionData?.user) {
      // Auth created but can't login — cleanup
      try { await supabase.rpc('delete_ghost_auth_user', { p_email: email.trim().toLowerCase() }) } catch(e) {}
      setError('Account created but login failed. Please try signing in manually.')
      setLoading(false); return
    }

    // ═══ STEP 4: Direct INSERT into app_users (no RPC!) ═══
    try {
      let insertData: any = {
        id: uid,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        mobile: mobile || null,
        status: 'active',
        points: 0,
        is_independent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (chosenType === 'owner') {
        // Create company first
        const code = generateCode(companyName)
        const { data: company, error: compErr } = await supabase.rpc('create_company_on_signup', {
          p_user_id: uid,
          p_name: companyName.trim(),
          p_slug: generateSlug(companyName),
          p_code: code,
          p_email: email.trim(),
        })

        if (compErr || !company) {
          try { await supabase.rpc('delete_ghost_auth_user', { p_email: email.trim().toLowerCase() }) } catch(e) {}
          await supabase.auth.signOut()
          setError('Could not create company. Please try again.')
          setLoading(false); return
        }

        insertData.role = 'account_owner'
        insertData.user_type = 'account_owner'
        insertData.title = selectedRoleLabel || 'Account Owner'
        insertData.company_id = company.id
        insertData.company_name = companyName.trim()
        insertData.company_code = code

        const { error: insErr } = await supabase.from('app_users').insert(insertData)
        if (insErr) {
          console.error('Insert error:', insErr)
          try { await supabase.rpc('delete_ghost_auth_user', { p_email: email.trim().toLowerCase() }) } catch(e) {}
          await supabase.auth.signOut()
          setError('Account setup failed: ' + insErr.message)
          setLoading(false); return
        }

        await supabase.auth.signOut()
        setSuccess(`Your company "${companyName}" is created!\n\nYour Company Code: ${code}\n\nShare this code with your team members so they can join.`)

      } else if (chosenType === 'freelancer') {
        insertData.role = selectedRole || 'recruiter'
        insertData.user_type = 'independent'
        insertData.title = selectedRoleLabel || 'Independent Recruiter'
        insertData.is_independent = true

        const { error: insErr } = await supabase.from('app_users').insert(insertData)
        if (insErr) {
          console.error('Insert error:', insErr)
          try { await supabase.rpc('delete_ghost_auth_user', { p_email: email.trim().toLowerCase() }) } catch(e) {}
          await supabase.auth.signOut()
          setError('Account setup failed: ' + insErr.message)
          setLoading(false); return
        }

        await supabase.auth.signOut()
        setSuccess('Your freelancer account is ready! Sign in to start.')

      } else if (chosenType === 'join') {
        insertData.role = selectedRole || 'recruiter'
        insertData.user_type = 'company_member'
        insertData.title = selectedRoleLabel || 'Recruiter'
        insertData.company_id = verifiedCompany.id
        insertData.company_name = verifiedCompany.name
        insertData.company_code = companyCode.trim().toUpperCase()
        insertData.status = 'pending'

        const { error: insErr } = await supabase.from('app_users').insert(insertData)
        if (insErr) {
          console.error('Insert error:', insErr)
          try { await supabase.rpc('delete_ghost_auth_user', { p_email: email.trim().toLowerCase() }) } catch(e) {}
          await supabase.auth.signOut()
          setError('Could not join company: ' + insErr.message)
          setLoading(false); return
        }

        await supabase.auth.signOut()
        setSuccess(`Request sent to join "${verifiedCompany.name}"!\n\nYour Account Owner will approve your access shortly.`)

      } else if (chosenType === 'jobseeker') {
        insertData.role = 'job_seeker'
        insertData.user_type = 'job_seeker'
        insertData.title = jobTitle || 'Job Seeker'

        const { error: insErr } = await supabase.from('app_users').insert(insertData)
        if (insErr) {
          console.error('Insert error:', insErr)
          try { await supabase.rpc('delete_ghost_auth_user', { p_email: email.trim().toLowerCase() }) } catch(e) {}
          await supabase.auth.signOut()
          setError('Account setup failed: ' + insErr.message)
          setLoading(false); return
        }

        // Auto-create profile
        await supabase.from('profiles').insert({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile || null,
          designation: jobTitle || null,
          source: 'Self Registered',
          status: 'New',
        }).catch(() => {})

        await supabase.auth.signOut()
        setSuccess('Your job seeker account is ready!\n\nSign in to browse jobs and apply.')
      }

    } catch (e: any) {
      console.error('Signup error:', e)
      try { await supabase.rpc('delete_ghost_auth_user', { p_email: email.trim().toLowerCase() }) } catch(ex) {}
      await supabase.auth.signOut()
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  // ── Styles ──
  const S = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontFamily: "'Outfit',sans-serif", color: 'var(--tx)', padding: 20 } as const,
    card: { background: 'var(--bg2)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', padding: '40px 36px', width: '100%', maxWidth: 440 } as const,
    wideCard: { background: 'var(--bg2)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', padding: '40px 36px', width: '100%', maxWidth: 540 } as const,
    label: { fontSize: 11, fontWeight: 700, color: 'var(--mu2)', textTransform: 'uppercase' as const, letterSpacing: '1.2px', marginBottom: 6, display: 'block' },
    input: { width: '100%', background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', color: 'var(--tx)', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 16 } as const,
    select: { width: '100%', background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', color: 'var(--tx)', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 16, cursor: 'pointer' } as const,
    btn: { width: '100%', padding: '14px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.2s' } as const,
    primary: { background: '#6c8cff', color: '#fff' },
    link: { color: '#6c8cff', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 },
    err: { background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16, lineHeight: 1.5 },
    ok: { background: 'rgba(61,214,140,0.1)', border: '1px solid rgba(61,214,140,0.3)', color: '#3dd68c', padding: '14px', borderRadius: 10, fontSize: 13, marginBottom: 16, lineHeight: 1.6, whiteSpace: 'pre-line' as const },
    typeCard: (sel: boolean, c: string) => ({
      background: sel ? `${c}15` : 'var(--bg2)',
      border: `2px solid ${sel ? c : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 16, padding: '20px', cursor: 'pointer',
      transition: 'all 0.2s', textAlign: 'center' as const,
    }),
  }

  if (checkingAuth) return <div style={S.page}><div style={{ color: 'var(--mu2)' }}>Loading...</div></div>

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input:focus,select:focus{border-color:rgba(108,140,255,0.5)!important}
        select option{background:var(--bg2)}
        .tc:hover{transform:translateY(-2px)}
        .ab:hover{opacity:0.9}
        .ab:active{transform:scale(0.98)}
        .bl:hover{text-decoration:underline}
      `}</style>

      {screen === 'login' && (
        <div style={S.card}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(108,140,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#6c8cff', fontSize: 22, marginBottom: 12 }}>R</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>RecruitBase Pro</div>
            <div style={{ fontSize: 13, color: 'var(--mu2)', marginTop: 4 }}>Sign in to your account</div>
          </div>
          {error && <div style={S.err}>{error}</div>}
          {success && <div style={S.ok}>{success}</div>}
          <label style={S.label}>Email Address</label>
          <input style={S.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <label style={S.label}>Password</label>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <input style={{ ...S.input, marginBottom: 0, paddingRight: 44 }} type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <span onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: 12, cursor: 'pointer', fontSize: 14, color: 'var(--mu2)' }}>{showPass ? '🙈' : '👁️'}</span>
          </div>
          <div style={{ textAlign: 'right', marginBottom: 20 }}><span style={{ fontSize: 12, color: '#6c8cff', cursor: 'pointer' }} onClick={() => { setForgotMode(true); setResetSent(false); setError(''); setResetEmail(email) }}>Forgot password?</span></div>

          {/* ── FORGOT PASSWORD MODAL ── */}
          {forgotMode && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
              <div style={{ width:'100%', maxWidth:400, background:'var(--bg2)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'32px 28px' }}>
                {resetSent ? (
                  <>
                    <div style={{ textAlign:'center', marginBottom:20 }}>
                      <div style={{ fontSize:48, marginBottom:12 }}>📧</div>
                      <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:700, color:'var(--tx)' }}>Check Your Email</h3>
                      <p style={{ margin:0, fontSize:13, color:'var(--mu)', lineHeight:1.6 }}>
                        We sent a password reset link to <strong style={{ color:'#6c8cff' }}>{resetEmail || email}</strong>.
                        <br/>Click the link in the email to set a new password.
                      </p>
                    </div>
                    <p style={{ fontSize:12, color:'var(--mu2)', textAlign:'center', marginBottom:20 }}>
                      Did not receive it? Check your spam folder or try again.
                    </p>
                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={() => { setResetSent(false) }} style={{ flex:1, background:'rgba(108,140,255,0.15)', color:'#6c8cff', border:'1px solid rgba(108,140,255,0.3)', borderRadius:10, padding:'11px 0', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Try Again</button>
                      <button onClick={() => { setForgotMode(false); setResetSent(false); setError('') }} style={{ flex:1, background:'rgba(255,255,255,0.06)', color:'var(--tx)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'11px 0', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Back to Login</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 style={{ margin:'0 0 6px', fontSize:18, fontWeight:700, color:'var(--tx)' }}>Reset Password</h3>
                    <p style={{ margin:'0 0 20px', fontSize:13, color:'var(--mu)' }}>Enter your email and we will send you a link to reset your password.</p>
                    {error && <div style={{ background:'rgba(255,107,107,0.1)', color:'#ff6b6b', border:'1px solid rgba(255,107,107,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{error}</div>}
                    <input
                      style={{ width:'100%', background:'var(--bg3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', fontSize:14, color:'var(--tx)', outline:'none', marginBottom:16, fontFamily:'inherit', boxSizing:'border-box' }}
                      type="email"
                      placeholder="Enter your email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                      autoFocus
                    />
                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={handleForgotPassword} disabled={resetLoading} style={{ flex:1, background:'#6c8cff', color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity: resetLoading ? 0.6 : 1 }}>{resetLoading ? 'Sending...' : 'Send Reset Link'}</button>
                      <button onClick={() => { setForgotMode(false); setError('') }} style={{ flex:1, background:'rgba(255,255,255,0.06)', color:'var(--tx)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <button className="ab" style={{ ...S.btn, ...S.primary, opacity: loading ? 0.7 : 1, marginBottom: 16 }} onClick={handleLogin} disabled={loading}>{loading ? 'Signing in...' : 'Sign In →'}</button>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--mu2)' }}>New here? <span className="bl" style={S.link} onClick={goToChoose}>Create free account</span></div>
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 10, color: 'var(--bg4)' }}>Privacy Policy · Terms of Service</div>
        </div>
      )}

      {screen === 'choose' && (
        <div style={S.wideCard}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>What describes you best?</div>
            <div style={{ fontSize: 13, color: 'var(--mu2)', marginTop: 6 }}>Choose your account type to get started</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            {ACCOUNT_TYPES.map(t => (
              <div key={t.id} className="tc" style={S.typeCard(chosenType === t.id, t.color)} onClick={() => selectType(t.id)}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{t.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'var(--mu)', lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}><span className="bl" style={{ ...S.link, fontSize: 13 }} onClick={goBackToLogin}>← Back to sign in</span></div>
        </div>
      )}

      {screen === 'signup' && (
        <div style={S.card}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{ACCOUNT_TYPES.find(t => t.id === chosenType)?.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{ACCOUNT_TYPES.find(t => t.id === chosenType)?.title}</div>
            <div style={{ fontSize: 12, color: 'var(--mu2)', marginTop: 4 }}>Step 2 of 2 — Fill your details</div>
          </div>
          {error && <div style={S.err}>{error}</div>}
          {success && (
            <div>
              <div style={S.ok}>{success}</div>
              <button className="ab" style={{ ...S.btn, ...S.primary, marginBottom: 12 }} onClick={goBackToLogin}>← Go to Sign In</button>
            </div>
          )}
          {!success && (
            <>
              <label style={S.label}>Full Name *</label>
              <input style={S.input} placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} />
              <label style={S.label}>Email Address *</label>
              <input style={S.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              <label style={S.label}>Password *</label>
              <input style={S.input} type="password" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
              <label style={S.label}>Mobile Number</label>
              <input style={S.input} type="tel" placeholder="+91 9876543210 (optional)" value={mobile} onChange={e => setMobile(e.target.value)} />
              {chosenType === 'owner' && (<><label style={S.label}>Company Name *</label><input style={S.input} placeholder="Your company or firm name" value={companyName} onChange={e => setCompanyName(e.target.value)} /></>)}
              {chosenType === 'join' && (<><label style={S.label}>Company Code *</label><input style={S.input} placeholder="e.g. LUCK4P1K" value={companyCode} onChange={e => setCompanyCode(e.target.value.toUpperCase())} maxLength={10} /><div style={{ fontSize: 11, color: 'var(--mu2)', marginTop: -10, marginBottom: 14 }}>Ask your Account Owner for this code</div></>)}
              {chosenType === 'jobseeker' && (<><label style={S.label}>Current / Desired Role</label><input style={S.input} placeholder="e.g. Software Developer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} /></>)}
              {chosenType !== 'jobseeker' && (<><label style={S.label}>Your Role</label><select style={S.select} value={selectedRole} onChange={e => { setSelectedRole(e.target.value); const type = ACCOUNT_TYPES.find(t => t.id === chosenType); const role = type?.roles.find(r => r.value === e.target.value); if (role) setSelectedRoleLabel(role.label) }}>{ACCOUNT_TYPES.find(t => t.id === chosenType)?.roles.map((r, i) => (<option key={i} value={r.value}>{r.label}</option>))}</select></>)}
              <button className="ab" style={{ ...S.btn, ...S.primary, opacity: loading ? 0.7 : 1, marginTop: 8, marginBottom: 16 }} onClick={handleSignup} disabled={loading}>
                {loading ? 'Creating account...' : chosenType === 'owner' ? '🏢 Create My Company →' : chosenType === 'join' ? '👥 Join Company →' : chosenType === 'jobseeker' ? '🎓 Create My Profile →' : '🧑‍💻 Start as Freelancer →'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="bl" style={{ ...S.link, fontSize: 12 }} onClick={() => { clearForm(); setScreen('choose') }}>← Change type</span>
                <span style={{ fontSize: 12, color: 'var(--mu2)' }}>Already have an account? <span className="bl" style={{ ...S.link, fontSize: 12 }} onClick={goBackToLogin}>Sign in</span></span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
