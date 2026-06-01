// @ts-nocheck
// ════════════════════════════════════════════════════════════════
// DEDICATED EDIT PROFILE PAGE  (standalone, full page — not a modal)
// Self-contained: does NOT import anything from master.tsx
// Route: /dashboard/edit-profile?id=<profileId>
// Loads existing profile → edit → UPDATE → redirect to /dashboard/master
// ════════════════════════════════════════════════════════════════
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import { applyTheme, getSavedTheme } from '../../src/components/theme'
import LocationPicker from '../../src/components/LocationPicker'
import { EDUCATION_LEVELS, coursesForLevel, branchesForCourse } from '../../src/lib/courseBranches'

const STUDY_YEARS = ['1st Year','2nd Year','3rd Year','4th Year','5th Year']
const STUDY_SEMS = ['1st Sem','2nd Sem','3rd Sem','4th Sem','5th Sem','6th Sem','7th Sem','8th Sem','9th Sem','10th Sem']

// ── CONSTANTS (copied so this page is fully independent) ──────────
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
}
const SEGMENT_CONFIG: any = {
  pursuing:   { label:'Student (Pursuing)', icon:'🎓', color:'#f59e0b' },
  fresher:    { label:'Fresher',            icon:'🌱', color:'#3dd68c' },
  experienced:{ label:'Experienced',        icon:'💼', color:'#6c8cff' },
  recruiter:  { label:'Recruitment Team',  icon:'🔍', color:'#c77dff' },
  bd:         { label:'Client Management', icon:'🤝', color:'#ff9f43' },
}
// ── Experience & CTC dropdown helpers (storage stays decimal) ──
const EXP_YEARS = Array.from({length:51},(_,i)=>i)
const EXP_MONTHS = Array.from({length:12},(_,i)=>i)
const CTC_LAKHS = Array.from({length:101},(_,i)=>i)
const CTC_THOUSANDS = Array.from({length:20},(_,i)=>i*5)
function decToYM(v:any){const d=parseFloat(v)||0;const y=Math.floor(d);let m=Math.round((d-y)*12);return m===12?{y:y+1,m:0}:{y,m}}
function ymToDec(y:number,m:number){return +(y + m/12).toFixed(4)}
function decToLT(v:any){const d=parseFloat(v)||0;const l=Math.floor(d);let t=Math.round(Math.round((d-l)*100)/5)*5;return t>=100?{l:l+1,t:0}:{l,t}}
function ltToDec(l:number,t:number){return +(l + t/100).toFixed(2)}
function deriveSegment(expDec:any){return (parseFloat(expDec)||0)>0?'experienced':'fresher'}
const PIPELINE_STATUSES = ['New','Contacted - Interested','Contacted - Not Interested','Contacted - Call Back Later','Contacted - Number Busy','Contacted - Not Reachable','Resume Received','Resume Shortlisted','Interview Scheduled','Interview Done - Selected','Interview Done - Rejected','Interview Done - On Hold','Offer Discussed','Offer Accepted','Offer Declined','Did Not Join','Joined Successfully']
const PIPELINE_EMOJI: Record<string,string> = {'New':'🆕','Contacted - Interested':'✅','Contacted - Not Interested':'❌','Contacted - Call Back Later':'📞','Contacted - Number Busy':'📵','Contacted - Not Reachable':'🔕','Resume Received':'📄','Resume Shortlisted':'⭐','Interview Scheduled':'📅','Interview Done - Selected':'🎯','Interview Done - Rejected':'❌','Interview Done - On Hold':'⏸️','Offer Discussed':'💬','Offer Accepted':'✅','Offer Declined':'🚫','Did Not Join':'😔','Joined Successfully':'🎉'}
const PIPELINE_COLORS: Record<string,{bg:string,color:string}> = {
  'New':{bg:'rgba(100,100,120,0.3)',color:'#aaa'},
  'Contacted - Interested':{bg:'rgba(30,160,100,0.25)',color:'#3dd68c'},
  'Resume Shortlisted':{bg:'rgba(150,80,255,0.2)',color:'#c77dff'},
  'Interview Scheduled':{bg:'rgba(0,140,255,0.2)',color:'#60b0ff'},
  'Offer Accepted':{bg:'rgba(30,200,30,0.25)',color:'#3dd68c'},
  'Joined Successfully':{bg:'rgba(30,160,30,0.3)',color:'#6fcf6f'},
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
const EMPTY_PROFILE = {
  segment:'experienced', type:'Candidate', name:'', country_code:'+91 India',
  mobile:'', email:'', age:'', gender:'Male', city:'', other_city:'',
  role:'', qualification:'', qualification_branch:'', skills:'', industry:'',
  experience:'', total_experience:'', relevant_experience:'',
  current_company:'', current_ctc:'', expected_ctc:'', notice_period:'',
  reason_for_change:'', work_mode:'', willing_to_relocate:false, languages:'',
  graduation_year:'', cgpa:'', college:'', stipend_expected:'', has_internship:false,
  internship_details:'', available_immediately:true,
  linkedin:'', youtube_url:'', address:'', google_maps_url:'', latitude:null, longitude:null, state:'', pincode:'',
  status:'New', assigned_to:'', source:'Direct', source_detail:'',
  ai_summary:'', resume_url:'', resume_name:'', star_rating:0,
  channels:[] as string[], photos:[] as string[], photo_url:'',
  work_experiences: [] as any[],
  education: [] as any[],
  certifications: [] as any[],
  achievements: [] as any[],
}

export default function EditProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [appUser, setAppUser] = useState<any>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<any>({...EMPTY_PROFILE})
  const [profileId, setProfileId] = useState<string>('')
  const [origAssigned, setOrigAssigned] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [errorModal, setErrorModal] = useState<{title:string,msg:string}|null>(null)
  const [successToast, setSuccessToast] = useState<string|null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseMsg, setParseMsg] = useState('')
  const [showCV, setShowCV] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const photoRef = useRef<any>(null)
  const cvRef = useRef<any>(null)

  useEffect(() => {
    applyTheme(getSavedTheme())
    if (!router.isReady) return
    const id = router.query.id as string
    if (!id) { router.replace('/dashboard/master'); return }
    setProfileId(id)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      loadData(session.user, id)
    })
  }, [router.isReady])

  async function loadData(u: any, id: string) {
    let { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    if (!au) { router.push('/dashboard/master'); return }
    if (au.role === 'job_seeker') { router.replace('/jobseeker'); return }
    setAppUser(au)
    // Load company users for "Assign To" dropdown
    if (['super_admin','platform_admin','platform_manager'].includes(au.role)) {
      const { data: users } = await supabase.from('app_users').select('*').order('full_name')
      setAllUsers(users || [])
    } else if (au.company_id) {
      const { data: users } = await supabase.from('app_users').select('*').eq('company_id', au.company_id)
      setAllUsers(users || [])
    }
    // Load the existing profile to edit
    const { data: p, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error || !p) { showError('Not Found','This profile could not be loaded. It may have been deleted.'); setLoading(false); return }
    const parseArr = (v:any) => Array.isArray(v) ? v : (v ? (typeof v === 'string' ? JSON.parse(v) : v) : [])
    setForm({...EMPTY_PROFILE, ...p,
      channels: parseArr(p.channels),
      photos: parseArr(p.photos),
      work_experiences: parseArr(p.work_experiences),
      education: parseArr(p.education),
      certifications: parseArr(p.certifications),
      achievements: parseArr(p.achievements),
    })
    setOrigAssigned(p.assigned_to || '')
    setLoading(false)
  }

  const sf = (k:string,v:any) => setForm((f:any)=>({...f,[k]:v}))
  function showError(title: string, msg: string) { setErrorModal({title, msg}) }
  function showSuccess(msg: string) { setSuccessToast(msg); setTimeout(()=>setSuccessToast(null), 3000) }

  // ── Helpers for the 4 array sections (work/edu/cert/achievement) ──
  function pushTo(key: string, item: any) { setForm((f:any) => ({...f, [key]: [...(Array.isArray(f[key])?f[key]:[]), item]})) }
  function updateAt(key: string, idx: number, patch: any) { setForm((f:any) => ({...f, [key]: (f[key]||[]).map((x:any,i:number) => i===idx ? {...x, ...patch} : x)})) }
  function removeAt(key: string, idx: number) {
    if (!window.confirm('Remove this entry?')) return
    setForm((f:any) => ({...f, [key]: (f[key]||[]).filter((_:any,i:number) => i!==idx)}))
  }
  // Nested: work_experiences[idx].bullets[]
  function addBullet(idx: number) { setForm((f:any) => ({...f, work_experiences: (f.work_experiences||[]).map((w:any,i:number) => i===idx ? {...w, bullets:[...(w.bullets||[]), '']} : w)})) }
  function updateBullet(idx: number, bIdx: number, val: string) { setForm((f:any) => ({...f, work_experiences: (f.work_experiences||[]).map((w:any,i:number) => i===idx ? {...w, bullets:(w.bullets||[]).map((b:string,j:number) => j===bIdx?val:b)} : w)})) }
  function removeBullet(idx: number, bIdx: number) { setForm((f:any) => ({...f, work_experiences: (f.work_experiences||[]).map((w:any,i:number) => i===idx ? {...w, bullets:(w.bullets||[]).filter((_:any,j:number) => j!==bIdx)} : w)})) }

  async function logActivity(profileId: string, action: string, oldVal='', newVal='') {
    try {
      await supabase.rpc('log_profile_action', { p_profile_id: profileId, p_actor_id: user?.id, p_action: action, p_old_val: oldVal, p_new_val: newVal })
    } catch(e) { /* non-critical */ }
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
            setForm((prev:any)=>({
              ...EMPTY_PROFILE,
              name: p.name||'', mobile:(p.mobile||'').replace(/\D/g,'').slice(-10), email:p.email||'',
              gender:p.gender||'Male', age:p.age||'', linkedin:p.linkedin||'', photo_url:p.photo_url||'',
              role:p.role||'', experience:p.experience||'', total_experience:p.experience||'',
              industry:p.industry||'', qualification:p.qualification||'', skills:p.skills||'',
              current_company:p.current_company||'', current_ctc:p.current_ctc||'', expected_ctc:p.expected_ctc||'',
              notice_period:p.notice_period||'', work_mode:p.work_mode||'', willing_to_relocate:p.willing_to_relocate==='true',
              city:p.city||'', address:p.address||'', ai_summary:p.ai_summary||p.summary||'',
              status:'New', source:'Direct', segment:p.segment||'experienced', country_code:p.country_code||'+91 India',
            }))
            setShowCV(false); setParsing(false); setParseMsg('')
            showSuccess('✅ CV parsed — please review the details below')
          } else {
            setParseMsg('Could not parse. Please add manually.')
            setTimeout(()=>{setShowCV(false);setParsing(false);setParseMsg('')},1500)
          }
        } catch {
          setParseMsg('Parse failed. Adding manually.')
          setTimeout(()=>{setShowCV(false);setParsing(false);setParseMsg('')},1500)
        }
      }
      reader.readAsDataURL(file)
    } catch { setParsing(false) }
  }

  async function saveProfile() {
    if (!form.name?.trim()) { showError('Name Required',"Please enter the candidate's full name."); return }
    setSaving(true)
    const n = (v:any) => (v===null||v===undefined||String(v).trim()==='')?null:String(v).trim()
    const i = (v:any) => (v===null||v===undefined||String(v).trim()==='')?null:String(v).trim()
    const u = (v:any) => (!v||String(v).trim()===''||String(v).trim()==='null')?null:v
    const s = (v:any) => (v===null||v===undefined)?'':String(v).trim()
    const payload = {
      name: s(form.name),
      mobile: (form.mobile||'').replace(/\D/g,'').slice(0,15),
      email: s(form.email), gender: s(form.gender)||'Male',
      segment: form.segment==='pursuing'?'pursuing':deriveSegment(form.experience), type: 'Candidate',
      status: s(form.status)||'New', source: s(form.source)||'Direct', source_detail: s(form.source_detail),
      country_code: s(form.country_code)||'+91 India', role: s(form.role),
      industry: s(form.industry), qualification: s(form.qualification), qualification_branch: s(form.qualification_branch),
      skills: s(form.skills), city: s(form.city)||s(form.other_city), other_city: s(form.other_city),
      address: s(form.address), google_maps_url: s(form.google_maps_url), languages: s(form.languages),
      latitude: (form.latitude===''||form.latitude===undefined)?null:form.latitude,
      longitude: (form.longitude===''||form.longitude===undefined)?null:form.longitude,
      state: s(form.state), pincode: s(form.pincode),
      linkedin: s(form.linkedin), youtube_url: s(form.youtube_url), current_company: s(form.current_company),
      notice_period: s(form.notice_period), reason_for_change: s(form.reason_for_change), work_mode: s(form.work_mode),
      college: s(form.college), internship_details: s(form.internship_details), ai_summary: s(form.ai_summary),
      resume_url: s(form.resume_url), resume_name: s(form.resume_name), photo_url: s(form.photo_url),
      age: i(form.age), experience: n(form.experience), total_experience: n(form.total_experience),
      relevant_experience: n(form.relevant_experience), current_ctc: n(form.current_ctc), expected_ctc: n(form.expected_ctc),
      cgpa: n(form.cgpa), graduation_year: i(form.graduation_year), stipend_expected: n(form.stipend_expected),
      star_rating: i(form.star_rating)||0,
      willing_to_relocate: !!form.willing_to_relocate, has_internship: !!form.has_internship,
      available_immediately: form.available_immediately!==false,
      assigned_to: u(form.assigned_to),
      channels: Array.isArray(form.channels)?form.channels:[], photos: Array.isArray(form.photos)?form.photos:[],
      work_experiences: Array.isArray(form.work_experiences)?form.work_experiences:[],
      education: Array.isArray(form.education)?form.education:[],
      certifications: Array.isArray(form.certifications)?form.certifications:[],
      achievements: Array.isArray(form.achievements)?form.achievements:[],
    }
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', profileId).select().single()
    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('mobile')) showError('Duplicate Mobile','This mobile number already exists in your database.')
        else if (error.message.includes('email')) showError('Duplicate Email','This email already exists in your database.')
        else showError('Duplicate Entry','A similar profile already exists.')
      } else showError('Update Failed', error.message)
      setSaving(false); return
    }
    if (data) {
      logActivity(profileId, 'updated')
      // Notify if assignee CHANGED to someone new
      if (payload.assigned_to && payload.assigned_to !== origAssigned && payload.assigned_to !== user?.id) {
        try {
          await supabase.from('notifications').insert({
            user_id: payload.assigned_to, from_user_id: user?.id, type: 'assignment',
            title: `${appUser?.full_name||'Someone'} assigned you a candidate`,
            message: `You have been assigned "${payload.name}"`,
            is_read: false, company_id: appUser?.company_id
          })
        } catch(e) {}
      }
      setSaving(false)
      showSuccess('✅ Profile updated successfully!')
      setTimeout(()=>router.push('/dashboard/master'), 700)
    }
  }

  const skillSugs = getSkillSugs(form.role||'', form.industry||'', form.qualification||'')
  const IS:any = {width:'100%',background:'var(--bg3)',border:'1px solid var(--bd2)',borderRadius:8,padding:'9px 12px',color:'var(--tx)',fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}
  const LS:any = {display:'block',fontSize:10,fontWeight:600,color:'var(--mu)',textTransform:'uppercase',letterSpacing:1,marginBottom:4,marginTop:10}
  const SECTION:any = {background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:16,padding:'18px 20px',marginBottom:16}
  const SECTITLE:any = {fontSize:13,fontWeight:700,color:'var(--ac)',marginBottom:4,display:'flex',alignItems:'center',gap:8}
  const ENTRY_CARD:any = {background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:12,padding:'14px 16px',marginTop:10,position:'relative'}
  const ADD_BTN:any = {background:'var(--acbg)',color:'var(--ac)',border:'1px dashed var(--bd2)',borderRadius:10,padding:'9px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',marginTop:10,width:'100%'}
  const DEL_BTN:any = {position:'absolute',top:10,right:10,background:'var(--rdbg)',color:'var(--rd)',border:'none',borderRadius:6,width:26,height:26,cursor:'pointer',fontSize:12,fontWeight:700}
  const CUR_YEAR = new Date().getFullYear()
  const YEARS: string[] = []
  for (let y = CUR_YEAR + 2; y >= 1975; y--) YEARS.push(String(y))
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',flexDirection:'column',gap:12}}>
      <div style={{width:40,height:40,border:'3px solid var(--ac)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{fontSize:13,color:'var(--mu)',fontFamily:'Outfit,sans-serif'}}>Loading...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--tx)',fontFamily:'Outfit,sans-serif',paddingBottom:90}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        input:focus,select:focus,textarea:focus{border-color:var(--ac)!important;outline:none;}
        select option{background:var(--bg3,#22262f);color:var(--tx,#fff);}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:4px}
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{position:'sticky',top:0,zIndex:50,background:'var(--bg)',borderBottom:'1px solid var(--bd)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <button onClick={()=>router.push('/dashboard/master')} style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,width:36,height:36,cursor:'pointer',color:'var(--tx)',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
          <div>
            <div style={{fontSize:17,fontWeight:700}}>Edit Profile</div>
            <div style={{fontSize:11,color:'var(--mu)',marginTop:2}}>{form.name || 'Update candidate details'}</div>
          </div>
        </div>
        <div style={{fontSize:11,color:'var(--mu)'}}>Editing existing profile</div>
      </div>

      <div style={{maxWidth:820,margin:'0 auto',padding:'20px 16px'}}>

        {/* ── SECTION 1: BASIC INFO ── */}
        <div style={SECTION}>
          <div style={SECTITLE}>📋 Basic Info</div>
          <label style={LS}>Candidate Status *</label>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
            {[
              {key:'pursuing', icon:'🎓', title:'Student (Pursuing)', sub:'Currently studying · interns / trainees', color:'#f59e0b'},
              {key:'professional', icon:'💼', title:'Professional', sub:'Passed out · in the job market', color:'#6c8cff'},
            ].map(opt=>{
              const isStudent = form.segment==='pursuing'
              const active = opt.key==='pursuing' ? isStudent : !isStudent
              return (
                <button key={opt.key} onClick={()=>{ if(opt.key==='pursuing') sf('segment','pursuing'); else sf('segment', deriveSegment(form.experience)) }}
                  style={{flex:1,minWidth:200,textAlign:'left',padding:'11px 14px',borderRadius:12,border:`1.5px solid ${active?opt.color:'var(--bd)'}`,background:active?`${opt.color}1e`:'transparent',color:active?opt.color:'var(--mu)',cursor:'pointer',fontFamily:'inherit'}}>
                  <div style={{fontSize:14,fontWeight:700,display:'flex',alignItems:'center',gap:7}}><span style={{fontSize:18}}>{opt.icon}</span>{opt.title}</div>
                  <div style={{fontSize:11,marginTop:3,opacity:0.85}}>{opt.sub}</div>
                </button>
              )
            })}
          </div>
          {form.segment!=='pursuing' && (()=>{const cfg=SEGMENT_CONFIG[deriveSegment(form.experience)];return(
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontSize:11,color:'var(--mu)'}}>Experience level (auto):</span>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:20,border:`1px solid ${cfg.color}`,background:`${cfg.color}1e`,color:cfg.color,fontSize:12,fontWeight:700}}><span>{cfg.icon}</span>{cfg.label}</span>
            </div>
          )})()}

          <label style={LS}>Profile Photo</label>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:56,height:56,borderRadius:14,background:'var(--acbg)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',border:'2px solid var(--bd2)',flexShrink:0}}>
              {form.photo_url?<img src={form.photo_url} alt='' style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:22,color:'var(--ac)',fontWeight:700}}>{(form.name||'?')[0]?.toUpperCase()||'?'}</span>}
            </div>
            <div>
              <input ref={photoRef} type='file' accept='image/*' onChange={e=>{const f=e.target.files?.[0];if(f)handlePhotoUpload(f)}} style={{display:'none'}} disabled={photoUploading}/>
              <button onClick={()=>photoRef.current?.click()} disabled={photoUploading} style={{background:'var(--acbg)',color:'var(--ac)',border:'1px solid var(--bd2)',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',opacity:photoUploading?0.5:1}}>{photoUploading?'Uploading...':'📸 Upload Photo'}</button>
              {form.photo_url&&<button onClick={()=>sf('photo_url','')} style={{marginLeft:8,background:'transparent',color:'#ff6b6b',border:'none',cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>Remove</button>}
              <div style={{fontSize:10,color:'var(--mu)',marginTop:4}}>Any size · Auto-compressed to 600px · JPG/PNG</div>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{gridColumn:'1/-1'}}>
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
                onBlur={async e=>{const mob=e.target.value.replace(/\D/g,'');if(mob.length>=10&&appUser?.company_id){const {data}=await supabase.from('profiles').select('id,name').eq('mobile',mob).eq('company_id',appUser.company_id).maybeSingle();if(data)showError('Duplicate Mobile',`Mobile ${mob} already exists for "${data.name}". Please check.`)}}}
                placeholder="10-digit number"/>
            </div>
            <div>
              <label style={LS}>Email Address</label>
              <input style={IS} type="email" value={form.email||''} onChange={e=>sf('email',e.target.value)}
                onBlur={async e=>{const em=e.target.value.trim();if(em&&appUser?.company_id){const {data}=await supabase.from('profiles').select('id,name').eq('email',em).eq('company_id',appUser.company_id).maybeSingle();if(data)showError('Duplicate Email',`Email ${em} already exists for "${data.name}". Please check.`)}}}
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
            <div style={{gridColumn:'1/-1'}}>
              <label style={LS}>Star Rating</label>
              <div style={{display:'flex',gap:4,marginTop:2}}>
                {[1,2,3,4,5].map(r=>(
                  <button key={r} onClick={()=>sf('star_rating',form.star_rating===r?0:r)} style={{width:36,height:36,borderRadius:8,border:`1.5px solid ${(form.star_rating||0)>=r?'#ffd60a':'var(--bd)'}`,background:(form.star_rating||0)>=r?'rgba(255,214,10,0.12)':'var(--bg3)',color:(form.star_rating||0)>=r?'#ffd60a':'var(--mu)',cursor:'pointer',fontSize:16}}>★</button>
                ))}
                {form.star_rating>0&&<span style={{fontSize:11,color:'#ffd60a',alignSelf:'center',marginLeft:4}}>{form.star_rating} star</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: PROFESSIONAL ── */}
        <div style={SECTION}>
          <div style={SECTITLE}>💼 Professional</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{gridColumn:'1/-1'}}>
              <label style={LS}>Role / Designation *</label>
              <input style={IS} value={form.role||''} onChange={e=>sf('role',e.target.value)} placeholder="e.g. Software Engineer, HR Manager, Sales Executive"/>
            </div>
            {form.segment!=='pursuing' && <div>
              <label style={LS}>Total Experience</label>
              {(()=>{const {y,m}=decToYM(form.experience);return(
                <div style={{display:'flex',gap:8}}>
                  <select style={{...IS,flex:1}} value={y} onChange={e=>{const nd=ymToDec(+e.target.value,m);sf('experience',nd);sf('total_experience',nd);sf('segment',deriveSegment(nd))}}>{EXP_YEARS.map(n=><option key={n} value={n}>{n} yr</option>)}</select>
                  <select style={{...IS,flex:1}} value={m} onChange={e=>{const nd=ymToDec(y,+e.target.value);sf('experience',nd);sf('total_experience',nd);sf('segment',deriveSegment(nd))}}>{EXP_MONTHS.map(n=><option key={n} value={n}>{n} mo</option>)}</select>
                </div>
              )})()}
            </div>}
            <div>
              <label style={LS}>Industry</label>
              <select style={IS} value={form.industry||''} onChange={e=>sf('industry',e.target.value)}>
                <option value="">Select Industry</option>{INDUSTRIES.map(x=><option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label style={LS}>Qualification</label>
              <select style={IS} value={form.qualification||''} onChange={e=>{sf('qualification',e.target.value);sf('qualification_branch','')}}>
                <option value="">Select</option>{QUALIFICATIONS.map(q=><option key={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label style={LS}>Branch / Specialization</label>
              {QUAL_BRANCHES[form.qualification]
                ? <select style={IS} value={form.qualification_branch||''} onChange={e=>sf('qualification_branch',e.target.value)}>
                    <option value="">Select Branch</option>{QUAL_BRANCHES[form.qualification].map(b=><option key={b}>{b}</option>)}
                  </select>
                : <input style={IS} value={form.qualification_branch||''} onChange={e=>sf('qualification_branch',e.target.value)} placeholder="e.g. Computer Science"/>}
            </div>

            {form.segment==='experienced' && <>
              <div><label style={LS}>Current Company</label><input style={IS} value={form.current_company||''} onChange={e=>sf('current_company',e.target.value)} placeholder="Current employer name"/></div>
              <div><label style={LS}>Current CTC (₹)</label>
                {(()=>{const {l,t}=decToLT(form.current_ctc);return(<div style={{display:'flex',gap:8}}>
                  <select style={{...IS,flex:1}} value={l} onChange={e=>sf('current_ctc',ltToDec(+e.target.value,t))}>{CTC_LAKHS.map(n=><option key={n} value={n}>{n} Lakh</option>)}</select>
                  <select style={{...IS,flex:1}} value={t} onChange={e=>sf('current_ctc',ltToDec(l,+e.target.value))}>{CTC_THOUSANDS.map(n=><option key={n} value={n}>{n} Th</option>)}</select>
                </div>)})()}
              </div>
              <div><label style={LS}>Expected CTC (₹)</label>
                {(()=>{const {l,t}=decToLT(form.expected_ctc);return(<div style={{display:'flex',gap:8}}>
                  <select style={{...IS,flex:1}} value={l} onChange={e=>sf('expected_ctc',ltToDec(+e.target.value,t))}>{CTC_LAKHS.map(n=><option key={n} value={n}>{n} Lakh</option>)}</select>
                  <select style={{...IS,flex:1}} value={t} onChange={e=>sf('expected_ctc',ltToDec(l,+e.target.value))}>{CTC_THOUSANDS.map(n=><option key={n} value={n}>{n} Th</option>)}</select>
                </div>)})()}
              </div>
              <div><label style={LS}>Notice Period</label><select style={IS} value={form.notice_period||''} onChange={e=>sf('notice_period',e.target.value)}><option value="">Select</option>{NOTICE_PERIODS.map(x=><option key={x}>{x}</option>)}</select></div>
              <div style={{gridColumn:'1/-1'}}><label style={LS}>Reason for Change</label><input style={IS} value={form.reason_for_change||''} onChange={e=>sf('reason_for_change',e.target.value)} placeholder="Why are they looking for a change?"/></div>
            </>}

            {form.segment==='fresher' && <>
              <div><label style={LS}>Expected CTC (₹)</label>
                {(()=>{const {l,t}=decToLT(form.expected_ctc);return(<div style={{display:'flex',gap:8}}>
                  <select style={{...IS,flex:1}} value={l} onChange={e=>sf('expected_ctc',ltToDec(+e.target.value,t))}>{CTC_LAKHS.map(n=><option key={n} value={n}>{n} Lakh</option>)}</select>
                  <select style={{...IS,flex:1}} value={t} onChange={e=>sf('expected_ctc',ltToDec(l,+e.target.value))}>{CTC_THOUSANDS.map(n=><option key={n} value={n}>{n} Th</option>)}</select>
                </div>)})()}
              </div>
              <div><label style={LS}>Graduation Year</label><select style={IS} value={form.graduation_year||''} onChange={e=>sf('graduation_year',e.target.value)}><option value="">Select Year</option>{[2025,2026,2024,2023,2022,2021,2020].map(y=><option key={y}>{y}</option>)}</select></div>
              <div><label style={LS}>CGPA / Percentage</label><input style={IS} type="number" step="0.1" min="0" max="10" value={form.cgpa||''} onChange={e=>sf('cgpa',e.target.value)} placeholder="e.g. 8.5"/></div>
              <div><label style={LS}>College / University</label><input style={IS} value={form.college||''} onChange={e=>sf('college',e.target.value)} placeholder="College or university name"/></div>
              <div style={{gridColumn:'1/-1',display:'flex',gap:24,flexWrap:'wrap'}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--tx)'}}><input type="checkbox" checked={form.has_internship||false} onChange={e=>sf('has_internship',e.target.checked)}/> Has done internship</label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--tx)'}}><input type="checkbox" checked={form.available_immediately!==false} onChange={e=>sf('available_immediately',e.target.checked)}/> Available immediately</label>
              </div>
            </>}

            {form.segment==='pursuing' && <>
              <div><label style={LS}>Looking For</label><select style={IS} value={form.looking_for||''} onChange={e=>sf('looking_for',e.target.value)}><option value="">Select</option>{['Internship','Training','Apprenticeship','Live Project','Part-time Job','Just Exploring'].map(x=><option key={x}>{x}</option>)}</select></div>
              {['Internship','Training','Apprenticeship'].includes(form.looking_for) && <div><label style={LS}>Preferred Duration</label><select style={IS} value={form.internship_duration||''} onChange={e=>sf('internship_duration',e.target.value)}><option value="">Select</option>{['1 month','2 months','3 months','4 months','5 months','6 months','7 months','8 months','9 months','10 months','11 months','12 months','Flexible'].map(x=><option key={x}>{x}</option>)}</select></div>}
              <div><label style={LS}>Expected Graduation Year</label><select style={IS} value={form.graduation_year||''} onChange={e=>sf('graduation_year',e.target.value)}><option value="">Select Year</option>{[2026,2027,2028,2025,2029,2024,2030].map(y=><option key={y}>{y}</option>)}</select></div>
              <div><label style={LS}>Current CGPA / %</label><input style={IS} type="number" step="0.1" min="0" max="10" value={form.cgpa||''} onChange={e=>sf('cgpa',e.target.value)} placeholder="e.g. 8.5"/></div>
              <div><label style={LS}>College / University</label><input style={IS} value={form.college||''} onChange={e=>sf('college',e.target.value)} placeholder="College or university name"/></div>
              <div><label style={LS}>Stipend Expected (₹/month)</label><input style={IS} type="number" value={form.stipend_expected||''} onChange={e=>sf('stipend_expected',e.target.value)} placeholder="e.g. 15000"/></div>
              <div style={{gridColumn:'1/-1',display:'flex',gap:24,flexWrap:'wrap'}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--tx)'}}><input type="checkbox" checked={form.has_internship||false} onChange={e=>sf('has_internship',e.target.checked)}/> Open to / has done internship</label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--tx)'}}><input type="checkbox" checked={form.available_immediately!==false} onChange={e=>sf('available_immediately',e.target.checked)}/> Available immediately</label>
              </div>
            </>}

            <div style={{gridColumn:'1/-1'}}>
              <label style={LS}>Skills (comma separated)</label>
              <textarea rows={2} style={{...IS,resize:'none'}} value={form.skills||''} onChange={e=>sf('skills',e.target.value)} placeholder="e.g. React, Node.js, Python, HR, Sales..."/>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>
                {skillSugs.filter(x=>!(form.skills||'').toLowerCase().includes(x.toLowerCase())).slice(0,8).map(x=>(
                  <span key={x} onClick={()=>sf('skills',form.skills?form.skills+', '+x:x)} style={{fontSize:10,background:'var(--bg4)',color:'var(--mu)',padding:'2px 8px',borderRadius:20,cursor:'pointer',border:'1px solid var(--bd)'}}>+ {x}</span>
                ))}
              </div>
            </div>
            <div>
              <label style={LS}>Work Mode Preference</label>
              <div style={{display:'flex',gap:6}}>
                {WORK_MODES.map(w=>(
                  <button key={w} onClick={()=>sf('work_mode',form.work_mode===w?'':w)} style={{flex:1,padding:'8px',borderRadius:8,border:`1px solid ${form.work_mode===w?'var(--ac)':'var(--bd)'}`,background:form.work_mode===w?'var(--acbg)':'transparent',color:form.work_mode===w?'var(--ac)':'var(--mu)',cursor:'pointer',fontSize:11,fontFamily:'inherit',fontWeight:500}}>{w}</button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',paddingTop:22}}>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--tx)'}}><input type="checkbox" checked={form.willing_to_relocate||false} onChange={e=>sf('willing_to_relocate',e.target.checked)}/> Willing to relocate</label>
            </div>
          </div>
        </div>

        {/* ── SECTION 2.5: WORK EXPERIENCE (multiple jobs) ── */}
        <div style={SECTION}>
          <div style={{...SECTITLE,justifyContent:'space-between',width:'100%'}}>
            <span>💼 Work Experience ({(form.work_experiences||[]).length})</span>
          </div>
          {(form.work_experiences||[]).map((w:any, idx:number) => (
            <div key={idx} style={ENTRY_CARD}>
              <button onClick={()=>removeAt('work_experiences', idx)} style={DEL_BTN} title="Remove this job">✕</button>
              <div style={{fontSize:11,fontWeight:600,color:'var(--mu)',marginBottom:8}}>JOB #{idx+1}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Company *</label>
                  <input style={IS} value={w.company||''} onChange={e=>updateAt('work_experiences',idx,{company:e.target.value})} placeholder="e.g. Agratas Infotech Pvt Ltd"/>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Role / Designation *</label>
                  <input style={IS} value={w.role||''} onChange={e=>updateAt('work_experiences',idx,{role:e.target.value})} placeholder="e.g. Talent Acquisition Lead"/>
                </div>
                <div>
                  <label style={LS}>From — Month</label>
                  <select style={IS} value={w.from_month||''} onChange={e=>updateAt('work_experiences',idx,{from_month:e.target.value})}>
                    <option value="">Month</option>{MONTHS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>From — Year</label>
                  <select style={IS} value={w.from_year||''} onChange={e=>updateAt('work_experiences',idx,{from_year:e.target.value})}>
                    <option value="">Year</option>{YEARS.map(y=><option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>To — Month</label>
                  {w.current
                    ? <div style={{...IS,color:'var(--gn)',fontWeight:600}}>Present</div>
                    : <select style={IS} value={w.to_month||''} onChange={e=>updateAt('work_experiences',idx,{to_month:e.target.value})}>
                        <option value="">Month</option>{MONTHS.map(m=><option key={m}>{m}</option>)}
                      </select>
                  }
                </div>
                <div>
                  <label style={LS}>To — Year</label>
                  {w.current
                    ? <div style={{...IS,color:'var(--gn)',fontWeight:600}}>Present</div>
                    : <select style={IS} value={w.to_year||''} onChange={e=>updateAt('work_experiences',idx,{to_year:e.target.value})}>
                        <option value="">Year</option>{YEARS.map(y=><option key={y}>{y}</option>)}
                      </select>
                  }
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--tx)',marginTop:4}}>
                    <input type="checkbox" checked={!!w.current} onChange={e=>updateAt('work_experiences',idx,{current:e.target.checked, to_month: e.target.checked?'':w.to_month, to_year: e.target.checked?'':w.to_year})}/> Currently working here
                  </label>
                </div>
              </div>
              <label style={{...LS,marginTop:14}}>Responsibilities (bullet points)</label>
              {(w.bullets||[]).map((b:string, bIdx:number) => (
                <div key={bIdx} style={{display:'flex',gap:6,marginBottom:6,alignItems:'flex-start'}}>
                  <span style={{color:'var(--ac)',paddingTop:9,fontWeight:700}}>•</span>
                  <input style={{...IS,flex:1}} value={b||''} onChange={e=>updateBullet(idx,bIdx,e.target.value)} placeholder="e.g. Led end-to-end recruitment lifecycle..."/>
                  <button onClick={()=>removeBullet(idx,bIdx)} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--rd)',padding:'0 8px',fontSize:14}} title="Remove bullet">✕</button>
                </div>
              ))}
              <button onClick={()=>addBullet(idx)} style={{background:'transparent',color:'var(--ac)',border:'1px dashed var(--bd2)',borderRadius:8,padding:'6px 12px',fontSize:11,cursor:'pointer',fontFamily:'inherit',marginTop:4}}>+ Add bullet point</button>
            </div>
          ))}
          <button onClick={()=>pushTo('work_experiences',{company:'',role:'',from_month:'',from_year:'',to_month:'',to_year:'',current:false,bullets:[]})} style={ADD_BTN}>+ Add Work Experience</button>
        </div>

        {/* ── SECTION 2.6: EDUCATION (cascading level→course→branch + pursuing/completed) ── */}
        <div style={SECTION}>
          <div style={{...SECTITLE,justifyContent:'space-between',width:'100%'}}>
            <span>🎓 Education ({(form.education||[]).length})</span>
          </div>
          {(form.education||[]).map((ed:any, idx:number) => {
            const courses = coursesForLevel(ed.level||'')
            const branches = branchesForCourse(ed.course||'')
            const pursuing = ed.study_status === 'pursuing'
            return (
            <div key={idx} style={ENTRY_CARD}>
              <button onClick={()=>removeAt('education', idx)} style={DEL_BTN} title="Remove">✕</button>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={LS}>Education Level</label>
                  <select style={IS} value={ed.level||''} onChange={e=>updateAt('education',idx,{level:e.target.value, course:'', branch:''})}>
                    <option value="">Select level</option>{EDUCATION_LEVELS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LS}>Course</label>
                  {courses.length>0 ? (
                    <select style={IS} value={ed.course||''} onChange={e=>updateAt('education',idx,{course:e.target.value, branch:''})}>
                      <option value="">Select course</option>{courses.map(c=><option key={c}>{c}</option>)}
                      <option value="__other">Other (type below)</option>
                    </select>
                  ) : (
                    <input style={IS} value={ed.course||''} onChange={e=>updateAt('education',idx,{course:e.target.value})} placeholder="Select level first / type course"/>
                  )}
                </div>
                {ed.course==='__other' && (
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={LS}>Custom Course Name</label>
                    <input style={IS} value={ed.course_custom||''} onChange={e=>updateAt('education',idx,{course_custom:e.target.value})} placeholder="Type the course name"/>
                  </div>
                )}
                <div>
                  <label style={LS}>Branch / Specialization</label>
                  {branches.length>0 ? (
                    <select style={IS} value={ed.branch||''} onChange={e=>updateAt('education',idx,{branch:e.target.value})}>
                      <option value="">Select branch</option>{branches.map(b=><option key={b}>{b}</option>)}
                      <option value="__other">Other (type below)</option>
                    </select>
                  ) : (
                    <input style={IS} value={ed.branch||''} onChange={e=>updateAt('education',idx,{branch:e.target.value})} placeholder="e.g. Computer Science"/>
                  )}
                </div>
                {ed.branch==='__other' && (
                  <div>
                    <label style={LS}>Custom Branch</label>
                    <input style={IS} value={ed.branch_custom||''} onChange={e=>updateAt('education',idx,{branch_custom:e.target.value})} placeholder="Type the branch"/>
                  </div>
                )}
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Institution / University</label>
                  <input style={IS} value={ed.institution||''} onChange={e=>updateAt('education',idx,{institution:e.target.value})} placeholder="e.g. IIT Delhi"/>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Status</label>
                  <div style={{display:'flex',gap:8}}>
                    <button type="button" onClick={()=>updateAt('education',idx,{study_status:'completed'})} style={{flex:1,padding:'9px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:13,border:`1px solid ${!pursuing?'var(--ac)':'var(--bd)'}`,background:!pursuing?'var(--acbg)':'transparent',color:!pursuing?'var(--ac)':'var(--mu)',fontWeight:!pursuing?600:400}}>✓ Completed</button>
                    <button type="button" onClick={()=>updateAt('education',idx,{study_status:'pursuing'})} style={{flex:1,padding:'9px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:13,border:`1px solid ${pursuing?'var(--ac)':'var(--bd)'}`,background:pursuing?'var(--acbg)':'transparent',color:pursuing?'var(--ac)':'var(--mu)',fontWeight:pursuing?600:400}}>⏳ Pursuing</button>
                  </div>
                </div>
                {pursuing ? (
                  <>
                    <div>
                      <label style={LS}>Currently In</label>
                      <select style={IS} value={ed.current_period||''} onChange={e=>updateAt('education',idx,{current_period:e.target.value})}>
                        <option value="">Year / Semester</option>
                        <optgroup label="By Year">{STUDY_YEARS.map(y=><option key={y}>{y}</option>)}</optgroup>
                        <optgroup label="By Semester">{STUDY_SEMS.map(s=><option key={s}>{s}</option>)}</optgroup>
                      </select>
                    </div>
                    <div>
                      <label style={LS}>Expected Passing Year</label>
                      <select style={IS} value={ed.year||''} onChange={e=>updateAt('education',idx,{year:e.target.value})}>
                        <option value="">Year</option>{YEARS.map(y=><option key={y}>{y}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={LS}>Passing Year</label>
                      <select style={IS} value={ed.year||''} onChange={e=>updateAt('education',idx,{year:e.target.value})}>
                        <option value="">Year</option>{YEARS.map(y=><option key={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={LS}>CGPA / Percentage</label>
                      <input style={IS} value={ed.percentage_or_cgpa||''} onChange={e=>updateAt('education',idx,{percentage_or_cgpa:e.target.value})} placeholder="e.g. 8.5 or 78%"/>
                    </div>
                  </>
                )}
              </div>
            </div>
          )})}
          <button onClick={()=>pushTo('education',{level:'',course:'',course_custom:'',branch:'',branch_custom:'',study_status:'completed',current_period:'',institution:'',year:'',percentage_or_cgpa:''})} style={ADD_BTN}>+ Add Education</button>
        </div>

        {/* ── SECTION 2.7: CERTIFICATIONS ── */}
        <div style={SECTION}>
          <div style={{...SECTITLE,justifyContent:'space-between',width:'100%'}}>
            <span>📜 Certifications ({(form.certifications||[]).length})</span>
          </div>
          {(form.certifications||[]).map((c:any, idx:number) => (
            <div key={idx} style={ENTRY_CARD}>
              <button onClick={()=>removeAt('certifications', idx)} style={DEL_BTN} title="Remove">✕</button>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 100px',gap:12}}>
                <div>
                  <label style={LS}>Certificate Name</label>
                  <input style={IS} value={c.name||''} onChange={e=>updateAt('certifications',idx,{name:e.target.value})} placeholder="e.g. Generative AI Skills"/>
                </div>
                <div>
                  <label style={LS}>Issued By</label>
                  <input style={IS} value={c.issuer||''} onChange={e=>updateAt('certifications',idx,{issuer:e.target.value})} placeholder="e.g. Growthschool.ai"/>
                </div>
                <div>
                  <label style={LS}>Year</label>
                  <select style={IS} value={c.year||''} onChange={e=>updateAt('certifications',idx,{year:e.target.value})}>
                    <option value="">—</option>{YEARS.map(y=><option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
          <button onClick={()=>pushTo('certifications',{name:'',issuer:'',year:''})} style={ADD_BTN}>+ Add Certification</button>
        </div>

        {/* ── SECTION 2.8: ACHIEVEMENTS & AWARDS ── */}
        <div style={SECTION}>
          <div style={{...SECTITLE,justifyContent:'space-between',width:'100%'}}>
            <span>🏆 Achievements & Awards ({(form.achievements||[]).length})</span>
          </div>
          {(form.achievements||[]).map((a:any, idx:number) => (
            <div key={idx} style={ENTRY_CARD}>
              <button onClick={()=>removeAt('achievements', idx)} style={DEL_BTN} title="Remove">✕</button>
              <div style={{display:'grid',gridTemplateColumns:'1fr 100px',gap:12}}>
                <div>
                  <label style={LS}>Title *</label>
                  <input style={IS} value={a.title||''} onChange={e=>updateAt('achievements',idx,{title:e.target.value})} placeholder="e.g. Best Employee Award"/>
                </div>
                <div>
                  <label style={LS}>Year</label>
                  <select style={IS} value={a.year||''} onChange={e=>updateAt('achievements',idx,{year:e.target.value})}>
                    <option value="">—</option>{YEARS.map(y=><option key={y}>{y}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={LS}>Description (optional)</label>
                  <textarea rows={2} style={{...IS,resize:'none'}} value={a.description||''} onChange={e=>updateAt('achievements',idx,{description:e.target.value})} placeholder="e.g. Won government tenders worth ₹250 Crore..."/>
                </div>
              </div>
            </div>
          ))}
          <button onClick={()=>pushTo('achievements',{title:'',description:'',year:''})} style={ADD_BTN}>+ Add Achievement</button>
        </div>

        {/* ── SECTION 3: LOCATION ── */}
        <div style={SECTION}>
          <div style={SECTITLE}>📍 Location & Contact</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={LS}>City *</label>
              <select style={IS} value={form.city||''} onChange={e=>sf('city',e.target.value)}>
                <option value="">Select City</option>{CITIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={LS}>Other City (if not in list)</label>
              <input style={IS} value={form.other_city||''} onChange={e=>{sf('other_city',e.target.value);if(e.target.value)sf('city',e.target.value)}} placeholder="Type city name"/>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={LS}>Precise Location (GPS / Map pin)</label>
              <LocationPicker
                value={{ latitude: form.latitude, longitude: form.longitude, address: form.address, google_maps_url: form.google_maps_url }}
                onChange={(loc:any)=>setForm((f:any)=>{ const n={...f,...loc}; if(loc.city && !CITIES.includes(loc.city)){ n.other_city=loc.city } return n })}
              />
            </div>
            <div>
              <label style={LS}>State (auto-filled)</label>
              <input style={IS} value={form.state||''} onChange={e=>sf('state',e.target.value)} placeholder="Auto from location"/>
            </div>
            <div>
              <label style={LS}>Pincode (auto-filled)</label>
              <input style={IS} value={form.pincode||''} onChange={e=>sf('pincode',e.target.value)} placeholder="Auto from location"/>
            </div>
            <div>
              <label style={LS}>Languages Known</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:2}}>
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
        </div>

        {/* ── SECTION 4: PIPELINE & ASSIGNMENT ── */}
        <div style={SECTION}>
          <div style={SECTITLE}>⚙️ Pipeline & Assignment</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={LS}>Pipeline Status</label>
              <select style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--bd2)',borderRadius:10,color:(PIPELINE_COLORS[form.status||'New']||STATUS_COLORS[form.status||'New'])?.color||'var(--tx)',fontSize:13,fontFamily:'inherit',outline:'none',padding:'10px 14px',cursor:'pointer',fontWeight:600}} value={form.status||'New'} onChange={e=>sf('status',e.target.value)}>
                {PIPELINE_STATUSES.map(st=><option key={st} value={st} style={{background:'var(--bg3)',color:'var(--tx)',fontWeight:400}}>{PIPELINE_EMOJI[st]||''} {st}</option>)}
              </select>
              {form.status&&<div style={{marginTop:6,display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,color:(PIPELINE_COLORS[form.status]||STATUS_COLORS[form.status])?.color||'var(--mu)',background:(PIPELINE_COLORS[form.status]||STATUS_COLORS[form.status])?.bg||'var(--acbg)',padding:'4px 12px',borderRadius:20,width:'fit-content'}}>{PIPELINE_EMOJI[form.status]||''} {form.status}</div>}
            </div>
            <div>
              <label style={LS}>Assign To</label>
              <select style={IS} value={form.assigned_to||''} onChange={e=>sf('assigned_to',e.target.value)}>
                <option value="">Unassigned</option>
                {allUsers.map(au=><option key={au.id} value={au.id}>{au.full_name} ({au.role?.replace(/_/g,' ')})</option>)}
              </select>
              <div style={{fontSize:10,color:'var(--mu)',marginTop:4}}>Assigned user gets a notification</div>
            </div>
            <div>
              <label style={LS}>Source</label>
              <select style={IS} value={form.source||'Direct'} onChange={e=>sf('source',e.target.value)}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select>
            </div>
            <div>
              <label style={LS}>Source Detail</label>
              <input style={IS} value={form.source_detail||''} onChange={e=>sf('source_detail',e.target.value)} placeholder="e.g. Naukri profile URL"/>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={LS}>Recruiter Notes / Summary</label>
              <textarea rows={2} style={{...IS,resize:'none'}} value={form.ai_summary||''} onChange={e=>sf('ai_summary',e.target.value)} placeholder="Any notes, observations or AI summary about this candidate..."/>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY SAVE BAR ── */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:60,background:'var(--bg2)',borderTop:'1px solid var(--bd)',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,boxShadow:'0 -8px 24px rgba(0,0,0,0.15)'}}>
        <button onClick={()=>router.push('/dashboard/master')} style={{padding:'10px 20px',borderRadius:10,background:'transparent',color:'var(--mu)',border:'1px solid var(--bd)',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Cancel</button>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>saveProfile()} disabled={saving} style={{padding:'10px 28px',borderRadius:10,background:'var(--gn)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:700,fontFamily:'inherit',opacity:saving?0.7:1}}>{saving?'⏳ Saving...':'✅ Update Profile'}</button>
        </div>
      </div>

      {/* ── CV UPLOAD MODAL ── */}
      {showCV && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:16}} onClick={e=>{if(e.target===e.currentTarget&&!parsing){setShowCV(false);setParseMsg('')}}}>
          <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:18,padding:24,width:'100%',maxWidth:460,animation:'fadeIn 0.2s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700}}>📄 Upload CV / Resume</div>
              {!parsing&&<button onClick={()=>{setShowCV(false);setParseMsg('')}} style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:8,width:28,height:28,cursor:'pointer',color:'var(--tx)',fontSize:14}}>✕</button>}
            </div>
            {parsing ? (
              <div style={{textAlign:'center',padding:'30px 0'}}>
                <div style={{width:36,height:36,border:'3px solid var(--ac)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}/>
                <div style={{fontSize:13,color:'var(--tx)'}}>{parseMsg||'Processing...'}</div>
              </div>
            ) : (
              <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files?.[0];if(f)handleCVUpload(f)}} onClick={()=>cvRef.current?.click()} style={{border:`2px dashed ${dragOver?'var(--ac)':'var(--bd2)'}`,borderRadius:12,padding:'34px 20px',textAlign:'center',cursor:'pointer',background:dragOver?'var(--acbg)':'transparent'}}>
                <input ref={cvRef} type='file' accept='.pdf,.doc,.docx' onChange={e=>{const f=e.target.files?.[0];if(f)handleCVUpload(f)}} style={{display:'none'}}/>
                <div style={{fontSize:34,marginBottom:10}}>📤</div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--tx)'}}>Drop CV here or click to browse</div>
                <div style={{fontSize:11,color:'var(--mu)',marginTop:6}}>PDF, DOC, DOCX · AI extracts the details automatically</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ERROR MODAL ── */}
      {errorModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:120,padding:16}} onClick={e=>{if(e.target===e.currentTarget)setErrorModal(null)}}>
          <div style={{background:'var(--bg2)',border:'1px solid rgba(255,107,107,0.3)',borderRadius:16,padding:24,width:'100%',maxWidth:400,animation:'fadeIn 0.2s ease'}}>
            <div style={{fontSize:32,marginBottom:10}}>⚠️</div>
            <div style={{fontSize:16,fontWeight:700,color:'#ff6b6b',marginBottom:6}}>{errorModal.title}</div>
            <div style={{fontSize:13,color:'var(--tx)',lineHeight:1.5,marginBottom:18}}>{errorModal.msg}</div>
            <button onClick={()=>setErrorModal(null)} style={{width:'100%',padding:'10px',borderRadius:10,background:'var(--ac)',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>Got it</button>
          </div>
        </div>
      )}

      {/* ── SUCCESS TOAST ── */}
      {successToast && (
        <div style={{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',zIndex:130,background:'var(--gn)',color:'#fff',padding:'12px 22px',borderRadius:12,fontSize:13,fontWeight:600,boxShadow:'0 8px 30px rgba(0,0,0,0.3)',animation:'slideUp 0.3s ease'}}>{successToast}</div>
      )}
    </div>
  )
}
