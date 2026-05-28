// fix-jobs-company-filter.js
// Fix 1: jobs.tsx - add company_id filter in loadData
// Fix 2: jobs.tsx - add company_id + is_public:false on insert

const fs = require('fs');

const jobsPath = 'pages/dashboard/jobs.tsx';
let content = fs.readFileSync(jobsPath, 'utf8');
fs.copyFileSync(jobsPath, jobsPath + '.bak');

// Fix 1: loadData query - add company_id filter
const oldLoad = `    try {
      const { data: js } = await supabase.from('job_descriptions').select('*').order('created_at', { ascending: false })      setJobs(js || [])
    } catch(e) { console.warn('Jobs table not ready yet') }`;

const newLoad = `    try {
      // Company-isolated: Super Admin sees all, others see only their company
      let q = supabase.from('job_descriptions').select('*').order('created_at', { ascending: false })
      if (!['super_admin', 'platform_admin', 'platform_manager'].includes(au?.role)) {
        q = q.eq('company_id', au?.company_id)
      }
      const { data: js } = await q
      setJobs(js || [])
    } catch(e) { console.warn('Jobs table not ready yet') }`;

if (content.includes(oldLoad)) {
  content = content.replace(oldLoad, newLoad);
  console.log('✅ Fix 1: Jobs loadData — company_id filter added');
} else {
  // Try partial match
  const oldLoad2 = `await supabase.from('job_descriptions').select('*').order('created_at', { ascending: false })      setJobs(js || [])`;
  const newLoad2 = `(() => {
        let q = supabase.from('job_descriptions').select('*').order('created_at', { ascending: false })
        if (!['super_admin', 'platform_admin', 'platform_manager'].includes(au?.role)) {
          q = q.eq('company_id', au?.company_id)
        }
        return q
      })().then(({ data: js }) => setJobs(js || []))`;
  if (content.includes('job_descriptions')) {
    console.log('⚠️  Partial match — check manually');
  }
}

// Fix 2: insert - add company_id and is_public:false
const oldInsert = `supabase.from('job_descriptions').insert({ ...form, created_by: appUser?.id }).select().single()`;
const newInsert = `supabase.from('job_descriptions').insert({ 
            ...form, 
            created_by: appUser?.id,
            company_id: appUser?.company_id,
            is_public: false
          }).select().single()`;

if (content.includes(oldInsert)) {
  content = content.replace(oldInsert, newInsert);
  console.log('✅ Fix 2: Jobs insert — company_id + is_public:false added');
} else {
  console.log('⚠️  Insert pattern not found exactly');
}

fs.writeFileSync(jobsPath, content);
console.log('\nRun: npm run build');
