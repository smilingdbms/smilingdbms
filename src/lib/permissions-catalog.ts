// @ts-nocheck
// ════════════════════════════════════════════════════════════════
// PERMISSIONS + PACKAGES — single source of truth.
// Used by: super-admin (company allotment), AO (employee grant),
// usePermission hook (enforcement), billing/seat checks.
// Rule: user_permissions ⊆ company_permissions ⊆ CATALOG.
// ════════════════════════════════════════════════════════════════

// ---- full permission catalog (grouped) ----
export const PERMISSION_GROUPS = [
  { group: 'Candidate Management', perms: [
    { key:'can_add_profiles',      label:'Add new candidate profiles' },
    { key:'can_edit_profiles',     label:'Edit candidate profiles' },
    { key:'can_delete_profiles',   label:'Delete candidate profiles' },
    { key:'can_reveal_contacts',   label:'View contact details (mobile/email)' },
    { key:'can_export_profiles',   label:'Export candidate data' },
    { key:'can_bulk_message',      label:'Send bulk WhatsApp/Email' },
    { key:'can_import_csv',        label:'Bulk import (CSV)' },
  ]},
  { group: 'Jobs & BD', perms: [
    { key:'can_add_jd',            label:'Create Job Descriptions' },
    { key:'can_edit_jd',           label:'Edit Job Descriptions' },
    { key:'can_delete_jd',         label:'Delete Job Descriptions' },
    { key:'can_access_bd',         label:'Access BD / Client pipeline' },
    { key:'can_add_bd',            label:'Add BD / client entries' },
    { key:'can_bd_analytics',      label:'BD analytics' },
  ]},
  { group: 'Interviews & Pipeline', perms: [
    { key:'can_schedule_interviews', label:'Schedule interviews' },
    { key:'can_edit_interviews',     label:'Edit / cancel interviews' },
    { key:'can_view_all_interviews', label:'View all team interviews' },
    { key:'can_record_placement',    label:'Record placements' },
  ]},
  { group: 'Data & Reports', perms: [
    { key:'can_view_analytics',    label:'View analytics & reports' },
    { key:'can_export_reports',    label:'Export reports (CSV/PDF)' },
    { key:'can_view_team_data',    label:"View other members' data" },
  ]},
  { group: 'AI Tools', perms: [
    { key:'can_cv_parser',         label:'AI CV parsing (upload résumé)' },
    { key:'can_smart_match',       label:'AI Smart Match (JD ↔ candidate)' },
    { key:'can_resume_builder',    label:'Resume / Portfolio builder' },
  ]},
  { group: 'Team & Settings', perms: [
    { key:'can_invite_members',    label:'Invite team members' },
    { key:'can_change_roles',      label:'Change member roles' },
    { key:'can_manage_templates',  label:'Manage message templates' },
    { key:'can_billing',           label:'View billing & invoices' },
    { key:'can_integrations',      label:'Integrations (Sheets/Calendar)' },
  ]},
];

// flat list of all keys
export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.key));

export function permLabel(key){
  for(const g of PERMISSION_GROUPS){ const p=g.perms.find(x=>x.key===key); if(p) return p.label; }
  return key;
}

// ---- 4 packages (Free first). Each = seats + limits + allowed permission keys ----
const CORE = ['can_add_profiles','can_edit_profiles','can_reveal_contacts','can_schedule_interviews','can_cv_parser','can_resume_builder'];
const STARTER = [...CORE,'can_delete_profiles','can_export_profiles','can_bulk_message','can_import_csv','can_add_jd','can_edit_jd','can_edit_interviews','can_view_analytics','can_export_reports','can_invite_members','can_manage_templates','can_record_placement'];
const GROWTH = [...STARTER,'can_delete_jd','can_access_bd','can_add_bd','can_bd_analytics','can_view_all_interviews','can_view_team_data','can_smart_match','can_change_roles','can_billing','can_integrations'];
const ENTERPRISE = [...ALL_PERMISSION_KEYS];

export const PACKAGES = [
  { code:'free',       name:'Free',       price_monthly:0,     seats:1,  candidate_cap:100,    active_job_cap:2,   cv_parse_daily:5,   bulk_msg_monthly:0,     sort:1, perms:CORE },
  { code:'starter',    name:'Starter',    price_monthly:1999,  seats:3,  candidate_cap:2000,   active_job_cap:25,  cv_parse_daily:40,  bulk_msg_monthly:500,   sort:2, perms:STARTER },
  { code:'growth',     name:'Growth',     price_monthly:5999,  seats:8,  candidate_cap:25000,  active_job_cap:150, cv_parse_daily:200, bulk_msg_monthly:5000,  sort:3, perms:GROWTH },
  { code:'enterprise', name:'Enterprise', price_monthly:14999, seats:20, candidate_cap:100000, active_job_cap:750, cv_parse_daily:600, bulk_msg_monthly:25000, sort:4, perms:ENTERPRISE },
];

export function getPackage(code){ return PACKAGES.find(p=>p.code===code) || PACKAGES[0]; }

// effective company-allowed keys: tailored override (Enterprise) wins, else package perms
export function companyAllowedKeys(pkgCode, overrideKeys){
  if(Array.isArray(overrideKeys) && overrideKeys.length) return overrideKeys;
  return getPackage(pkgCode).perms;
}
