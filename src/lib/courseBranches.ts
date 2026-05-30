// @ts-nocheck
// ════════════════════════════════════════════════════════════════
// SHARED EDUCATION MAPPING — single source of truth
// Used by BOTH the candidate profile form (add/edit) AND the filter page,
// so education fields stay perfectly aligned (filter can never reference a
// course/branch the profile can't store).
//
// Structure:  EDUCATION_LEVELS  → ordered list of levels
//             COURSES_BY_LEVEL  → { level: [course, ...] }
//             BRANCHES_BY_COURSE→ { course: [branch, ...] }
//
// Every course/branch list ends conceptually with a free "Other" option,
// which the UI adds automatically (so users can type a custom value).
// ════════════════════════════════════════════════════════════════

export const EDUCATION_LEVELS = [
  '10th / SSC',
  '12th / HSC',
  'Diploma / ITI',
  'Bachelor (UG)',
  'Master (PG)',
  'Doctorate (PhD)',
  'Super-Speciality / Fellowship',
] as const

export const COURSES_BY_LEVEL: Record<string, string[]> = {
  '10th / SSC': ['10th / SSC'],
  '12th / HSC': ['12th - Science (PCM)', '12th - Science (PCB)', '12th - Commerce', '12th - Arts/Humanities', '12th - Other'],

  'Diploma / ITI': [
    'Polytechnic Diploma (Engineering)', 'ITI', 'D.Pharma', 'DMLT (Lab Tech)',
    'Diploma in Nursing (GNM)', 'ANM', 'Diploma in Hotel Management', 'Diploma in Education (D.El.Ed)',
    'Diploma in Computer Applications', 'Diploma in Design', 'Diploma in Architecture', 'Other Diploma',
  ],

  'Bachelor (UG)': [
    // Engineering / Tech
    'B.Tech', 'B.E.', 'BCA', 'B.Sc (IT/CS)',
    // Medical / Health
    'MBBS', 'BDS', 'BAMS', 'BHMS', 'BUMS', 'BPT (Physiotherapy)', 'B.Sc Nursing', 'B.Pharma', 'BVSc (Veterinary)', 'B.Optom', 'BMLT',
    // Science
    'B.Sc',
    // Commerce / Management
    'B.Com', 'BBA', 'BMS', 'BBM',
    // Arts / Humanities
    'BA', 'BFA (Fine Arts)', 'BSW (Social Work)', 'BJMC (Journalism)',
    // Law
    'LLB (3 yr)', 'BA LLB', 'BBA LLB', 'B.Com LLB',
    // Architecture / Design
    'B.Arch', 'B.Des (Design)', 'B.Plan (Planning)',
    // Education
    'B.Ed', 'BPEd',
    // Hospitality / Others
    'BHM (Hotel Mgmt)', 'BCA',
    'Other Bachelor',
  ],

  'Master (PG)': [
    // Engineering / Tech
    'M.Tech', 'M.E.', 'MCA', 'M.Sc (IT/CS)',
    // Medical / Health (broad specialities)
    'MD (Doctor of Medicine)', 'MS (Master of Surgery)', 'MDS', 'MPT (Physiotherapy)', 'M.Pharma', 'M.Sc Nursing', 'MVSc',
    // Science
    'M.Sc',
    // Management / Commerce
    'MBA', 'PGDM', 'M.Com', 'MMS',
    // Arts / Humanities
    'MA', 'MFA', 'MSW', 'MJMC',
    // Law
    'LLM',
    // Architecture / Design
    'M.Arch', 'M.Des', 'M.Plan',
    // Education
    'M.Ed', 'MPEd',
    // Hospitality
    'MHM',
    'Other Master',
  ],

  'Doctorate (PhD)': [
    'PhD - Engineering/Technology', 'PhD - Medical Sciences', 'PhD - Science', 'PhD - Management',
    'PhD - Arts/Humanities', 'PhD - Commerce', 'PhD - Law', 'PhD - Pharmacy', 'PhD - Education', 'PhD - Other',
  ],

  'Super-Speciality / Fellowship': [
    'DM (Doctorate of Medicine)', 'MCh (Master of Chirurgiae)', 'DNB Super-Speciality',
    'Fellowship (Medical)', 'Post-Doctoral Fellowship', 'Other Super-Speciality',
  ],
}

export const BRANCHES_BY_COURSE: Record<string, string[]> = {
  // ── Engineering UG/PG ──
  'B.Tech': ['Computer Science (CSE)', 'Information Technology (IT)', 'Electronics & Comm (ECE)', 'Electrical (EE)', 'Mechanical', 'Civil', 'Chemical', 'Aerospace', 'Automobile', 'Biotechnology', 'AI & ML', 'Data Science', 'Robotics', 'Mechatronics', 'Petroleum', 'Mining', 'Metallurgy', 'Instrumentation', 'Production', 'Marine'],
  'B.E.':   ['Computer Science (CSE)', 'Information Technology (IT)', 'Electronics & Comm (ECE)', 'Electrical (EE)', 'Mechanical', 'Civil', 'Chemical', 'Aerospace', 'Automobile', 'Biotechnology', 'AI & ML', 'Instrumentation', 'Production'],
  'M.Tech': ['Computer Science (CSE)', 'Software Engineering', 'VLSI Design', 'Embedded Systems', 'Power Systems', 'Structural Engineering', 'Thermal Engineering', 'Machine Design', 'AI & ML', 'Data Science', 'Communication Systems', 'Environmental Engineering', 'Transportation', 'Manufacturing'],
  'M.E.':   ['Computer Science (CSE)', 'VLSI Design', 'Power Systems', 'Structural Engineering', 'Thermal Engineering', 'AI & ML', 'Communication Systems'],
  'BCA':    ['General', 'Cloud Computing', 'Data Science', 'Cyber Security', 'AI & ML'],
  'MCA':    ['General', 'Cloud Computing', 'Data Science', 'Cyber Security', 'AI & ML'],
  'B.Sc (IT/CS)': ['Computer Science', 'Information Technology', 'Software Systems'],
  'M.Sc (IT/CS)': ['Computer Science', 'Information Technology', 'Data Science', 'Cyber Security'],

  // ── Medical UG ──
  'MBBS': ['General Medicine (MBBS)'],
  'BDS':  ['General Dentistry'],
  'BAMS': ['Ayurveda'],
  'BHMS': ['Homeopathy'],
  'BUMS': ['Unani Medicine'],
  'BPT (Physiotherapy)': ['Physiotherapy'],
  'B.Sc Nursing': ['Nursing'],
  'B.Pharma': ['Pharmacy'],
  'BVSc (Veterinary)': ['Veterinary Science'],

  // ── Medical PG (MD/MS) — the big specialities ──
  'MD (Doctor of Medicine)': ['General Medicine', 'Paediatrics', 'Dermatology', 'Psychiatry', 'Radiology', 'Anaesthesiology', 'Pathology', 'Microbiology', 'Pharmacology', 'Community Medicine', 'Respiratory Medicine', 'Biochemistry', 'Physiology', 'Anatomy', 'Forensic Medicine'],
  'MS (Master of Surgery)':  ['General Surgery', 'Orthopaedics', 'ENT', 'Ophthalmology', 'Obstetrics & Gynaecology', 'Anatomy', 'Urology'],
  'MDS': ['Orthodontics', 'Oral Surgery', 'Periodontics', 'Prosthodontics', 'Endodontics', 'Pedodontics', 'Oral Pathology'],
  'M.Pharma': ['Pharmaceutics', 'Pharmacology', 'Pharmaceutical Chemistry', 'Pharmacognosy', 'Quality Assurance', 'Clinical Pharmacy'],
  'MPT (Physiotherapy)': ['Orthopaedic Physiotherapy', 'Neuro Physiotherapy', 'Cardio Physiotherapy', 'Sports Physiotherapy'],
  'M.Sc Nursing': ['Medical Surgical Nursing', 'Community Health Nursing', 'Paediatric Nursing', 'Psychiatric Nursing', 'OBG Nursing'],

  // ── Super-Speciality ──
  'DM (Doctorate of Medicine)': ['Cardiology', 'Neurology', 'Nephrology', 'Gastroenterology', 'Endocrinology', 'Oncology (Medical)', 'Pulmonology', 'Haematology', 'Clinical Immunology', 'Neonatology'],
  'MCh (Master of Chirurgiae)': ['Plastic Surgery', 'Neuro Surgery', 'Cardiothoracic Surgery', 'Urology', 'Surgical Oncology', 'Paediatric Surgery', 'Vascular Surgery', 'GI Surgery'],
  'DNB Super-Speciality': ['Cardiology', 'Neurology', 'Nephrology', 'Gastroenterology', 'Plastic Surgery', 'Neuro Surgery'],

  // ── Science UG/PG ──
  'B.Sc': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Botany', 'Zoology', 'Microbiology', 'Biotechnology', 'Biochemistry', 'Statistics', 'Computer Science', 'Environmental Science', 'Agriculture', 'Geology', 'Electronics'],
  'M.Sc': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Botany', 'Zoology', 'Microbiology', 'Biotechnology', 'Biochemistry', 'Statistics', 'Environmental Science', 'Organic Chemistry', 'Analytical Chemistry'],

  // ── Commerce / Management ──
  'B.Com': ['General', 'Accounting & Finance', 'Banking & Insurance', 'Taxation', 'Computer Applications', 'Honours'],
  'M.Com': ['Accounting', 'Finance', 'Banking', 'Taxation', 'Business Management'],
  'BBA': ['General', 'Finance', 'Marketing', 'HR', 'International Business', 'Business Analytics'],
  'MBA': ['Finance', 'Marketing', 'Human Resources (HR)', 'Operations', 'Information Technology', 'Business Analytics', 'International Business', 'Supply Chain', 'Healthcare Management', 'Retail', 'Banking & Insurance', 'Entrepreneurship', 'Hospitality', 'Agribusiness', 'General'],
  'PGDM': ['Finance', 'Marketing', 'Human Resources (HR)', 'Operations', 'Business Analytics', 'International Business', 'General'],
  'BMS': ['Management Studies'], 'BBM': ['Business Management'], 'MMS': ['Management Studies'],

  // ── Arts / Humanities ──
  'BA': ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology', 'Geography', 'Philosophy', 'Public Administration', 'Hindi', 'Journalism', 'Fine Arts'],
  'MA': ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology', 'Geography', 'Philosophy', 'Public Administration', 'Journalism & Mass Comm'],
  'BFA (Fine Arts)': ['Painting', 'Sculpture', 'Applied Arts', 'Visual Communication'],
  'BJMC (Journalism)': ['Journalism', 'Mass Communication', 'Advertising', 'PR'],
  'BSW (Social Work)': ['Social Work'], 'MSW': ['Medical & Psychiatric', 'Community Development', 'HR', 'Family & Child Welfare'],

  // ── Law ──
  'LLB (3 yr)': ['General Law'], 'BA LLB': ['Constitutional', 'Corporate', 'Criminal', 'Cyber', 'General'],
  'BBA LLB': ['Corporate Law', 'Business Law', 'General'], 'B.Com LLB': ['Taxation Law', 'Corporate Law', 'General'],
  'LLM': ['Constitutional Law', 'Corporate Law', 'Criminal Law', 'Cyber Law', 'International Law', 'IPR', 'Taxation Law', 'Labour Law'],

  // ── Architecture / Design ──
  'B.Arch': ['Architecture'], 'M.Arch': ['Urban Design', 'Landscape', 'Sustainable Architecture', 'Construction Mgmt'],
  'B.Des (Design)': ['Product Design', 'Graphic Design', 'Fashion Design', 'Interior Design', 'UX/UI Design', 'Animation', 'Communication Design'],
  'M.Des': ['Product Design', 'Communication Design', 'UX/UI Design', 'Transportation Design', 'Interaction Design'],
  'B.Plan (Planning)': ['Urban Planning'], 'M.Plan': ['Urban Planning', 'Regional Planning', 'Transport Planning'],

  // ── Education ──
  'B.Ed': ['General'], 'M.Ed': ['Educational Administration', 'Curriculum & Pedagogy', 'Guidance & Counselling'],

  // ── Pharmacy diploma ──
  'D.Pharma': ['Pharmacy'],

  // ── Diploma engineering ──
  'Polytechnic Diploma (Engineering)': ['Mechanical', 'Civil', 'Electrical', 'Electronics', 'Computer', 'Automobile', 'Chemical'],
  'ITI': ['Electrician', 'Fitter', 'Welder', 'Mechanic (Motor Vehicle)', 'COPA (Computer)', 'Turner', 'Machinist', 'Plumber'],

  // ── Hotel Management ──
  'BHM (Hotel Mgmt)': ['Hotel Management', 'Culinary Arts', 'Hospitality'],

  // ── Doctorate ──
  'PhD - Engineering/Technology': ['Computer Science', 'Mechanical', 'Electrical', 'Civil', 'Electronics'],
  'PhD - Medical Sciences': ['Medicine', 'Pharmacology', 'Biotechnology', 'Microbiology'],
  'PhD - Management': ['Finance', 'Marketing', 'HR', 'Operations'],
  'PhD - Science': ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
}

// Helper: get courses for a level (always returns an array)
export function coursesForLevel(level: string): string[] {
  return COURSES_BY_LEVEL[level] || []
}

// Helper: get branches for a course (always returns an array; empty if none mapped)
export function branchesForCourse(course: string): string[] {
  return BRANCHES_BY_COURSE[course] || []
}

// ── Flat list of every valid course (for snap-matching) ──
export const ALL_COURSES: string[] = Array.from(
  new Set(Object.values(COURSES_BY_LEVEL).flat())
).filter(c => c && c !== '10th / SSC')

// Common full-name → short-form aliases (extend freely)
const COURSE_ALIASES: Record<string,string> = {
  'bachelor of computer application':'BCA','bachelor of computer applications':'BCA',
  'master of computer application':'MCA','master of computer applications':'MCA',
  'bachelor of technology':'B.Tech','master of technology':'M.Tech',
  'bachelor of engineering':'B.E.','master of engineering':'M.E.',
  'bachelor of commerce':'B.Com','master of commerce':'M.Com',
  'bachelor of arts':'BA','master of arts':'MA',
  'bachelor of science':'B.Sc','master of science':'M.Sc',
  'bachelor of business administration':'BBA','master of business administration':'MBA',
  'bachelor of medicine':'MBBS','bachelor of medicine and bachelor of surgery':'MBBS',
  'bachelor of dental surgery':'BDS','master of dental surgery':'MDS',
  'doctor of medicine':'MD (Doctor of Medicine)','master of surgery':'MS (Master of Surgery)',
  'bachelor of pharmacy':'B.Pharma','master of pharmacy':'M.Pharma',
  'bachelor of laws':'LLB (3 yr)','master of laws':'LLM','bachelor of law':'LLB (3 yr)',
  'bachelor of architecture':'B.Arch','master of architecture':'M.Arch',
  'bachelor of education':'B.Ed','master of education':'M.Ed',
  'intermediate':'12th - Science (PCM)','higher secondary':'12th - Science (PCM)','hsc':'12th - Science (PCM)',
  'matriculation':'10th / SSC','ssc':'10th / SSC','matric':'10th / SSC','high school':'10th / SSC',
}

// Snap an AI-extracted / free-text course to the closest valid course name.
// Returns the matched canonical course, or the original string if no good match.
export function snapToCourse(raw: string): string {
  if (!raw) return ''
  const s = raw.trim()
  const low = s.toLowerCase()
  // 1. exact (case-insensitive) match against valid list
  const exact = ALL_COURSES.find(c => c.toLowerCase() === low)
  if (exact) return exact
  // 2. alias match (full name → short form)
  if (COURSE_ALIASES[low]) return COURSE_ALIASES[low]
  // 3. alias partial (raw contains an alias key)
  for (const k of Object.keys(COURSE_ALIASES)) {
    if (low.includes(k)) return COURSE_ALIASES[k]
  }
  // 4. valid course appears inside the raw string (e.g. "B.Tech in CSE" → B.Tech)
  const contained = ALL_COURSES.find(c => low.includes(c.toLowerCase()))
  if (contained) return contained
  // 5. no confident match → keep original (treated as custom)
  return s
}

// Snap an AI-extracted level to a valid EDUCATION_LEVELS value.
export function snapToLevel(raw: string): string {
  if (!raw) return ''
  const low = raw.trim().toLowerCase()
  const exact = EDUCATION_LEVELS.find(l => l.toLowerCase() === low)
  if (exact) return exact
  if (/(^|\b)(10th|matric|ssc|high school)/.test(low)) return '10th / SSC'
  if (/(^|\b)(12th|inter|hsc|higher secondary|senior secondary)/.test(low)) return '12th / HSC'
  if (/(diploma|iti|polytechnic)/.test(low)) return 'Diploma / ITI'
  if (/(super.?special|fellowship|mch|\bdm\b)/.test(low)) return 'Super-Speciality / Fellowship'
  if (/(phd|doctorate|doctoral)/.test(low)) return 'Doctorate (PhD)'
  if (/(master|pg|post.?grad|m\.|mba|msc|mtech|ma\b|mca|md\b|ms\b)/.test(low)) return 'Master (PG)'
  if (/(bachelor|ug|under.?grad|b\.|bsc|btech|ba\b|bca|bcom|bba|mbbs)/.test(low)) return 'Bachelor (UG)'
  return raw.trim()
}
