// fix-bd-and-jobs.js
const fs = require('fs');

// ══════════════════════════════════════
// FIX 1: bd.tsx
// ══════════════════════════════════════
const bdPath = 'pages/dashboard/bd.tsx';
let bd = fs.readFileSync(bdPath, 'utf8');
fs.copyFileSync(bdPath, bdPath + '.bak');

// Fix 1a: Replace hardcoded currentUser state
const oldCurrentUser = `  const [currentUser, setCurrentUser] = useState({
    name: 'Pravin (AO)',
    company: 'Prime Consultancy',
    consultancy_id: 'PRIME001'
  });`;

const newCurrentUser = `  const [currentUser, setCurrentUser] = useState({
    name: '', company_id: null, role: '', id: null
  });`;

if (bd.includes(oldCurrentUser)) {
  bd = bd.replace(oldCurrentUser, newCurrentUser);
  console.log('✅ Fix 1a: currentUser state — hardcoded values removed');
} else {
  console.log('⚠️  currentUser pattern not exact — check bd.tsx line ~50');
}

// Fix 1b: Replace hardcoded teamMembers array
const oldTeam = `const teamMembers = ["Pravin", "Rahul Sharma", "Neha Singh", "Amit Kumar", "Priya Desai", "Vikas Tech"];`;
const newTeam = `// teamMembers loaded from Supabase dynamically (see loadData)`;

if (bd.includes(oldTeam)) {
  bd = bd.replace(oldTeam, newTeam);
  console.log('✅ Fix 1b: hardcoded teamMembers removed');
}

// Fix 1c: Replace useEffect + fetchMandates with loadData
const oldEffect = `  useEffect(() => { fetchMandates(); }, []);`;
const newEffect = `  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: au } = await supabase
        .from('app_users').select('*').eq('id', user.id).single();

      if (au) {
        setCurrentUser({
          name: au.full_name || au.email || 'Team Member',
          company_id: au.company_id,
          role: au.role,
          id: au.id
        });

        // Load real team members for @mentions
        const { data: team } = await supabase
          .from('app_users')
          .select('full_name, email')
          .eq('company_id', au.company_id)
          .eq('status', 'active');
        if (team) setTeamMembers(team.map(t => t.full_name || t.email || 'Team Member'));

        // Load BD leads — company isolated
        let q = supabase.from('bd_pipeline').select('*').order('created_at', { ascending: false });
        if (!['super_admin', 'platform_admin', 'platform_manager'].includes(au.role)) {
          q = q.eq('company_id', au.company_id);
        }
        const { data, error } = await q;
        if (!error && data) {
          setMandates(data.map(d => ({
            ...d,
            tags: parseSafeJSON(d.tags, []),
            feedbackList: parseSafeJSON(d.feedback, [])
          })));
        }
      }
    } catch(e) { console.error('loadData error:', e); }
    setLoading(false);
  }`;

if (bd.includes(oldEffect)) {
  bd = bd.replace(oldEffect, newEffect);
  console.log('✅ Fix 1c: useEffect replaced with loadData (company_id filter + real team members)');
} else {
  console.log('⚠️  useEffect pattern not found exactly');
}

// Fix 1d: Remove old fetchMandates function (now inside loadData)
const oldFetch = `  const fetchMandates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bd_pipeline').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const mapped = data.map(d => ({
        ...d,
        tags: parseSafeJSON(d.tags, []),
        feedbackList: parseSafeJSON(d.feedback, [])
      }));
      setMandates(mapped);
    }
    setLoading(false);
  };`;

if (bd.includes(oldFetch)) {
  // Replace with a simple refresh that calls loadData
  bd = bd.replace(oldFetch, `  const fetchMandates = async () => { loadData(); };`);
  console.log('✅ Fix 1d: fetchMandates now calls loadData');
}

// Fix 1e: Add company_id to handleSave insert payload
const oldPayload = `      consultancy_id: currentUser.consultancy_id,`;
const newPayload = `      company_id: currentUser.company_id,`;

if (bd.includes(oldPayload)) {
  bd = bd.replace(oldPayload, newPayload);
  console.log('✅ Fix 1e: handleSave — company_id added to payload');
}

// Fix 1f: Fix bd_owner in formData init — use real name
const oldBdOwner1 = `bd_owner: currentUser.name,
    commercial_type: 'Percentage (%)',
    value: '', agreement_file: '',
    feedbackList: [], newFeedbackText: '', currentTaggedMembers: []
      });
    }
    setIsModalOpen(true);`;
// This won't match exactly, let's do a simpler search
if (bd.includes(`bd_owner: currentUser.name`)) {
  // Replace all instances
  bd = bd.split(`bd_owner: currentUser.name`).join(`bd_owner: currentUser.name || 'Team Member'`);
  console.log('✅ Fix 1f: bd_owner uses real user name');
}

fs.writeFileSync(bdPath, bd);
console.log('\n✅ bd.tsx fixes complete');

// ══════════════════════════════════════
// FIX 2: jobs.tsx — loadData company filter (direct approach)
// ══════════════════════════════════════
const jobsPath = 'pages/dashboard/jobs.tsx';
let jobs = fs.readFileSync(jobsPath, 'utf8');
fs.copyFileSync(jobsPath, jobsPath + '.bak2');

// The partial match issue — find the actual select line
const oldSelect = `await supabase.from('job_descriptions').select('*').order('created_at', { ascending: false })      setJobs(js || [])`;

if (jobs.includes('job_descriptions')) {
  // Find the try block and replace it entirely
  const oldTry = `    try {
      // Company-isolated: Super Admin sees all, others see only their company
      let q = supabase.from('job_descriptions').select('*').order('created_at', { ascending: false })
      if (!['super_admin', 'platform_admin', 'platform_manager'].includes(au?.role)) {
        q = q.eq('company_id', au?.company_id)
      }
      const { data: js } = await q
      setJobs(js || [])
    } catch(e) { console.warn('Jobs table not ready yet') }`;

  if (jobs.includes(oldTry)) {
    console.log('✅ Fix 2: jobs.tsx loadData already has company filter from previous fix');
  } else {
    // Find and replace the raw select
    const oldRawSelect = `await supabase.from('job_descriptions').select('*').order('created_at', { ascending: false })      setJobs(js || [])`;
    const newRawSelect = `(() => {
        let q = supabase.from('job_descriptions').select('*').order('created_at', { ascending: false });
        if (!['super_admin', 'platform_admin', 'platform_manager'].includes(au?.role)) {
          q = q.eq('company_id', au?.company_id);
        }
        return q;
      })().then(({ data: js }) => setJobs(js || []))`;

    if (jobs.includes(oldRawSelect)) {
      jobs = jobs.replace(oldRawSelect, newRawSelect);
      console.log('✅ Fix 2: jobs.tsx — company_id filter added to select');
    } else {
      // Last resort: find the supabase.from line in jobs
      const lines = jobs.split('\n');
      let changed = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("from('job_descriptions')") && lines[i].includes("select('*')")) {
          console.log(`Found at line ${i+1}: ${lines[i].trim()}`);
          // Replace this line
          lines[i] = `      let _q = supabase.from('job_descriptions').select('*').order('created_at', { ascending: false }); if (!['super_admin','platform_admin','platform_manager'].includes(au?.role)) _q = _q.eq('company_id', au?.company_id); const { data: js } = await _q; // company isolated`;
          changed = true;
          break;
        }
      }
      if (changed) {
        jobs = lines.join('\n');
        console.log('✅ Fix 2: jobs.tsx — company filter added via line replacement');
      } else {
        console.log('⚠️  jobs.tsx select not found — check manually');
      }
    }
  }
}

fs.writeFileSync(jobsPath, jobs);
console.log('\n✅ All fixes applied!');
console.log('Run: npm run build');
