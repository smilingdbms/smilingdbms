// fix-team-and-admin-tabs.js
// Fix 1: TeamManager.tsx - query app_users (not profiles), add company_id filter
// Fix 2: admin.tsx - hide Consultancies, Audit Logs, Job Seeker tabs from AO

const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════
// FIX 1: TeamManager.tsx
// Was querying profiles table (WRONG)
// Should query app_users with company_id filter
// ══════════════════════════════════════════
const teamPath = path.join(__dirname, 'src', 'components', 'TeamManager.tsx');
fs.copyFileSync(teamPath, teamPath + '.bak');

const newTeamManager = `// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TeamManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { fetchTeam(); }, []);

  async function fetchTeam() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get current user's role and company_id
    const { data: au } = await supabase
      .from('app_users')
      .select('role, company_id, full_name')
      .eq('id', user.id)
      .single();

    setCurrentUser(au);

    // Super Admin sees all users, AO sees only their company
    let query = supabase
      .from('app_users')
      .select('id, full_name, email, role, status, created_at, company_id')
      .order('created_at', { ascending: false });

    if (!['super_admin', 'platform_admin', 'platform_manager'].includes(au?.role)) {
      query = query.eq('company_id', au?.company_id);
    }

    const { data, error } = await query;
    if (!error && data) setMembers(data);
    setLoading(false);
  }

  const getRoleBadge = (role) => {
    const styles = {
      'super_admin':    { bg: 'rgba(239,68,68,0.15)',   color: '#EF4444', label: 'Super Admin' },
      'account_owner':  { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B', label: 'Account Owner' },
      'team_manager':   { bg: 'rgba(99,102,241,0.15)',  color: '#818CF8', label: 'Team Manager' },
      'recruiter':      { bg: 'rgba(16,185,129,0.15)',  color: '#10B981', label: 'Recruiter' },
      'bd':             { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA', label: 'BD Executive' },
      'job_seeker':     { bg: 'rgba(107,114,128,0.15)', color: '#9CA3AF', label: 'Job Seeker' },
    };
    const style = styles[role] || { bg: 'rgba(107,114,128,0.15)', color: '#9CA3AF', label: role || 'User' };
    return (
      <span style={{ background: style.bg, color: style.color, padding: '4px 10px',
        borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: \`1px solid \${style.color}40\` }}>
        {style.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = {
      'active':   { color: '#10B981', label: '● Active' },
      'pending':  { color: '#F59E0B', label: '● Pending' },
      'disabled': { color: '#EF4444', label: '● Disabled' },
      'rejected': { color: '#6B7280', label: '● Rejected' },
    };
    const st = s[status] || s['active'];
    return <span style={{ color: st.color, fontSize: '12px' }}>{st.label}</span>;
  };

  if (loading) return <div style={{ color: '#6B7280', padding: '20px' }}>Loading team...</div>;

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>
          {currentUser?.role === 'super_admin' ? 'All Platform Users' : 'My Team'}
        </h2>
        <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '13px' }}>
          {members.length} member{members.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div style={{ background: '#11182D', borderRadius: '12px', border: '1px solid #1F2937', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#1F2937' }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Member</th>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Joined</th>
              <th style={{ padding: '15px', textAlign: 'right', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                No team members yet. Invite someone to get started.
              </td></tr>
            ) : (
              members.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #1F2937' }}>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#374151',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '14px', color: '#fff', flexShrink: 0 }}>
                        {(m.full_name || m.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                          {m.full_name || 'No name set'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}>{getRoleBadge(m.role)}</td>
                  <td style={{ padding: '15px' }}>{getStatusBadge(m.status)}</td>
                  <td style={{ padding: '15px', fontSize: '12px', color: '#6B7280' }}>
                    {new Date(m.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#9CA3AF',
                      cursor: 'pointer', fontSize: '16px', marginRight: '10px' }} title="Settings">⚙️</button>
                    <button style={{ background: 'transparent', border: 'none', color: '#EF4444',
                      cursor: 'pointer', fontSize: '16px' }} title="Remove">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(teamPath, newTeamManager);
console.log('✅ Fix 1: TeamManager.tsx — now queries app_users with company_id filter');

// ══════════════════════════════════════════
// FIX 2: admin.tsx - hide tabs from AO
// AO should only see: My Team + Pending Approvals
// ══════════════════════════════════════════
const adminPath = path.join(__dirname, 'pages', 'dashboard', 'admin.tsx');
let admin = fs.readFileSync(adminPath, 'utf8');
fs.copyFileSync(adminPath, adminPath + '.bak2');

// Hide Consultancies, Audit Logs, Job Seeker tabs from AO
const oldTabs = `          {/* Role Permissions — Super Admin ONLY */}
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
          <div className={\`rbac-menu-item \${activeSubMenu === 'pending' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('pending'); window.location.hash = 'pending'; }}>⏳ Pending Approvals <span>→</span></div>`;

const newTabs = `          {/* Super Admin ONLY tabs */}
          {isSuperAdmin && (
            <>
              <div className={\`rbac-menu-item \${activeSubMenu === 'role_wise' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('role_wise'); window.location.hash = 'role_wise'; }}>🔐 Role Wise Permissions <span>→</span></div>
              <div className={\`rbac-menu-item \${activeSubMenu === 'job_seeker' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('job_seeker'); window.location.hash = 'job_seeker'; }}>🎯 Job Seeker Access <span>→</span></div>
              <div className={\`rbac-menu-item \${activeSubMenu === 'audit_logs' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('audit_logs'); window.location.hash = 'audit_logs'; }}>🔍 Security Audit Logs <span>→</span></div>
              <div className={\`rbac-menu-item \${activeSubMenu === 'tenants' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('tenants'); window.location.hash = 'tenants'; }}>🏢 Consultancies <span>→</span></div>
            </>
          )}
          {/* Account Owner tabs */}
          <div className={\`rbac-menu-item \${activeSubMenu === 'team' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('team'); window.location.hash = 'team'; }}>👥 {isSuperAdmin ? 'All Users' : 'My Team'} <span>→</span></div>
          <div className={\`rbac-menu-item \${activeSubMenu === 'pending' ? 'active' : ''}\`} onClick={() => { setActiveSubMenu('pending'); window.location.hash = 'pending'; }}>⏳ Pending Approvals <span>→</span></div>`;

if (admin.includes(oldTabs)) {
  admin = admin.replace(oldTabs, newTabs);
  console.log('✅ Fix 2: admin.tsx tabs — AO sees only My Team + Pending Approvals');
} else {
  console.log('⚠️  admin.tsx tab pattern not found exactly — check manually');
}

fs.writeFileSync(adminPath, admin);
console.log('\n✅ All fixes applied! Run: npm run build');
