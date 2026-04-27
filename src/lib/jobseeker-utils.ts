// ══════════════════════════════════════════════════════════
// JOBSEEKER UTILITIES v2.0 — Production Grade
// Match %, profile strength, image compression, geo (GPS + IP fallback),
// share, streak, XP, daily tips, ad slots, debounce, cache
// ══════════════════════════════════════════════════════════

import { supabase } from './supabase'
import type { Job, Profile, AppUser } from '../types/jobseeker'

// ── Cache utility ────────────────────────────────────────
const cache: Record<string, { data: unknown; expires: number }> = {}

export function getCached<T>(key: string): T | null {
  const entry = cache[key]
  if (!entry) return null
  if (Date.now() > entry.expires) { delete cache[key]; return null }
  return entry.data as T
}

export function setCache(key: string, data: unknown, ttlMs: number = 300000) {
  cache[key] = { data, expires: Date.now() + ttlMs }
}

export function clearCache(prefix?: string) {
  if (!prefix) { Object.keys(cache).forEach(k => delete cache[k]); return }
  Object.keys(cache).filter(k => k.startsWith(prefix)).forEach(k => delete cache[k])
}

// ── Debounce utility ─────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T, ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// ── Job Match % ──────────────────────────────────────────
export function calculateMatch(userSkills: string, userExp: number | null, job: Job): number {
  if (!userSkills && userExp === null) return 0
  let score = 0
  let factors = 0

  // Skill match (60% weight)
  if (userSkills && job.skills) {
    factors++
    const uSkills = userSkills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean)
    const jSkills = job.skills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean)
    if (jSkills.length > 0 && uSkills.length > 0) {
      const matched = uSkills.filter(us => jSkills.some(js => js.includes(us) || us.includes(js)))
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

  if (factors === 0) return 0
  const raw = Math.round(score + (factors < 2 ? 15 : 0))
  return Math.min(99, Math.max(10, raw))
}

// ── Profile Strength ─────────────────────────────────────
export function calculateProfileStrength(profile: Partial<Profile> | null): { score: number; missing: string[] } {
  if (!profile) return { score: 0, missing: ['Everything'] }
  const fields: { key: keyof Profile; label: string; weight: number }[] = [
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
    const val = profile[f.key]
    if (val !== null && val !== undefined && String(val).trim() !== '' && val !== 0) {
      score += f.weight
    } else {
      missing.push(f.label)
    }
  }
  return { score: Math.min(100, score), missing }
}

// ── Image Compression (max 1MB, client-side) ─────────────
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

// ── File Size Validator ──────────────────────────────────
export function validateFileSize(file: File, maxMB: number = 1): { ok: boolean; msg: string } {
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxMB) {
    return { ok: false, msg: `File is ${sizeMB.toFixed(1)}MB. Maximum allowed is ${maxMB}MB.` }
  }
  return { ok: true, msg: '' }
}

// ── Geolocation (GPS + IP fallback) ──────────────────────
export async function getUserLocation(): Promise<{ lat: number; lng: number; source: 'gps' | 'ip' } | null> {
  // Try GPS first
  const gps = await getGPSLocation()
  if (gps) return { ...gps, source: 'gps' }

  // Fallback to IP-based location
  const ip = await getIPLocation()
  if (ip) return { ...ip, source: 'ip' }

  return null
}

function getGPSLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 600000 }
    )
  })
}

async function getIPLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const apis = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/?fields=lat,lon',
    ]
    for (const url of apis) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timeout)
        if (!res.ok) continue
        const data = await res.json()
        const lat = data.latitude || data.lat
        const lng = data.longitude || data.lon
        if (lat && lng) return { lat, lng }
      } catch {
        continue
      }
    }
  } catch {
    // All APIs failed
  }
  return null
}

// ── Google Maps Link ─────────────────────────────────────
export function getMapLink(lat?: number | null, lng?: number | null, address?: string): string {
  if (lat && lng) return `https://www.google.com/maps?q=${lat},${lng}`
  if (address) return `https://www.google.com/maps/search/${encodeURIComponent(address)}`
  return ''
}

// ── Share Job ────────────────────────────────────────────
export function shareJob(job: Job, platform: 'whatsapp' | 'copy' | 'native'): boolean {
  const companyName = job.companies?.name || job.company_name || 'a top company'
  const text = `Check out this role: ${job.title} at ${companyName}${job.location ? ' in ' + job.location : ''}. Apply now on RecruitBase!`
  const url = typeof window !== 'undefined' ? window.location.origin + '/jobseeker' : ''
  const full = `${text}\n${url}`

  try {
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, '_blank')
      return true
    } else if (platform === 'copy') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(full)
        return true
      }
      return false
    } else if (platform === 'native' && navigator.share) {
      navigator.share({ title: job.title, text, url }).catch(() => {})
      return true
    }
  } catch {
    return false
  }
  return false
}

// ── Daily Tip Fetcher (cached) ───────────────────────────
export async function getDailyTip(segment: string): Promise<string | null> {
  const cacheKey = `tip_${segment}`
  const cached = getCached<string>(cacheKey)
  if (cached) return cached

  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)

  const { data } = await supabase
    .from('daily_tips')
    .select('tip_text')
    .or(`segment.eq.${segment},segment.eq.all`)
    .eq('is_active', true)

  if (!data || data.length === 0) return null
  const tip = data[dayOfYear % data.length].tip_text
  setCache(cacheKey, tip, 3600000)
  return tip
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
  const newStreak = lastDate === yesterday ? (user.streak_count || 0) + 1 : 1

  await supabase.from('app_users').update({
    streak_count: newStreak,
    last_streak_date: today,
  }).eq('id', userId)

  return newStreak
}

// ── XP Award (max 3 per action) ──────────────────────────
export async function awardXP(userId: string, amount: number): Promise<number> {
  const safeAmount = Math.min(amount, 3)
  const { data } = await supabase
    .from('app_users')
    .select('xp_points')
    .eq('id', userId)
    .single()

  const current = data?.xp_points || 0
  const newTotal = current + safeAmount
  await supabase.from('app_users').update({ xp_points: newTotal }).eq('id', userId)
  return newTotal
}

// ── Ad Slot Check ────────────────────────────────────────
export function isAdSlot(index: number, frequency: number = 10): boolean {
  return index > 0 && (index + 1) % frequency === 0
}

// ── Night Mode Helper ────────────────────────────────────
export function getNightModePreference(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = window.sessionStorage.getItem('rb_night_mode')
    if (stored !== null) return stored === 'true'
  } catch {
    // sessionStorage not available
  }
  return false
}

export function setNightModePreference(enabled: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem('rb_night_mode', String(enabled))
  } catch {
    // sessionStorage not available
  }
}

// ── Pagination Helper ────────────────────────────────────
export function paginate<T>(items: T[], page: number, pageSize: number = 20): {
  data: T[]
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
} {
  const totalPages = Math.ceil(items.length / pageSize)
  const start = (page - 1) * pageSize
  return {
    data: items.slice(start, start + pageSize),
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

// ── Save/Update Location ─────────────────────────────────
export async function saveUserLocation(userId: string): Promise<{ lat: number; lng: number; source: string } | null> {
  const loc = await getUserLocation()
  if (loc) {
    await supabase.from('app_users').update({
      latitude: loc.lat,
      longitude: loc.lng,
    }).eq('id', userId)
    return loc
  }
  return null
}

// ── Auth Guard (single, reusable — fixes dual auth flash) ─
export async function checkJobSeekerAuth(): Promise<{
  user: AppUser | null
  redirect: string | null
}> {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return { user: null, redirect: '/' }

  const cacheKey = `auth_${authUser.id}`
  const cached = getCached<AppUser>(cacheKey)
  if (cached) {
    if (cached.status === 'disabled') return { user: null, redirect: '/' }
    if (!['job_seeker', 'super_admin'].includes(cached.role)) return { user: null, redirect: '/dashboard' }
    return { user: cached, redirect: null }
  }

  const { data: au } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!au) {
    await supabase.auth.signOut()
    return { user: null, redirect: '/' }
  }

  if (au.status === 'disabled') {
    await supabase.auth.signOut()
    return { user: null, redirect: '/' }
  }

  if (!['job_seeker', 'super_admin'].includes(au.role)) {
    return { user: null, redirect: '/dashboard' }
  }

  setCache(cacheKey, au, 60000)
  return { user: au as AppUser, redirect: null }
}
