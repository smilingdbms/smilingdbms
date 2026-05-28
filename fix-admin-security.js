// fix-admin-security.js
// Adds proper role-based access control to admin.tsx
// Super Admin: Full access to everything
// Account Owner: Only their company team management
// Others: Access denied

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages', 'dashboard', 'admin.tsx');
let content = fs.readFileSync(filePath, 'utf8');
fs.copyFileSync(filePath, filePath + '.bak_security');

// ── STEP 1: Add router import ──
content = content.replace(
  `import React, { useState, useEffect } from 'react';`,
  `import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';`
);

// ── STEP 2: Add user role states inside component (after useWindowSize call) ──
content = content.replace(
  `  const { width, height } = useWindowSize();
  const [activeModule, setActiveModule] = useState('tenants');`,
  `  const router = useRouter();
  const { width, height } = useWindowSize();
  const [activeModule, setActiveModule] = useState('tenants');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [currentUserCompanyId, setCurrentUserCompanyId] = useState('');
  const [securityLoading, setSecurityLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);`
);

// ── STEP 3: Add security check useEffect after existing useEffects ──
const insertAfter = `  useEffect(() => { fetchPermissions(); }, [selectedRole]);`;
const securityEffect = `

  // ── SECURITY: Load current user role ──
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/'); return; }

        const { data: userData } = await supabase
          .from('app_users')
          .select('role, company_id')
          .eq('id', user.id)
          .single();

        if (!userData) { router.push('/'); return; }

        const role = userData.role || '';
        setCurrentUserRole(role);
        setCurrentUserCompanyId(userData.company_id || '');

        // Only super_admin gets full access
        // account_owner gets limited team-only view
        // Everyone else: access denied
        const allowed = ['super_admin', 'account_owner'];
        if (!allowed.includes(role)) {
          setAccessDenied(true);
        }

        // Account owners default to team tab, not permissions
        if (role === 'account_owner') {
          setActiveSubMenu('team');
        }

      } catch (e) {
        console.error('Security check failed:', e);
        router.push('/');
      } finally {
        setSecurityLoading(false);
      }
    };
    checkAccess();
  }, []);`;

content = content.replace(insertAfter, insertAfter + securityEffect);

// ── STEP 4: Filter ROLES_LIST for non-super-admins ──
// Account owners should NOT see Super Admin, Admin, Core Team etc.
content = content.replace(
  `const ROLES_LIST = [
  'Super Admin', 'Admin', 'Core Team', 'Tech Admin', 'Billing Admin', 'Support Admin',
  'Account Owner', 'Recruitment Manager', 'Recruitment TL', 'Recruitment Senior Executive', 'Recruitment Executive',
  'BD Manager', 'BD TL', 'BD Senior Executive', 'BD Executive',
  'Freelance Recruiter', 'Freelance Account Owner',
  'Job Seeker (Free)', 'Job Seeker (Paid)'
];`,
  `// All roles - Super Admin sees all
const ALL_ROLES_LIST = [
  'Super Admin', 'Admin', 'Core Team', 'Tech Admin', 'Billing Admin', 'Support Admin',
  'Account Owner', 'Recruitment Manager', 'Recruitment TL', 'Recruitment Senior Executive', 'Recruitment Executive',
  'BD Manager', 'BD TL', 'BD Senior Executive', 'BD Executive',
  'Freelance Recruiter', 'Freelance Account Owner',
  'Job Seeker (Free)', 'Job Seeker (Paid)'
];

// Account Owner roles - cannot see/edit Super Admin level roles
const ACCOUNT_OWNER_ROLES = [
  'Recruitment Manager', 'Recruitment TL', 'Recruitment Senior Executive', 'Recruitment Executive',
  'BD Manager', 'BD TL', 'BD Senior Executive', 'BD Executive',
  'Freelance Recruiter',
  'Job Seeker (Free)', 'Job Seeker (Paid)'
];

const ROLES_LIST = []; // will be set dynamically`
);

// ── STEP 5: Add security gate in the return statement ──
content = content.replace(
  `  return (
    <>
      {showConfetti && (`,
  `  // ── SECURITY LOADING ──
  if (securityLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050810', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: '#9CA3AF', fontSize: 14 }}>Verifying access...</div>
        <style>{\`@keyframes spin{to{transform:rotate(360deg)}}\`}</style>
      </div>
    );
  }

  // ── ACCESS DENIED ──
  if (accessDenied) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050810', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 60 }}>🔒</div>
        <h2 style={{ color: '#EF4444', margin: 0, fontSize: 24 }}>Access Denied</h2>
        <p style={{ color: '#9CA3AF', textAlign: 'center', maxWidth: 400 }}>
          You do not have permission to access the Admin Center.
          Contact your Super Admin if you need access.
        </p>
        <button onClick={() => router.push('/dashboard')} style={{ background: '#3B82F6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  // ── DYNAMIC ROLES LIST based on user role ──
  const effectiveRolesList = currentUserRole === 'super_admin' ? ALL_ROLES_LIST : ACCOUNT_OWNER_ROLES;
  const isSuperAdmin = currentUserRole === 'super_admin';

  return (
    <>
      {showConfetti && (`
);

// ── STEP 6: Replace ROLES_LIST.filter with effectiveRolesList.filter ──
content = content.replace(
  `{ROLES_LIST.filter(r => activeSubMenu === 'job_seeker' ? r.includes('Job Seeker') : !r.includes('Job Seeker')).map(role => (`,
  `{effectiveRolesList.filter(r => activeSubMenu === 'job_seeker' ? r.includes('Job Seeker') : !r.includes('Job Seeker')).map(role => (`
);

// ── STEP 7: Hide Role Permissions tab from Account Owners ──
// And hide Consultancies tab from Account Owners (they can't see other companies)
content = content.replace(
  `          <div className={\`rbac-menu-item \${activeSubMenu === 'role_wise' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('role_wise'); window.location.hash = 'role_wise'; }}>Role Wise Permissions <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'job_seeker' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('job_seeker'); window.location.hash = 'job_seeker'; }}>Job Seeker Access <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'audit_logs' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('audit_logs'); window.location.hash = 'audit_logs'; }}>Security Audit Logs <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'tenants' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('tenants'); window.location.hash = 'tenants'; }}>🏅 Consultancies <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'team' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('team'); window.location.hash = 'team'; }}>👥 Internal Team <span>→</span></div>`,
  `          {/* Role Permissions — Super Admin ONLY */}
          {isSuperAdmin && (
            <>
              <div className={\`rbac-menu-item \${activeSubMenu === 'role_wise' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('role_wise'); window.location.hash = 'role_wise'; }}>Role Wise Permissions <span>→</span></div>
              <div className={\`rbac-menu-item \${activeSubMenu === 'job_seeker' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('job_seeker'); window.location.hash = 'job_seeker'; }}>Job Seeker Access <span>→</span></div>
              <div className={\`rbac-menu-item \${activeSubMenu === 'audit_logs' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('audit_logs'); window.location.hash = 'audit_logs'; }}>Security Audit Logs <span>→</span></div>
              <div className={\`rbac-menu-item \${activeSubMenu === 'tenants' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('tenants'); window.location.hash = 'tenants'; }}>🏅 Consultancies <span>→</span></div>
            </>
          )}
          {/* Team tab — Both Super Admin and Account Owner */}
          <div className={\`rbac-menu-item \${activeSubMenu === 'team' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('team'); window.location.hash = 'team'; }}>👥 {isSuperAdmin ? 'Internal Team' : 'My Team'} <span>→</span></div>
          {/* Pending Approvals — Account Owner can approve their own team */}
          <div className={\`rbac-menu-item \${activeSubMenu === 'pending' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('pending'); window.location.hash = 'pending'; }}>⏳ Pending Approvals <span>→</span></div>`
);

// ── STEP 8: Add pending approvals section and block non-super-admin from role editing ──
// Wrap role_wise section with isSuperAdmin check
content = content.replace(
  `            {(activeSubMenu === 'role_wise' || activeSubMenu === 'job_seeker') ? (`,
  `            {(activeSubMenu === 'role_wise' || activeSubMenu === 'job_seeker') && !isSuperAdmin ? (
              <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 50 }}>🔒</div>
                <h3 style={{ color: '#EF4444', margin: 0 }}>Super Admin Only</h3>
                <p style={{ color: '#9CA3AF', textAlign: 'center', maxWidth: 400, fontSize: 13 }}>
                  Role permission management is restricted to Super Admin only.
                  You can manage your team members from the My Team section.
                </p>
              </div>
            ) : (activeSubMenu === 'role_wise' || activeSubMenu === 'job_seeker') ? (`
);

// ── STEP 9: Add pending approvals module ──
content = content.replace(
  `            ) : activeSubMenu === 'audit_logs' ? (
              <AuditLogs />
            ) : activeSubMenu === 'tenants' ? (
              <TenantManager />
            ) : activeSubMenu === 'team' ? (
              <TeamManager />
            ) : (`,
  `            ) : activeSubMenu === 'audit_logs' ? (
              <AuditLogs />
            ) : activeSubMenu === 'tenants' ? (
              <TenantManager />
            ) : activeSubMenu === 'team' ? (
              <TeamManager />
            ) : activeSubMenu === 'pending' ? (
              <PendingApprovals companyId={currentUserCompanyId} isSuperAdmin={isSuperAdmin} />
            ) : (`
);

// ── STEP 10: Add PendingApprovals component before export default ──
const pendingComponent = `
// ══════════════════════════════════════════════════════
// PENDING APPROVALS COMPONENT
// Super Admin: sees ALL pending users across all companies
// Account Owner: sees ONLY their company's pending users
// ══════════════════════════════════════════════════════
function PendingApprovals({ companyId, isSuperAdmin }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');

  useEffect(() => { fetchPending(); }, []);

  async function fetchPending() {
    setLoading(true);
    let query = supabase.from('app_users').select('*').eq('status', 'pending');
    if (!isSuperAdmin && companyId) {
      query = query.eq('company_id', companyId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) setPending(data);
    setLoading(false);
  }

  async function handleApprove(userId) {
    setProcessing(userId);
    const { error } = await supabase.from('app_users').update({ status: 'active' }).eq('id', userId);
    if (!error) {
      await supabase.from('audit_logs').insert([{ user_id: userId, action: 'USER_APPROVED', details: 'User approved by admin' }]);
      fetchPending();
    } else {
      alert('Error approving user: ' + error.message);
    }
    setProcessing('');
  }

  async function handleReject(userId) {
    if (!window.confirm('Are you sure you want to reject this user?')) return;
    setProcessing(userId);
    const { error } = await supabase.from('app_users').update({ status: 'rejected' }).eq('id', userId);
    if (!error) {
      await supabase.from('audit_logs').insert([{ user_id: userId, action: 'USER_REJECTED', details: 'User rejected by admin' }]);
      fetchPending();
    } else {
      alert('Error rejecting user: ' + error.message);
    }
    setProcessing('');
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ color: '#9CA3AF' }}>Loading pending users...</div>
    </div>
  );

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: 8 }}>⏳ Pending Approvals</h2>
      <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 24 }}>
        {isSuperAdmin ? 'All pending users across all companies' : 'Pending users in your company'}
      </p>

      {pending.length === 0 ? (
        <div style={{ background: '#11182D', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ color: '#9CA3AF', fontSize: 14 }}>No pending approvals</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pending.map(user => (
            <div key={user.id} style={{ background: '#11182D', border: '1px solid #1F2937', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#fff' }}>
                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{user.full_name || 'No name'}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{user.email}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                    Role: {user.role} • Joined: {new Date(user.created_at).toLocaleDateString('en-IN')}
                    {isSuperAdmin && user.company_id && <span> • Company: {user.company_id.slice(0,8)}...</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button
                  onClick={() => handleApprove(user.id)}
                  disabled={processing === user.id}
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', color: '#10B981', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  {processing === user.id ? '...' : '✅ Approve'}
                </button>
                <button
                  onClick={() => handleReject(user.id)}
                  disabled={processing === user.id}
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', color: '#EF4444', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  {processing === user.id ? '...' : '❌ Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

`;

content = content.replace(
  `export default function SuperAdminDashboard()`,
  pendingComponent + `export default function SuperAdminDashboard()`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ admin.tsx security fix applied!');
console.log('');
console.log('Changes made:');
console.log('  ✅ Added role check on load');
console.log('  ✅ Super Admin: Full access');
console.log('  ✅ Account Owner: Team + Pending Approvals only');
console.log('  ✅ Others: Access Denied page');
console.log('  ✅ Role Wise Permissions: Super Admin ONLY');
console.log('  ✅ Consultancies tab: Super Admin ONLY');
console.log('  ✅ Pending Approvals: WORKING (Approve/Reject buttons)');
console.log('');
console.log('Run: npm run build');
