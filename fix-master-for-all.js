// fix-master-for-all.js
// Fix 1: master.tsx - Remove SA gate (allow all users with RLS isolation)
// Fix 2: master.tsx - Allow SA to add profiles (remove company_id block)
// Fix 3: index.tsx - All users go to /dashboard/master

const fs = require('fs');

// ══════════════════════════════════════
// FIX 1 & 2: master.tsx
// ══════════════════════════════════════
const masterPath = 'pages/dashboard/master.tsx';
let master = fs.readFileSync(masterPath, 'utf8');
fs.copyFileSync(masterPath, masterPath + '.bak_gate');

// Remove SUPER_ADMIN_GATE useEffect completely
const oldGate = `  // SUPER_ADMIN_GATE — only super_admin can access this page
  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single()
      if (!data || !['super_admin', 'platform_admin', 'platform_manager'].includes(data.role)) {
        router.push('/dashboard')
      }
    }
    checkSuperAdmin()
  }, [])`;

if (master.includes(oldGate)) {
  master = master.replace(oldGate, '  // All users can access - RLS handles data isolation');
  console.log('✅ Fix 1: SA gate removed — all users can access master');
} else {
  console.log('⚠️  SA gate pattern not found — check manually');
}

// Fix saveProfile — remove company_id block for SA
const oldCompanyCheck = `    if (!appUser?.company_id) {
      alert('ΓÜá∩╕Å You must be part of a Company before adding profiles.\\n\\nAsk your Account Owner for the Company Code and join from the signup page.')
      return
    }`;

if (master.includes(oldCompanyCheck)) {
  master = master.replace(oldCompanyCheck, '    // SA can add without company_id - RLS handles isolation');
  console.log('✅ Fix 2: company_id block removed for SA');
} else {
  // Try alternative pattern
  const oldCheck2 = `if (!appUser?.company_id) {
      alert('ΓÜá∩╕Å You must be part of a Company before adding profiles.`;
  if (master.includes("must be part of a Company")) {
    console.log('⚠️  company_id check found but pattern differs — searching...');
    // Find and replace the check
    master = master.replace(
      /if \(!appUser\?\.company_id\) \{[\s\S]*?return\s*\n\s*\}/,
      '// SA can add without company_id - RLS handles isolation'
    );
    console.log('✅ Fix 2: company_id block removed (regex)');
  }
}

fs.writeFileSync(masterPath, master);
console.log('✅ master.tsx updated');

// ══════════════════════════════════════
// FIX 3: index.tsx — ALL users → /dashboard/master
// ══════════════════════════════════════
const indexPath = 'pages/dashboard/index.tsx';
fs.copyFileSync(indexPath, indexPath + '.bak_redirect');

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

      if (!au) { router.replace('/'); return }

      if (au.status === 'pending') {
        await supabase.auth.signOut()
        router.replace('/?error=pending')
        return
      }

      // ALL users → Master DB (data isolation via RLS)
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
console.log('✅ Fix 3: index.tsx — ALL users now go to /dashboard/master');
console.log('\n✅ All fixes done! Run: npm run build');
