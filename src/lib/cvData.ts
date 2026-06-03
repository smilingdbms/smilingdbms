// @ts-nocheck
// Shared CV data helpers — used by ResumeBuilder (preview/PDF) + public /cv/[token] page.
// Single source of truth so document + website stay consistent.

export const BRAND = 'RecruitBase Pro';

export const CV_COLORS = [
  { name: 'Indigo', hex: '#4f46e5' }, { name: 'Royal', hex: '#2563eb' },
  { name: 'Teal', hex: '#0d9488' },   { name: 'Emerald', hex: '#059669' },
  { name: 'Violet', hex: '#7c3aed' }, { name: 'Slate', hex: '#334155' },
  { name: 'Rose', hex: '#e11d48' },   { name: 'Amber', hex: '#d97706' },
];

export function arr(v){return Array.isArray(v)?v:[]}
export function csv(v){return (v||'').split(',').map(s=>s.trim()).filter(Boolean)}
export function val(v,d=''){return (v===null||v===undefined||v==='')?d:v}
export function shade(hex,p){
  try{const n=parseInt(hex.slice(1),16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  r=Math.round(r+(p<0?r:255-r)*p);g=Math.round(g+(p<0?g:255-g)*p);b=Math.round(b+(p<0?b:255-b)*p);
  return `rgb(${r},${g},${b})`}catch{return hex}}

const MONTHS=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function period(w){
  const f=[MONTHS[+w.from_month]||'', w.from_year||''].filter(Boolean).join(' ');
  const t=w.current?'Present':[MONTHS[+w.to_month]||'', w.to_year||''].filter(Boolean).join(' ');
  return [f,t].filter(Boolean).join(' – ');
}
export function eduLine(e){
  const course=e.course==='Other'?(e.course_custom||'Other'):(e.course||e.level||'');
  const branch=e.branch==='Other'?(e.branch_custom||''):(e.branch||'');
  const t=[course,branch].filter(Boolean).join(' — ');
  const yr=e.year||(e.study_status==='pursuing'?(e.current_period||'Pursuing'):'');
  return {t,inst:e.institution||'',yr,grade:e.percentage_or_cgpa||''};
}
export function bullets(w){
  if(Array.isArray(w.bullets)) return w.bullets.filter(Boolean);
  if(typeof w.bullets==='string'&&w.bullets.trim()) return w.bullets.split('\n').map(s=>s.replace(/^[•\-\s]+/,'').trim()).filter(Boolean);
  if(w.desc||w.description) return [w.desc||w.description];
  return [];
}
export function listText(a){return typeof a==='string'?a:(a.title||a.text||a.name||'')}

// Build normalised CV data. mask=true hides phone/email (recruiter share to client).
export function buildCV(p, mask=false){
  const ctc=(v)=>{ if(!v&&v!==0)return ''; return `₹${v} LPA` };
  return {
    name:val(p.name,'Candidate'), role:val(p.role||p.designation),
    email: mask?'':val(p.email),
    mobile: mask?'':(p.mobile?`${p.country_code||''} ${p.mobile}`.trim():''),
    masked: mask,
    city:val(p.city)===' Other'?val(p.other_city):val(p.city||p.other_city),
    state:val(p.state),
    linkedin: mask?'':val(p.linkedin), github: mask?'':val(p.github),
    age:val(p.age), gender:val(p.gender),
    summary:val(p.ai_summary||p.summary), segment:val(p.segment),
    experience:val(p.experience||p.total_experience), relevant:val(p.relevant_experience),
    current_company:val(p.current_company),
    current_ctc:ctc(p.current_ctc), expected_ctc:ctc(p.expected_ctc),
    notice:val(p.notice_period), industry:val(p.industry),
    emp_type:val(p.employment_type), job_type:val(p.job_type), work_mode:val(p.work_mode),
    availability:val(p.availability), relocate:p.willing_to_relocate?'Yes':'',
    looking_for:val(p.looking_for), internship_dur:val(p.internship_duration),
    stipend:val(p.stipend_expected_range||p.stipend_expected),
    immediate:p.available_immediately?'Immediate':'',
    skills:csv(p.skills), languages:csv(p.languages),
    work:arr(p.work_experiences), education:arr(p.education),
    achievements:arr(p.achievements),
    certifications:typeof p.certifications==='string'?csv(p.certifications):arr(p.certifications),
    photo:val(p.photo_url),
  };
}

export function snapshot(d){
  const out=[]; const add=(k,v)=>{ if(v) out.push({k,v}) };
  add('Experience', d.experience?`${d.experience} yrs`:'');
  add('Current Company', d.current_company);
  add('Industry', d.industry);
  add('Current CTC', d.current_ctc);
  add('Expected CTC', d.expected_ctc);
  add('Notice', d.notice);
  add('Location', [d.city,d.state].filter(Boolean).join(', '));
  add('Work Mode', d.work_mode);
  add('Employment', d.emp_type);
  add('Availability', d.availability||d.immediate);
  add('Relocate', d.relocate);
  add('Looking For', d.looking_for);
  add('Duration', d.internship_dur);
  add('Stipend', d.stipend);
  return out;
}
export function contactItems(d){
  return [d.email,d.mobile,[d.city,d.state].filter(Boolean).join(', '),d.linkedin,d.github,d.age?`Age: ${d.age}`:'',d.gender].filter(Boolean);
}
