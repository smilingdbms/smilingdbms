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
