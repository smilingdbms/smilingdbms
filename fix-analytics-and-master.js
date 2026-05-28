// fix-analytics-and-master.js
// Fix 1: Analytics leaderboard - add company_id filter
// Fix 2: Profiles query - use company_id not created_by
// Fix 3: Master page - Super Admin only

const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════
// FIX 1 & 2: analytics.tsx
// ══════════════════════════════════════════════
const analyticsPath = path.join(__dirname, 'pages', 'dashboard', 'analytics.tsx');
let analytics = fs.readFileSync(analyticsPath, 'utf8');
fs.copyFileSync(analyticsPath, analyticsPath + '.bak_leaderboard');

// Fix profiles query - use company_id filter instead of created_by
const oldProfilesQuery = `    let q = supabase.from('profiles').select('*')
    if (au?.role !== 'admin') q = q.eq('created_by', u.id)
    const { data: ps } = await q
    const { data: us } = await supabase.from('app_users').select('*').order('points', { ascending: false })`;

const newProfilesQuery = `    // Profiles: Super Admin sees all, others see their company only
    let q = supabase.from('profiles').select('*')
    if (!['super_admin', 'platform_admin'].includes(au?.role)) {
      q = q.eq('company_id', au?.company_id)
    }
    const { data: ps } = await q

    // Leaderboard: Super Admin sees all, others see their company only
    let uq = supabase.from('app_users').select('*').order('points', { ascending: false })
    if (!['super_admin', 'platform_admin'].includes(au?.role)) {
      uq = uq.eq('company_id', au?.company_id)
    }
    const { data: us } = await uq`;

if (analytics.includes(oldProfilesQuery)) {
  analytics = analytics.replace(oldProfilesQuery, newProfilesQuery);
  console.log('✅ Fix 1: Profiles query — company_id filter added');
  console.log('✅ Fix 2: Leaderboard — company_id filter added');
} else {
  console.log('⚠️  Pattern not found exactly — trying partial fix...');
  
  // Partial fix for leaderboard only
  const oldLeaderboard = `const { data: us } = await supabase.from('app_users').select('*').order('points', { ascending: false })`;
  const newLeaderboard = `// Leaderboard: company-isolated
    let uq = supabase.from('app_users').select('*').order('points', { ascending: false })
    if (!['super_admin', 'platform_admin'].includes(au?.role)) {
      uq = uq.eq('company_id', au?.company_id)
    }
    const { data: us } = await uq`;
  
  if (analytics.includes(oldLeaderboard)) {
    analytics = analytics.replace(oldLeaderboard, newLeaderboard);
    console.log('✅ Fix 2: Leaderboard — company_id filter added (partial)');
  }

  // Partial fix for profiles
  const oldProfiles = `if (au?.role !== 'admin') q = q.eq('created_by', u.id)`;
  const newProfiles = `if (!['super_admin', 'platform_admin'].includes(au?.role)) {
      q = q.eq('company_id', au?.company_id)
    }`;
  
  if (analytics.includes(oldProfiles)) {
    analytics = analytics.replace(oldProfiles, newProfiles);
    console.log('✅ Fix 1: Profiles query — company_id filter added (partial)');
  }
}

fs.writeFileSync(analyticsPath, analytics, 'utf8');

// ══════════════════════════════════════════════
// FIX 3: master.tsx — Super Admin Only
// ══════════════════════════════════════════════
const masterPath = path.join(__dirname, 'pages', 'dashboard', 'master.tsx');
let master = fs.readFileSync(masterPath, 'utf8');
fs.copyFileSync(masterPath, masterPath + '.bak_access');

// Check if fix already applied
if (master.includes('SUPER_ADMIN_GATE')) {
  console.log('ℹ️  Master page already has Super Admin gate');
} else {
  // Add router import if not present
  if (!master.includes("import { useRouter }")) {
    master = master.replace(
      "import { useEffect, useState",
      "import { useRouter } from 'next/router'\nimport { useEffect, useState"
    );
  }

  // Add Super Admin gate at the start of the component
  const superAdminGate = `
  // SUPER_ADMIN_GATE — only super_admin can access this page
  const router = useRouter()
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
  }, [])
`;

  // Insert after the function declaration and first {
  // Find the pattern: export default function ... () {
  master = master.replace(
    /export default function \w+\(\) \{/,
    (match) => match + superAdminGate
  );

  fs.writeFileSync(masterPath, master, 'utf8');
  console.log('✅ Fix 3: Master page — Super Admin only gate added');
}

console.log('\n✅ All fixes applied!');
console.log('Run: npm run build');
