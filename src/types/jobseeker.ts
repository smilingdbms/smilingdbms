// RecruitBase Pro — TypeScript Interfaces
// All jobseeker-related types

export interface AppUser {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  company_id: string | null
  points: number
  experience_segment: 'intern' | 'fresher' | 'junior' | 'experienced'
  vibe_mode: 'fun' | 'professional' | 'focus'
  onboarded: boolean
  latitude: number | null
  longitude: number | null
  streak_count: number
  xp_points: number
  last_streak_date: string | null
  photo_url: string | null
  city: string | null
  mobile: string | null
  designation: string | null
  created_at: string
}

export interface Job {
  id: string
  title: string
  company_id: string | null
  company_name: string | null
  location: string | null
  city: string | null
  industry: string | null
  experience_min: number | null
  experience_max: number | null
  salary_min: number | null
  salary_max: number | null
  job_type: string | null
  skills: string | null
  description: string | null
  status: string
  is_public: boolean
  latitude: number | null
  longitude: number | null
  created_at: string
  companies?: { name: string; company_code: string }
}

export interface JobApplication {
  id: string
  job_id: string
  applicant_id: string
  full_name: string | null
  email: string | null
  status: string
  cover_note: string | null
  cover_letter: string | null
  applied_at: string
  created_at: string
  updated_at: string | null
  job_descriptions?: {
    title: string
    location: string | null
    city: string | null
    salary_min: number | null
    salary_max: number | null
    job_type: string | null
    experience_min: number | null
    companies?: { name: string }
  }
}

export interface Profile {
  id?: string
  created_by: string
  name: string
  email: string
  mobile: string
  role: string
  qualification: string
  skills: string
  experience: number | null
  current_ctc: number | null
  expected_ctc: number | null
  notice_period: string
  work_mode: string
  city: string
  linkedin: string
  segment: string
  photo_url?: string
}

export interface DailyTip {
  id: string
  segment: string
  tip_text: string
  category: string
}

export type VibeMode = 'fun' | 'professional' | 'focus'
export type Segment = 'intern' | 'fresher' | 'junior' | 'experienced'
export type ToastType = 'success' | 'error'
