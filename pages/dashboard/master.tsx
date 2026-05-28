// @ts-nocheck
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import { applyTheme, getSavedTheme, THEME_LIST } from '../../src/components/theme'
import Layout from '../../src/components/Layout'

// ── CONSTANTS ─────────────────────────────────────────────────────
const STATUSES = ['New','Contacted','Screening','Shortlisted','Interview Scheduled','Offer Made','Placed','Rejected','On Hold']
const INDUSTRIES = ['IT / Software','BFSI / Banking','Healthcare / Medical','FMCG / Consumer Goods','Real Estate / Property','Manufacturing / Engineering','E-commerce / Retail','Education / EdTech','Consulting / Advisory','Media / Advertising','Pharma / Biotech','Logistics / Supply Chain','Legal / Law','Hospitality / Travel','Telecom','Automobile','Infrastructure / Construction','Government / PSU','NGO / Social Sector','Other']
const CITIES = ['Delhi','Mumbai','Bangalore','Hyderabad','Pune','Chennai','Noida','Gurgaon','Kolkata','Ahmedabad','Jaipur','Lucknow','Chandigarh','Kochi','Nagpur','Indore','Bhopal','Surat','Vadodara','Patna','Ranchi','Coimbatore','Visakhapatnam','Bhubaneswar','Mysore','Nashik','Aurangabad','Rajkot','Jodhpur','Agra','Other']
const QUALIFICATIONS = ['MBBS','MD','MS','BDS','MDS','B.Tech','M.Tech','BE','ME','MCA','BCA','B.Sc','M.Sc','MBA','PGDM','BBA','CA (Qualified)','CA (Inter)','CMA','CS','LLB','LLM','BA','MA','B.Com','M.Com','PhD','Diploma','ITI','12th Pass','10th Pass','Graduate','Post Graduate','Other']
const SOURCES = ['Direct','WhatsApp','LinkedIn','Facebook','Instagram','Naukri','Indeed','Monster','Referral','Walk-in','Campus','Job Fair','Agency','Other']
const NOTICE_PERIODS = ['Immediate','7 days','15 days','1 month','2 months','3 months','Negotiable']
const WORK_MODES = ['WFH','Office','Hybrid','Flexible']
const LANGUAGES = ['Hindi','English','Tamil','Telugu','Kannada','Malayalam','Bengali','Marathi','Gujarati','Punjabi','Odia','Urdu']
const QUAL_BRANCHES: Record<string,string[]> = {
  'B.Tech':['Computer Science','Information Technology','Electronics','Electrical','Mechanical','Civil','Chemical','Biotechnology','Aerospace','Production'],
  'MBA':['Human Resources','Marketing','Finance','Sales','Operations','Supply Chain','IT','Healthcare','International Business','Strategy','Analytics'],
  'MBBS':['General Medicine','Surgery','Pediatrics','Gynecology','Orthopedics','ENT','Ophthalmology','Dermatology','Psychiatry','Radiology'],
  'M.Tech':['Computer Science','IT','Electronics','Electrical','Mechanical','Civil','VLSI','AI & ML','Data Science'],
}
const STATUS_COLORS: Record<string,{bg:string,color:string}> = {
  'New':{bg:'rgba(100,100,120,0.3)',color:'#aaa'},
  'Contacted':{bg:'rgba(30,90,200,0.25)',color:'#7ab3ff'},
  'Screening':{bg:'rgba(200,120,0,0.25)',color:'#ffb347'},
  'Shortlisted':{bg:'rgba(30,160,100,0.25)',color:'#3dd68c'},
  'Interview Scheduled':{bg:'rgba(0,160,160,0.25)',color:'#48cae4'},
  'Offer Made':{bg:'rgba(150,80,255,0.25)',color:'#c77dff'},
  'Placed':{bg:'rgba(30,160,30,0.3)',color:'#6fcf6f'},
  'Rejected':{bg:'rgba(200,50,50,0.25)',color:'#ff6b6b'},
  'On Hold':{bg:'rgba(80,80,100,0.3)',color:'#888'}
}
const STATUS_EMOJI: Record<string,string> = {'New':'🆕','Contacted':'📞','Screening':'🔍','Shortlisted':'⭐','Interview Scheduled':'📅','Offer Made':'💼','Placed':'🎯','Rejected':'❌','On Hold':'⏸️'}
const SEGMENT_CONFIG = {
  all:        { label:'All Profiles',   icon:'👥', color:'var(--ac)',  desc:'All segments combined' },
  fresher:    { label:'Freshers',        icon:'🎓', color:'#3dd68c',  desc:'0-1 year, students, interns' },
  experienced:{ label:'Experienced',    icon:'💼', color:'#6c8cff',  desc:'2+ years professionals' },
  recruiter:  { label:'Recruitment Team',icon:'🔍', color:'#c77dff', desc:'Recruiters & leaders' },
  bd:         { label:'Client Management',icon:'🤝',color:'#ff9f43', desc:'BD & client acquisition' },
}
const SKILL_SETS: Record<string,string[]> = {
  'IT':['React','Angular','Vue.js','Node.js','Python','Java','C++','C#','.NET','PHP','Django','Spring Boot','MySQL','PostgreSQL','MongoDB','AWS','Azure','GCP','Docker','Kubernetes','TypeScript','GraphQL','REST API','Flutter','Swift','Kotlin'],
  'Healthcare':['Patient Care','Clinical Research','EMR Systems','Medical Coding','ICD-10','CPT Coding','Surgical Assistance','ICU Management','OT Techniques','Radiology','Pathology','Pharmacology','NABH','JCI'],
  'Finance':['Financial Analysis','Tally','QuickBooks','SAP FICO','Taxation','Audit','GST','Income Tax','IFRS','IndAS','Financial Modeling','Investment Banking','Risk Management','Compliance'],
  'Sales':['B2B Sales','B2C Sales','CRM','Salesforce','Lead Generation','Cold Calling','Negotiation','Business Development','Key Account Management','Channel Sales','Direct Sales'],
  'HR':['Talent Acquisition','Recruitment','Payroll','HRIS','Performance Management','Employee Relations','Training & Development','Statutory Compliance','PF','ESI','Labour Laws','HRMS'],
  'Engineering':['AutoCAD','SolidWorks','CATIA','ANSYS','Project Management','Quality Control','ISO Standards','Six Sigma','Lean Manufacturing','PLC','SCADA'],
  'Legal':['Contract Drafting','Legal Research','Litigation','Corporate Law','FEMA','SEBI','Company Law','Labour Law','IPR','Compliance','Due Diligence'],
  'Marketing':['Digital Marketing','SEO','SEM','Social Media','Google Analytics','Content Marketing','Email Marketing','Brand Management','Market Research','Campaign Management'],
  'default':['MS Office','Communication','Team Management','Leadership','Problem Solving','Project Management','Time Management','Presentation','Negotiation']
}
const ROLE_HIERARCHY: Record<string,number> = {
  super_admin:7, platform_manager:6, admin:5, account_owner:4,
  team_manager:3, team_leader:3, sr_recruiter:2, recruiter:2,
  bd_manager:2, bd_executive:1, individual_recruiter:1
}
const POINTS_MAP: Record<string,number> = {add_profile:5,update_profile:2,add_note:3,shortlisted:10,offer_made:20,placed:50}

const EMPTY_PROFILE = {
  segment:'experienced', type:'Candidate', name:'', country_code:'+91 India',
  mobile:'', email:'', age:'', gender:'Male', city:'', other_city:'',
  role:'', qualification:'', qualification_branch:'', skills:'', industry:'',
  experience:'', total_experience:'', relevant_experience:'',
  current_company:'', current_ctc:'', expected_ctc:'', notice_period:'',
  reason_for_change:'', work_mode:'', willing_to_relocate:false, languages:'',
  graduation_year:'', cgpa:'', college:'', stipend_expected:'', has_internship:false,
  internship_details:'', available_immediately:true,
  linkedin:'', youtube_url:'', address:'', google_maps_url:'',
  status:'New', assigned_to:'', source:'Direct', source_detail:'',
  ai_summary:'', resume_url:'', resume_name:'', star_rating:0,
  channels:[] as string[], photos:[] as string[], photo_url:''
}

function getSkillSugs(role: string, ind: string, qual: string): string[] {
  const r=role.toLowerCase(),i=ind.toLowerCase(),q=qual.toLowerCase()
  if(r.includes('developer')||r.includes('software')||i.includes('it')||q.includes('b.tech')&&q.includes('cs')||q.includes('mca'))return SKILL_SETS['IT']
  if(r.includes('doctor')||r.includes('physician')||i.includes('health')||q.includes('mbbs'))return SKILL_SETS['Healthcare']
  if(r.includes('account')||r.includes('finance')||i.includes('bfsi')||q.includes('ca')||q.includes('b.com'))return SKILL_SETS['Finance']
  if(r.includes('sales')||r.includes('business dev')||i.includes('fmcg'))return SKILL_SETS['Sales']
  if(r.includes('hr')||r.includes('talent')||r.includes('recruiter'))return SKILL_SETS['HR']
  if(r.includes('civil')||r.includes('mechanical')||i.includes('manufacturing'))return SKILL_SETS['Engineering']
  if(r.includes('legal')||r.includes('lawyer')||q.includes('llb'))return SKILL_SETS['Legal']
  if(r.includes('market')||r.includes('digital')||i.includes('media'))return SKILL_SETS['Marketing']
  return SKILL_SETS['default']
}

function exportCSV(profiles: any[]) {
  const headers = ['Name','Mobile','Email','Role','Experience','Current CTC','Expected CTC','Notice Period','Qualification','Skills','City','Status','Source','Star Rating','Added On']
  const rows = profiles.map(p => [
    p.name||'', p.mobile||'', p.email||'', p.role||'',
    p.experience||'', p.current_ctc||'', p.expected_ctc||'',
    p.notice_period||'', p.qualification||'', p.skills||'',
    p.city||'', p.status||'', p.source||'', p.star_rating||'',
    new Date(p.created_at).toLocaleDateString('en-IN')
  ])
  const csv = [headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `candidates_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function downloadTemplate() {
  const headers = ['name','mobile','email','role','experience','current_ctc','expected_ctc','notice_period','qualification','skills','city','gender','age','source','linkedin','current_company','industry','work_mode']
  const sample = ['John Doe','9876543210','john@email.com','Software Engineer','3','8','12','1 month','B.Tech','React, Node.js','Delhi','Male','26','Direct','linkedin.com/in/john','ABC Corp','IT / Software','Hybrid']
  const csv = [headers, sample].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href=url; a.download='candidate_import_template.csv'; a.click()
  URL.revokeObjectURL(url)
}

const ADMIN_ROLES = ['super_admin','platform_admin','platform_manager','account_owner']

// Extended pipeline statuses (17 detailed stages)
const PIPELINE_STATUSES = [
  'New','Contacted - Interested','Contacted - Not Interested','Contacted - Call Back Later',
  'Contacted - Number Busy','Contacted - Not Reachable','Resume Received',
  'Resume Shortlisted','Interview Scheduled','Interview Done - Selected',
  'Interview Done - Rejected','Interview Done - On Hold','Offer Discussed',
  'Offer Accepted','Offer Declined','Did Not Join','Joined Successfully'
]
const PIPELINE_EMOJI: Record<string,string> = {
  'New':'🆕','Contacted - Interested':'✅','Contacted - Not Interested':'❌',
  'Contacted - Call Back Later':'📞','Contacted - Number Busy':'📵',
  'Contacted - Not Reachable':'🔕','Resume Received':'📄','Resume Shortlisted':'⭐',
  'Interview Scheduled':'📅','Interview Done - Selected':'🎯',
  'Interview Done - Rejected':'❌','Interview Done - On Hold':'⏸️',
  'Offer Discussed':'💬','Offer Accepted':'✅','Offer Declined':'🚫',
  'Did Not Join':'😔','Joined Successfully':'🎉'
}
const PIPELINE_COLORS: Record<string,{bg:string,color:string}> = {
  'New':{bg:'rgba(100,100,120,0.3)',color:'#aaa'},
  'Contacted - Interested':{bg:'rgba(30,160,100,0.25)',color:'#3dd68c'},
  'Contacted - Not Interested':{bg:'rgba(200,50,50,0.2)',color:'#ff6b6b'},
  'Contacted - Call Back Later':{bg:'rgba(30,90,200,0.25)',color:'#7ab3ff'},
  'Contacted - Number Busy':{bg:'rgba(150,100,0,0.25)',color:'#ffb347'},
  'Contacted - Not Reachable':{bg:'rgba(100,80,0,0.25)',color:'#ffd60a'},
  'Resume Received':{bg:'rgba(0,160,160,0.2)',color:'#48cae4'},
  'Resume Shortlisted':{bg:'rgba(150,80,255,0.2)',color:'#c77dff'},
  'Interview Scheduled':{bg:'rgba(0,140,255,0.2)',color:'#60b0ff'},
  'Interview Done - Selected':{bg:'rgba(30,200,100,0.25)',color:'#6fcf6f'},
  'Interview Done - Rejected':{bg:'rgba(200,50,50,0.25)',color:'#ff6b6b'},
  'Interview Done - On Hold':{bg:'rgba(80,80,100,0.3)',color:'#888'},
  'Offer Discussed':{bg:'rgba(150,80,255,0.2)',color:'#c77dff'},
  'Offer Accepted':{bg:'rgba(30,200,30,0.25)',color:'#3dd68c'},
  'Offer Declined':{bg:'rgba(200,50,50,0.2)',color:'#ff6b6b'},
  'Did Not Join':{bg:'rgba(150,50,50,0.2)',color:'#ff8888'},
  'Joined Successfully':{bg:'rgba(30,160,30,0.3)',color:'#6fcf6f'},
}
const FEEDBACK_OPTIONS = ['Contacted - Interested','Contacted - Not Interested','Contacted - Call Back Later','Contacted - Number Busy','Contacted - Not Reachable','Resume Received','Resume Shortlisted','Interview Scheduled','Interview Done - Selected','Interview Done - Rejected','Interview Done - On Hold','Offer Discussed','Offer Accepted','Offer Declined','Did Not Join','Joined Successfully','Custom']

export default function Dashboard() {
  // All users can access - RLS handles data isolation

  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [appUser, setAppUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [myTeam, setMyTeam] = useState<any>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [myPermissions, setMyPermissions] = useState<any>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // View
  const [viewLayout, setViewLayout] = useState<'table'|'cards'|'kanban'>('table')
  const [viewDensity, setViewDensity] = useState<'comfortable'|'compact'>('comfortable')
  const [activeSegment, setActiveSegment] = useState<'all'|'fresher'|'experienced'|'recruiter'|'bd'>('all')

  // Quick search
  const [search, setSearch] = useState('')

  // Smart filter state - grouped
  const [showFilters, setShowFilters] = useState(false)
  const [filterSection, setFilterSection] = useState<'quick'|'professional'|'fresher'|'activity'|'personal'>('quick')
  const [savedFilterName, setSavedFilterName] = useState('')
  const [savedFilters, setSavedFilters] = useState<any[]>([])

  // Quick filters
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [filterCity, setFilterCity] = useState<string[]>([])
  const [filterExpMin, setFilterExpMin] = useState('')
  const [filterExpMax, setFilterExpMax] = useState('')

  // Professional filters
  const [filterIndustry, setFilterIndustry] = useState<string[]>([])
  const [filterSkills, setFilterSkills] = useState<string[]>([])
  const [filterQual, setFilterQual] = useState<string[]>([])
  const [filterRole, setFilterRole] = useState('')
  const [filterCurrentCompany, setFilterCurrentCompany] = useState('')
  const [filterNoticePeriod, setFilterNoticePeriod] = useState<string[]>([])
  const [filterWorkMode, setFilterWorkMode] = useState<string[]>([])
  const [filterCTCMin, setFilterCTCMin] = useState('')
  const [filterCTCMax, setFilterCTCMax] = useState('')
  const [filterWillingToRelocate, setFilterWillingToRelocate] = useState('')

  // Fresher filters
  const [filterGradYear, setFilterGradYear] = useState('')
  const [filterCollege, setFilterCollege] = useState('')
  const [filterCGPAMin, setFilterCGPAMin] = useState('')
  const [filterHasInternship, setFilterHasInternship] = useState('')
  const [filterAvailableNow, setFilterAvailableNow] = useState('')

  // Activity filters
  const [filterDateAdded, setFilterDateAdded] = useState('')
  const [filterSource, setFilterSource] = useState<string[]>([])
  const [filterHasResume, setFilterHasResume] = useState('')
  const [filterHasVideo, setFilterHasVideo] = useState('')
  const [filterStarMin, setFilterStarMin] = useState(0)
  const [filterAssigned, setFilterAssigned] = useState('')
  const [filterCompletion, setFilterCompletion] = useState('')

  // Personal filters
  const [filterGender, setFilterGender] = useState('')
  const [filterAgeMin, setFilterAgeMin] = useState('')
  const [filterAgeMax, setFilterAgeMax] = useState('')
  const [filterLanguage, setFilterLanguage] = useState<string[]>([])
  const [filterDifferentlyAbled, setFilterDifferentlyAbled] = useState('')

  // Skill input
  const [skillInput, setSkillInput] = useState('')
  const [citySearch, setCitySearch] = useState('')

  // UI modals
  const [showAdd, setShowAdd] = useState(false)
  const [showProfile, setShowProfile] = useState<any>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showBulkMsg, setShowBulkMsg] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set())
  const [form, setForm] = useState<any>({...EMPTY_PROFILE})
  const [parsing, setParsing] = useState(false)
  const [parseMsg, setParseMsg] = useState('')
  const [newNote, setNewNote] = useState('')
  const [taggedUser, setTaggedUser] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [bulkMsg, setBulkMsg] = useState('')
  const [bulkType, setBulkType] = useState('whatsapp')
  const [pointsLog, setPointsLog] = useState<any[]>([])
  const [wizardStep, setWizardStep] = useState(1)
  const [statusToast, setStatusToast] = useState<{msg:string,color:string}|null>(null)
  const [successToast, setSuccessToast] = useState<string|null>(null)
  const [errorModal, setErrorModal] = useState<{title:string,msg:string}|null>(null)
  const [bulkImportModal, setBulkImportModal] = useState(false)
  const [importResult, setImportResult] = useState<{ok:number,fail:number,errors:string[]}|null>(null)
  const [importing, setImporting] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState('')
  const [filterAddedBy, setFilterAddedBy] = useState('')
  const photoRef = useRef<any>(null)
  const bulkFileRef = useRef<any>(null)

  useEffect(() => {
    applyTheme(getSavedTheme())
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      loadAll(session.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_,session) => { if (!session) router.push('/') })
    return () => subscription.unsubscribe()
  }, [])

  // Auto-open add form when redirected from /dashboard/add-profile
  useEffect(() => {
    if (router.query.action === 'add' && !loading) {
      setForm({...EMPTY_PROFILE, segment: activeSegment === 'all' ? 'experienced' : activeSegment});
      setShowAdd(true);
      setShowProfile(null);
      setWizardStep(1);
      router.replace('/dashboard/master', undefined, { shallow: true });
    }
  }, [router.query.action, loading])

  async function loadAll(u: any) {
    // Load user
    let { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    if (!au) {
      au = { id:u.id, email:u.email, full_name:u.user_metadata?.full_name||u.email?.split('@')[0]||'User', role:'recruiter', points:0, status:'active' }
      await supabase.from('app_users').upsert(au)
    }
    setAppUser(au)

    // Block job seekers from accessing dashboard
    if (au.role === 'job_seeker') {
      router.replace('/jobseeker')
      return
    }

    // Load company
    if (au.company_id) {
      const { data: co } = await supabase.from('companies').select('*').eq('id', au.company_id).single()
      setCompany(co)
    }

    // Load team
    if (au.team_id) {
      const { data: tm } = await supabase.from('teams').select('*').eq('id', au.team_id).single()
      setMyTeam(tm)
    }

    // Load permissions
    const { data: perms } = await supabase.from('user_permissions').select('*').eq('user_id', u.id).single()
    setMyPermissions(perms)

    // Load company users (all for super admin, company-scoped for others)
    if (['super_admin','platform_admin','platform_manager'].includes(au.role)) {
      const { data: users } = await supabase.from('app_users').select('*').order('full_name')
      setAllUsers(users || [])
    } else if (au.company_id) {
      const { data: users } = await supabase.from('app_users').select('*').eq('company_id', au.company_id)
      setAllUsers(users || [])
    }

    // Load profiles with data isolation
    await loadProfiles(au)

    // Load notifications
    const { data: notifs } = await supabase.from('notifications')
      .select('*, from_user:app_users!notifications_from_user_id_fkey(full_name)')
      .eq('user_id', u.id).order('created_at',{ascending:false}).limit(20)
    setNotifications(notifs || [])
    setUnreadCount((notifs||[]).filter((n:any)=>!n.is_read).length)

    // Load points log
    const { data: pl } = await supabase.from('points_log').select('*').eq('user_id', u.id).order('created_at',{ascending:false}).limit(50)
    setPointsLog(pl || [])

    // Load saved filters
    const { data: sf } = await supabase.from('saved_filters').select('*').eq('user_id', u.id).order('created_at',{ascending:false})
    setSavedFilters(sf || [])

    setLoading(false)
  }

  async function loadProfiles(au: any) {
    const isAdmin = ['super_admin','platform_manager','admin'].includes(au.role)
    const isOwner = au.role === 'account_owner'

    let q = supabase.from('profiles').select('*').order('created_at',{ascending:false})

    if (isAdmin) {
      // Super admin sees all
    } else if (au.company_id) {
      // Company members see company data
      q = q.eq('company_id', au.company_id)

      // Team isolation — if not owner/manager, only see own team
      if (!isOwner && !['team_manager','team_leader'].includes(au.role)) {
        if (au.team_id) {
          // Check cross-team permissions
          const { data: tv } = await supabase.from('team_visibility')
            .select('to_team_id').eq('from_team_id', au.team_id).eq('can_view', true)
          const allowedTeamIds = [au.team_id, ...(tv||[]).map((t:any)=>t.to_team_id)]
          q = q.or(allowedTeamIds.map((id:string)=>`team_id.eq.${id}`).join(',') + `,created_by.eq.${au.id}`)
        } else {
          q = q.or(`created_by.eq.${au.id},assigned_to.eq.${au.id}`)
        }
      }
    } else {
      // No company — see only own profiles
      q = q.or(`created_by.eq.${au.id},assigned_to.eq.${au.id}`)
      // Also show profiles with no company that were created by this user
      // This handles the case where company_id was not set
    }

    const { data: ps } = await q
    setProfiles(ps || [])
  }

  async function loadFeedbacks(profileId: string) {
    const { data } = await supabase.from('feedbacks')
      .select('*').eq('profile_id', profileId).order('created_at',{ascending:false})
    if (data) {
      // Enrich with user names from allUsers
      const enriched = data.map((f:any) => {
        const creator = allUsers.find((u:any)=>u.id===f.created_by)
        return { ...f, app_users: { full_name: creator?.full_name||'Unknown' } }
      })
      setFeedbacks(enriched)
    } else {
      setFeedbacks([])
    }
  }

  // ── Inline status change from table row ──────────────────
  async function quickStatusChange(profileId: string, oldStatus: string, newStatus: string) {
    if (oldStatus === newStatus) return
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', profileId)
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status: newStatus } : p))
      logActivity(profileId, 'status_changed', oldStatus, newStatus)
      showStatusToast(newStatus)
    }
  }

  async function logActivity(profileId: string, action: string, oldVal='', newVal='') {
    try {
      await supabase.rpc('log_profile_action', {
        p_profile_id: profileId, p_actor_id: user?.id,
        p_action: action, p_old_val: oldVal, p_new_val: newVal
      })
    } catch(e) { /* silent fail - activity log is non-critical */ }
  }

  function showError(title: string, msg: string) {
    setErrorModal({title, msg})
  }

  async function handleBulkImport(file: File) {
    if(!file) return
    setImporting(true)
    const text = await file.text()
    const rows = text.split('\n').filter(r=>r.trim())
    const headers = rows[0].replace(/"/g,'').split(',').map(h=>h.trim().toLowerCase())
    let ok=0, fail=0, errors: string[]=[]
    for(let i=1; i<rows.length; i++) {
      const vals = rows[i].match(/(".*?"|[^,]+)/g)?.map(v=>v.replace(/^"|"$/g,'').trim())||[]
      const row: any = {}
      headers.forEach((h,idx)=>{ row[h]=vals[idx]||'' })
      if(!row.name) { fail++; errors.push(`Row ${i+1}: Name is required`); continue }
      const payload = {
        name:row.name, mobile:row.mobile||'', email:row.email||'',
        role:row.role||'', experience:row.experience||null,
        current_ctc:row.current_ctc||null, expected_ctc:row.expected_ctc||null,
        notice_period:row.notice_period||'', qualification:row.qualification||'',
        skills:row.skills||'', city:row.city||'', gender:row.gender||'Male',
        age:row.age||null, source:row.source||'Direct',
        linkedin:row.linkedin||'', current_company:row.current_company||'',
        industry:row.industry||'', work_mode:row.work_mode||'',
        status:'New', segment:'experienced',
        company_id:appUser?.company_id||null,
        team_id:appUser?.team_id||null,
        created_by:user?.id
      }
      const {error} = await supabase.from('profiles').insert(payload)
      if(error) { fail++; errors.push(`Row ${i+1} (${row.name}): ${error.message}`) }
      else ok++
    }
    setImportResult({ok,fail,errors})
    setImporting(false)
    if(ok>0) loadProfiles(appUser)
  }

  async function handlePhotoUpload(file: File) {
    if(!file||!user) return
    setPhotoUploading(true)
    try {
      const blob = await new Promise<Blob>((resolve,reject)=>{
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let w=img.width, h=img.height, maxDim=600
            if(w>maxDim||h>maxDim){ if(w>h){h=Math.round(h*maxDim/w);w=maxDim}else{w=Math.round(w*maxDim/h);h=maxDim} }
            canvas.width=w; canvas.height=h
            canvas.getContext('2d')!.drawImage(img,0,0,w,h)
            canvas.toBlob(b=>b?resolve(b):reject(new Error('Failed')),'image/jpeg',0.8)
          }
          img.src = e.target?.result as string
        }
        reader.readAsDataURL(file)
      })
      const path = `profiles/${user.id}/${Date.now()}.jpg`
      const {error:upErr} = await supabase.storage.from('photos').upload(path,blob,{upsert:true,contentType:'image/jpeg'})
      if(upErr){ showError('Upload Failed',upErr.message); setPhotoUploading(false); return }
      const {data:urlData} = supabase.storage.from('photos').getPublicUrl(path)
      if(urlData?.publicUrl) sf('photo_url', urlData.publicUrl)
    } catch(e){ showError('Upload Error','Could not upload photo. Try a JPG or PNG image.') }
    setPhotoUploading(false)
  }

  function showSuccess(msg: string) {
    setSuccessToast(msg)
    setTimeout(()=>setSuccessToast(null), 3000)
  }

  function showStatusToast(status: string) {
    const sc = STATUS_COLORS[status]||{color:'#fff'}
    setStatusToast({msg:`${STATUS_EMOJI[status]||''} Status → ${status}`, color:sc.color})
    setTimeout(()=>setStatusToast(null), 2500)
  }

  async function revealContact(profileId: string) {
    if (!myPermissions?.can_reveal_contacts) { showError('Permission Denied','You do not have permission to reveal contacts. Ask your Account Owner.'); return }
    setRevealedContacts(prev => new Set([...prev, profileId]))
    try { await supabase.from('contact_views').insert({ profile_id: profileId, viewed_by: user?.id }) } catch(e) {}
    logActivity(profileId, 'viewed')
  }

  async function markAllRead() {
    await supabase.from('notifications').update({is_read:true}).eq('user_id',user?.id).eq('is_read',false)
    setNotifications(prev=>prev.map(n=>({...n,is_read:true}))); setUnreadCount(0)
  }

  function openProfile(p: any) {
    setShowProfile(p); setShowAdd(false)
    setForm({...EMPTY_PROFILE,...p,
      channels: Array.isArray(p.channels)?p.channels:p.channels?JSON.parse(p.channels):[],
      photos: Array.isArray(p.photos)?p.photos:p.photos?JSON.parse(p.photos):[],
    })
    setWizardStep(1)
    loadFeedbacks(p.id)
    logActivity(p.id, 'viewed')
  }

  async function saveProfile() {
    if (!form.name?.trim()) { showError('Name Required',"Please enter the candidate's full name."); return }
    // SA can add without company_id - RLS handles isolation
    setSaving(true)
    // All numeric columns are now TEXT in DB - just send strings safely
    const n = (v:any) => (v===null||v===undefined||String(v).trim()==='')?null:String(v).trim()
    const i = (v:any) => (v===null||v===undefined||String(v).trim()==='')?null:String(v).trim()
    const u = (v:any) => (!v||String(v).trim()===''||String(v).trim()==='null')?null:v
    const s = (v:any) => (v===null||v===undefined)?'':String(v).trim()
    const payload = {
      name: s(form.name),
      mobile: (form.mobile||'').replace(/\D/g,'').slice(0,15),
      email: s(form.email),
      gender: s(form.gender)||'Male',
      segment: s(form.segment)||'experienced',
      type: 'Candidate',
      status: s(form.status)||'New',
      source: s(form.source)||'Direct',
      source_detail: s(form.source_detail),
      country_code: s(form.country_code)||'+91 India',
      role: s(form.role),
      industry: s(form.industry),
      qualification: s(form.qualification),
      qualification_branch: s(form.qualification_branch),
      skills: s(form.skills),
      city: s(form.city)||s(form.other_city),
      other_city: s(form.other_city),
      address: s(form.address),
      google_maps_url: s(form.google_maps_url),
      languages: s(form.languages),
      linkedin: s(form.linkedin),
      youtube_url: s(form.youtube_url),
      current_company: s(form.current_company),
      notice_period: s(form.notice_period),
      reason_for_change: s(form.reason_for_change),
      work_mode: s(form.work_mode),
      college: s(form.college),
      internship_details: s(form.internship_details),
      ai_summary: s(form.ai_summary),
      resume_url: s(form.resume_url),
      resume_name: s(form.resume_name),
      photo_url: s(form.photo_url),
      // Numbers - null if empty
      age: i(form.age),
      experience: n(form.experience),
      total_experience: n(form.total_experience),
      relevant_experience: n(form.relevant_experience),
      current_ctc: n(form.current_ctc),
      expected_ctc: n(form.expected_ctc),
      cgpa: n(form.cgpa),
      graduation_year: i(form.graduation_year),
      stipend_expected: n(form.stipend_expected),
      star_rating: i(form.star_rating)||0,
      // Booleans
      willing_to_relocate: !!form.willing_to_relocate,
      has_internship: !!form.has_internship,
      available_immediately: form.available_immediately!==false,
      // UUIDs - null if empty
      company_id: u(appUser?.company_id),
      team_id: u(appUser?.team_id),
      assigned_to: u(form.assigned_to),
      // Arrays
      channels: Array.isArray(form.channels)?form.channels:[],
      photos: Array.isArray(form.photos)?form.photos:[],
    }
    if (showProfile?.id) {
      const { data, error } = await supabase.from('profiles').update(payload).eq('id',showProfile.id).select().single()
      if (error) { showError('Update Failed', error.message); setSaving(false); return }
      if (data) {
        setProfiles(prev=>prev.map(p=>p.id===data.id?data:p))
        showSuccess('✅ Profile updated successfully!')
        logActivity(data.id, 'edited', showProfile.status, data.status)
        if (showProfile.status !== data.status) logActivity(data.id, 'status_changed', showProfile.status, data.status)
      }
    } else {
      const { data, error } = await supabase.from('profiles').insert({...payload,created_by:user?.id}).select().single()
      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('mobile')) {
            showError('Duplicate Mobile','This mobile number already exists in your database.')
          } else if (error.message.includes('email')) {
            showError('Duplicate Email','This email already exists in your database.')
          } else {
            showError('Duplicate Entry','A similar profile already exists.')
          }
        } else {
          showError('Save Failed', error.message)
        }
        setSaving(false); return
      }
      if (data) {
        setProfiles(prev=>[data,...prev])
        showSuccess('✅ Profile added successfully!')
        setShowAdd(false)
        setShowProfile(null)
        logActivity(data.id, 'created')
        // Update points
        setTimeout(async()=>{
          const { data: updUser } = await supabase.from('app_users').select('points').eq('id',user.id).single()
          if (updUser) setAppUser((prev:any)=>({...prev,points:updUser.points}))
        }, 500)
      }
    }
    setSaving(false)
  }

  async function deleteProfile(id: string) {
    if (!myPermissions?.can_delete_profiles && !['super_admin','admin','account_owner'].includes(appUser?.role)) {
      showError('Permission Denied','You do not have permission to delete profiles.'); return
    }
    if (!confirm('Delete this profile permanently?')) return
    await supabase.from('profiles').delete().eq('id',id)
    setProfiles(prev=>prev.filter(p=>p.id!==id))
    setShowProfile(null)
    showSuccess('🗑️ Profile deleted successfully.')
  }

  async function addNote() {
    if ((!newNote.trim() && !selectedFeedback) || !showProfile?.id) return
    setSavingNote(true)
    try {
      const tagName = taggedUser ? allUsers.find((u:any)=>u.id===taggedUser)?.full_name||'' : ''
      const noteText = selectedFeedback&&selectedFeedback!=='Custom'
        ? selectedFeedback+(newNote.trim()?' — '+newNote.trim():'')
        : newNote.trim()
      const finalText = noteText+(tagName?` [@${tagName}]`:'')
      // Insert note - simple insert without join
      const { data, error } = await supabase.from('feedbacks').insert({
        profile_id: showProfile.id,
        text: finalText,
        created_by: user?.id,
        tagged_user: taggedUser||null
      }).select().single()
      if (error) {
        showError('Note Failed', error.message)
      } else if (data) {
        // Fetch creator name separately
        const authorName = appUser?.full_name || 'You'
        const noteWithAuthor = { ...data, app_users: { full_name: authorName } }
        setFeedbacks(prev=>[noteWithAuthor,...prev])
        setNewNote(''); setSelectedFeedback(''); setTaggedUser('')
        logActivity(showProfile.id, 'note_added', '', finalText.slice(0,50))
        if (taggedUser && taggedUser !== user?.id) {
          try {
            await supabase.from('notifications').insert({
              user_id: taggedUser, from_user_id: user?.id, type: 'mention',
              title: `${appUser?.full_name||'Someone'} mentioned you`,
              message: `On profile ${showProfile?.name}: "${noteText.slice(0,80)}"`,
              is_read: false, company_id: appUser?.company_id
            })
          } catch(e) {}
        }
      }
    } catch(e: any) {
      showError('Note Error', e?.message||'Could not save note. Please try again.')
    }
    setSavingNote(false)
  }

  const sf = (k:string,v:any) => setForm((f:any)=>({...f,[k]:v}))
  function toggleFilter<T>(arr: T[], val: T, setter: (v:T[])=>void) {
    setter(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr,val])
  }

  // ── FILTER LOGIC ──────────────────────────────────────────────
  const activeFilterCount = [
    filterStatus.length, filterCity.length, filterIndustry.length, filterQual.length,
    filterSkills.length, filterSource.length, filterNoticePeriod.length,
    filterWorkMode.length, filterLanguage.length,
    filterRole?1:0, filterCurrentCompany?1:0, filterCTCMin?1:0, filterCTCMax?1:0,
    filterExpMin?1:0, filterExpMax?1:0, filterGender?1:0, filterDateAdded?1:0,
    filterHasResume?1:0, filterHasVideo?1:0, filterStarMin?1:0, filterAssigned?1:0,
    filterGradYear?1:0, filterCollege?1:0, filterCGPAMin?1:0, filterHasInternship?1:0,
    filterCompletion?1:0, filterAgeMin?1:0, filterAgeMax?1:0, filterWillingToRelocate?1:0,
  ].reduce((a,b)=>a+b,0)

  function clearAllFilters() {
    setFilterStatus([]); setFilterCity([]); setFilterIndustry([]); setFilterQual([])
    setFilterSkills([]); setFilterSource([]); setFilterNoticePeriod([])
    setFilterWorkMode([]); setFilterLanguage([])
    setFilterRole(''); setFilterCurrentCompany(''); setFilterCTCMin(''); setFilterCTCMax('')
    setFilterExpMin(''); setFilterExpMax(''); setFilterGender(''); setFilterDateAdded('')
    setFilterHasResume(''); setFilterHasVideo(''); setFilterStarMin(0); setFilterAssigned('')
    setFilterGradYear(''); setFilterCollege(''); setFilterCGPAMin(''); setFilterHasInternship('')
    setFilterCompletion(''); setFilterAgeMin(''); setFilterAgeMax(''); setFilterWillingToRelocate('')
    setFilterAddedBy(''); setSearch('')
  }

  const isAdmin = ADMIN_ROLES.includes(appUser?.role||'')
  function getAddedByLabel(p: any) {
    if(p.source==='Job Portal') return {label:'Self (JS)',color:'#3dd68c'}
    // Check in allUsers first (company users)
    const creator = allUsers.find((u:any)=>u.id===p.created_by)
    if(creator) return {label:(creator.full_name||'Unknown').split(' ')[0], color:'#c77dff'}
    // If created_by matches current user (Super Admin / platform user)
    if(p.created_by === user?.id) return {label:(appUser?.full_name||'Me').split(' ')[0], color:'#ffd60a'}
    // Has a created_by but not found in company users = platform admin
    if(p.created_by) return {label:'Platform', color:'#ff9f43'}
    return {label:'—', color:'var(--mu2)'}
  }
  const canAddProfiles = myPermissions?.can_add_profiles !== false || ['super_admin','admin','account_owner','team_manager','team_leader','sr_recruiter','recruiter','individual_recruiter'].includes(appUser?.role||'')


  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    if (q && ![p.name,p.mobile,p.email,p.role,p.city,p.skills,p.qualification,p.industry,p.current_company,p.college].some(v=>(v||'').toLowerCase().includes(q))) return false
    if (activeSegment !== 'all' && (p.segment||'experienced') !== activeSegment) return false
    if (filterStatus.length && !filterStatus.includes(p.status||'New')) return false
    if (filterCity.length && !filterCity.includes(p.city)) return false
    if (filterIndustry.length && !filterIndustry.includes(p.industry)) return false
    if (filterQual.length && !filterQual.includes(p.qualification)) return false
    if (filterSkills.length && !filterSkills.every((s:string) => (p.skills||'').toLowerCase().includes(s.toLowerCase()))) return false
    if (filterSource.length && !filterSource.includes(p.source)) return false
    if (filterNoticePeriod.length && !filterNoticePeriod.includes(p.notice_period)) return false
    if (filterWorkMode.length && !filterWorkMode.includes(p.work_mode)) return false
    if (filterLanguage.length && !filterLanguage.some((l:string) => (p.languages||'').includes(l))) return false
    if (filterRole && !(p.role||'').toLowerCase().includes(filterRole.toLowerCase())) return false
    if (filterCurrentCompany && !(p.current_company||'').toLowerCase().includes(filterCurrentCompany.toLowerCase())) return false
    if (filterExpMin && (!p.experience || parseFloat(p.experience) < parseFloat(filterExpMin))) return false
    if (filterExpMax && (!p.experience || parseFloat(p.experience) > parseFloat(filterExpMax))) return false
    if (filterCTCMin && (!p.current_ctc || p.current_ctc < parseFloat(filterCTCMin))) return false
    if (filterCTCMax && (!p.current_ctc || p.current_ctc > parseFloat(filterCTCMax))) return false
    if (filterGender && p.gender !== filterGender) return false
    if (filterAssigned && p.assigned_to !== filterAssigned && p.created_by !== filterAssigned) return false
    if (filterStarMin && (!p.star_rating || p.star_rating < filterStarMin)) return false
    if (filterHasResume === 'yes' && !p.resume_url) return false
    if (filterHasResume === 'no' && p.resume_url) return false
    if (filterHasVideo === 'yes' && !p.youtube_url) return false
    if (filterHasVideo === 'no' && p.youtube_url) return false
    if (filterCompletion && (p.profile_completion||0) < parseInt(filterCompletion)) return false
    if (filterGradYear && p.graduation_year?.toString() !== filterGradYear) return false
    if (filterCollege && !(p.college||'').toLowerCase().includes(filterCollege.toLowerCase())) return false
    if (filterCGPAMin && (!p.cgpa || p.cgpa < parseFloat(filterCGPAMin))) return false
    if (filterHasInternship === 'yes' && !p.has_internship) return false
    if (filterHasInternship === 'no' && p.has_internship) return false
    if (filterWillingToRelocate === 'yes' && !p.willing_to_relocate) return false
    if (filterWillingToRelocate === 'no' && p.willing_to_relocate) return false
    if (filterAgeMin && (!p.age || p.age < parseInt(filterAgeMin))) return false
    if (filterAgeMax && (!p.age || p.age > parseInt(filterAgeMax))) return false
    if (filterDateAdded) {
      const days = parseInt(filterDateAdded)
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-days)
      if (new Date(p.created_at) < cutoff) return false
    }
    if(isAdmin && filterAddedBy) {
      if(filterAddedBy==='self_js' && p.source!=='Job Portal') return false
      if(filterAddedBy!=='self_js' && p.created_by!==filterAddedBy) return false
    }
    return true
  })

  const stats = {
    total: profiles.length,
    fresher: profiles.filter(p=>(p.segment||'experienced')==='fresher').length,
    experienced: profiles.filter(p=>(p.segment||'experienced')==='experienced').length,
    recruiter: profiles.filter(p=>p.segment==='recruiter').length,
    bd: profiles.filter(p=>p.segment==='bd').length,
    shortlisted: profiles.filter(p=>p.status==='Shortlisted').length,
    inProgress: profiles.filter(p=>['Contacted','Screening','Interview Scheduled'].includes(p.status)).length,
    placed: profiles.filter(p=>p.status==='Placed').length,
    offerMade: profiles.filter(p=>p.status==='Offer Made').length,
  }

  const statusBadge = (status:string) => {
    const s = STATUS_COLORS[status]||{bg:'rgba(100,100,120,0.3)',color:'#aaa'}
    return <span style={{padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:s.bg,color:s.color,whiteSpace:'nowrap' as const}}>{status||'New'}</span>
  }

  const assignedUserName = (id: string) => allUsers.find(u=>u.id===id)?.full_name || '—'
  const skillSugs = getSkillSugs(form.role||'', form.industry||'', form.qualification||'')
  const IS:any = {width:'100%',background:'var(--bg3)',border:'1px solid var(--bd2)',borderRadius:8,padding:'9px 12px',color:'var(--tx)',fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}
  const LS:any = {display:'block',fontSize:10,fontWeight:600,color:'var(--mu)',textTransform:'uppercase',letterSpacing:1,marginBottom:4,marginTop:10}
  const tdPad = viewDensity==='compact'?'7px 12px':'11px 14px'

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',flexDirection:'column',gap:12}}>
      <div style={{width:40,height:40,border:'3px solid var(--ac)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        /* ── Light theme overrides ── */
        [data-theme='light'] .rh:hover td{background:rgba(0,0,0,0.04)!important;}
        [data-theme='light'] select option{background:#fff;color:#1a1a2e;}
        [data-theme='light'] input::placeholder,[data-theme='light'] textarea::placeholder{color:#999;}
        [data-theme='light'] .seg-btn{background:#f5f5f5;color:#555;}
        [data-theme='light'] .seg-btn.on{background:rgba(108,140,255,0.12);color:#4a6cf7;}
        [data-theme='light'] .filter-chip{background:transparent;color:#666;}
        [data-theme='light'] .filter-chip.on,.filter-chip:hover{background:rgba(108,140,255,0.1);color:#4a6cf7;}
        [data-theme='light'] .tag-pill{background:rgba(108,140,255,0.1);color:#4a6cf7;}
        [data-theme='light'] .status-sel{filter:brightness(0.9);}`}</style>
      <div style={{fontSize:13,color:'var(--mu)',fontFamily:'Outfit,sans-serif'}}>Loading {company?.name||'RecruitBase Pro'}...</div>
    </div>
  )

  return (
    <>
      <style>{`html,body,#__next{overscroll-behavior:none !important;overscroll-behavior-x:none !important;}*{-webkit-overflow-scrolling:touch;}
        select option{background:var(--bg3,#22262f);color:var(--tx,#fff);}
      `}</style>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        select option{background:var(--bg3,#22262f);}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        html,body{overscroll-behavior:none;overscroll-behavior-x:none;}
        .no-swipe{overscroll-behavior:contain;touch-action:pan-y;}
        .rh:hover td{background:var(--bg3)!important;}
        .card-h:hover{border-color:var(--ac)!important;transform:translateY(-2px);}
        input:focus,select:focus,textarea:focus{border-color:var(--ac)!important;outline:none;}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:4px}
        .seg-btn{padding:8px 14px;border-radius:10px;border:1px solid var(--bd);cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;transition:all .15s;background:var(--bg2);color:var(--mu);display:flex;align-items:center;gap:6px;white-space:nowrap;}
        .seg-btn.on{background:var(--acbg);color:var(--ac);border-color:var(--ac);}
        .filter-chip{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--bd);background:transparent;color:var(--mu);transition:all .15s;font-family:inherit;}
        .filter-chip:hover,.filter-chip.on{background:var(--acbg);color:var(--ac);border-color:var(--ac);}
        .filter-section-btn{padding:6px 12px;border-radius:20px;border:1px solid var(--bd);background:transparent;color:var(--mu);cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;transition:all .15s;}
        .filter-section-btn.on{background:var(--ac);color:#fff;border-color:var(--ac);}
        .tag-pill{display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:3px 8px;border-radius:20px;background:var(--acbg);color:var(--ac);margin:2px;}
        .tag-pill .rm{cursor:pointer;opacity:0.6;font-size:10px;}
        .tag-pill .rm:hover{opacity:1;}
        @media(max-width:900px){.hide-sm{display:none!important;}}
        /* Light theme refinements */
        [data-theme='light'] select option{background:#f1f5f9;color:#0f172a;}
        [data-theme='light'] .seg-btn{background:#f1f5f9;color:#475569;border-color:rgba(0,0,0,0.1);}
        [data-theme='light'] .seg-btn.on{background:rgba(79,70,229,0.1);color:#4f46e5;border-color:#4f46e5;}
        [data-theme='light'] .filter-chip{color:#475569;border-color:rgba(0,0,0,0.12);}
        [data-theme='light'] .filter-chip.on{background:rgba(79,70,229,0.1);color:#4f46e5;border-color:#4f46e5;}
        [data-theme='light'] .tag-pill{background:rgba(79,70,229,0.1);color:#4f46e5;}
        [data-theme='light'] .rh:hover td{background:rgba(0,0,0,0.03)!important;}
        [data-theme='light'] .card-h:hover{border-color:#4f46e5!important;}
        [data-theme='light'] input:focus,[data-theme='light'] select:focus,[data-theme='light'] textarea:focus{border-color:#4f46e5!important;}
        /* ══ LIGHT THEME - Professional LinkedIn/Naukri quality ══ */
        body[class~='light'] *,:root:has(body.light) *{transition:background .2s,color .2s,border-color .2s;}
        .light-theme input,.light-theme select,.light-theme textarea{background:#fff!important;color:#1a1a2e!important;border-color:#d0d5dd!important;}
        .light-theme .rh:hover td{background:#f0f4ff!important;}
        .light-theme .seg-btn{background:#f2f4f8!important;color:#444!important;border-color:#dde1ec!important;}
        .light-theme .seg-btn.on{background:#eef2ff!important;color:#4a6cf7!important;border-color:#4a6cf7!important;}
        .light-theme .filter-chip{background:transparent!important;color:#555!important;border-color:#d0d5dd!important;}
        .light-theme .filter-chip.on{background:#eef2ff!important;color:#4a6cf7!important;border-color:#4a6cf7!important;}
        .light-theme .tag-pill{background:#eef2ff!important;color:#4a6cf7!important;}
      `}</style>


      {successToast && (
        <div style={{position:'fixed',top:24,right:24,zIndex:99999,
          background:'var(--gnbg)',border:'1px solid var(--gn)',
          borderRadius:12,padding:'12px 20px',fontSize:13,fontWeight:700,
          color:'var(--gn)',boxShadow:'var(--sh)',
          display:'flex',alignItems:'center',gap:8,
          animation:'slideDown 0.25s ease'}}>
          {successToast}
        </div>
      )}
      {statusToast && (
        <div style={{position:'fixed',top:24,left:'50%',transform:'translateX(-50%)',zIndex:99999,background:'var(--bg2)',border:`1px solid ${statusToast.color}`,borderRadius:14,padding:'12px 28px',fontSize:14,fontWeight:700,color:statusToast.color,boxShadow:'0 8px 32px rgba(0,0,0,0.6)',display:'flex',alignItems:'center',gap:10,whiteSpace:'nowrap' as const,animation:'slideDown 0.25s ease'}}>
          {statusToast.msg}
        </div>
      )}
      {errorModal && (
        <div style={{position:'fixed',inset:0,zIndex:100100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'var(--bg2)',border:'1px solid rgba(255,107,107,0.3)',borderRadius:18,padding:28,maxWidth:400,width:'100%',textAlign:'center' as const,animation:'fadeIn 0.2s ease'}}>
            <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>{errorModal.title}</div>
            <div style={{fontSize:13,color:'var(--mu)',lineHeight:1.6,marginBottom:20}}>{errorModal.msg}</div>
            <button onClick={()=>setErrorModal(null)} style={{padding:'10px 28px',borderRadius:10,background:'rgba(255,107,107,0.12)',color:'#ff6b6b',border:'1px solid rgba(255,107,107,0.3)',cursor:'pointer',fontFamily:'inherit',fontWeight:600,fontSize:14}}>Close</button>
          </div>
        </div>
      )}

      {bulkImportModal && (
        <div style={{position:'fixed',inset:0,zIndex:100100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:20,padding:24,width:'100%',maxWidth:480,boxShadow:'0 24px 80px rgba(0,0,0,0.5)',animation:'fadeIn 0.2s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700}}>⬆ Bulk Import Candidates</div>
              <button onClick={()=>{setBulkImportModal(false);setImportResult(null)}} style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,width:28,height:28,cursor:'pointer',color:'var(--tx)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            {!importResult ? (
              <>
                <div style={{background:'var(--bg3)',borderRadius:12,padding:16,marginBottom:14,border:'1px solid var(--bd)'}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>📋 How it works:</div>
                  <div style={{fontSize:12,color:'var(--mu)',lineHeight:1.8}}>1. Download the template CSV<br/>2. Fill in candidate data in Excel/Sheets<br/>3. Upload filled CSV here<br/>4. System imports all rows automatically</div>
                </div>
                <button onClick={downloadTemplate} style={{width:'100%',padding:'10px',borderRadius:10,background:'rgba(108,140,255,0.12)',color:'var(--ac)',border:'1px solid rgba(108,140,255,0.3)',cursor:'pointer',fontFamily:'inherit',fontWeight:600,fontSize:13,marginBottom:10}}>📄 Download Template CSV</button>
                <div style={{border:'2px dashed var(--bd2)',borderRadius:12,padding:'28px 20px',textAlign:'center' as const,background:'var(--bg3)',marginBottom:14}}>
                  {importing ? (
                    <div><div style={{width:32,height:32,border:'3px solid var(--ac)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 10px'}}/><div style={{fontSize:13,color:'var(--mu)'}}>Importing candidates...</div></div>
                  ) : (
                    <>
                      <div style={{fontSize:28,marginBottom:6}}>📂</div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Drop CSV file here or click to browse</div>
                      <div style={{fontSize:11,color:'var(--mu)',marginBottom:12}}>Only CSV format · Max 500 rows per upload</div>
                      <input ref={bulkFileRef} type='file' accept='.csv' style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleBulkImport(f)}}/>
                      <button onClick={()=>bulkFileRef.current?.click()} style={{padding:'8px 20px',borderRadius:8,background:'var(--ac)',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>Browse CSV File</button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div>
                <div style={{display:'flex',gap:12,marginBottom:16}}>
                  <div style={{flex:1,background:'rgba(61,214,140,0.1)',border:'1px solid rgba(61,214,140,0.3)',borderRadius:12,padding:'14px',textAlign:'center' as const}}><div style={{fontSize:28,fontWeight:800,color:'#3dd68c'}}>{importResult.ok}</div><div style={{fontSize:11,color:'var(--mu)',fontWeight:600}}>IMPORTED ✅</div></div>
                  <div style={{flex:1,background:'rgba(255,107,107,0.1)',border:'1px solid rgba(255,107,107,0.3)',borderRadius:12,padding:'14px',textAlign:'center' as const}}><div style={{fontSize:28,fontWeight:800,color:'#ff6b6b'}}>{importResult.fail}</div><div style={{fontSize:11,color:'var(--mu)',fontWeight:600}}>FAILED ❌</div></div>
                </div>
                {importResult.errors.length>0&&<div style={{background:'var(--bg3)',borderRadius:10,padding:12,maxHeight:150,overflowY:'auto' as const,marginBottom:14}}>{importResult.errors.map((e,i)=><div key={i} style={{fontSize:11,color:'#ff6b6b',padding:'2px 0'}}>{e}</div>)}</div>}
                <button onClick={()=>{setBulkImportModal(false);setImportResult(null)}} style={{width:'100%',padding:'10px',borderRadius:10,background:'var(--ac)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:600,fontSize:13}}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div style={{background:'var(--bg2)',borderBottom:'1px solid var(--bd)',padding:'0 20px',height:54,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:9,padding:'6px 14px',flex:1,maxWidth:420}}>
          <span style={{color:'var(--mu)',fontSize:14,flexShrink:0}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search name, skill, mobile, company, city..."
            style={{background:'none',border:'none',outline:'none',color:'var(--tx)',fontSize:13,fontFamily:'inherit',width:'100%'}}/>
          {search && <span onClick={()=>setSearch('')} style={{color:'var(--mu)',cursor:'pointer',fontSize:12}}>✕</span>}
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center',marginLeft:'auto'}}>
          {/* Layout */}
          <div style={{display:'flex',background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,overflow:'hidden'}}>
            {([['table','☰'],['cards','⊞'],['kanban','▦']] as const).map(([v,icon])=>(
              <button key={v} onClick={()=>setViewLayout(v)} style={{padding:'6px 10px',border:'none',cursor:'pointer',fontSize:13,fontFamily:'inherit',background:viewLayout===v?'var(--ac)':'transparent',color:viewLayout===v?'#fff':'var(--mu)',transition:'all .15s'}}>{icon}</button>
            ))}
          </div>
          {/* Density */}
          <div style={{display:'flex',background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,overflow:'hidden'}}>
            {([['comfortable','≡'],['compact','☰☰']] as const).map(([v,icon])=>(
              <button key={v} onClick={()=>setViewDensity(v)} style={{padding:'6px 9px',border:'none',cursor:'pointer',fontSize:11,fontFamily:'inherit',background:viewDensity===v?'var(--acbg)':'transparent',color:viewDensity===v?'var(--ac)':'var(--mu)',transition:'all .15s'}}>{icon}</button>
            ))}
          </div>
          {/* Export CSV */}
          <button onClick={()=>exportCSV(filtered)} title="Export to CSV" style={{background:'rgba(61,214,140,0.1)',color:'#3dd68c',border:'1px solid rgba(61,214,140,0.2)',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>⬇ CSV</button>
          <button onClick={()=>setBulkImportModal(true)} style={{background:'rgba(108,140,255,0.1)',color:'var(--ac)',border:'1px solid rgba(108,140,255,0.2)',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>⬆ Bulk Import</button>
          <button onClick={downloadTemplate} style={{background:'rgba(255,214,10,0.1)',color:'#ffd60a',border:'1px solid rgba(255,214,10,0.2)',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>📄 Template</button>
          {/* Notifications */}
          <div style={{position:'relative'}}>
            <button onClick={()=>setShowNotifications(v=>!v)} style={{position:'relative',background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,width:36,height:36,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>
              🔔
              {unreadCount>0 && <span style={{position:'absolute',top:-3,right:-3,background:'#ff6b6b',color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{unreadCount>9?'9+':unreadCount}</span>}
            </button>
            {showNotifications && (
              <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'var(--bg2)',border:'1px solid var(--bd2)',borderRadius:14,padding:12,zIndex:200,boxShadow:'0 8px 32px rgba(0,0,0,0.4)',minWidth:300,animation:'fadeIn 0.15s ease'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <span style={{fontSize:13,fontWeight:700}}>🔔 Notifications</span>
                  {unreadCount>0 && <button onClick={markAllRead} style={{fontSize:11,color:'var(--ac)',background:'none',border:'none',cursor:'pointer'}}>Mark all read</button>}
                </div>
                {notifications.length===0 ? <div style={{fontSize:12,color:'var(--mu)',textAlign:'center',padding:'16px 0'}}>No notifications</div>
                : notifications.slice(0,8).map(n=>(
                  <div key={n.id} style={{padding:'9px 10px',borderRadius:8,marginBottom:4,background:n.is_read?'transparent':'var(--acbg)',border:`1px solid ${n.is_read?'transparent':'var(--bd2)'}`}}>
                    <div style={{fontSize:12,fontWeight:600}}>{n.title}</div>
                    <div style={{fontSize:11,color:'var(--mu)',marginTop:2}}>{n.message?.slice(0,70)}</div>
                    <div style={{fontSize:10,color:'var(--mu2)',marginTop:3}}>{new Date(n.created_at).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Points */}
          <button onClick={()=>setShowPoints(true)} style={{fontSize:12,padding:'6px 12px',borderRadius:8,background:'rgba(255,214,10,0.1)',color:'#ffd60a',border:'1px solid rgba(255,214,10,0.2)',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>
            ⭐ {appUser?.points||0}
          </button>
          {canAddProfiles && <>
            <button onClick={()=>setShowUpload(true)} style={{background:'var(--ac)',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>📄 Upload CV</button>
            <button onClick={()=>{setForm({...EMPTY_PROFILE,segment:activeSegment==='all'?'experienced':activeSegment});setShowAdd(true);setShowProfile(null);setWizardStep(1)}} style={{background:'var(--acbg)',color:'var(--ac)',border:'1px solid var(--bd2)',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>+ Add Profile</button>
          </>}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>

        {/* COMPANY BANNER */}
        {company && (
          <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:12,padding:'10px 16px',marginBottom:14,display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:36,height:36,borderRadius:8,background:'var(--acbg)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'var(--ac)',fontSize:16,flexShrink:0}}>{company.name[0]}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700}}>{company.name}</div>
              <div style={{fontSize:11,color:'var(--mu)'}}>Company Code: <span style={{color:'var(--ac)',fontWeight:600}}>{company.company_code}</span> · {company.subscription_plan?.toUpperCase()||'FREE'} Plan · {allUsers.length} users</div>
            </div>
            {myTeam && <div style={{fontSize:11,background:'var(--bg3)',padding:'4px 10px',borderRadius:20,color:'var(--mu)',border:'1px solid var(--bd)'}}>Team: <strong style={{color:'var(--tx)'}}>{myTeam.name}</strong></div>}
            {appUser?.role==='account_owner' && (
              <button onClick={()=>router.push('/dashboard/permissions')} style={{background:'rgba(255,214,10,0.1)',color:'#ffd60a',border:'1px solid rgba(255,214,10,0.2)',borderRadius:8,padding:'6px 12px',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>⚙️ Permissions</button>
            )}
          </div>
        )}

        {/* SEGMENT TABS */}
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap' as const}}>
          {(Object.entries(SEGMENT_CONFIG) as any[]).map(([key,cfg])=>(
            <button key={key} className={`seg-btn${activeSegment===key?' on':''}`} onClick={()=>setActiveSegment(key as any)}>
              <span style={{fontSize:14}}>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span style={{fontSize:10,background:activeSegment===key?'var(--acbg)':'var(--bg3)',padding:'1px 7px',borderRadius:20,color:activeSegment===key?'var(--ac)':'var(--mu2)'}}>
                {key==='all'?stats.total:stats[key as keyof typeof stats]||0}
              </span>
            </button>
          ))}
        </div>

        {/* STAT CARDS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:10,marginBottom:14}}>
          {[
            {l:'Total',v:stats.total,c:'var(--ac)',t:'All profiles'},
            {l:'Freshers',v:stats.fresher,c:'#3dd68c',t:'0-1yr exp'},
            {l:'Experienced',v:stats.experienced,c:'#6c8cff',t:'2+ yrs exp'},
            {l:'Team',v:stats.recruiter,c:'#c77dff',t:'Recruiters'},
            {l:'Clients',v:stats.bd,c:'#ff9f43',t:'BD segment'},
            {l:'Shortlisted',v:stats.shortlisted,c:'#48cae4',t:'Ready'},
            {l:'Offer Made',v:stats.offerMade,c:'#ffd60a',t:'Pending join'},
            {l:'Placed',v:stats.placed,c:'#6fcf6f',t:`${Math.round(stats.placed/Math.max(stats.total,1)*100)}% rate`},
          ].map(s=>(
            <div key={s.l} onClick={()=>{}} style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:10,padding:'10px 12px',borderTop:`2px solid ${s.c}`,cursor:'default',transition:'all .2s',textAlign:'center' as const}}>
              <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
              <div style={{fontSize:9,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginTop:2}}>{s.l}</div>
              <div style={{fontSize:9,color:'var(--mu2)',marginTop:1}}>{s.t}</div>
            </div>
          ))}
        </div>

        {/* ACTION + FILTER BAR */}
        <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center',flexWrap:'wrap' as const}}>
          <button onClick={()=>setShowFilters(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,border:'1px solid var(--bd)',background:showFilters||activeFilterCount>0?'var(--acbg)':'var(--bg2)',color:showFilters||activeFilterCount>0?'var(--ac)':'var(--mu)',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>
            ⚙️ Filters
            {activeFilterCount>0 && <span style={{background:'var(--ac)',color:'#fff',borderRadius:'50%',width:17,height:17,fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{activeFilterCount}</span>}
          </button>
          {activeFilterCount>0 && <button onClick={clearAllFilters} style={{padding:'7px 12px',borderRadius:8,background:'transparent',color:'#ff6b6b',border:'1px solid rgba(255,107,107,0.3)',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>✕ Clear All</button>}
          {selectedProfiles.length>0 && <>
            <button onClick={()=>setShowBulkMsg(true)} style={{padding:'7px 14px',borderRadius:8,background:'var(--acbg)',color:'var(--ac)',border:'1px solid var(--bd2)',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>📨 Message {selectedProfiles.length}</button>
            <button onClick={()=>setSelectedProfiles([])} style={{padding:'7px 10px',borderRadius:8,background:'transparent',color:'var(--mu)',border:'1px solid var(--bd)',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>✕ Clear</button>
          </>}
          <div style={{marginLeft:'auto',fontSize:12,color:'var(--mu)'}}>
            Showing <strong style={{color:'var(--tx)'}}>{filtered.length}</strong> of <strong style={{color:'var(--tx)'}}>{profiles.length}</strong>
          </div>
        </div>

        {/* ── WORLD-CLASS FILTER PANEL ─────────────────────────────── */}
        {showFilters && (
          <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:14,padding:18,marginBottom:16,animation:'fadeIn 0.2s ease'}}>
            {/* Filter section nav */}
            <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap' as const}}>
              {([['quick','Quick'],['professional','Professional'],['fresher','Fresher'],['activity','Activity'],['personal','Personal']] as const).map(([v,l])=>(
                <button key={v} className={`filter-section-btn${filterSection===v?' on':''}`} onClick={()=>setFilterSection(v)}>{l}</button>
              ))}
              {activeFilterCount>0 && (
                <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center',fontSize:11,color:'var(--mu)'}}>
                  {filtered.length} matching
                  <button onClick={clearAllFilters} style={{fontSize:11,color:'#ff6b6b',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>Clear all</button>
                </div>
              )}
            </div>

            {/* QUICK FILTERS */}
            {filterSection==='quick' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Pipeline Status</div>
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:4}}>
                    {PIPELINE_STATUSES.map(s=>{
                      const sc=PIPELINE_COLORS[s]||STATUS_COLORS[s]||{bg:'rgba(100,100,120,0.3)',color:'#aaa'}
                      const on=filterStatus.includes(s)
                      return <button key={s} onClick={()=>toggleFilter(filterStatus,s,setFilterStatus)} style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',border:`1px solid ${on?sc.color:'var(--bd)'}`,background:on?sc.bg:'transparent',color:on?sc.color:'var(--mu)',fontFamily:'inherit'}}>{PIPELINE_EMOJI[s]||''} {s}</button>
                    })}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Experience (years)</div>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                    <input value={filterExpMin} onChange={e=>setFilterExpMin(e.target.value)} placeholder="Min" type="number" min="0" style={{...IS,padding:'7px 10px',width:75,textAlign:'center' as const}}/>
                    <span style={{color:'var(--mu)',fontSize:12}}>to</span>
                    <input value={filterExpMax} onChange={e=>setFilterExpMax(e.target.value)} placeholder="Max" type="number" min="0" style={{...IS,padding:'7px 10px',width:75,textAlign:'center' as const}}/>
                    <span style={{fontSize:11,color:'var(--mu)'}}>yrs</span>
                  </div>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap' as const}}>
                    {[['0-1','0','1'],['1-3','1','3'],['3-5','3','5'],['5-10','5','10'],['10+','10','50']].map(([l,mn,mx])=>(
                      <button key={l} onClick={()=>{setFilterExpMin(mn);setFilterExpMax(mx)}} style={{padding:'2px 8px',borderRadius:20,fontSize:10,cursor:'pointer',border:'1px solid var(--bd)',background:filterExpMin===mn&&filterExpMax===mx?'var(--acbg)':'transparent',color:filterExpMin===mn&&filterExpMax===mx?'var(--ac)':'var(--mu)',fontFamily:'inherit'}}>{l}y</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>City / Location</div>
                  <select onChange={e=>{if(e.target.value)toggleFilter(filterCity,e.target.value,setFilterCity)}} value="" style={{...IS,fontSize:12,marginBottom:6}}>
                    <option value="">+ Add City</option>
                    {CITIES.filter(c=>!filterCity.includes(c)).map(c=><option key={c}>{c}</option>)}
                  </select>
                  <div style={{display:'flex',flexWrap:'wrap' as const}}>
                    {filterCity.map(c=><span key={c} className="tag-pill">{c} <span className="rm" onClick={()=>toggleFilter(filterCity,c,setFilterCity)}>✕</span></span>)}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Skills</div>
                  <div style={{display:'flex',gap:6,marginBottom:6}}>
                    <input value={skillInput} onChange={e=>setSkillInput(e.target.value)}
                      onKeyDown={e=>{if((e.key==='Enter'||e.key===',')&&skillInput.trim()){toggleFilter(filterSkills,skillInput.trim(),setFilterSkills);setSkillInput('')}}}
                      placeholder="Type skill + Enter" style={{...IS,fontSize:12,flex:1}}/>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap' as const}}>
                    {filterSkills.map(s=><span key={s} className="tag-pill" style={{background:'rgba(61,214,140,0.12)',color:'#3dd68c'}}>{s} <span className="rm" onClick={()=>toggleFilter(filterSkills,s,setFilterSkills)}>✕</span></span>)}
                  </div>
                </div>
              </div>
            )}

            {/* PROFESSIONAL FILTERS */}
            {filterSection==='professional' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Designation / Role</div>
                  <input value={filterRole} onChange={e=>setFilterRole(e.target.value)} placeholder="e.g. Software Engineer, HR..." style={{...IS,fontSize:12}}/>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Current Company</div>
                  <input value={filterCurrentCompany} onChange={e=>setFilterCurrentCompany(e.target.value)} placeholder="Search current company..." style={{...IS,fontSize:12}}/>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Industry</div>
                  <select onChange={e=>{if(e.target.value)toggleFilter(filterIndustry,e.target.value,setFilterIndustry)}} value="" style={{...IS,fontSize:12,marginBottom:6}}>
                    <option value="">+ Add Industry</option>
                    {INDUSTRIES.filter(i=>!filterIndustry.includes(i)).map(i=><option key={i}>{i}</option>)}
                  </select>
                  <div style={{display:'flex',flexWrap:'wrap' as const}}>
                    {filterIndustry.map(i=><span key={i} className="tag-pill">{i.split('/')[0].trim()} <span className="rm" onClick={()=>toggleFilter(filterIndustry,i,setFilterIndustry)}>✕</span></span>)}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Qualification</div>
                  <select onChange={e=>{if(e.target.value)toggleFilter(filterQual,e.target.value,setFilterQual)}} value="" style={{...IS,fontSize:12,marginBottom:6}}>
                    <option value="">+ Add Qualification</option>
                    {QUALIFICATIONS.filter(q=>!filterQual.includes(q)).map(q=><option key={q}>{q}</option>)}
                  </select>
                  <div style={{display:'flex',flexWrap:'wrap' as const}}>
                    {filterQual.map(q=><span key={q} className="tag-pill" style={{background:'rgba(199,125,255,0.12)',color:'#c77dff'}}>{q} <span className="rm" onClick={()=>toggleFilter(filterQual,q,setFilterQual)}>✕</span></span>)}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Current CTC (₹ LPA)</div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input value={filterCTCMin} onChange={e=>setFilterCTCMin(e.target.value)} placeholder="Min" type="number" style={{...IS,padding:'7px 10px',width:80,textAlign:'center' as const}}/>
                    <span style={{color:'var(--mu)'}}>—</span>
                    <input value={filterCTCMax} onChange={e=>setFilterCTCMax(e.target.value)} placeholder="Max" type="number" style={{...IS,padding:'7px 10px',width:80,textAlign:'center' as const}}/>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Notice Period</div>
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:4}}>
                    {NOTICE_PERIODS.map(n=>(
                      <button key={n} onClick={()=>toggleFilter(filterNoticePeriod,n,setFilterNoticePeriod)} className={`filter-chip${filterNoticePeriod.includes(n)?' on':''}`}>{n}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Work Mode Preference</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
                    {WORK_MODES.map(w=>(
                      <button key={w} onClick={()=>toggleFilter(filterWorkMode,w,setFilterWorkMode)} className={`filter-chip${filterWorkMode.includes(w)?' on':''}`}>{w}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Willing to Relocate</div>
                  <div style={{display:'flex',gap:6}}>
                    {[['yes','Yes'],['no','No'],['','Any']].map(([v,l])=>(
                      <button key={l} onClick={()=>setFilterWillingToRelocate(v)} className={`filter-chip${filterWillingToRelocate===v?' on':''}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FRESHER FILTERS */}
            {filterSection==='fresher' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Graduation Year</div>
                  <select value={filterGradYear} onChange={e=>setFilterGradYear(e.target.value)} style={{...IS,fontSize:12}}>
                    <option value="">Any Year</option>
                    {[2024,2025,2026,2027,2028,2023,2022,2021,2020].map(y=><option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>College / University</div>
                  <input value={filterCollege} onChange={e=>setFilterCollege(e.target.value)} placeholder="College name..." style={{...IS,fontSize:12}}/>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>CGPA (Minimum)</div>
                  <div style={{display:'flex',gap:6}}>
                    {['6.0','6.5','7.0','7.5','8.0','8.5','9.0'].map(c=>(
                      <button key={c} onClick={()=>setFilterCGPAMin(filterCGPAMin===c?'':c)} className={`filter-chip${filterCGPAMin===c?' on':''}`}>{c}+</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Internship Done?</div>
                  <div style={{display:'flex',gap:6}}>
                    {[['yes','Yes'],['no','No'],['','Any']].map(([v,l])=>(
                      <button key={l} onClick={()=>setFilterHasInternship(v)} className={`filter-chip${filterHasInternship===v?' on':''}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Available Immediately?</div>
                  <div style={{display:'flex',gap:6}}>
                    {[['yes','Yes'],['no','No'],['','Any']].map(([v,l])=>(
                      <button key={l} onClick={()=>setFilterAvailableNow(v)} className={`filter-chip${filterAvailableNow===v?' on':''}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

                {isAdmin && (
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'#ffd60a',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>🔐 Added By <span style={{fontSize:9,fontWeight:400,color:'var(--mu2)'}}>(Admin only)</span></div>
                    <select value={filterAddedBy} onChange={e=>setFilterAddedBy(e.target.value)} style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,padding:'8px 12px',color:'var(--tx)',fontSize:12,fontFamily:'inherit',outline:'none'}}>
                      <option value=''>All — Everyone</option>
                      <option value='self_js'>🟢 Self-registered (Job Seeker)</option>
                      {allUsers.map((u:any)=><option key={u.id} value={u.id}>{u.full_name} · {u.role?.replace(/_/g,' ')}</option>)}
                    </select>
                    {filterAddedBy&&<div style={{marginTop:4,fontSize:10,color:'#ffd60a'}}>✓ Filtering by: {filterAddedBy==='self_js'?'Self-registered JS':allUsers.find((u:any)=>u.id===filterAddedBy)?.full_name}</div>}
                  </div>
                )}
            {/* ACTIVITY FILTERS */}
            {filterSection==='activity' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Date Added</div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap' as const}}>
                    {[['7','Last 7 days'],['30','Last 30 days'],['90','Last 3 months'],['180','Last 6 months'],['365','Last year']].map(([v,l])=>(
                      <button key={v} onClick={()=>setFilterDateAdded(filterDateAdded===v?'':v)} className={`filter-chip${filterDateAdded===v?' on':''}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Source</div>
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:4}}>
                    {SOURCES.map(s=>(
                      <button key={s} onClick={()=>toggleFilter(filterSource,s,setFilterSource)} className={`filter-chip${filterSource.includes(s)?' on':''}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Resume & Video</div>
                  <div style={{display:'flex',flexDirection:'column' as const,gap:6}}>
                    <div style={{display:'flex',gap:6,alignItems:'center',fontSize:12,color:'var(--mu)'}}>
                      Resume:
                      {[['yes','Has ✓'],['no','Missing'],['','Any']].map(([v,l])=>(
                        <button key={l} onClick={()=>setFilterHasResume(v)} className={`filter-chip${filterHasResume===v?' on':''}`}>{l}</button>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'center',fontSize:12,color:'var(--mu)'}}>
                      Video:
                      {[['yes','Has ✓'],['no','Missing'],['','Any']].map(([v,l])=>(
                        <button key={l} onClick={()=>setFilterHasVideo(v)} className={`filter-chip${filterHasVideo===v?' on':''}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Star Rating (Min)</div>
                  <div style={{display:'flex',gap:5}}>
                    {[0,1,2,3,4,5].map(r=>(
                      <button key={r} onClick={()=>setFilterStarMin(filterStarMin===r?0:r)} style={{width:32,height:32,borderRadius:7,border:`1px solid ${filterStarMin===r?'#ffd60a':'var(--bd)'}`,background:filterStarMin===r?'rgba(255,214,10,0.12)':'transparent',color:filterStarMin===r?'#ffd60a':'var(--mu)',cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>
                        {r===0?'★':r+'★'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Profile Completion</div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap' as const}}>
                    {['25','50','75','100'].map(p=>(
                      <button key={p} onClick={()=>setFilterCompletion(filterCompletion===p?'':p)} className={`filter-chip${filterCompletion===p?' on':''}`}>{p}%+</button>
                    ))}
                  </div>
                </div>
                {(ROLE_HIERARCHY[appUser?.role]||0)>=3 && (
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Assigned To</div>
                    <select value={filterAssigned} onChange={e=>setFilterAssigned(e.target.value)} style={{...IS,fontSize:12}}>
                      <option value="">All Team Members</option>
                      {allUsers.map(u=>(<option key={u.id} value={u.id}>{u.full_name} ({u.role?.replace(/_/g,' ')})</option>))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* PERSONAL FILTERS */}
            {filterSection==='personal' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Gender</div>
                  <div style={{display:'flex',gap:6}}>
                    {['Male','Female','Other',''].map(g=>(
                      <button key={g||'Any'} onClick={()=>setFilterGender(g)} className={`filter-chip${filterGender===g?' on':''}`}>{g||'Any'}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Age Range</div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input value={filterAgeMin} onChange={e=>setFilterAgeMin(e.target.value)} placeholder="Min" type="number" style={{...IS,padding:'7px 10px',width:75,textAlign:'center' as const}}/>
                    <span style={{color:'var(--mu)'}}>—</span>
                    <input value={filterAgeMax} onChange={e=>setFilterAgeMax(e.target.value)} placeholder="Max" type="number" style={{...IS,padding:'7px 10px',width:75,textAlign:'center' as const}}/>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:8}}>Languages Known</div>
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:4}}>
                    {LANGUAGES.map(l=>(
                      <button key={l} onClick={()=>toggleFilter(filterLanguage,l,setFilterLanguage)} className={`filter-chip${filterLanguage.includes(l)?' on':''}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Active filter summary */}
            {activeFilterCount>0 && (
              <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' as const}}>
                <span style={{fontSize:11,color:'var(--mu)',fontWeight:600}}>Active:</span>
                {filterStatus.map(s=><span key={s} className="tag-pill" style={{background:STATUS_COLORS[s]?.bg,color:STATUS_COLORS[s]?.color}}>{s}</span>)}
                {filterCity.map(c=><span key={c} className="tag-pill">📍{c}</span>)}
                {filterIndustry.map(i=><span key={i} className="tag-pill">{i.split('/')[0]}</span>)}
                {filterSkills.map(s=><span key={s} className="tag-pill" style={{background:'rgba(61,214,140,0.12)',color:'#3dd68c'}}>{s}</span>)}
                {filterQual.map(q=><span key={q} className="tag-pill" style={{background:'rgba(199,125,255,0.12)',color:'#c77dff'}}>{q}</span>)}
                {filterExpMin&&<span className="tag-pill">{filterExpMin}-{filterExpMax||'∞'}y exp</span>}
                {filterCTCMin&&<span className="tag-pill">CTC {filterCTCMin}+L</span>}
                {filterGender&&<span className="tag-pill">{filterGender}</span>}
                {filterStarMin>0&&<span className="tag-pill" style={{background:'rgba(255,214,10,0.12)',color:'#ffd60a'}}>{filterStarMin}+★</span>}
                {filterDateAdded&&<span className="tag-pill">Last {filterDateAdded}d</span>}
                {filterHasResume&&<span className="tag-pill">{filterHasResume==='yes'?'Has Resume':'No Resume'}</span>}
                {filterGradYear&&<span className="tag-pill">Grad {filterGradYear}</span>}
                {filterWillingToRelocate&&<span className="tag-pill">Relocate:{filterWillingToRelocate}</span>}
                {isAdmin&&filterAddedBy&&<span className="tag-pill" style={{background:'rgba(255,214,10,0.12)',color:'#ffd60a'}}>By: {filterAddedBy==='self_js'?'Self (JS)':allUsers.find((u:any)=>u.id===filterAddedBy)?.full_name?.split(' ')[0]}</span>}
              </div>
            )}
          </div>
        )}

        {/* ── TABLE VIEW ───────────────────────────────────────────── */}
        {viewLayout==='table' && (
          <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:14,overflow:'hidden'}}>
            <div style={{padding:'11px 18px',borderBottom:'1px solid var(--bd)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:13}}>{SEGMENT_CONFIG[activeSegment].icon} {SEGMENT_CONFIG[activeSegment].label} <span style={{fontSize:11,color:'var(--mu)',fontWeight:400,marginLeft:6}}>{filtered.length} profiles</span></div>
            </div>
            <div style={{overflowX:'auto' as const}}>
              <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:13}}>
                <thead>
                  <tr style={{background:'var(--bg3)'}}>
                    <th style={{width:36,padding:'9px 12px'}}><input type="checkbox" onChange={e=>{if(e.target.checked)setSelectedProfiles(filtered.map(p=>p.id));else setSelectedProfiles([])}} checked={selectedProfiles.length===filtered.length&&filtered.length>0}/></th>
                    {[...['Name / Contact','Segment','Role','Qualification','Exp','CTC','Status','City','Source','★','Team'],...(isAdmin?['Added By']:[]),'Actions'].map(h=>(

                      <th key={h} style={{textAlign:'left' as const,padding:'9px 14px',fontSize:10,fontWeight:700,color:h==='Added By'?'#ffd60a':'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',whiteSpace:'nowrap' as const}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0
                    ? <tr><td colSpan={13} style={{textAlign:'center',padding:56,color:'var(--mu)'}}>
                        <div style={{fontSize:32,marginBottom:10}}>🔍</div>
                        <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>No profiles match</div>
                        <div style={{fontSize:12}}>Try different filters or <span onClick={clearAllFilters} style={{color:'var(--ac)',cursor:'pointer'}}>clear all</span></div>
                      </td></tr>
                    : filtered.map(p=>{
                      const colors=['#6c8cff','#3dd68c','#c77dff','#ff9f43','#48cae4','#ffd60a','#ff6b6b']
                      const col=colors[(p.name?.charCodeAt(0)||0)%colors.length]
                      const seg=SEGMENT_CONFIG[p.segment||'experienced']
                      return (
                        <tr key={p.id} className="rh" style={{borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer'}}>
                          <td style={{padding:tdPad}} onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedProfiles.includes(p.id)} onChange={()=>setSelectedProfiles(prev=>prev.includes(p.id)?prev.filter(x=>x!==p.id):[...prev,p.id])}/></td>
                          <td style={{padding:tdPad,minWidth:180}} onClick={()=>openProfile(p)}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              {p.photo_url
                                ? <img src={p.photo_url} alt="" style={{width:32,height:32,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>
                                : <div style={{width:32,height:32,borderRadius:'50%',background:`${col}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:col,flexShrink:0}}>{(p.name||'?')[0].toUpperCase()}</div>
                              }
                              <div>
                                <div style={{fontWeight:600,color:'var(--tx)',fontSize:13}}>{p.name}</div>
                                <div style={{fontSize:11,color:'var(--mu)',marginTop:1}}>
                                  {revealedContacts.has(p.id)
                                    ? (p.mobile?((p.country_code||'+91').split(' ')[0])+p.mobile:p.email||'—')
                                    : <span style={{color:'var(--mu2)'}}>+91 •••••••••<span onClick={e=>{e.stopPropagation();revealContact(p.id)}} style={{marginLeft:5,color:'var(--ac)',cursor:'pointer',fontSize:9,fontWeight:700}}>View</span></span>
                                  }
                                </div>
                                {p.profile_completion>0 && <div style={{height:2,background:'var(--bg4)',borderRadius:1,marginTop:3,width:60}}><div style={{height:'100%',width:`${p.profile_completion}%`,background:p.profile_completion>74?'#3dd68c':p.profile_completion>49?'#ff9f43':'#ff6b6b',borderRadius:1}}/></div>}
                              </div>
                            </div>
                          </td>
                          <td style={{padding:tdPad}} onClick={()=>openProfile(p)}>
                            <span style={{padding:'2px 7px',borderRadius:6,fontSize:10,fontWeight:600,background:`${seg?.color||'#888'}22`,color:seg?.color||'#888'}}>{seg?.icon} {seg?.label||'—'}</span>
                          </td>
                          <td style={{padding:tdPad,fontSize:12,color:'var(--mu)',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}} onClick={()=>openProfile(p)}>{p.role||'—'}</td>
                          <td style={{padding:tdPad,fontSize:11,color:'var(--mu)'}} onClick={()=>openProfile(p)}>{p.qualification||'—'}</td>
                          <td style={{padding:tdPad,fontSize:12,color:'var(--mu)'}} onClick={()=>openProfile(p)}>{p.experience?p.experience+'y':'—'}</td>
                          <td style={{padding:tdPad,fontSize:11,color:'var(--mu)',whiteSpace:'nowrap' as const}} onClick={()=>openProfile(p)}>
                            {p.current_ctc?`₹${p.current_ctc}L`:'—'}
                            {p.expected_ctc?<div style={{fontSize:9,color:'var(--mu2)'}}>Exp: ₹{p.expected_ctc}L</div>:null}
                          </td>
                          <td style={{padding:tdPad}} onClick={e=>e.stopPropagation()}>
                            <select
                              value={p.status||'New'}
                              onChange={e=>quickStatusChange(p.id, p.status||'New', e.target.value)}
                              style={{background:(STATUS_COLORS[p.status||'New']||PIPELINE_COLORS[p.status||'New'])?.bg||'rgba(100,100,120,0.3)',color:(STATUS_COLORS[p.status||'New']||PIPELINE_COLORS[p.status||'New'])?.color||'#aaa',border:`1px solid ${(STATUS_COLORS[p.status||'New']||PIPELINE_COLORS[p.status||'New'])?.color||'#aaa'}44`,borderRadius:20,padding:'4px 10px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',outline:'none',minWidth:145}}
                            >
                              {PIPELINE_STATUSES.map(s=><option key={s} value={s} style={{background:'var(--bg3)',color:'var(--tx)',padding:6}}>{PIPELINE_EMOJI[s]||''} {s}</option>)}
                            </select>
                          </td>
                          <td style={{padding:tdPad,fontSize:12,color:'var(--mu)'}} onClick={()=>openProfile(p)}>{p.city||'—'}</td>
                          <td style={{padding:tdPad,fontSize:10,color:'var(--mu)'}} onClick={()=>openProfile(p)}>{p.source&&<span style={{padding:'2px 6px',borderRadius:20,background:'var(--bg3)',border:'1px solid var(--bd)'}}>{p.source}</span>}</td>
                          <td style={{padding:tdPad,fontSize:12,color:'#ffd60a'}} onClick={()=>openProfile(p)}>{p.star_rating>0?'★'.repeat(p.star_rating):'—'}</td>
                          <td style={{padding:tdPad,fontSize:11}} onClick={()=>openProfile(p)}>
                            {allUsers.find(u=>u.team_id&&u.id===p.created_by)?.full_name?.split(' ')[0]||'—'}
                          </td>
                          {isAdmin&&(()=>{const ab=getAddedByLabel(p);return(<td style={{padding:tdPad,fontSize:10}} onClick={()=>openProfile(p)}><span style={{color:ab.color,fontWeight:ab.label==='Self (JS)'?700:400,background:ab.label==='Self (JS)'?'rgba(61,214,140,0.1)':'transparent',padding:ab.label==='Self (JS)'?'2px 7px':'0',borderRadius:20}}>{ab.label}</span></td>)})()}
                          <td style={{padding:tdPad}} onClick={e=>e.stopPropagation()}>
                            <div style={{display:'flex',gap:3}}>
                              {p.mobile&&<button onClick={()=>{const cc=((p.country_code||'+91 India').split(' ')[0]).replace('+','');window.open(`https://wa.me/${cc+(p.mobile||'').replace(/\D/g,'')}`)}} style={{background:'rgba(37,211,102,0.15)',border:'none',borderRadius:5,width:26,height:26,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}} title="WhatsApp">💬</button>}
                              {p.email&&<button onClick={()=>window.open(`mailto:${p.email}`)} style={{background:'var(--acbg)',border:'none',borderRadius:5,width:26,height:26,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}} title="Email">✉</button>}
                              <button onClick={()=>router.push('/dashboard/edit-profile?id='+p.id)} style={{background:'transparent',border:'none',color:'var(--ac)',cursor:'pointer',fontSize:11,fontFamily:'inherit',padding:'0 4px'}}>View →</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CARDS VIEW ───────────────────────────────────────────── */}
        {viewLayout==='cards' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:14}}>
            {filtered.map(p=>{
              const sc=STATUS_COLORS[p.status||'New']||{bg:'rgba(100,100,120,0.3)',color:'#aaa'}
              const colors=['#6c8cff','#3dd68c','#c77dff','#ff9f43','#48cae4','#ffd60a','#ff6b6b']
              const col=colors[(p.name?.charCodeAt(0)||0)%colors.length]
              const seg=SEGMENT_CONFIG[p.segment||'experienced']
              return (
                <div key={p.id} className="card-h" onClick={()=>openProfile(p)} style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:14,padding:18,cursor:'pointer',transition:'all .2s',borderTop:`3px solid ${col}`}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:12}}>
                    {p.photo_url
                      ? <img src={p.photo_url} alt="" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>
                      : <div style={{width:44,height:44,borderRadius:'50%',background:`${col}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:800,color:col,flexShrink:0}}>{(p.name||'?')[0].toUpperCase()}</div>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{p.name}</div>
                      <div style={{fontSize:12,color:'var(--mu)',marginTop:1}}>{p.role||'—'}</div>
                      {p.star_rating>0&&<div style={{fontSize:11,color:'#ffd60a',marginTop:2}}>{'★'.repeat(p.star_rating)}</div>}
                    </div>
                    <span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:sc.bg,color:sc.color,flexShrink:0}}>{p.status||'New'}</span>
                  </div>
                  <div style={{display:'flex',gap:6,marginBottom:8}}>
                    <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:`${seg?.color||'#888'}22`,color:seg?.color||'#888',fontWeight:600}}>{seg?.icon} {seg?.label}</span>
                    {p.current_ctc&&<span style={{fontSize:10,color:'var(--mu)'}}>₹{p.current_ctc}L</span>}
                    {p.notice_period&&<span style={{fontSize:10,color:'var(--mu)'}}>{p.notice_period}</span>}
                  </div>
                  {p.skills&&(
                    <div style={{display:'flex',gap:4,flexWrap:'wrap' as const,marginBottom:10}}>
                      {p.skills.split(',').slice(0,3).map((s:string)=>(
                        <span key={s} style={{fontSize:10,background:'var(--bg3)',color:'var(--mu)',padding:'2px 7px',borderRadius:20,border:'1px solid var(--bd)'}}>{s.trim()}</span>
                      ))}
                      {p.skills.split(',').length>3&&<span style={{fontSize:10,color:'var(--mu2)'}}>+{p.skills.split(',').length-3}</span>}
                    </div>
                  )}
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:11,color:'var(--mu)'}}>
                    <span>{p.city?`📍${p.city}`:'—'}{p.experience?` · ${p.experience}y`:''}</span>
                    <span>{p.qualification||'—'}</span>
                  </div>
                  {p.profile_completion>0&&(
                    <div style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--mu)',marginBottom:3}}>
                        <span>Profile</span><span>{p.profile_completion}%</span>
                      </div>
                      <div style={{height:3,background:'var(--bg4)',borderRadius:2}}><div style={{height:'100%',width:`${p.profile_completion}%`,background:p.profile_completion>74?'#3dd68c':p.profile_completion>49?'#ff9f43':'#ff6b6b',borderRadius:2,transition:'width .3s'}}/></div>
                    </div>
                  )}
                  <div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>openProfile(p)} style={{flex:1,background:'var(--acbg)',color:'var(--ac)',border:'none',borderRadius:8,padding:'7px',fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>View Profile</button>
                    {p.mobile&&<button onClick={()=>{const cc=((p.country_code||'+91 India').split(' ')[0]).replace('+','');window.open(`https://wa.me/${cc+(p.mobile||'').replace(/\D/g,'')}`)}} style={{background:'rgba(37,211,102,0.15)',color:'#3dd68c',border:'none',borderRadius:8,padding:'7px 10px',fontSize:13,cursor:'pointer'}}>💬</button>}
                  </div>
                </div>
              )
            })}
            {filtered.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'var(--mu)',background:'var(--bg2)',borderRadius:14,border:'1px solid var(--bd)'}}>
              <div style={{fontSize:36,marginBottom:10}}>🔍</div>
              <div>No profiles match. <span onClick={clearAllFilters} style={{color:'var(--ac)',cursor:'pointer'}}>Clear filters</span></div>
            </div>}
          </div>
        )}

        {/* ── KANBAN VIEW ──────────────────────────────────────────── */}
        {viewLayout==='kanban' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))',gap:12,alignItems:'start'}}>
            {STATUSES.map(status=>{
              const sc=STATUS_COLORS[status]||{bg:'rgba(100,100,120,0.3)',color:'#aaa'}
              const cols=filtered.filter(p=>(p.status||'New')===status)
              return (
                <div key={status} style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:12,overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)',display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:`3px solid ${sc.color}`}}>
                    <span style={{fontSize:12,fontWeight:700,color:sc.color}}>{status}</span>
                    <span style={{fontSize:11,background:sc.bg,color:sc.color,padding:'2px 8px',borderRadius:10,fontWeight:700}}>{cols.length}</span>
                  </div>
                  <div style={{padding:8,display:'flex',flexDirection:'column' as const,gap:6,maxHeight:500,overflowY:'auto' as const}}>
                    {cols.length===0
                      ? <div style={{textAlign:'center',padding:'16px 0',color:'var(--mu2)',fontSize:11}}>Empty</div>
                      : cols.map(p=>{
                        const seg=SEGMENT_CONFIG[p.segment||'experienced']
                        return (
                          <div key={p.id} onClick={()=>openProfile(p)} style={{background:'var(--bg3)',borderRadius:8,padding:'10px 12px',cursor:'pointer',border:'1px solid var(--bd)',transition:'all .15s'}} onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--ac)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--bd)')}>
                            <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{p.name}</div>
                            <div style={{fontSize:11,color:'var(--mu)',marginBottom:3}}>{p.role||'—'}</div>
                            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--mu2)'}}>
                              <span>{p.city||'—'}</span>
                              <span style={{color:seg?.color||'#888'}}>{seg?.icon}</span>
                            </div>
                            {p.star_rating>0&&<div style={{fontSize:10,color:'#ffd60a',marginTop:3}}>{'★'.repeat(p.star_rating)}</div>}
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── POINTS MODAL ──────────────────────────────────────── */}
      {showPoints&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:16}} onClick={e=>{if(e.target===e.currentTarget)setShowPoints(false)}}>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:20,padding:24,width:'100%',maxWidth:440,maxHeight:'80vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 24px 80px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div><div style={{fontSize:15,fontWeight:700}}>⭐ My Points</div><div style={{fontSize:12,color:'var(--mu)'}}>Total: <strong style={{color:'#ffd60a'}}>{appUser?.points||0} pts</strong></div></div>
              <button onClick={()=>setShowPoints(false)} style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,width:28,height:28,cursor:'pointer',color:'var(--tx)',fontSize:14}}>✕</button>
            </div>
            <div style={{background:'var(--bg3)',borderRadius:10,padding:12,marginBottom:12}}>
              <div style={{fontWeight:600,fontSize:12,marginBottom:6}}>How to earn points</div>
              {Object.entries(POINTS_MAP).map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid var(--bd)',fontSize:12,color:'var(--mu)'}}>
                  <span style={{textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</span><span style={{color:'#ffd60a',fontWeight:600}}>+{v} pts</span>
                </div>
              ))}
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {pointsLog.map((pl:any)=>(
                <div key={pl.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--bd)',fontSize:12}}>
                  <span style={{color:'var(--mu)',textTransform:'capitalize'}}>{pl.action?.replace(/_/g,' ')||pl.reason}</span>
                  <span style={{color:pl.points>0?'#3dd68c':'#ff6b6b',fontWeight:600}}>{pl.points>0?'+':''}{pl.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BULK MESSAGE MODAL ─────────────────────────────────── */}
      {showBulkMsg&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:16}} onClick={e=>{if(e.target===e.currentTarget)setShowBulkMsg(false)}}>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:20,padding:24,width:'100%',maxWidth:500,boxShadow:'0 24px 80px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700}}>📨 Bulk Message ({selectedProfiles.length})</div>
              <button onClick={()=>setShowBulkMsg(false)} style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,width:28,height:28,cursor:'pointer',color:'var(--tx)',fontSize:14}}>✕</button>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              {(['whatsapp','email'] as const).map(t=>(
                <button key={t} onClick={()=>setBulkType(t)} style={{flex:1,padding:'8px',borderRadius:8,border:`1px solid ${bulkType===t?'var(--ac)':'var(--bd)'}`,background:bulkType===t?'var(--acbg)':'transparent',color:bulkType===t?'var(--ac)':'var(--mu)',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:600}}>
                  {t==='whatsapp'?'💬 WhatsApp':'✉ Email'}
                </button>
              ))}
            </div>
            <textarea rows={4} value={bulkMsg} onChange={e=>setBulkMsg(e.target.value)} placeholder="Type your message..." style={{...IS,resize:'vertical' as const,marginBottom:14}}/>
            <button onClick={()=>{
              profiles.filter(p=>selectedProfiles.includes(p.id)).forEach(p=>{
                if(bulkType==='whatsapp'&&p.mobile){const cc=((p.country_code||'+91 India').split(' ')[0]).replace('+','');window.open(`https://wa.me/${cc+(p.mobile||'').replace(/\D/g,'')}?text=${encodeURIComponent(bulkMsg)}`,'_blank')}
                else if(bulkType==='email'&&p.email){window.open(`mailto:${p.email}?body=${encodeURIComponent(bulkMsg)}`,'_blank')}
              })
              setShowBulkMsg(false)
            }} style={{width:'100%',padding:'12px',borderRadius:10,background:'var(--ac)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:700,fontFamily:'inherit'}}>
              Send to {selectedProfiles.length} profiles
            </button>
          </div>
        </div>
      )}

      {/* ── UPLOAD CV MODAL ────────────────────────────────────── */}
      {showUpload&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:16}} onClick={e=>{if(e.target===e.currentTarget){setShowUpload(false);setParsing(false);setParseMsg('')}}}>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:20,padding:24,width:'100%',maxWidth:480,boxShadow:'0 24px 80px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700}}>📄 Upload CV / Resume</div>
              <button onClick={()=>{setShowUpload(false);setParsing(false);setParseMsg('')}} style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,width:28,height:28,cursor:'pointer',color:'var(--tx)',fontSize:14}}>✕</button>
            </div>
            <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
              onDrop={async e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)await handleCVUpload(f)}}
              style={{border:`2px dashed ${dragOver?'var(--ac)':'var(--bd2)'}`,borderRadius:12,padding:'32px 20px',textAlign:'center' as const,background:dragOver?'var(--acbg)':'var(--bg3)',marginBottom:14,transition:'all .2s'}}>
              {parsing ? (
                <div><div style={{width:36,height:36,border:'3px solid var(--ac)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/><div style={{fontSize:13,color:'var(--mu)'}}>{parseMsg||'Parsing with AI...'}</div></div>
              ) : (
                <>
                  <div style={{fontSize:32,marginBottom:8}}>📄</div>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Drop CV here or click to browse</div>
                  <div style={{fontSize:12,color:'var(--mu)',marginBottom:12}}>PDF format · AI extracts all details automatically</div>
                  <label style={{padding:'8px 20px',borderRadius:8,background:'var(--ac)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600}}>
                    Browse File
                    <input type="file" accept=".pdf,.doc,.docx" style={{display:'none'}} onChange={async e=>{const f=e.target.files?.[0];if(f)await handleCVUpload(f)}}/>
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ── ADD / VIEW PROFILE MODAL — WIZARD ───────────────────── */}
      {(showAdd||showProfile)&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:100,padding:16,overflowY:'auto'}} onClick={e=>{if(e.target===e.currentTarget){setShowAdd(false);setShowProfile(null)}}}>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:20,padding:24,width:'100%',maxWidth:700,marginTop:16,marginBottom:16,boxShadow:'0 24px 80px rgba(0,0,0,0.5)',animation:'fadeIn 0.2s ease',maxHeight:'92vh',overflowY:'auto' as const}}>

            {/* Header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:700}}>{showProfile?form.name:'Add New Profile'}</div>
                {showProfile&&<div style={{fontSize:11,color:'var(--mu)',marginTop:2}}>{SEGMENT_CONFIG[form.segment||'experienced']?.icon} {SEGMENT_CONFIG[form.segment||'experienced']?.label} · {form.role||'—'} · {form.city||'—'}</div>}
                {showProfile&&statusBadge(form.status||'New')}
              </div>
              <div style={{display:'flex',gap:8}}>
                {showProfile&&(appUser?.role==='super_admin'||appUser?.role==='admin'||appUser?.role==='account_owner'||appUser?.id===showProfile.created_by)&&(
                  <button onClick={()=>deleteProfile(showProfile.id)} style={{padding:'6px 12px',borderRadius:8,background:'rgba(255,107,107,0.1)',color:'#ff6b6b',border:'1px solid rgba(255,107,107,0.3)',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>🗑 Delete</button>
                )}
                <button onClick={()=>{setShowAdd(false);setShowProfile(null);setWizardStep(1)}} style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,width:32,height:32,cursor:'pointer',color:'var(--tx)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              </div>
            </div>

            {/* Wizard Steps Indicator — View mode only */}
            {showProfile && (
              <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:24}}>
                {[
                  {n:1,l:'Basic Info'},
                  {n:2,l:'Professional'},
                  {n:3,l:'Location'},
                  {n:4,l:'Review & Save'},
                ].map((s,i)=>(
                  <div key={s.n} style={{display:'flex',alignItems:'center',flex:1}}>
                    <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',flex:1}}>
                      <div style={{width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,background:wizardStep>s.n?'var(--gn)':wizardStep===s.n?'var(--ac)':'var(--bg3)',color:wizardStep>=s.n?'#fff':'var(--mu)',border:`2px solid ${wizardStep>=s.n?wizardStep>s.n?'var(--gn)':'var(--ac)':'var(--bd)'}`,transition:'all .3s'}}>
                        {wizardStep>s.n?'✓':s.n}
                      </div>
                      <div style={{fontSize:10,color:wizardStep===s.n?'var(--ac)':wizardStep>s.n?'var(--gn)':'var(--mu)',marginTop:4,fontWeight:wizardStep===s.n?600:400,whiteSpace:'nowrap' as const}}>{s.l}</div>
                    </div>
                    {i<3&&<div style={{height:2,flex:1,background:wizardStep>s.n?'var(--gn)':'var(--bd)',marginBottom:20,transition:'background .3s'}}/>}
                  </div>
                ))}
              </div>
            )}

            {/* View mode tabs */}
            {showProfile && (
              <div style={{display:'flex',gap:4,background:'var(--bg3)',padding:4,borderRadius:10,marginBottom:18,width:'fit-content',border:'1px solid var(--bd)'}}>
                {[1,2,3,4].map(t=>(
                  <button key={t} onClick={()=>setWizardStep(t)} style={{padding:'6px 14px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:500,fontFamily:'inherit',background:wizardStep===t?'var(--acbg)':'transparent',color:wizardStep===t?'var(--ac)':'var(--mu)',transition:'all .15s'}}>
                    {t===1?'👤 Basic':t===2?'💼 Professional':t===3?'📍 Location':'💬 Notes'}
                  </button>
                ))}
              </div>
            )}

            {/* Section headers for add mode */}
            {showAdd && !showProfile && (
              <div style={{display:'flex',gap:16,marginBottom:20,padding:'10px 14px',background:'var(--bg3)',borderRadius:10,fontSize:11,color:'var(--mu)',flexWrap:'wrap' as const}}>
                <span>📋 <strong style={{color:'var(--tx)'}}>Basic Info</strong></span>
                <span style={{color:'var(--bd2)'}}>→</span>
                <span>💼 <strong style={{color:'var(--tx)'}}>Professional</strong></span>
                <span style={{color:'var(--bd2)'}}>→</span>
                <span>📍 <strong style={{color:'var(--tx)'}}>Location</strong></span>
                <span style={{color:'var(--bd2)'}}>→</span>
                <span>⚙️ <strong style={{color:'var(--tx)'}}>Pipeline</strong></span>
              </div>
            )}
            {/* ── STEP 1: BASIC INFO ─────────────────────────────── */}
            {(showProfile ? wizardStep===1 : true) && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Profile Segment *</label>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
                    {(Object.entries(SEGMENT_CONFIG).filter(([k])=>k!=='all') as any[]).map(([key,cfg])=>(
                      <button key={key} onClick={()=>sf('segment',key)} style={{flex:1,minWidth:100,padding:'10px 8px',borderRadius:10,border:`1.5px solid ${form.segment===key?cfg.color:'var(--bd)'}`,background:form.segment===key?`${cfg.color}22`:'transparent',color:form.segment===key?cfg.color:'var(--mu)',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit',transition:'all .15s'}}>
                        <div style={{fontSize:18,marginBottom:3}}>{cfg.icon}</div>
                        <div>{cfg.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Profile Photo</label>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:56,height:56,borderRadius:14,background:'var(--acbg)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',border:'2px solid var(--bd2)',flexShrink:0}}>
                      {form.photo_url?<img src={form.photo_url} alt='' style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:22,color:'var(--ac)',fontWeight:700}}>{(form.name||'?')[0]?.toUpperCase()||'?'}</span>}
                    </div>
                    <div>
                      <input ref={photoRef} type='file' accept='image/*' onChange={e=>{const f=e.target.files?.[0];if(f)handlePhotoUpload(f)}} style={{display:'none'}} disabled={photoUploading}/>
                      <button onClick={()=>photoRef.current?.click()} disabled={photoUploading} style={{background:'var(--acbg)',color:'var(--ac)',border:'1px solid var(--bd2)',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',opacity:photoUploading?0.5:1}}>
                        {photoUploading?'Uploading...':'📸 Upload Photo'}
                      </button>
                      {form.photo_url&&<button onClick={()=>sf('photo_url','')} style={{marginLeft:8,background:'transparent',color:'#ff6b6b',border:'none',cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>Remove</button>}
                      <div style={{fontSize:10,color:'var(--mu)',marginTop:4}}>Any size · Auto-compressed to 600px · JPG/PNG</div>
                    </div>
                  </div>
                </div>
                  <label style={LS}>Full Name *</label>
                  <input style={IS} value={form.name||''} onChange={e=>sf('name',e.target.value)} placeholder="Full name of the candidate"/>
                </div>
                <div>
                  <label style={LS}>Country Code</label>
                  <select style={IS} value={form.country_code||'+91 India'} onChange={e=>sf('country_code',e.target.value)}>
                    {['+91 India','+1 USA','+44 UK','+971 UAE','+65 Singapore','+61 Australia','+60 Malaysia','+49 Germany'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>Mobile Number *</label>
                  <input style={IS} value={form.mobile||''} 
                    onChange={e=>sf('mobile',e.target.value.replace(/\D/g,'').slice(0,15))}
                    onBlur={async e=>{
                      const mob = e.target.value.replace(/\D/g,'')
                      if(mob.length >= 10 && appUser?.company_id) {
                        const {data} = await supabase.from('profiles').select('id,name').eq('mobile',mob).eq('company_id',appUser.company_id).maybeSingle()
                        if(data) showError('Duplicate Mobile',`Mobile ${mob} already exists for "${data.name}". Please check.`)
                      }
                    }}
                    placeholder="10-digit number"/>
                </div>
                <div>
                  <label style={LS}>Email Address</label>
                  <input style={IS} type="email" value={form.email||''} 
                    onChange={e=>sf('email',e.target.value)}
                    onBlur={async e=>{
                      const em = e.target.value.trim()
                      if(em && appUser?.company_id) {
                        const {data} = await supabase.from('profiles').select('id,name').eq('email',em).eq('company_id',appUser.company_id).maybeSingle()
                        if(data) showError('Duplicate Email',`Email ${em} already exists for "${data.name}". Please check.`)
                      }
                    }}
                    placeholder="email@example.com"/>
                </div>
                <div>
                  <label style={LS}>Gender</label>
                  <select style={IS} value={form.gender||'Male'} onChange={e=>sf('gender',e.target.value)}>
                    <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label style={LS}>Age</label>
                  <input style={IS} type="number" value={form.age||''} onChange={e=>sf('age',e.target.value)} placeholder="e.g. 28" min="16" max="70"/>
                </div>
                <div>
                  <label style={LS}>LinkedIn Profile</label>
                  <input style={IS} value={form.linkedin||''} onChange={e=>sf('linkedin',e.target.value)} placeholder="linkedin.com/in/..."/>
                </div>
                <div>
                  <label style={LS}>Star Rating</label>
                  <div style={{display:'flex',gap:4,marginTop:2}}>
                    {[1,2,3,4,5].map(r=>(
                      <button key={r} onClick={()=>sf('star_rating',form.star_rating===r?0:r)} style={{width:36,height:36,borderRadius:8,border:`1.5px solid ${(form.star_rating||0)>=r?'#ffd60a':'var(--bd)'}`,background:(form.star_rating||0)>=r?'rgba(255,214,10,0.12)':'var(--bg3)',color:(form.star_rating||0)>=r?'#ffd60a':'var(--mu)',cursor:'pointer',fontSize:16,transition:'all .15s'}}>★</button>
                    ))}
                    {form.star_rating>0&&<span style={{fontSize:11,color:'#ffd60a',alignSelf:'center',marginLeft:4}}>{form.star_rating} star</span>}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: PROFESSIONAL ──────────────────────────── */}
            {(showProfile ? wizardStep===2 : true) && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Role / Designation *</label>
                  <input style={IS} value={form.role||''} onChange={e=>sf('role',e.target.value)} placeholder="e.g. Software Engineer, HR Manager, Sales Executive"/>
                </div>
                <div>
                  <label style={LS}>Total Experience (years)</label>
                  <input style={IS} type="number" step="0.5" value={form.experience||''} onChange={e=>sf('experience',e.target.value)} placeholder="e.g. 5.5"/>
                </div>
                <div>
                  <label style={LS}>Industry</label>
                  <select style={IS} value={form.industry||''} onChange={e=>sf('industry',e.target.value)}>
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>Qualification</label>
                  <select style={IS} value={form.qualification||''} onChange={e=>{sf('qualification',e.target.value);sf('qualification_branch','')}}>
                    <option value="">Select</option>
                    {QUALIFICATIONS.map(q=><option key={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>Branch / Specialization</label>
                  {QUAL_BRANCHES[form.qualification]
                    ? <select style={IS} value={form.qualification_branch||''} onChange={e=>sf('qualification_branch',e.target.value)}>
                        <option value="">Select Branch</option>
                        {QUAL_BRANCHES[form.qualification].map(b=><option key={b}>{b}</option>)}
                      </select>
                    : <input style={IS} value={form.qualification_branch||''} onChange={e=>sf('qualification_branch',e.target.value)} placeholder="e.g. Computer Science"/>
                  }
                </div>

                {/* Experienced / Recruiter / BD fields */}
                {form.segment!=='fresher' && <>
                  <div>
                    <label style={LS}>Current Company</label>
                    <input style={IS} value={form.current_company||''} onChange={e=>sf('current_company',e.target.value)} placeholder="Current employer name"/>
                  </div>
                  <div>
                    <label style={LS}>Current CTC (₹ LPA)</label>
                    <input style={IS} type="number" step="0.5" value={form.current_ctc||''} onChange={e=>sf('current_ctc',e.target.value)} placeholder="e.g. 8.5"/>
                  </div>
                  <div>
                    <label style={LS}>Expected CTC (₹ LPA)</label>
                    <input style={IS} type="number" step="0.5" value={form.expected_ctc||''} onChange={e=>sf('expected_ctc',e.target.value)} placeholder="e.g. 12"/>
                  </div>
                  <div>
                    <label style={LS}>Notice Period</label>
                    <select style={IS} value={form.notice_period||''} onChange={e=>sf('notice_period',e.target.value)}>
                      <option value="">Select</option>
                      {NOTICE_PERIODS.map(n=><option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={LS}>Reason for Change</label>
                    <input style={IS} value={form.reason_for_change||''} onChange={e=>sf('reason_for_change',e.target.value)} placeholder="Why are they looking for a change?"/>
                  </div>
                </>}

                {/* Fresher fields */}
                {form.segment==='fresher' && <>
                  <div>
                    <label style={LS}>Graduation Year</label>
                    <select style={IS} value={form.graduation_year||''} onChange={e=>sf('graduation_year',e.target.value)}>
                      <option value="">Select Year</option>
                      {[2024,2025,2026,2027,2023,2022,2021,2020].map(y=><option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LS}>CGPA / Percentage</label>
                    <input style={IS} type="number" step="0.1" min="0" max="10" value={form.cgpa||''} onChange={e=>sf('cgpa',e.target.value)} placeholder="e.g. 8.5"/>
                  </div>
                  <div>
                    <label style={LS}>College / University</label>
                    <input style={IS} value={form.college||''} onChange={e=>sf('college',e.target.value)} placeholder="College or university name"/>
                  </div>
                  <div>
                    <label style={LS}>Stipend Expected (₹/month)</label>
                    <input style={IS} type="number" value={form.stipend_expected||''} onChange={e=>sf('stipend_expected',e.target.value)} placeholder="e.g. 15000"/>
                  </div>
                  <div style={{gridColumn:'1/-1',display:'flex',gap:24}}>
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--tx)'}}>
                      <input type="checkbox" checked={form.has_internship||false} onChange={e=>sf('has_internship',e.target.checked)}/> Has done internship
                    </label>
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--tx)'}}>
                      <input type="checkbox" checked={form.available_immediately!==false} onChange={e=>sf('available_immediately',e.target.checked)}/> Available immediately
                    </label>
                  </div>
                </>}

                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Skills (comma separated)</label>
                  <textarea rows={2} style={{...IS,resize:'none' as const}} value={form.skills||''} onChange={e=>sf('skills',e.target.value)} placeholder="e.g. React, Node.js, Python, HR, Sales..."/>
                  {/* Skill suggestions */}
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:4,marginTop:6}}>
                    {skillSugs.filter(s=>!(form.skills||'').toLowerCase().includes(s.toLowerCase())).slice(0,8).map(s=>(
                      <span key={s} onClick={()=>sf('skills',form.skills?form.skills+', '+s:s)} style={{fontSize:10,background:'var(--bg4)',color:'var(--mu)',padding:'2px 8px',borderRadius:20,cursor:'pointer',border:'1px solid var(--bd)',transition:'all .15s'}} onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--ac)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--bd)')}>
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={LS}>Work Mode Preference</label>
                  <div style={{display:'flex',gap:6}}>
                    {WORK_MODES.map(w=>(
                      <button key={w} onClick={()=>sf('work_mode',form.work_mode===w?'':w)} style={{flex:1,padding:'8px',borderRadius:8,border:`1px solid ${form.work_mode===w?'var(--ac)':'var(--bd)'}`,background:form.work_mode===w?'var(--acbg)':'transparent',color:form.work_mode===w?'var(--ac)':'var(--mu)',cursor:'pointer',fontSize:11,fontFamily:'inherit',fontWeight:500}}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',paddingTop:22}}>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--tx)'}}>
                    <input type="checkbox" checked={form.willing_to_relocate||false} onChange={e=>sf('willing_to_relocate',e.target.checked)}/> Willing to relocate
                  </label>
                </div>
              </div>
            )}

            {/* ── STEP 3: LOCATION ──────────────────────────────── */}
            {(showProfile ? wizardStep===3 : true) && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={LS}>City *</label>
                  <select style={IS} value={form.city||''} onChange={e=>sf('city',e.target.value)}>
                    <option value="">Select City</option>
                    {CITIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>Other City (if not in list)</label>
                  <input style={IS} value={form.other_city||''} onChange={e=>{sf('other_city',e.target.value);if(e.target.value)sf('city',e.target.value)}} placeholder="Type city name"/>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Full Address</label>
                  <textarea rows={2} style={{...IS,resize:'none' as const}} value={form.address||''} onChange={e=>sf('address',e.target.value)} placeholder="House/Flat, Street, Area, City, Pincode"/>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Google Maps Link</label>
                  <div style={{display:'flex',gap:8}}>
                    <input style={{...IS,flex:1}} value={form.google_maps_url||''} onChange={e=>sf('google_maps_url',e.target.value)} placeholder="Paste Google Maps link"/>
                    {form.address && !form.google_maps_url && (
                      <button onClick={()=>sf('google_maps_url',`https://maps.google.com/?q=${encodeURIComponent(form.address)}`)} style={{padding:'0 14px',borderRadius:8,background:'var(--acbg)',color:'var(--ac)',border:'1px solid var(--bd)',cursor:'pointer',fontSize:12,fontFamily:'inherit',whiteSpace:'nowrap' as const}}>
                        Auto Generate ↗
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label style={LS}>Languages Known</label>
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:4,marginTop:2}}>
                    {LANGUAGES.map(l=>{
                      const active=(form.languages||'').includes(l)
                      return <button key={l} onClick={()=>{const arr=(form.languages||'').split(',').map((x:string)=>x.trim()).filter(Boolean);sf('languages',active?arr.filter((x:string)=>x!==l).join(', '):[...arr,l].join(', '))}} style={{padding:'4px 10px',borderRadius:20,fontSize:11,cursor:'pointer',border:`1px solid ${active?'var(--ac)':'var(--bd)'}`,background:active?'var(--acbg)':'transparent',color:active?'var(--ac)':'var(--mu)',fontFamily:'inherit'}}>{l}</button>
                    })}
                  </div>
                </div>
                <div>
                  <label style={LS}>YouTube Interview Link</label>
                  <input style={IS} value={form.youtube_url||''} onChange={e=>sf('youtube_url',e.target.value)} placeholder="youtube.com/watch?v=..."/>
                </div>
              </div>
            )}

            {/* ── STEP 4: REVIEW & SAVE ────────────────────────── */}
            {wizardStep===4 && (
              <div style={{display:'flex',flexDirection:'column' as const,gap:14}}>
                {/* Profile summary card */}
                <div style={{background:'var(--bg3)',borderRadius:12,padding:18,border:'1px solid var(--bd)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
                    <div style={{width:52,height:52,borderRadius:'50%',background:'var(--acbg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'var(--ac)'}}>
                      {(form.name||'?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:16,fontWeight:700}}>{form.name||'—'}</div>
                      <div style={{fontSize:12,color:'var(--mu)',marginTop:2}}>{form.role||'—'} · {form.city||'—'}</div>
                      <div style={{fontSize:11,color:'var(--ac)',marginTop:2}}>{SEGMENT_CONFIG[form.segment||'experienced']?.icon} {SEGMENT_CONFIG[form.segment||'experienced']?.label}</div>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                    {[
                      {l:'Mobile',v:form.mobile?((form.country_code||'+91').split(' ')[0])+form.mobile:'—'},
                      {l:'Email',v:form.email||'—'},
                      {l:'Experience',v:form.experience?form.experience+'y':'—'},
                      {l:'Qualification',v:form.qualification||'—'},
                      {l:'Industry',v:form.industry||'—'},
                      {l:'Current CTC',v:form.current_ctc?'₹'+form.current_ctc+'L':'—'},
                      {l:'Expected CTC',v:form.expected_ctc?'₹'+form.expected_ctc+'L':'—'},
                      {l:'Notice Period',v:form.notice_period||'—'},
                      {l:'Work Mode',v:form.work_mode||'—'},
                    ].map(f=>(
                      <div key={f.l} style={{background:'var(--bg2)',borderRadius:8,padding:'8px 10px',border:'1px solid var(--bd)'}}>
                        <div style={{fontSize:9,color:'var(--mu2)',textTransform:'uppercase' as const,letterSpacing:'0.8px',marginBottom:2}}>{f.l}</div>
                        <div style={{fontSize:12,fontWeight:600,color:'var(--tx)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{f.v}</div>
                      </div>
                    ))}
                  </div>
                  {form.skills&&(
                    <div style={{marginTop:10}}>
                      <div style={{fontSize:9,color:'var(--mu2)',textTransform:'uppercase' as const,letterSpacing:'0.8px',marginBottom:5}}>Skills</div>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap' as const}}>
                        {form.skills.split(',').slice(0,8).map((s:string)=>(
                          <span key={s} style={{fontSize:10,background:'var(--acbg)',color:'var(--ac)',padding:'2px 8px',borderRadius:20}}>{s.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pipeline Status & Assignment */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div>
                    <label style={LS}>Pipeline Status</label>
                    <div style={{position:'relative' as const}}>
                      <select style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bd2)',borderRadius:10,color:(PIPELINE_COLORS[form.status||'New']||STATUS_COLORS[form.status||'New'])?.color||'var(--tx)',fontSize:13,fontFamily:'inherit',outline:'none',padding:'10px 14px',cursor:'pointer',fontWeight:600,appearance:'auto' as const}} value={form.status||'New'} onChange={e=>sf('status',e.target.value)}>
                        {PIPELINE_STATUSES.map(s=><option key={s} value={s} style={{background:'var(--bg3)',color:'var(--tx)',padding:8,fontWeight:400}}>{PIPELINE_EMOJI[s]||''} {s}</option>)}
                      </select>
                    </div>
                    {form.status&&<div style={{marginTop:6,display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,color:(PIPELINE_COLORS[form.status]||STATUS_COLORS[form.status])?.color||'var(--mu)',background:(PIPELINE_COLORS[form.status]||STATUS_COLORS[form.status])?.bg||'var(--acbg)',padding:'4px 12px',borderRadius:20,width:'fit-content' as const}}>{PIPELINE_EMOJI[form.status]||''} {form.status}</div>}
                  </div>
                  <div>
                    <label style={LS}>Assign To</label>
                    <select style={IS} value={form.assigned_to||''} onChange={e=>sf('assigned_to',e.target.value)}>
                      <option value="">Unassigned</option>
                      {allUsers.map(u=><option key={u.id} value={u.id}>{u.full_name} ({u.role?.replace(/_/g,' ')})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LS}>Source</label>
                    <select style={IS} value={form.source||'Direct'} onChange={e=>sf('source',e.target.value)}>
                      {SOURCES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LS}>Source Detail</label>
                    <input style={IS} value={form.source_detail||''} onChange={e=>sf('source_detail',e.target.value)} placeholder="e.g. Naukri profile URL"/>
                  </div>
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={LS}>Recruiter Notes / Summary</label>
                    <textarea rows={2} style={{...IS,resize:'none' as const}} value={form.ai_summary||''} onChange={e=>sf('ai_summary',e.target.value)} placeholder="Any notes, observations or AI summary about this candidate..."/>
                  </div>
                </div>
              </div>
            )}

            {/* View mode — Notes tab */}
            {showProfile && wizardStep===4 && (
              <div style={{marginTop:14}}>
                <div style={{background:'var(--bg3)',borderRadius:10,padding:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--mu)',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:10}}>Activity Notes</div>

                  <div style={{display:'flex',gap:8,marginBottom:10}}>
                    <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="Add a note..." rows={2} style={{...IS,flex:1,resize:'none' as const}}/>
                  </div>
                  <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
                    <select value={taggedUser} onChange={e=>setTaggedUser(e.target.value)} style={{...IS,width:'auto',fontSize:12,padding:'5px 10px'}}>
                      <option value="">@Tag teammate</option>
                      {allUsers.filter(u=>u.id!==user?.id).map(u=><option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </select>
                    <button onClick={addNote} disabled={savingNote||(!newNote.trim()&&!selectedFeedback)} style={{padding:'7px 16px',borderRadius:8,background:'var(--ac)',color:'#fff',border:'none',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit',opacity:savingNote||(!newNote.trim()&&!selectedFeedback)?0.5:1}}>
                      {savingNote?'Adding...':'Add Note'}
                    </button>
                  </div>
                  <div style={{maxHeight:220,overflowY:'auto' as const,display:'flex',flexDirection:'column' as const,gap:8}}>
                    {feedbacks.map(f=>(
                      <div key={f.id} style={{background:'var(--bg4)',borderRadius:8,padding:'10px 12px',borderLeft:'2px solid var(--ac)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                          <span style={{fontSize:11,fontWeight:600,color:'var(--ac)'}}>{f.app_users?.full_name||'Unknown'}</span>
                          <span style={{fontSize:10,color:'var(--mu)'}}>{new Date(f.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div style={{fontSize:12,color:'var(--tx)',lineHeight:1.5}}>{f.text}</div>
                      </div>
                    ))}
                    {feedbacks.length===0&&<div style={{fontSize:12,color:'var(--mu)',textAlign:'center' as const,padding:'12px 0'}}>No notes yet</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ── NAVIGATION BUTTONS ────────────────────────────── */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:24,paddingTop:16,borderTop:'1px solid var(--bd)'}}>
              <button onClick={()=>{setShowAdd(false);setShowProfile(null);setWizardStep(1)}} style={{padding:'9px 20px',borderRadius:10,background:'transparent',color:'var(--mu)',border:'1px solid var(--bd)',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>
                Cancel
              </button>

              <div/>

              {/* Save button */}
              {showAdd && !showProfile ? (
                  <button onClick={saveProfile} disabled={saving} style={{padding:'9px 28px',borderRadius:10,background:'var(--gn)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:700,fontFamily:'inherit',opacity:saving?0.7:1,display:'flex',alignItems:'center',gap:8}}>
                    {saving?'⏳ Saving...':'✅ Save Profile'}
                  </button>
              ) : (
                <button onClick={saveProfile} disabled={saving} style={{padding:'9px 28px',borderRadius:10,background:'var(--ac)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:700,fontFamily:'inherit',opacity:saving?0.7:1}}>
                  {saving?'Saving...':'Save Changes'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  )

  async function handleCVUpload(file: File) {
    setParsing(true); setParseMsg('Reading CV...')
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const b64 = (ev.target?.result as string).split(',')[1]
        setParseMsg('AI extracting details...')
        try {
          const res = await fetch('/api/parse-cv', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'PARSE_CV',b64,mimeType:file.type||'application/pdf',filename:file.name}) })
          const json = await res.json()
          if (json.profile) {
            const p = json.profile || {}
            setForm({
              ...EMPTY_PROFILE,
              // Step 1 — Basic Info
              name: p.name||'',
              mobile: (p.mobile||'').replace(/\D/g,'').slice(-10),
              email: p.email||'',
              gender: p.gender||'Male',
              age: p.age||'',
              linkedin: p.linkedin||'',
              photo_url: p.photo_url||'',
              // Step 2 — Professional
              role: p.role||'',
              experience: p.experience||'',
              total_experience: p.experience||'',
              industry: p.industry||'',
              qualification: p.qualification||'',
              skills: p.skills||'',
              current_company: p.current_company||'',
              current_ctc: p.current_ctc||'',
              expected_ctc: p.expected_ctc||'',
              notice_period: p.notice_period||'',
              work_mode: p.work_mode||'',
              willing_to_relocate: p.willing_to_relocate==='true',
              // Step 3 — Location
              city: p.city||'',
              address: p.address||'',
              // Step 4 — Review
              ai_summary: p.ai_summary||p.summary||'',
              status: 'New',
              source: 'Direct',
              // Meta
              segment: activeSegment!=='all'?activeSegment:(p.segment||'experienced'),
              country_code: p.country_code||'+91 India',
              company_id: appUser?.company_id,
              team_id: appUser?.team_id,
            })
            setShowUpload(false); setShowAdd(true); setParsing(false); setParseMsg('')
          } else {
            setParseMsg('Could not parse. Please add manually.')
            setTimeout(()=>{setShowUpload(false);setShowAdd(true);setParsing(false);setParseMsg('')},1500)
          }
        } catch {
          setParseMsg('Parse failed. Adding manually.')
          setTimeout(()=>{setShowUpload(false);setShowAdd(true);setParsing(false);setParseMsg('')},1500)
        }
      }
      reader.readAsDataURL(file)
    } catch { setParsing(false) }
  }
}