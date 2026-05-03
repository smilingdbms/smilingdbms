import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import DashboardNav from '../../src/components/DashboardNav'

// ── FIELD MAPPING CONFIG ─────────────────────────────────────────
const SYSTEM_FIELDS = [
  { key: 'name', label: 'Full Name', required: true },
  { key: 'mobile', label: 'Mobile Number', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'experience', label: 'Experience (Years)', required: false },
  { key: 'role', label: 'Role / Designation', required: false },
  { key: 'qualification', label: 'Qualification', required: false },
  { key: 'skills', label: 'Skills', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'industry', label: 'Industry', required: false },
  { key: 'gender', label: 'Gender', required: false },
  { key: 'age', label: 'Age', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'linkedin', label: 'LinkedIn URL', required: false },
  { key: 'type', label: 'Profile Type (Candidate/Recruiter)', required: false },
  { key: 'ai_summary', label: 'Summary / Notes', required: false },
  { key: 'country_code', label: 'Country Code', required: false },
  { key: 'ignore', label: '— Ignore this column —', required: false },
]

const VALID_STATUSES = ['New','Contacted','Screening','Shortlisted','Interview Scheduled','Offer Made','Placed','Rejected','On Hold']

export default function ImportPage() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [step, setStep] = useState<'upload'|'map'|'preview'|'importing'|'done'>('upload')
  const [rawRows, setRawRows] = useState<any[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<number, string>>({})
  const [importMode, setImportMode] = useState<'append'|'overwrite'>('append')
  const [assignTo, setAssignTo] = useState('')
  const [profileType, setProfileType] = useState('Candidate')
  const [preview, setPreview] = useState<any[]>([])
  const [duplicates, setDuplicates] = useState<number[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [imported, setImported] = useState(0)
  const [skipped, setSkipped] = useState(0)
  const [total, setTotal] = useState(0)
  const [importing, setImporting] = useState(false)
  const [fileName, setFileName] = useState('')
  const [sheetsUrl, setSheetsUrl] = useState('')
  const [loadingSheets, setLoadingSheets] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      loadData(session.user)
    })
  }, [router])

  async function loadData(u: any) {
    const { data: au } = await supabase.from('app_users').select('*').eq('id', u.id).single()
    setAppUser(au)
    setAssignTo(u.id)
    const { data: users } = await supabase.from('app_users').select('*').eq('status', 'active')
    setAllUsers(users || [])
  }

  // ── PARSE CSV ────────────────────────────────────────────────────
  function parseCSV(text: string): string[][] {
    const rows: string[][] = []
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    for (const line of lines) {
      const row: string[] = []
      let inQuote = false, cell = ''
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') { inQuote = !inQuote }
        else if (ch === ',' && !inQuote) { row.push(cell.trim()); cell = '' }
        else { cell += ch }
      }
      row.push(cell.trim())
      rows.push(row)
    }
    return rows
  }

  // ── AUTO MAP columns based on header names ──────────────────────
  function autoMap(hdrs: string[]): Record<number, string> {
    const map: Record<number, string> = {}
    const matchRules: Record<string, string[]> = {
      name: ['name', 'full name', 'candidate name', 'applicant name', 'candidate', 'full_name'],
      mobile: ['mobile', 'phone', 'contact', 'phone number', 'mobile number', 'cell', 'mob'],
      email: ['email', 'email address', 'e-mail', 'mail'],
      experience: ['experience', 'exp', 'years', 'total exp', 'work exp', 'yrs'],
      role: ['role', 'designation', 'position', 'job title', 'title', 'current role', 'profile'],
      qualification: ['qualification', 'education', 'degree', 'qual', 'highest qualification'],
      skills: ['skills', 'key skills', 'skill set', 'competencies', 'technologies'],
      city: ['city', 'location', 'place', 'current location', 'current city'],
      industry: ['industry', 'sector', 'domain', 'vertical'],
      gender: ['gender', 'sex'],
      age: ['age', 'dob', 'date of birth'],
      status: ['status', 'stage', 'current status'],
      linkedin: ['linkedin', 'linkedin url', 'profile url', 'linkedin profile'],
      type: ['type', 'profile type', 'category'],
      ai_summary: ['summary', 'notes', 'remarks', 'comment', 'observation'],
    }
    hdrs.forEach((h, i) => {
      const hl = h.toLowerCase().trim()
      let matched = 'ignore'
      for (const [field, patterns] of Object.entries(matchRules)) {
        if (patterns.some(p => hl.includes(p))) { matched = field; break }
      }
      map[i] = matched
    })
    return map
  }

  // ── HANDLE FILE UPLOAD ───────────────────────────────────────────
  async function handleFile(file: File) {
    setFileName(file.name)
    const text = await file.text()
    let rows: string[][]
    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      rows = parseCSV(text)
    } else {
      alert('Please upload a CSV file. For Excel (.xlsx), save as CSV first using File → Save As → CSV.')
      return
    }
    if (rows.length < 2) { alert('File has no data rows'); return }
    const hdrs = rows[0]
    setHeaders(hdrs)
    setRawRows(rows.slice(1).filter(r => r.some(c => c.trim())))
    setMapping(autoMap(hdrs))
    setStep('map')
  }

  // ── LOAD FROM GOOGLE SHEETS ──────────────────────────────────────
  async function loadFromSheets() {
    if (!sheetsUrl.trim()) { alert('Please enter a Google Sheets URL'); return }
    setLoadingSheets(true)
    try {
      // Extract sheet ID from URL
      const match = sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (!match) { alert('Invalid Google Sheets URL'); setLoadingSheets(false); return }
      const sheetId = match[1]
      // Use public export URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
      const resp = await fetch(csvUrl)
      if (!resp.ok) throw new Error('Could not access sheet. Make sure it is set to "Anyone with the link can view"')
      const text = await resp.text()
      const rows = parseCSV(text)
      if (rows.length < 2) { alert('Sheet has no data'); setLoadingSheets(false); return }
      setFileName('Google Sheet')
      setHeaders(rows[0])
      setRawRows(rows.slice(1).filter(r => r.some(c => c.trim())))
      setMapping(autoMap(rows[0]))
      setStep('map')
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoadingSheets(false)
  }

  // ── BUILD PREVIEW ────────────────────────────────────────────────
  async function buildPreview() {
    const errs: string[] = []
    const dupes: number[] = []
    const previewed: any[] = []

    // Get existing mobiles and emails for duplicate check
    const { data: existing } = await supabase.from('profiles').select('mobile, email, name')
    const existingMobiles = new Set((existing || []).map(p => (p.mobile || '').replace(/\D/g, '')))
    const existingEmails = new Set((existing || []).map(p => (p.email || '').toLowerCase()))

    rawRows.forEach((row, idx) => {
      const record: any = {
        type: profileType,
        status: 'New',
        assigned_to: assignTo,
        created_by: appUser?.id,
        country_code: '+91 India',
      }
      let hasName = false
      Object.entries(mapping).forEach(([colIdx, field]) => {
        if (field === 'ignore') return
        const val = (row[parseInt(colIdx)] || '').trim()
        if (!val) return
        if (field === 'name') { record.name = val; hasName = true }
        else if (field === 'mobile') record.mobile = val.replace(/\D/g, '').slice(-10)
        else if (field === 'experience') record.experience = val.replace(/\D/g, '').slice(0, 2) || null
        else if (field === 'age') record.age = parseInt(val) || null
        else if (field === 'status') record.status = VALID_STATUSES.includes(val) ? val : 'New'
        else if (field === 'type') record.type = val.toLowerCase().includes('recruit') ? 'Recruiter' : 'Candidate'
        else record[field] = val
      })
      if (!hasName) { errs.push(`Row ${idx + 2}: Missing name`); return }

      // Check duplicates
      const mob = (record.mobile || '').replace(/\D/g, '')
      const email = (record.email || '').toLowerCase()
      if ((mob && existingMobiles.has(mob)) || (email && existingEmails.has(email))) {
        dupes.push(idx)
      }
      previewed.push(record)
    })

    setPreview(previewed)
    setDuplicates(dupes)
    setErrors(errs)
    setTotal(previewed.length)
    setStep('preview')
  }

  // ── RUN IMPORT ───────────────────────────────────────────────────
  async function runImport(skipDupes: boolean) {
    setStep('importing')
    setImporting(true)
    let importedCount = 0, skippedCount = 0

    // If overwrite mode, delete existing first
    if (importMode === 'overwrite') {
      await supabase.from('profiles').delete().eq('created_by', appUser?.id)
    }

    // Import in batches of 50
    const toImport = preview.filter((_, i) => !skipDupes || !duplicates.includes(i))
    const BATCH = 50
    const allInserted: any[] = []
    for (let i = 0; i < toImport.length; i += BATCH) {
      const batch = toImport.slice(i, i + BATCH)
      const { data: inserted, error } = await supabase.from('profiles').insert(batch).select()
      if (error) { skippedCount += batch.length }
      else { 
        importedCount += batch.length
        if (inserted) allInserted.push(...inserted)
      }
      setImported(importedCount)
      setSkipped(skippedCount)
    }

    // Sync all imported records to Google Sheets
    if (allInserted.length > 0 && appUser?.google_sheet_url) {
      const assignedUser = allUsers.find((u: any) => u.id === assignTo)
      for (const record of allInserted) {
        fetch('/api/parse-cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ADD',
            ...record,
            syncedBy: appUser.full_name,
            addedBy: appUser.full_name,
            lastUpdatedBy: appUser.full_name,
            assignedToName: assignedUser?.full_name || appUser.full_name,
            userRole: appUser.role,
            syncedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            importedVia: 'Bulk Import — ' + fileName
          })
        }).catch(() => {})
      }
    }

    setImporting(false)
    setStep('done')
  }

  const IS: any = { width:'100%', background:'#22262f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', color:'#e8eaf0', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const LS: any = { display:'block', fontSize:10, fontWeight:600, color:'#7a7f90', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }

  return (
    <div style={{minHeight:'100vh', background:'#111318', color:'#e8eaf0', fontFamily:"'Outfit',Inter,sans-serif"}}>
      <DashboardNav />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box}select option{background:#22262f}`}</style>

      {/* Nav */}
      <nav style={{background:'#0d0f14', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div style={{width:28, height:28, borderRadius:7, background:'rgba(108,140,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', color:'#6c8cff', fontSize:13}}>R</div>
          <span style={{fontWeight:700, fontSize:14}}>RecruitBase Pro</span>
          <span style={{fontSize:12, padding:'2px 10px', borderRadius:20, background:'rgba(108,140,255,0.1)', color:'#6c8cff'}}>📥 Bulk Import</span>
        </div>
        
      </nav>

      <div style={{maxWidth:1000, margin:'0 auto', padding:'24px 16px'}}>

        {/* Progress Steps */}
        <div style={{display:'flex', gap:4, alignItems:'center', marginBottom:28}}>
          {[['upload','1. Upload'],['map','2. Map Columns'],['preview','3. Preview'],['importing','4. Importing'],['done','5. Done']].map(([s, label], i) => {
            const steps = ['upload','map','preview','importing','done']
            const current = steps.indexOf(step)
            const thisStep = steps.indexOf(s)
            const done = thisStep < current
            const active = thisStep === current
            return (
              <div key={s} style={{display:'flex', alignItems:'center', gap:4}}>
                <div style={{display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:20,
                  background: active ? 'rgba(108,140,255,0.2)' : done ? 'rgba(61,214,140,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? '#6c8cff' : done ? '#3dd68c' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? '#6c8cff' : done ? '#3dd68c' : '#505468', fontSize:12}}>
                  <span>{done ? '✓' : thisStep+1}</span>
                  <span>{label.split('. ')[1]}</span>
                </div>
                {i < 4 && <div style={{width:20, height:1, background:'rgba(255,255,255,0.08)'}}/>}
              </div>
            )
          })}
        </div>

        {/* ── STEP 1: UPLOAD ─────────────────────────────────── */}
        {step === 'upload' && (
          <div>
            <h2 style={{fontSize:18, fontWeight:700, marginBottom:4}}>Upload Your Data</h2>
            <p style={{fontSize:13, color:'#7a7f90', marginBottom:24}}>Import candidates from CSV, Excel (saved as CSV), or Google Sheets</p>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20}}>
              {/* File Upload */}
              <div style={{background:'#1a1d24', border:'2px dashed rgba(255,255,255,0.1)', borderRadius:14, padding:28, textAlign:'center', cursor:'pointer'}}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); (e.currentTarget as any).style.borderColor = '#6c8cff' }}
                onDragLeave={e => { (e.currentTarget as any).style.borderColor = 'rgba(255,255,255,0.1)' }}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}>
                <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:'none'}} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}/>
                <div style={{fontSize:40, marginBottom:10}}>📊</div>
                <div style={{fontWeight:600, fontSize:14, marginBottom:4}}>Upload CSV / Excel</div>
                <div style={{fontSize:12, color:'#7a7f90', marginBottom:12}}>Drag & drop or click to browse</div>
                <div style={{fontSize:11, color:'#505468'}}>CSV, TXT supported · Excel: Save as CSV first</div>
              </div>

              {/* Google Sheets */}
              <div style={{background:'#1a1d24', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:28}}>
                <div style={{fontSize:32, marginBottom:10, textAlign:'center'}}>🔗</div>
                <div style={{fontWeight:600, fontSize:14, marginBottom:4, textAlign:'center'}}>Google Sheets Link</div>
                <div style={{fontSize:12, color:'#7a7f90', marginBottom:14, textAlign:'center'}}>Paste a public Google Sheets URL</div>
                <input value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." style={{...IS, marginBottom:10, fontSize:12}}/>
                <div style={{fontSize:11, color:'#505468', marginBottom:12}}>⚠ Sheet must be set to "Anyone with the link can view"</div>
                <button onClick={loadFromSheets} disabled={loadingSheets}
                  style={{width:'100%', padding:'10px', borderRadius:10, background:'#3dd68c', color:'#111', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', opacity:loadingSheets?0.7:1}}>
                  {loadingSheets ? 'Loading...' : 'Load Sheet Data'}
                </button>
              </div>
            </div>

            {/* Import settings */}
            <div style={{background:'#1a1d24', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:20}}>
              <div style={{fontSize:13, fontWeight:600, marginBottom:14, color:'#6c8cff'}}>Import Settings</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14}}>
                <div>
                  <label style={LS}>Import Mode</label>
                  <select style={IS} value={importMode} onChange={e => setImportMode(e.target.value as any)}>
                    <option value="append">Append — Add to existing data</option>
                    <option value="overwrite">Overwrite — Replace my existing data</option>
                  </select>
                </div>
                <div>
                  <label style={LS}>Default Profile Type</label>
                  <select style={IS} value={profileType} onChange={e => setProfileType(e.target.value)}>
                    <option>Candidate</option>
                    <option>Recruiter</option>
                  </select>
                </div>
                <div>
                  <label style={LS}>Assign Records To</label>
                  <select style={IS} value={assignTo} onChange={e => setAssignTo(e.target.value)}>
                    <option value={appUser?.id}>Myself ({appUser?.full_name})</option>
                    {allUsers.filter(u => u.id !== appUser?.id && ['recruiter','sr_recruiter'].includes(u.role)).map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} — {u.role}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Download template */}
            <div style={{marginTop:16, padding:14, background:'rgba(108,140,255,0.06)', border:'1px solid rgba(108,140,255,0.2)', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontSize:13, fontWeight:600, marginBottom:2}}>📋 Download CSV Template</div>
                <div style={{fontSize:11, color:'#7a7f90'}}>Use this template to format your data correctly</div>
              </div>
              <button onClick={() => {
                const csv = 'Name,Mobile,Email,Experience (Years),Role/Designation,Qualification,Skills,City,Industry,Gender,Age,Status,LinkedIn URL,Profile Type,Summary\nJohn Doe,9876543210,john@email.com,5,Software Developer,B.Tech,React Node.js Python,Delhi,IT / Software,Male,28,New,linkedin.com/in/john,Candidate,Experienced full stack developer'
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = 'RecruitBase_Import_Template.csv'; a.click()
              }} style={{padding:'8px 16px', borderRadius:8, background:'rgba(108,140,255,0.15)', color:'#6c8cff', border:'1px solid rgba(108,140,255,0.3)', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600}}>
                ⬇ Download Template
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: MAP COLUMNS ─────────────────────────────── */}
        {step === 'map' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20}}>
              <div>
                <h2 style={{fontSize:18, fontWeight:700, marginBottom:4}}>Map Your Columns</h2>
                <p style={{fontSize:13, color:'#7a7f90'}}>File: <strong style={{color:'#6c8cff'}}>{fileName}</strong> · {rawRows.length} data rows · {headers.length} columns · Auto-mapped where possible</p>
              </div>
              <button onClick={() => setStep('upload')} style={{padding:'7px 14px', borderRadius:8, background:'transparent', color:'#7a7f90', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontFamily:'inherit', fontSize:12}}>← Back</button>
            </div>

            <div style={{background:'#1a1d24', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden', marginBottom:16}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                <thead>
                  <tr style={{background:'#22262f'}}>
                    <th style={{padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:600, color:'#7a7f90', textTransform:'uppercase', letterSpacing:1, width:'5%'}}>#</th>
                    <th style={{padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:600, color:'#7a7f90', textTransform:'uppercase', letterSpacing:1, width:'30%'}}>Your Column</th>
                    <th style={{padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:600, color:'#7a7f90', textTransform:'uppercase', letterSpacing:1, width:'30%'}}>Maps To</th>
                    <th style={{padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:600, color:'#7a7f90', textTransform:'uppercase', letterSpacing:1, width:'35%'}}>Sample Data</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h, i) => {
                    const sample = rawRows.slice(0, 3).map(r => r[i]).filter(Boolean).join(' / ')
                    const mapped = mapping[i]
                    return (
                      <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                        <td style={{padding:'10px 16px', color:'#505468'}}>{i+1}</td>
                        <td style={{padding:'10px 16px', fontWeight:500}}>{h}</td>
                        <td style={{padding:'10px 16px'}}>
                          <select value={mapping[i] || 'ignore'} onChange={e => setMapping(m => ({...m, [i]: e.target.value}))}
                            style={{...IS, background: mapped && mapped !== 'ignore' ? 'rgba(61,214,140,0.08)' : '#22262f',
                              borderColor: mapped && mapped !== 'ignore' ? 'rgba(61,214,140,0.3)' : 'rgba(255,255,255,0.1)'}}>
                            {SYSTEM_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}{f.required?' *':''}</option>)}
                          </select>
                        </td>
                        <td style={{padding:'10px 16px', fontSize:11, color:'#7a7f90'}}>{sample || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Validation check */}
            {!Object.values(mapping).includes('name') && (
              <div style={{padding:12, background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', borderRadius:8, fontSize:13, color:'#ff6b6b', marginBottom:12}}>
                ⚠ Please map at least one column to <strong>Full Name</strong> — it is required
              </div>
            )}

            <div style={{display:'flex', justifyContent:'flex-end'}}>
              <button onClick={buildPreview} disabled={!Object.values(mapping).includes('name')}
                style={{padding:'10px 24px', borderRadius:10, background:'#6c8cff', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', opacity:Object.values(mapping).includes('name')?1:0.5}}>
                Preview Import →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: PREVIEW ─────────────────────────────────── */}
        {step === 'preview' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16}}>
              <div>
                <h2 style={{fontSize:18, fontWeight:700, marginBottom:4}}>Preview & Validate</h2>
                <p style={{fontSize:13, color:'#7a7f90'}}>{total} records ready · {duplicates.length} duplicates found · {errors.length} errors</p>
              </div>
              <button onClick={() => setStep('map')} style={{padding:'7px 14px', borderRadius:8, background:'transparent', color:'#7a7f90', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontFamily:'inherit', fontSize:12}}>← Back</button>
            </div>

            {/* Summary cards */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16}}>
              {[
                {l:'Total Records', v:total, c:'#6c8cff'},
                {l:'Ready to Import', v:total - duplicates.length - errors.length, c:'#3dd68c'},
                {l:'Duplicates Found', v:duplicates.length, c:'#ff9f43'},
                {l:'Errors', v:errors.length, c:'#ff6b6b'},
              ].map(s => (
                <div key={s.l} style={{background:'#1a1d24', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:16}}>
                  <div style={{fontSize:9, fontWeight:600, color:'#7a7f90', textTransform:'uppercase', letterSpacing:1, marginBottom:4}}>{s.l}</div>
                  <div style={{fontSize:24, fontWeight:700, color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div style={{background:'rgba(255,107,107,0.08)', border:'1px solid rgba(255,107,107,0.2)', borderRadius:10, padding:14, marginBottom:14}}>
                <div style={{fontSize:13, fontWeight:600, color:'#ff6b6b', marginBottom:8}}>⚠ Errors — These rows will be skipped</div>
                {errors.slice(0,5).map((e, i) => <div key={i} style={{fontSize:12, color:'#ff6b6b', marginBottom:3}}>• {e}</div>)}
                {errors.length > 5 && <div style={{fontSize:11, color:'#7a7f90'}}>...and {errors.length - 5} more</div>}
              </div>
            )}

            {/* Duplicates warning */}
            {duplicates.length > 0 && (
              <div style={{background:'rgba(255,159,67,0.08)', border:'1px solid rgba(255,159,67,0.2)', borderRadius:10, padding:14, marginBottom:14}}>
                <div style={{fontSize:13, fontWeight:600, color:'#ff9f43', marginBottom:4}}>⚡ {duplicates.length} duplicate records found (same mobile or email already in system)</div>
                <div style={{fontSize:12, color:'#7a7f90'}}>You can skip duplicates or import them anyway</div>
              </div>
            )}

            {/* Preview table */}
            <div style={{background:'#1a1d24', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'auto', marginBottom:16, maxHeight:320}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
                <thead style={{position:'sticky', top:0, background:'#22262f', zIndex:1}}>
                  <tr>
                    {['#','Name','Mobile','Email','Role','Qual','City','Status','Flag'].map(h => (
                      <th key={h} style={{padding:'8px 12px', textAlign:'left', fontSize:9, fontWeight:600, color:'#7a7f90', textTransform:'uppercase', letterSpacing:1, whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 100).map((p, i) => {
                    const isDupe = duplicates.includes(i)
                    return (
                      <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)', background:isDupe?'rgba(255,159,67,0.05)':'transparent'}}>
                        <td style={{padding:'7px 12px', color:'#505468'}}>{i+1}</td>
                        <td style={{padding:'7px 12px', fontWeight:500}}>{p.name}</td>
                        <td style={{padding:'7px 12px', color:'#7a7f90'}}>{p.mobile||'—'}</td>
                        <td style={{padding:'7px 12px', color:'#7a7f90'}}>{p.email||'—'}</td>
                        <td style={{padding:'7px 12px', color:'#7a7f90'}}>{p.role||'—'}</td>
                        <td style={{padding:'7px 12px', color:'#7a7f90'}}>{p.qualification||'—'}</td>
                        <td style={{padding:'7px 12px', color:'#7a7f90'}}>{p.city||'—'}</td>
                        <td style={{padding:'7px 12px'}}><span style={{padding:'2px 8px', borderRadius:20, fontSize:10, background:'rgba(100,100,120,0.3)', color:'#aaa'}}>{p.status}</span></td>
                        <td style={{padding:'7px 12px'}}>{isDupe ? <span style={{fontSize:10, color:'#ff9f43'}}>⚡ Dupe</span> : <span style={{fontSize:10, color:'#3dd68c'}}>✓</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {preview.length > 100 && <div style={{padding:12, textAlign:'center', fontSize:12, color:'#7a7f90'}}>Showing first 100 of {preview.length} records</div>}
            </div>

            {/* Import buttons */}
            <div style={{display:'flex', gap:12, justifyContent:'flex-end'}}>
              {duplicates.length > 0 && (
                <button onClick={() => runImport(true)}
                  style={{padding:'10px 20px', borderRadius:10, background:'rgba(255,159,67,0.15)', color:'#ff9f43', border:'1px solid rgba(255,159,67,0.3)', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600}}>
                  Import — Skip {duplicates.length} Duplicates
                </button>
              )}
              <button onClick={() => runImport(false)}
                style={{padding:'10px 24px', borderRadius:10, background:'#6c8cff', color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600}}>
                Import All {total} Records
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: IMPORTING ───────────────────────────────── */}
        {step === 'importing' && (
          <div style={{textAlign:'center', padding:'60px 20px'}}>
            <div style={{fontSize:48, marginBottom:16}}>⚡</div>
            <h2 style={{fontSize:20, fontWeight:700, marginBottom:8}}>Importing Records...</h2>
            <p style={{fontSize:13, color:'#7a7f90', marginBottom:24}}>Please wait, do not close this window</p>
            <div style={{background:'rgba(255,255,255,0.06)', borderRadius:8, height:8, maxWidth:400, margin:'0 auto 16px', overflow:'hidden'}}>
              <div style={{height:'100%', background:'#6c8cff', borderRadius:8, width:`${total > 0 ? Math.round(((imported+skipped)/total)*100) : 0}%`, transition:'width 0.3s'}}/>
            </div>
            <div style={{fontSize:14, color:'#6c8cff', fontWeight:600}}>{imported + skipped} / {total} processed</div>
            <div style={{fontSize:12, color:'#7a7f90', marginTop:4}}>{imported} imported · {skipped} skipped</div>
          </div>
        )}

        {/* ── STEP 5: DONE ────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{textAlign:'center', padding:'60px 20px'}}>
            <div style={{fontSize:64, marginBottom:16}}>🎉</div>
            <h2 style={{fontSize:22, fontWeight:700, marginBottom:8}}>Import Complete!</h2>
            <div style={{display:'flex', gap:20, justifyContent:'center', marginBottom:24}}>
              <div style={{background:'rgba(61,214,140,0.1)', border:'1px solid rgba(61,214,140,0.3)', borderRadius:12, padding:'16px 24px'}}>
                <div style={{fontSize:28, fontWeight:700, color:'#3dd68c'}}>{imported}</div>
                <div style={{fontSize:12, color:'#7a7f90'}}>Successfully imported</div>
              </div>
              <div style={{background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', borderRadius:12, padding:'16px 24px'}}>
                <div style={{fontSize:28, fontWeight:700, color:'#ff6b6b'}}>{skipped}</div>
                <div style={{fontSize:12, color:'#7a7f90'}}>Skipped / Failed</div>
              </div>
            </div>
            <div style={{display:'flex', gap:12, justifyContent:'center'}}>
              <button onClick={() => { setStep('upload'); setPreview([]); setRawRows([]); setHeaders([]); setFileName(''); setSheetsUrl(''); setImported(0); setSkipped(0) }}
                style={{padding:'10px 20px', borderRadius:10, background:'transparent', color:'#7a7f90', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontFamily:'inherit', fontSize:13}}>
                Import More
              </button>
              <button onClick={() => router.push('/dashboard')}
                style={{padding:'10px 24px', borderRadius:10, background:'#6c8cff', color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600}}>
                View Dashboard →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
