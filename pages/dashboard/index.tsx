// @ts-nocheck
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

export default function DashboardIndex() {
  const router = useRouter()

  useEffect(() => {
    const redirect = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      const { data: au } = await supabase
        .from('app_users')
        .select('role, status')
        .eq('id', user.id)
        .single()

      if (!au) { router.replace('/'); return }

      if (au.status === 'pending') {
        await supabase.auth.signOut()
        router.replace('/?error=pending')
        return
      }

      // Super Admin / Platform Admin → Platform Overview (god-view)
      if (['super_admin', 'platform_admin'].includes(au.role)) {
        router.replace('/dashboard/overview')
        return
      }

      // Account Owner → premium AO workspace dashboard
      if (au.role === 'account_owner') {
        router.replace('/dashboard/ao')
        return
      }

      // Everyone else (recruiters, BD, etc.) → Master DB (data isolation via RLS)
      router.replace('/dashboard/master')
    }

    redirect()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      flexDirection: 'column',
      gap: 12
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #3B82F6',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 13, color: 'var(--mu)', fontFamily: 'Outfit, sans-serif' }}>
        Loading RecruitBase Pro...
      </div>
    </div>
  )
}
