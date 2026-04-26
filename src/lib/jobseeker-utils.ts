// ══════════════════════════════════════════════════════════
// JOBSEEKER SHARED UTILITIES — v1.0
// Match %, profile strength, image compression, geo, sharing
// ══════════════════════════════════════════════════════════

import { supabase } from './supabase'

// ── Job Match % ──────────────────────────────────────────
export function calculateMatch(userSkills: string, userExp: number | null, job: any): number {
  let score = 0
  let factors = 0

  // Skill match (60% weight)
  if (userSkills && job.skills) {
    factors++
    const uSkills = userSkills.toLowerCase().split(',').map((s: string) => s.trim()).filter(Boolean)
    const jSkills = job.skills.toLowerCase().split(',').map((s: string) => s.trim()).filter(Boolean)
    if (jSkills.length > 0 && uSkills.length > 0) {
      const matched = uSkills.filter((us: string) => jSkills.some((js: string) => js.includes(us) || us.includes(js)))
      score += (matched.length / jSkills.length) * 60
    }
  }

  // Experience match (25% weight)
  if (userExp !== null && userExp !== undefined && (job.experience_min || job.experience_max)) {
    factors++
    const min = job.experience_min || 0
    const max = job.experience_max || min + 5
    if (userExp >= min && userExp <= max) {
      score += 25
    } else if (userExp < min) {
      score += Math.max(0, 25 - (min - userExp) * 5)
    } else {
      score += Math.max(0, 25 - (userExp - max) * 3)
    }
  }

  // Location match (15% weight)
  // Will be enhanced with geolocation later
  if (factors === 0) return 0
  const raw = Math.round(score + (factors < 2 ? 15 : 0)) // bonus if less data
  return Math.min(99, Math.max(10, raw))
}

// ── Profile Strength ─────────────────────────────────────
export function calculateProfileStrength(profile: any): { score: number, missing: string[] } {
  const fields = [
    { key: 'name', label: 'Full name', weight: 15 },
    { key: 'email', label: 'Email', weight: 10 },
    { key: 'mobile', label: 'Mobile number', weight: 10 },
    { key: 'city', label: 'City', weight: 5 },
    { key: 'role', label: 'Current role', weight: 10 },
    { key: 'qualification', label: 'Qualification', weight: 10 },
    { key: 'skills', label: 'Skills', weight: 15 },
    { key: 'experience', label: 'Experience', weight: 10 },
    { key: 'current_ctc', label: 'Current CTC', weight: 5 },
    { key: 'expected_ctc', label: 'Expected CTC', weight: 5 },
    { key: 'linkedin', label: 'LinkedIn URL', weight: 5 },
  ]
  let score = 0
  const missing: string[] = []
  for (const f of fields) {
    const val = profile?.[f.key]
    if (val && String(val).trim() !== '' && val !== 0) {
      score += f.weight
    } else {
      missing.push(f.label)
    }
  }
  return { score: Math.min(100, score), missing }
}

// ── Image Compression (client-side, max 1MB) ─────────────
export function compressImage(file: File, maxSizeKB: number = 250, maxDim: number = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Not an image')); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim }
          else { w = Math.round(w * maxDim / h); h = maxDim }
        }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas error')); return }
        ctx.drawImage(img, 0, 0, w, h)
        let quality = 0.8
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('Compression failed')); return }
            if (blob.size > maxSizeKB * 1024 && quality > 0.2) {
              quality -= 0.1
              tryCompress()
            } else {
              resolve(blob)
            }
          }, 'image/jpeg', quality)
        }
        tryCompress()
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

// ── PDF Size Check (max 1MB) ─────────────────────────────
export function validateFileSize(file: File, maxMB: number = 1): { ok: boolean, msg: string } {
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxMB) {
    return { ok: false, msg: `File is ${sizeMB.toFixed(1)}MB. Maximum allowed is ${maxMB}MB.` }
  }
  return { ok: true, msg: '' }
}

// ── Geolocation ──────────────────────────────────────────
export function getUserLocation(): Promise<{ lat: number, lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 600000 }
    )
  })
}

// ── Google Maps Link ─────────────────────────────────────
export function getMapLink(lat?: number, lng?: number, address?: string): string {
  if (lat && lng) return `https://www.google.com/maps?q=${lat},${lng}`
  if (address) return `https://www.google.com/maps/search/${encodeURIComponent(address)}`
  return ''
}

// ── Share Job ────────────────────────────────────────────
export function shareJob(job: any, platform: 'whatsapp' | 'copy' | 'native') {
  const text = `Check out this role: ${job.title} at ${job.companies?.name || job.company_name || 'a top company'}${job.location ? ' in ' + job.location : ''}. Apply now on RecruitBase!`
  const url = typeof window !== 'undefined' ? window.location.origin + '/jobseeker' : ''
  const full = `${text}\n${url}`

  if (platform === 'whatsapp') {
    window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, '_blank')
  } else if (platform === 'copy') {
    navigator.clipboard?.writeText(full)
  } else if (platform === 'native' && navigator.share) {
    navigator.share({ title: job.title, text, url }).catch(() => {})
  }
}

// ── Daily Tip Fetcher ────────────────────────────────────
export async function getDailyTip(segment: string): Promise<string | null> {
  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)

  const { data } = await supabase
    .from('daily_tips')
    .select('tip_text')
    .or(`segment.eq.${segment},segment.eq.all`)
    .eq('is_active', true)

  if (!data || data.length === 0) return null
  // Deterministic daily rotation based on day of year
  return data[dayOfYear % data.length].tip_text
}

// ── Streak Updater ───────────────────────────────────────
export async function updateStreak(userId: string): Promise<number> {
  const { data: user } = await supabase
    .from('app_users')
    .select('streak_count, last_streak_date')
    .eq('id', userId)
    .single()

  if (!user) return 0

  const today = new Date().toISOString().split('T')[0]
  const lastDate = user.last_streak_date

  if (lastDate === today) return user.streak_count || 0

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  let newStreak = 1

  if (lastDate === yesterday) {
    newStreak = (user.streak_count || 0) + 1
  }

  await supabase.from('app_users').update({
    streak_count: newStreak,
    last_streak_date: today,
    
  }).eq('id', userId)

  return newStreak
}

// ── XP Award ─────────────────────────────────────────────
export async function awardXP(userId: string, amount: number, reason?: string) {
  const { data } = await supabase
    .from('app_users')
    .select('xp_points')
    .eq('id', userId)
    .single()

  const current = data?.xp_points || 0
  await supabase.from('app_users').update({ xp_points: current + amount }).eq('id', userId)
  return current + amount
}

// ── Ad Slot Check ────────────────────────────────────────
export function isAdSlot(index: number, frequency: number = 10): boolean {
  return index > 0 && (index + 1) % frequency === 0
}
