// ═══════════════════════════════════════════════════════════════
// RecruitBase Pro — Activity Logger Utility
// 
// Usage in any page:
//   import { logActivity } from '../../src/lib/activityLogger'
//   
//   logActivity(supabase, {
//     userId: appUser.id,
//     companyId: appUser.company_id,
//     actionType: 'profile_added',
//     entityType: 'profile',
//     entityId: profileId,
//     metadata: { candidate_name: 'Rahul', source: 'LinkedIn' }
//   })
//
// Action Types:
//   profile_added, profile_edited, profile_viewed, profile_deleted
//   status_changed, note_added, note_edited
//   interview_scheduled, interview_completed, interview_cancelled
//   offer_made, placement_done
//   jd_created, jd_updated, jd_closed
//   bd_added, bd_updated, bd_stage_changed
//   whatsapp_clicked, email_clicked, call_clicked
//   cv_uploaded, cv_parsed
//   application_received, application_status_changed
//   login, logout, session_start, session_idle
//   link_shared
//   user_role_changed, user_disabled, user_enabled, user_deleted
// ═══════════════════════════════════════════════════════════════

import { SupabaseClient } from '@supabase/supabase-js'

interface ActivityParams {
  userId: string
  companyId?: string | null
  actionType: string
  entityType?: string
  entityId?: string
  oldValue?: string
  newValue?: string
  sourcePlatform?: string
  refCode?: string
  referrerUrl?: string
  metadata?: Record<string, any>
}

export async function logActivity(
  supabase: SupabaseClient,
  params: ActivityParams
): Promise<void> {
  try {
    await supabase.from('activity_log').insert({
      user_id: params.userId,
      company_id: params.companyId || null,
      action_type: params.actionType,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      old_value: params.oldValue || null,
      new_value: params.newValue || null,
      source_platform: params.sourcePlatform || null,
      ref_code: params.refCode || null,
      referrer_url: params.referrerUrl || null,
      metadata: params.metadata || {},
      session_id: getSessionId(),
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    // Never let logging break the main flow
    console.error('Activity log failed:', e)
  }
}

// ── Session tracking ──
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('rb_session_id')
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
    sessionStorage.setItem('rb_session_id', sid)
  }
  return sid
}

// ── Convenience wrappers for common actions ──

export function logProfileAdded(supabase: SupabaseClient, userId: string, companyId: string, profileId: string, candidateName: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: 'profile_added',
    entityType: 'profile',
    entityId: profileId,
    metadata: { candidate_name: candidateName }
  })
}

export function logProfileViewed(supabase: SupabaseClient, userId: string, companyId: string, profileId: string, candidateName: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: 'profile_viewed',
    entityType: 'profile',
    entityId: profileId,
    metadata: { candidate_name: candidateName }
  })
}

export function logStatusChanged(supabase: SupabaseClient, userId: string, companyId: string, entityType: string, entityId: string, oldStatus: string, newStatus: string, entityName: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: 'status_changed',
    entityType,
    entityId,
    oldValue: oldStatus,
    newValue: newStatus,
    metadata: { entity_name: entityName }
  })
}

export function logNoteAdded(supabase: SupabaseClient, userId: string, companyId: string, profileId: string, candidateName: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: 'note_added',
    entityType: 'profile',
    entityId: profileId,
    metadata: { candidate_name: candidateName }
  })
}

export function logContactAttempt(supabase: SupabaseClient, userId: string, companyId: string, profileId: string, method: 'whatsapp' | 'email' | 'call', candidateName: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: method + '_clicked',
    entityType: 'profile',
    entityId: profileId,
    metadata: { candidate_name: candidateName, contact_method: method }
  })
}

export function logInterviewScheduled(supabase: SupabaseClient, userId: string, companyId: string, interviewId: string, candidateName: string, interviewDate: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: 'interview_scheduled',
    entityType: 'interview',
    entityId: interviewId,
    metadata: { candidate_name: candidateName, interview_date: interviewDate }
  })
}

export function logPlacement(supabase: SupabaseClient, userId: string, companyId: string, profileId: string, candidateName: string, placedAt: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: 'placement_done',
    entityType: 'profile',
    entityId: profileId,
    metadata: { candidate_name: candidateName, placed_at: placedAt }
  })
}

export function logJdCreated(supabase: SupabaseClient, userId: string, companyId: string, jdId: string, jdTitle: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: 'jd_created',
    entityType: 'jd',
    entityId: jdId,
    metadata: { jd_title: jdTitle }
  })
}

export function logApplicationStatusChanged(supabase: SupabaseClient, userId: string, companyId: string, applicationId: string, oldStatus: string, newStatus: string, applicantName: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: 'application_status_changed',
    entityType: 'application',
    entityId: applicationId,
    oldValue: oldStatus,
    newValue: newStatus,
    metadata: { applicant_name: applicantName }
  })
}

export function logBdAdded(supabase: SupabaseClient, userId: string, companyId: string, bdId: string, clientName: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: 'bd_added',
    entityType: 'bd',
    entityId: bdId,
    metadata: { client_name: clientName }
  })
}

export function logCvUploaded(supabase: SupabaseClient, userId: string, companyId: string, profileId: string, candidateName: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: 'cv_uploaded',
    entityType: 'profile',
    entityId: profileId,
    metadata: { candidate_name: candidateName }
  })
}

export function logLogin(supabase: SupabaseClient, userId: string, companyId?: string | null) {
  return logActivity(supabase, {
    userId,
    companyId,
    actionType: 'login',
    metadata: { timestamp: new Date().toISOString() }
  })
}

export function logLinkShared(supabase: SupabaseClient, userId: string, companyId: string, jdId: string, platform: string, jdTitle: string) {
  return logActivity(supabase, {
    userId, companyId,
    actionType: 'link_shared',
    entityType: 'jd',
    entityId: jdId,
    sourcePlatform: platform,
    metadata: { jd_title: jdTitle, platform }
  })
}

// ── Idle detection for WFH tracking ──
let idleTimer: any = null
let lastActiveTime: number = Date.now()

export function startIdleTracking(supabase: SupabaseClient, userId: string, companyId?: string | null) {
  if (typeof window === 'undefined') return

  const IDLE_THRESHOLD = 30 * 60 * 1000 // 30 minutes

  function resetTimer() {
    lastActiveTime = Date.now()
  }

  function checkIdle() {
    const idleTime = Date.now() - lastActiveTime
    if (idleTime >= IDLE_THRESHOLD) {
      logActivity(supabase, {
        userId,
        companyId,
        actionType: 'session_idle',
        metadata: { idle_minutes: Math.round(idleTime / 60000) }
      })
    }
  }

  // Track user activity
  window.addEventListener('mousemove', resetTimer)
  window.addEventListener('keypress', resetTimer)
  window.addEventListener('click', resetTimer)
  window.addEventListener('scroll', resetTimer)

  // Check every 5 minutes
  idleTimer = setInterval(checkIdle, 5 * 60 * 1000)

  // Log session start
  logActivity(supabase, {
    userId,
    companyId,
    actionType: 'session_start',
    metadata: { user_agent: navigator.userAgent }
  })

  // Log on page close
  window.addEventListener('beforeunload', () => {
    logActivity(supabase, {
      userId,
      companyId,
      actionType: 'logout',
      metadata: { 
        session_duration_minutes: Math.round((Date.now() - (parseInt(sessionStorage.getItem('rb_session_start') || '0') || Date.now())) / 60000)
      }
    })
  })

  sessionStorage.setItem('rb_session_start', Date.now().toString())
}

export function stopIdleTracking() {
  if (idleTimer) clearInterval(idleTimer)
  if (typeof window === 'undefined') return
  window.removeEventListener('mousemove', () => {})
  window.removeEventListener('keypress', () => {})
}
