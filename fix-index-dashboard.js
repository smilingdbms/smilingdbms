// fix-index-dashboard.js
// index.tsx poora rewrite karo
// SA → /dashboard/master
// AO/Recruiter → /dashboard/add-profile (profiles table with company isolation)

const fs = require('fs');

const indexPath = 'pages/dashboard/index.tsx';
fs.copyFileSync(indexPath, indexPath + '.bak_old');

const newIndex = `// @ts-nocheck
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

      if (!au || au.status === 'pending') {
        await supabase.auth.signOut()
        router.replace('/?error=pending')
        return
      }

      // Super Admin → Master DB (God View)
      if (['super_admin', 'platform_admin', 'platform_manager'].includes(au.role)) {
        router.replace('/dashboard/master')
        return
      }

      // Everyone else → Candidate Database (profiles table)
      router.replace('/dashboard/add-profile')
    }

    redirect()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050810',
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
      <style>{\`@keyframes spin{to{transform:rotate(360deg)}}\`}</style>
      <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'Outfit, sans-serif' }}>
        Loading RecruitBase Pro...
      </div>
    </div>
  )
}
`;

fs.writeFileSync(indexPath, newIndex);
console.log('✅ index.tsx rewritten — now redirects correctly:');
console.log('   Super Admin → /dashboard/master');
console.log('   AO/Recruiter → /dashboard/add-profile');
console.log('\nRun: npm run build');
