/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  typescript: { ignoreBuildErrors: true },

  // ═══════════════════════════════════════════════════════
  // URL REWRITES — Pravin's Convention
  // Formula: /dashboard/[menu]/[submenu]/[childmenu]
  // Files don't move — URLs look correct in browser
  // ═══════════════════════════════════════════════════════
  async rewrites() {
    return [

      // ── MASTER DB (Super Admin Only) ──
      { source: '/dashboard/master/job_seekers', destination: '/dashboard/master' },
      { source: '/dashboard/master/companies',   destination: '/dashboard/master' },
      { source: '/dashboard/master/analytics',   destination: '/dashboard/master' },

      // ── CANDIDATES ──
      { source: '/dashboard/candidates/all',            destination: '/dashboard/add-profile' },
      { source: '/dashboard/candidates/add',            destination: '/dashboard/new-candidate' },
      { source: '/dashboard/candidates/bulk_import',    destination: '/dashboard/import' },
      { source: '/dashboard/candidates/import',         destination: '/dashboard/import' },
      // Dynamic: /dashboard/candidates/profile/[id]  → will be new file

      // ── JOBS ──
      { source: '/dashboard/jobs/all_jobs',             destination: '/dashboard/jobs' },
      { source: '/dashboard/jobs/active_jobs',          destination: '/dashboard/jobs' },
      { source: '/dashboard/jobs/draft_jobs',           destination: '/dashboard/jobs' },
      { source: '/dashboard/jobs/closed_jobs',          destination: '/dashboard/jobs' },
      { source: '/dashboard/jobs/urgent_jobs',          destination: '/dashboard/jobs' },
      { source: '/dashboard/jobs/assigned_jobs',        destination: '/dashboard/jobs' },
      { source: '/dashboard/jobs/client_wise_jobs',     destination: '/dashboard/jobs' },
      { source: '/dashboard/jobs/walk_in_jobs',         destination: '/dashboard/jobs' },
      { source: '/dashboard/jobs/remote_jobs',          destination: '/dashboard/jobs' },
      { source: '/dashboard/jobs/bulk_import',          destination: '/dashboard/import' },
      // Dynamic: /dashboard/jobs/detail/[id]  → will be new file

      // ── APPLICATIONS ──
      { source: '/dashboard/applications/all',          destination: '/dashboard/applications' },
      { source: '/dashboard/applications/new',          destination: '/dashboard/applications' },
      { source: '/dashboard/applications/screening',    destination: '/dashboard/applications' },
      { source: '/dashboard/applications/shortlisted',  destination: '/dashboard/applications' },
      { source: '/dashboard/applications/interview',    destination: '/dashboard/applications' },
      { source: '/dashboard/applications/offered',      destination: '/dashboard/applications' },
      { source: '/dashboard/applications/joined',       destination: '/dashboard/applications' },
      { source: '/dashboard/applications/rejected',     destination: '/dashboard/applications' },
      // Dynamic: /dashboard/applications/detail/[id] → will be new file

      // ── INTERVIEWS ──
      { source: '/dashboard/interviews/all',            destination: '/dashboard/interviews' },
      { source: '/dashboard/interviews/today',          destination: '/dashboard/interviews' },
      { source: '/dashboard/interviews/upcoming',       destination: '/dashboard/interviews' },
      { source: '/dashboard/interviews/completed',      destination: '/dashboard/interviews' },
      { source: '/dashboard/interviews/calendar',       destination: '/dashboard/interviews' },
      // Dynamic: /dashboard/interviews/detail/[id] → will be new file

      // ── BD & CLIENTS ──
      { source: '/dashboard/bd/pipeline',               destination: '/dashboard/bd' },
      { source: '/dashboard/bd/leads/all',              destination: '/dashboard/bd' },
      { source: '/dashboard/bd/leads/new_lead',         destination: '/dashboard/bd' },
      { source: '/dashboard/bd/leads/hot',              destination: '/dashboard/bd' },
      { source: '/dashboard/bd/leads/warm',             destination: '/dashboard/bd' },
      { source: '/dashboard/bd/leads/converted',        destination: '/dashboard/bd' },
      { source: '/dashboard/bd/clients/all',            destination: '/dashboard/companies' },
      { source: '/dashboard/bd/stakeholders',           destination: '/dashboard/stakeholders' },
      { source: '/dashboard/bd/billing',                destination: '/dashboard/company' },

      // ── PLACEMENTS ──
      { source: '/dashboard/placements/all',            destination: '/dashboard/applications' },
      { source: '/dashboard/placements/revenue',        destination: '/dashboard/analytics' },
      { source: '/dashboard/placements/joining_tracker', destination: '/dashboard/applications' },

      // ── FOLLOW UPS ──
      { source: '/dashboard/follow_ups/all',            destination: '/dashboard/communications' },
      { source: '/dashboard/follow_ups/today',          destination: '/dashboard/communications' },
      { source: '/dashboard/follow_ups/overdue',        destination: '/dashboard/communications' },
      { source: '/dashboard/follow_ups/whatsapp',       destination: '/dashboard/communications' },
      { source: '/dashboard/follow_ups/email',          destination: '/dashboard/communications' },
      { source: '/dashboard/follow_ups/call_logs',      destination: '/dashboard/communications' },

      // ── ANALYTICS ──
      { source: '/dashboard/analytics/overview',             destination: '/dashboard/analytics' },
      { source: '/dashboard/analytics/recruiter_performance', destination: '/dashboard/analytics' },
      { source: '/dashboard/analytics/team_performance',     destination: '/dashboard/analytics' },
      { source: '/dashboard/analytics/job_analytics',        destination: '/dashboard/analytics' },
      { source: '/dashboard/analytics/placement_reports',    destination: '/dashboard/analytics' },
      { source: '/dashboard/analytics/revenue',              destination: '/dashboard/analytics' },

      // ── TEAM & ACCESS ──
      { source: '/dashboard/team/members',              destination: '/dashboard/admin' },
      { source: '/dashboard/team/pending_approvals',    destination: '/dashboard/admin' },
      { source: '/dashboard/team/invite',               destination: '/dashboard/invite' },
      { source: '/dashboard/team/permissions',          destination: '/dashboard/permissions' },
      { source: '/dashboard/team/company_permissions',  destination: '/dashboard/company-permissions' },

      // ── ADMIN / PERMISSIONS (Super Admin) ──
      { source: '/dashboard/admin/overview',                            destination: '/dashboard/admin' },
      { source: '/dashboard/admin/role_wise_permission',                destination: '/dashboard/admin' },
      { source: '/dashboard/admin/role_wise_permission/super_admin',    destination: '/dashboard/admin' },
      { source: '/dashboard/admin/role_wise_permission/admin',          destination: '/dashboard/admin' },
      { source: '/dashboard/admin/role_wise_permission/account_owner',  destination: '/dashboard/admin' },
      { source: '/dashboard/admin/role_wise_permission/recruiter',      destination: '/dashboard/admin' },
      { source: '/dashboard/admin/role_wise_permission/job_seeker',     destination: '/dashboard/admin' },
      { source: '/dashboard/admin/job_seeker_access',                   destination: '/dashboard/admin' },
      { source: '/dashboard/admin/audit_logs',                          destination: '/dashboard/admin' },
      { source: '/dashboard/admin/consultancies',                       destination: '/dashboard/admin' },
      { source: '/dashboard/admin/internal_team',                       destination: '/dashboard/admin' },
      { source: '/dashboard/admin/all_companies',                       destination: '/dashboard/companies' },

      // ── COMMUNICATIONS ──
      { source: '/dashboard/communications/all',        destination: '/dashboard/communications' },
      { source: '/dashboard/communications/whatsapp',   destination: '/dashboard/communications' },
      { source: '/dashboard/communications/email',      destination: '/dashboard/communications' },
      { source: '/dashboard/communications/follow_ups', destination: '/dashboard/communications' },
      { source: '/dashboard/communications/call_logs',  destination: '/dashboard/communications' },
      { source: '/dashboard/communications/templates',  destination: '/dashboard/communications' },
      { source: '/dashboard/communications/reminders',  destination: '/dashboard/communications' },

      // ── SETTINGS ──
      { source: '/dashboard/settings/ats_preferences',  destination: '/dashboard/settings' },
      { source: '/dashboard/settings/workflow_rules',   destination: '/dashboard/settings' },
      { source: '/dashboard/settings/email_templates',  destination: '/dashboard/settings' },
      { source: '/dashboard/settings/notifications',    destination: '/dashboard/settings' },
      { source: '/dashboard/settings/ai_parser',        destination: '/dashboard/settings' },
      { source: '/dashboard/settings/company_profile',  destination: '/dashboard/company' },
      { source: '/dashboard/settings/integrations',     destination: '/dashboard/settings' },

      // ── JOB SEEKER PORTAL ──
      { source: '/jobseeker/my_applications',           destination: '/jobseeker/applications' },
      { source: '/jobseeker/my_profile',                destination: '/jobseeker/profile' },
      { source: '/jobseeker/browse_jobs',               destination: '/jobseeker' },

    ]
  },
}

module.exports = nextConfig
