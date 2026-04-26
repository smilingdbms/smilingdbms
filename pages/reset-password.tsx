import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../src/lib/supabase'

// ══════════════════════════════════════════════════════════
// RESET PASSWORD PAGE v1.1 — FIXED TOKEN DETECTION
// Handles Supabase recovery link hash properly
// ══════════════════════════════════════════════════════════

export default function ResetPassword() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let handled = false

    async function handleRecovery() {
      // Method 1: Check URL hash for recovery params
      if (typeof window !== 'undefined') {
        const hash = window.location.hash
        if (hash) {
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const type = params.get('type')

          if (accessToken && type === 'recovery') {
            // Set the session using the tokens from the hash
            const { error: sessionErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })

            if (!sessionErr) {
              handled = true
              setReady(true)
              setChecking(false)
              return
            }
          }
        }

        // Method 2: Check query params (some Supabase versions use query instead of hash)
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code)
          if (!exchangeErr) {
            handled = true
            setReady(true)
            setChecking(false)
            return
          }
        }
      }

      // Method 3: Listen for PASSWORD_RECOVERY auth event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          handled = true
          setReady(true)
          setChecking(false)
        }
      })

      // Method 4: Check if already have a valid session
      const { data: { session } } = await supabase.auth.getSession()
      if (session && !handled) {
        setReady(true)
        setChecking(false)
        return
      }

      // Give Supabase auth event listener 3 seconds to fire
      setTimeout(() => {
        if (!handled) {
          setChecking(false)
        }
      }, 3000)

      return () => subscription.unsubscribe()
    }

    handleRecovery()
  }, [])

  async function handleReset() {
    setError('')

    if (!newPassword) {
      setError('Please enter a new password.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateErr) {
      const msg = updateErr.message.toLowerCase()
      if (msg.includes('same') || msg.includes('different')) {
        setError('New password cannot be the same as your old password. Please choose a different one.')
      } else if (msg.includes('weak') || msg.includes('short')) {
        setError('Password is too weak. Use at least 6 characters with a mix of letters and numbers.')
      } else if (msg.includes('session') || msg.includes('token') || msg.includes('expired')) {
        setError('Your reset link has expired. Please go back to login and request a new one.')
      } else {
        setError('Could not update your password: ' + updateErr.message)
      }
    } else {
      setSuccess(true)
      await supabase.auth.signOut()
      setTimeout(() => router.push('/'), 3000)
    }

    setLoading(false)
  }

  const S: Record<string, any> = {
    page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg,#111318)', fontFamily:'Outfit,sans-serif', padding:20 },
    card: { width:'100%', maxWidth:420, background:'var(--bg2,#1a1d24)', border:'1px solid var(--bd,rgba(255,255,255,0.07))', borderRadius:16, padding:'36px 32px', textAlign:'center' as const },
    logo: { width:48, height:48, background:'rgba(108,140,255,0.15)', border:'1px solid #6c8cff', borderRadius:12, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#6c8cff', marginBottom:16 },
    title: { fontSize:22, fontWeight:800, color:'var(--tx,#e8eaf0)', margin:'0 0 6px' },
    subtitle: { fontSize:13, color:'var(--mu,#7a7f90)', margin:'0 0 28px' },
    input: { width:'100%', background:'var(--bg3,#22262f)', border:'1px solid var(--bd,rgba(255,255,255,0.08))', borderRadius:10, padding:'12px 14px', fontSize:14, color:'var(--tx,#e8eaf0)', outline:'none', marginBottom:14, fontFamily:'inherit', boxSizing:'border-box' as const },
    btn: { width:'100%', background:'#6c8cff', color:'#fff', border:'none', borderRadius:10, padding:'13px 0', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginTop:8 },
    error: { background:'rgba(255,107,107,0.1)', color:'#ff6b6b', border:'1px solid rgba(255,107,107,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16, textAlign:'left' as const },
    success: { background:'rgba(61,214,140,0.1)', color:'#3dd68c', border:'1px solid rgba(61,214,140,0.2)', borderRadius:8, padding:'16px', fontSize:14, fontWeight:600 },
    passToggle: { position:'absolute' as const, right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--mu,#7a7f90)', cursor:'pointer', fontSize:16 },
  }

  // Still checking token
  if (checking) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.logo}>R</div>
          <h1 style={S.title}>RecruitBase Pro</h1>
          <p style={S.subtitle}>Verifying your reset link...</p>
        </div>
      </div>
    )
  }

  // Token invalid or expired
  if (!ready && !checking) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.logo}>R</div>
          <h1 style={S.title}>Link Expired</h1>
          <p style={{ ...S.subtitle, marginBottom:16 }}>
            This password reset link has expired or is invalid.
          </p>
          <p style={{ fontSize:13, color:'var(--mu,#7a7f90)', marginBottom:24 }}>
            Please go back to login and click "Forgot Password" to request a new link.
          </p>
          <button
            style={S.btn}
            onClick={() => router.push('/')}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Success
  if (success) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.logo}>R</div>
          <h1 style={S.title}>Password Updated!</h1>
          <div style={S.success}>
            Your password has been changed successfully. Redirecting to login...
          </div>
        </div>
      </div>
    )
  }

  // Ready — show password form
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>R</div>
        <h1 style={S.title}>Set New Password</h1>
        <p style={S.subtitle}>Enter your new password below</p>

        {error && <div style={S.error}>{error}</div>}

        <div style={{ position:'relative' }}>
          <input
            style={S.input}
            type={showPass ? 'text' : 'password'}
            placeholder="New password (min 6 characters)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <button style={S.passToggle} onClick={() => setShowPass(!showPass)} type="button">
            {showPass ? '🙈' : '👁'}
          </button>
        </div>

        <input
          style={S.input}
          type={showPass ? 'text' : 'password'}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReset()}
        />

        <button
          style={{ ...S.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>

        <p style={{ marginTop:20, fontSize:12, color:'var(--mu,#7a7f90)' }}>
          <span style={{ color:'#6c8cff', cursor:'pointer' }} onClick={() => router.push('/')}>
            Back to Login
          </span>
        </p>
      </div>
    </div>
  )
}
