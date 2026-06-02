// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { snapToCourse, snapToLevel } from '../../src/lib/courseBranches'

// ══════════════════════════════════════════════════════════
// CV PARSER v5.0 — Gemini AI (TWO PARALLEL CALLS) + Regex Fallback
// Splits the work: one Gemini call for flat fields, another for the
// 4 structured arrays (work_experiences/education/certifications/
// achievements). Both get full token budget → arrays no longer get
// truncated by flash-lite. Server-side console logs for diagnosis.
// ══════════════════════════════════════════════════════════

export const config = { api: { bodyParser: { sizeLimit: '15mb' } } }

// ── Regex patterns for CV parsing ────────────────────────
const PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+91[\s-]?)?(?:0?\d{2,4}[\s-]?)?\d{5}[\s-]?\d{5}/g,
  phoneFallback: /\b\d{10,12}\b/g,
  linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi,
  experience: /(\d+\.?\d*)\s*(?:\+\s*)?(?:years?|yrs?|yr)\s*(?:of\s+)?(?:experience|exp)?/gi,
  ctc: /(?:(?:current|present)\s*(?:ctc|salary|compensation|package))\s*[:\-]?\s*(?:(?:INR|Rs\.?|₹)\s*)?(\d+\.?\d*)\s*(?:lpa|lakhs?|lacs?|l\.?p\.?a\.?|cr|crore)?/gi,
  expectedCtc: /(?:(?:expected|desired|looking)\s*(?:ctc|salary|compensation|package))\s*[:\-]?\s*(?:(?:INR|Rs\.?|₹)\s*)?(\d+\.?\d*)\s*(?:lpa|lakhs?|lacs?|l\.?p\.?a\.?|cr|crore)?/gi,
  notice: /(?:notice\s*period)\s*[:\-]?\s*(\d+\s*(?:days?|months?|weeks?)|immediate)/gi,
  dob: /(?:date\s*of\s*birth|d\.?o\.?b\.?|born)\s*[:\-]?\s*(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{2,4})/gi,
  gender: /\b(male|female|other)\b/gi,
}

const CITIES = ['Delhi','Mumbai','Bangalore','Bengaluru','Hyderabad','Pune','Chennai','Noida','Gurgaon','Gurugram','Kolkata','Ahmedabad','Jaipur','Lucknow','Chandigarh','Kochi','Nagpur','Indore','Bhopal','Surat','Vadodara','Patna','Ranchi','Coimbatore','Visakhapatnam','Bhubaneswar','Thiruvananthapuram','Mysore','Mangalore','Dehradun','Guwahati','Raipur','Jodhpur','Agra','Varanasi','Kanpur','Allahabad','Meerut','Faridabad','Ghaziabad','Thane','Navi Mumbai','Greater Noida','Mohali','Panchkula','Zirakpur']

const QUALIFICATIONS: Record<string, string[]> = {
  'PhD': ['phd', 'ph.d', 'doctorate', 'doctor of philosophy'],
  'M.Tech': ['m.tech', 'mtech', 'master of technology'],
  'B.Tech': ['b.tech', 'btech', 'bachelor of technology', 'b.e.', 'be ', 'bachelor of engineering'],
  'MCA': ['mca', 'master of computer applications'],
  'BCA': ['bca', 'bachelor of computer applications'],
  'MBA': ['mba', 'master of business administration', 'pgdm'],
  'M.Sc': ['m.sc', 'msc', 'master of science'],
  'B.Sc': ['b.sc', 'bsc', 'bachelor of science'],
  'MBBS': ['mbbs', 'bachelor of medicine'],
  'CA': ['chartered accountant', 'ca (qualified)', 'ca inter'],
  'CS': ['company secretary', 'cs '],
  'LLB': ['llb', 'll.b', 'bachelor of law'],
  'M.Com': ['m.com', 'mcom', 'master of commerce'],
  'B.Com': ['b.com', 'bcom', 'bachelor of commerce'],
  'BA': ['b.a.', 'bachelor of arts'],
  'MA': ['m.a.', 'master of arts'],
  'BBA': ['bba', 'bachelor of business'],
  'Diploma': ['diploma in', 'polytechnic'],
  'ITI': ['iti ', 'industrial training'],
  '12th Pass': ['12th', 'xii', 'intermediate', 'higher secondary', 'hsc', '+2'],
  '10th Pass': ['10th', 'x ', 'ssc', 'matriculation'],
}

const SKILL_KEYWORDS = [
  'javascript','typescript','react','angular','vue','node','python','java','c++','c#',
  'sql','mysql','postgresql','mongodb','redis','aws','azure','gcp','docker','kubernetes',
  'html','css','sass','tailwind','bootstrap','figma','photoshop','illustrator',
  'git','jira','confluence','agile','scrum','devops','ci/cd','jenkins',
  'machine learning','data science','ai','nlp','tensorflow','pytorch',
  'sales','marketing','business development','client management','negotiation',
  'communication','leadership','team management','project management','problem solving',
  'excel','powerpoint','word','tableau','power bi','sap','oracle','erp',
  'recruitment','talent acquisition','hr','payroll','compliance','onboarding',
  'accounting','finance','taxation','audit','gst','tally','quickbooks',
  'autocad','solidworks','matlab','civil','mechanical','electrical',
  'php','ruby','swift','kotlin','flutter','react native','ionic',
  '.net','asp.net','spring boot','django','flask','fastapi','express',
  'graphql','rest api','microservices','system design','dsa','algorithms',
]

const INDUSTRIES_MAP: Record<string, string[]> = {
  'IT / Software': ['software','developer','engineer','programmer','coding','fullstack','frontend','backend','devops','cloud'],
  'Healthcare': ['doctor','nurse','hospital','medical','pharma','health','clinical','patient'],
  'BFSI': ['banking','finance','insurance','investment','mutual fund','stock','trading'],
  'Sales': ['sales','revenue','target','quota','business development','client','account manager'],
  'HR / Recruitment': ['hr ','human resource','recruiter','talent','hiring','staffing','recruitment'],
  'Marketing': ['marketing','digital marketing','seo','sem','social media','brand','campaign'],
  'Education': ['teacher','professor','tutor','education','training','coaching','faculty'],
  'Manufacturing': ['manufacturing','production','plant','factory','quality','lean','six sigma'],
  'Legal': ['lawyer','advocate','legal','litigation','compliance','contract','law firm'],
  'Design': ['designer','ui','ux','graphic','creative','visual','branding'],
}

// ── Parse extracted text ─────────────────────────────────
function parseCV(text: string): Record<string, string> {
  const t = text || ''
  const lower = t.toLowerCase()
  const lines = t.split('\n').map(l => l.trim()).filter(Boolean)
  const result: Record<string, string> = {}

  // Name — usually first non-empty meaningful line
  for (const line of lines.slice(0, 10)) {
    const clean = line.replace(/[^a-zA-Z\s.]/g, '').trim()
    if (clean.length >= 3 && clean.length <= 50 && clean.split(' ').length <= 5) {
      const skip = ['curriculum','vitae','resume','cv','profile','summary','objective','email','phone','mobile','address','personal']
      if (!skip.some(s => clean.toLowerCase().startsWith(s))) {
        result.name = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        break
      }
    }
  }

  // Email
  const emails = t.match(PATTERNS.email) || []
  result.email = emails.find(e => !e.includes('naukri') && !e.includes('indeed') && !e.includes('linkedin')) || emails[0] || ''

  // Phone
  const phones = t.match(PATTERNS.phone) || t.match(PATTERNS.phoneFallback) || []
  result.mobile = (phones[0] || '').replace(/[\s-]/g, '').replace(/^\+91/, '').replace(/^0/, '').slice(-10)

  // LinkedIn
  const linkedins = t.match(PATTERNS.linkedin) || []
  result.linkedin = linkedins[0] || ''

  // Experience
  const expMatches = [...lower.matchAll(PATTERNS.experience)]
  if (expMatches.length > 0) {
    const years = expMatches.map(m => parseFloat(m[1])).filter(n => n >= 0 && n <= 50)
    result.experience = years.length > 0 ? String(Math.max(...years)) : ''
  }

  // Current CTC
  const ctcMatches = [...lower.matchAll(PATTERNS.ctc)]
  if (ctcMatches.length > 0) result.current_ctc = ctcMatches[0][1]

  // Expected CTC
  const ectcMatches = [...lower.matchAll(PATTERNS.expectedCtc)]
  if (ectcMatches.length > 0) result.expected_ctc = ectcMatches[0][1]

  // Notice Period
  const noticeMatches = [...lower.matchAll(PATTERNS.notice)]
  if (noticeMatches.length > 0) result.notice_period = noticeMatches[0][1].trim()

  // Gender
  const genderMatch = lower.match(PATTERNS.gender)
  if (genderMatch) result.gender = genderMatch[0].charAt(0).toUpperCase() + genderMatch[0].slice(1).toLowerCase()

  // City
  for (const city of CITIES) {
    if (lower.includes(city.toLowerCase())) {
      result.city = city === 'Bengaluru' ? 'Bangalore' : city === 'Gurugram' ? 'Gurgaon' : city
      break
    }
  }

  // Qualification
  for (const [qual, keywords] of Object.entries(QUALIFICATIONS)) {
    if (keywords.some(k => lower.includes(k))) {
      result.qualification = qual
      break
    }
  }

  // Skills — match against known skills
  const foundSkills: string[] = []
  for (const skill of SKILL_KEYWORDS) {
    if (lower.includes(skill.toLowerCase())) {
      foundSkills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
    }
  }
  result.skills = [...new Set(foundSkills)].slice(0, 15).join(', ')

  // Industry
  for (const [industry, keywords] of Object.entries(INDUSTRIES_MAP)) {
    if (keywords.some(k => lower.includes(k))) {
      result.industry = industry
      break
    }
  }

  // Role — look for "designation", "position", "role" sections
  const rolePatterns = [
    /(?:designation|current\s*role|position|job\s*title)\s*[:\-]?\s*(.+)/gi,
    /(?:working\s+as|currently\s+(?:working|employed)\s+as)\s+(.+)/gi,
  ]
  for (const rp of rolePatterns) {
    const rm = [...t.matchAll(rp)]
    if (rm.length > 0) {
      result.role = rm[0][1].trim().substring(0, 60)
      break
    }
  }

  // Current Company
  const compPatterns = [
    /(?:current\s*(?:company|employer|organization))\s*[:\-]?\s*(.+)/gi,
    /(?:working\s+(?:at|with|in))\s+(.+?)(?:\s+as\s+|\s+since\s+|\.|,|\n)/gi,
  ]
  for (const cp of compPatterns) {
    const cm = [...t.matchAll(cp)]
    if (cm.length > 0) {
      result.current_company = cm[0][1].trim().substring(0, 60)
      break
    }
  }

  // Summary — first 200 chars of meaningful content after name
  const nameIdx = result.name ? lines.findIndex(l => l.includes(result.name!)) : 0
  const summaryLines = lines.slice(nameIdx + 1, nameIdx + 6).filter(l => l.length > 20)
  result.summary = summaryLines.join(' ').substring(0, 200) || ''

  // Segment guess
  const exp = parseFloat(result.experience || '0')
  if (exp === 0 && lower.includes('intern')) result.segment = 'intern'
  else if (exp <= 0.5) result.segment = 'fresher'
  else if (exp <= 2) result.segment = 'junior'
  else result.segment = 'experienced'

  // Structured arrays — regex fallback can't extract these reliably,
  // so return empty arrays. The form will let the recruiter add them.
  ;(result as any).work_experiences = []
  ;(result as any).education        = []
  ;(result as any).certifications   = []
  ;(result as any).achievements     = []

  return result
}

// ── AI-Powered CV Parser (Gemini) — v5: TWO PARALLEL CALLS ──
//
// Why 2 calls?  flash-lite (free tier) struggles when asked for 30+ flat
// fields PLUS 4 nested arrays in ONE shot — it truncates / skips arrays.
// We split:
//   Call A — flat fields  (small output, fast, reliable)
//   Call B — structured arrays  (focused, gets full output budget)
// Both fire in parallel → no extra latency. Results merged.
// ─────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`

async function callGemini(apiKey: string, prompt: string, label: string): Promise<any> {
  const r = await fetch(GEMINI_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 16384, responseMimeType: 'application/json' }
    })
  })
  if (!r.ok) {
    const body = await r.text()
    console.error(`[parse-cv] Gemini ${label} ERROR ${r.status}:`, body.slice(0, 300))
    throw new Error(`Gemini ${label} failed: ${r.status}`)
  }
  const data = await r.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  console.log(`[parse-cv] Gemini ${label} OK — ${content.length} chars returned`)
  // Strip code fences if any
  const jsonStr = content.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(jsonStr)
  } catch (e) {
    // Sometimes the model trails extra text; try to grab the JSON object/array
    const m = jsonStr.match(/^[\s\S]*?(\{[\s\S]*\}|\[[\s\S]*\])\s*$/)
    if (m) {
      try { return JSON.parse(m[1]) } catch {}
    }
    console.error(`[parse-cv] Gemini ${label} JSON parse FAILED. Snippet:`, jsonStr.slice(0, 300))
    throw e
  }
}

async function parseWithAI(text: string): Promise<Record<string, any>> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || ''
    if (!apiKey) throw new Error('GEMINI_API_KEY not set')

    const trimmed = text.substring(0, 10000)

    // ── CALL A — flat profile fields ──
    const flatPrompt = `You are a recruitment CV parser. Extract the following fields from this CV.
Return ONLY a JSON object — no markdown, no code fences, no explanation. Use null/"" when not found. Never invent data.

CV TEXT:
${trimmed}

{
  "name": "Full name of the person (NOT job title or company)",
  "email": "email",
  "mobile": "10-digit mobile, digits only",
  "gender": "Male/Female/Other or null",
  "age": "age as number string or null",
  "linkedin": "LinkedIn URL or null",
  "role": "current/most recent job title",
  "experience": "total years of experience as number string e.g. 5 or 5.5",
  "current_company": "current/most recent employer",
  "current_ctc": "current CTC in LPA as number string or null",
  "expected_ctc": "expected CTC in LPA as number string or null",
  "notice_period": "Immediate / 7 days / 15 days / 1 month / 2 months / 3 months / Negotiable or null",
  "qualification": "highest qualification — pick from: MBBS, MD, MS, BDS, MDS, B.Tech, M.Tech, BE, ME, MCA, BCA, B.Sc, M.Sc, MBA, PGDM, BBA, CA (Qualified), CA (Inter), CMA, CS, LLB, LLM, BA, MA, B.Com, M.Com, PhD, Diploma, ITI, 12th Pass, 10th Pass, Graduate, Post Graduate, Other",
  "qualification_branch": "specialization for highest qualification e.g. Computer Science",
  "college": "college/university name for highest qualification",
  "graduation_year": "4-digit graduation year for highest qualification or null",
  "skills": "comma separated top skills from the CV, up to 20 actual skills (not generic words)",
  "industry": "industry sector",
  "city": "current city",
  "work_mode": "WFH / Office / Hybrid or null",
  "willing_to_relocate": "true/false as string or null",
  "ai_summary": "Professional summary in 2-4 lines (use the CV's own summary if present)",
  "languages": "languages known, comma separated"
}`

    // ── CALL B — structured arrays ──
    const arraysPrompt = `Extract structured resume data from this CV.
Return ONLY a JSON object — no markdown, no code fences, no explanation. Use [] for missing arrays. Never invent data.

CV TEXT:
${trimmed}

Return EXACTLY this shape:

{
  "work_experiences": [
    {
      "company": "employer name",
      "role": "designation at this employer",
      "from_month": "Jan/Feb/Mar/Apr/May/Jun/Jul/Aug/Sep/Oct/Nov/Dec or empty string",
      "from_year": "4-digit year as string or empty string",
      "to_month": "Jan..Dec or empty string (empty if currently working)",
      "to_year": "4-digit year as string or empty string (empty if currently working)",
      "current": true,
      "bullets": ["short responsibility/achievement bullets, one line each, 3-8 per job"]
    }
  ],
  "education": [
    {
      "level": "one of: 10th / SSC | 12th / HSC | Diploma / ITI | Bachelor (UG) | Master (PG) | Doctorate (PhD) | Super-Speciality / Fellowship",
      "course": "the EXACT course/degree. Map full names to standard short forms: 'Bachelor of Computer Application'=BCA, 'Master of Computer Application'=MCA, 'Bachelor of Technology'=B.Tech, 'Bachelor of Commerce'=B.Com, 'Bachelor of Arts'=BA, 'Bachelor of Science'=B.Sc, 'Intermediate'=12th / HSC, 'Matriculation'=10th / SSC. Read carefully — BCA and MCA are DIFFERENT.",
      "branch": "specialization/stream if any, else empty string",
      "institution": "college/university/school/board name or empty string",
      "study_status": "'pursuing' if currently studying / expected / ongoing / present / pursuing, else 'completed'",
      "current_period": "if pursuing, the current year or semester e.g. 'Year 3' or 'Semester 5', else empty string",
      "year": "4-digit passing year (or expected graduation year if pursuing) as string or empty string",
      "percentage_or_cgpa": "e.g. 8.5 or 78% or empty string"
    }
  ],
  "certifications": [
    { "name": "certification name", "issuer": "issuing organization", "year": "4-digit year or empty string" }
  ],
  "achievements": [
    { "title": "award/achievement title", "description": "1-2 line description or empty string", "year": "4-digit year or empty string" }
  ]
}

Rules:
- work_experiences: include EVERY job in the CV. Most recent first. Mark "current": true ONLY if CV says present/current/now/till date.
- bullets: short crisp lines, strip leading numbers/dashes/bullets characters.
- If a CV has only 1 job — return 1. If it has 5 jobs — return 5. Do not skip any.
- education: include ALL qualifications mentioned (Bachelor, Master, 12th/Intermediate, 10th/Matriculation, Diploma). Set the correct "level" for each and map the full degree name to its standard short form. Distinguish BCA (Bachelor) vs MCA (Master) carefully. If a qualification is ongoing/expected/present, set study_status="pursuing" and fill current_period (e.g. "Year 3" / "Semester 5").
- certifications: only real named certifications/courses (not skills).
- achievements: only real awards/recognitions (not work duties).`

    // Fire both calls in parallel
    const [flatRes, arraysRes] = await Promise.all([
      callGemini(apiKey, flatPrompt, 'FLAT').catch(e => ({ __err: String(e) })),
      callGemini(apiKey, arraysPrompt, 'ARRAYS').catch(e => ({ __err: String(e) }))
    ])

    // If both failed, throw to trigger regex fallback
    if ((flatRes as any).__err && (arraysRes as any).__err) {
      throw new Error('Both Gemini calls failed')
    }

    // Merge — flat fields first, then arrays override
    const parsed: any = {
      ...(flatRes && !(flatRes as any).__err ? flatRes : {}),
      ...(arraysRes && !(arraysRes as any).__err ? arraysRes : {})
    }

    // ── Normalize & sanitize ──
    if (parsed.mobile) parsed.mobile = String(parsed.mobile).replace(/\D/g, '').slice(-10)

    parsed.work_experiences = Array.isArray(parsed.work_experiences) ? parsed.work_experiences : []
    parsed.education        = Array.isArray(parsed.education)        ? parsed.education        : []
    parsed.certifications   = Array.isArray(parsed.certifications)   ? parsed.certifications   : []
    parsed.achievements     = Array.isArray(parsed.achievements)     ? parsed.achievements     : []

    parsed.work_experiences = parsed.work_experiences.map((w: any) => ({
      company:    String(w?.company || '').trim(),
      role:       String(w?.role || '').trim(),
      from_month: String(w?.from_month || '').trim(),
      from_year:  String(w?.from_year || '').trim(),
      to_month:   w?.current ? '' : String(w?.to_month || '').trim(),
      to_year:    w?.current ? '' : String(w?.to_year || '').trim(),
      current:    !!w?.current,
      bullets:    Array.isArray(w?.bullets) ? w.bullets.map((b: any) => String(b || '').replace(/^[\s\d\.\-•*]+/, '').trim()).filter(Boolean) : []
    })).filter((w: any) => w.company || w.role)

    parsed.education = parsed.education.map((e: any) => {
      const rawLevel  = String(e?.level || '').trim()
      const rawCourse = String(e?.course || e?.degree || '').trim()
      return {
        level:              snapToLevel(rawLevel || rawCourse),
        course:             snapToCourse(rawCourse),
        branch:             String(e?.branch || e?.specialization || '').trim(),
        study_status:       (e?.study_status === 'pursuing') ? 'pursuing' : 'completed',
        current_period:     String(e?.current_period || '').trim(),
        institution:        String(e?.institution || '').trim(),
        year:               String(e?.year || '').trim(),
        percentage_or_cgpa: String(e?.percentage_or_cgpa || '').trim()
      }
    }).filter((e: any) => e.course || e.institution || e.level)

    parsed.certifications = parsed.certifications.map((c: any) => ({
      name:   String(c?.name   || '').trim(),
      issuer: String(c?.issuer || '').trim(),
      year:   String(c?.year   || '').trim()
    })).filter((c: any) => c.name)

    parsed.achievements = parsed.achievements.map((a: any) => ({
      title:       String(a?.title       || '').trim(),
      description: String(a?.description || '').trim(),
      year:        String(a?.year        || '').trim()
    })).filter((a: any) => a.title)

    // Segment: student if any education still pursuing, else by experience
    const exp = parseFloat(parsed.experience || '0')
    const anyPursuing = parsed.education.some((e: any) => e.study_status === 'pursuing')
    parsed.segment = anyPursuing ? 'pursuing' : (exp <= 1 ? 'fresher' : 'experienced')

    console.log(
      `[parse-cv] Parsed counts -> work:${parsed.work_experiences.length}  edu:${parsed.education.length}  cert:${parsed.certifications.length}  award:${parsed.achievements.length}`
    )
    return parsed
  } catch(e) {
    console.error('AI parse error:', e)
    // Fallback to regex parser
    return parseCV(text)
  }
}

// ── Main handler ─────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { action, b64, b64data, mimeType, filename, profileId } = req.body
    const act = (action || '').toUpperCase()

    // ── PARSE CV (extract text + parse) ──
    if (act === 'PARSE_CV') {
      const base64 = b64 || b64data
      if (!base64) return res.status(400).json({ error: 'No file data' })

      const buffer = Buffer.from(base64, 'base64')
      const mime = (mimeType || '').toLowerCase()
      let extractedText = ''

      if (mime.includes('pdf')) {
        // Use pdf-parse for PDF files
        try {
          const pdfParse = (await import('pdf-parse')).default
          const pdfData = await pdfParse(buffer)
          extractedText = pdfData.text || ''
        } catch (pdfErr: any) {
          console.error('PDF parse error:', pdfErr.message)
          extractedText = ''
        }
      } else if (mime.includes('text') || mime.includes('plain')) {
        extractedText = buffer.toString('utf-8')
      } else if (mime.includes('word') || mime.includes('doc')) {
        // Basic DOCX text extraction (zip-based)
        try {
          const text = buffer.toString('utf-8')
          // Extract text between XML tags
          extractedText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        } catch {
          extractedText = ''
        }
      }

      if (!extractedText.trim()) {
        // Fallback: try to extract name from filename
        const fname = (filename || '').replace(/\.(pdf|doc|docx|txt)$/i, '')
          .replace(/^Naukri_/i, '').replace(/\[\d+y[\d_]+m\]/i, '')
          .replace(/[_\[\]]/g, ' ').trim()

        return res.status(200).json({
          success: true,
          profile: { name: fname || 'Unknown', _fallback: true, summary: 'Could not extract text. Please fill details manually.' }
        })
      }

      const profile = await parseWithAI(extractedText)
      return res.status(200).json({ success: true, profile })
    }

    // ── UPLOAD CV TO SUPABASE STORAGE ──
    if (act === 'UPLOAD_CV_STORAGE') {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const base64 = b64data || b64
      if (!base64 || !filename || !profileId) {
        return res.status(400).json({ error: 'Missing fields' })
      }

      let buffer = Buffer.from(base64, 'base64')

      // Auto-compress if over 125KB
      const maxSize = 125 * 1024 // 125KB
      if (buffer.length > maxSize) {
        // For PDFs we can't easily compress server-side without heavy libs
        // But we can enforce the limit — client should compress before upload
        // For images, we reduce quality
        const mime = (mimeType || '').toLowerCase()
        if (mime.includes('image')) {
          // Sharp not available, so we just truncate warning
          console.warn(`Image ${filename} is ${Math.round(buffer.length/1024)}KB — client should compress to 125KB`)
        }
      }

      const filePath = `cvs/${profileId}/${filename}`
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, buffer, { contentType: mimeType || 'application/pdf', upsert: true })

      if (uploadError) throw new Error('Upload failed: ' + uploadError.message)

      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(filePath)

      await supabase.from('profiles')
        .update({ resume_url: urlData.publicUrl, resume_name: filename })
        .eq('id', profileId)

      return res.status(200).json({ success: true, url: urlData.publicUrl })
    }

    return res.status(400).json({ error: 'Unknown action. Use PARSE_CV or UPLOAD_CV_STORAGE' })

  } catch (error: any) {
    console.error('CV API error:', error.message)
    const fn = (req.body?.filename || '')
    const fname = fn.replace(/\.(pdf|doc|docx|txt)$/i, '').replace(/^Naukri_/i, '')
      .replace(/\[\d+y[\d_]+m\]/i, '').replace(/[_\[\]]/g, ' ').trim()

    return res.status(200).json({
      success: true,
      profile: {
        name: fname || 'Unknown',
        _fallback: true,
        summary: 'Parse error. Please fill details manually.'
      },
      error: error.message
    })
  }
}
