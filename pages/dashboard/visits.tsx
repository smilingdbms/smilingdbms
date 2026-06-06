// @ts-nocheck
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'

// ════════════════════════════════════════════════════════════════════════
//  BD FIELD VISITS — GPS Camera (auto-upload + details form)
//  Capture → GPS/address/time STAMPED on photo → AUTO upload + create row
//  → form opens for Company name, Industry, Purpose, Notes → update row.
//  100% free: getUserMedia + navigator.geolocation + OSM. No API key.
// ════════════════════════════════════════════════════════════════════════

const INDUSTRIES = ['IT / Software', 'Healthcare', 'Manufacturing', 'BFSI / Finance', 'Retail / FMCG', 'Logistics', 'Education', 'Construction / Real Estate', 'Hospitality', 'Other']

export default function FieldVisits() {
  const router = useRouter()
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visits, setVisits] = useState([])
  const [mode, setMode] = useState('list')     // list | capture | form
  const [camErr, setCamErr] = useState('')
  const [loc, setLoc] = useState(null)
  const [locating, setLocating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [shotUrl, setShotUrl] = useState(null)  // local preview
  const [rowId, setRowId] = useState(null)       // inserted visit id
  const [form, setForm] = useState({ client_name: '', industry: '', purpose: 'Client Meeting', notes: '' })
  const [saving, setSaving] = useState(false)
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null), fileRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      const { data: au } = await supabase.from('app_users').select('*').eq('id', session.user.id).single()
      setMe(au); await loadVisits(au); setLoading(false)
    })
    return () => stopCam()
  }, [])

  async function loadVisits(au) {
    const admin = ['super_admin', 'platform_admin', 'platform_manager'].includes(au?.role)
    let q = supabase.from('bd_visits').select('*').order('created_at', { ascending: false }).limit(100)
    if (!admin && au?.company_id) q = q.eq('company_id', au.company_id)
    const { data } = await q; setVisits(data || [])
  }

  async function startCam() {
    setCamErr(''); setMode('capture'); setShotUrl(null); getLocation()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
    } catch { setCamErr('Camera nahi khuli — permission allow karo, ya neeche se photo upload karo.') }
  }
  function stopCam() { try { streamRef.current?.getTracks().forEach(t => t.stop()) } catch {} streamRef.current = null }

  function getLocation() {
    if (!navigator.geolocation) { setCamErr('GPS not supported on this device.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = +pos.coords.latitude.toFixed(6), lng = +pos.coords.longitude.toFixed(6)
      let address = ''
      try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`, { headers: { Accept: 'application/json' } }); const d = await r.json(); address = d?.display_name || '' } catch {}
      setLoc({ lat, lng, address }); setLocating(false)
    }, () => { setLocating(false); setCamErr('Location permission denied — allow karke retry karo.') }, { enableHighAccuracy: true, timeout: 15000 })
  }

  function stampToCanvas(source, sw, sh, curLoc) {
    const maxW = 1280, scale = Math.min(1, maxW / sw), W = Math.round(sw * scale), H = Math.round(sh * scale)
    const cv = canvasRef.current; cv.width = W; cv.height = H
    const ctx = cv.getContext('2d'); ctx.drawImage(source, 0, 0, W, H)
    const now = new Date()
    const lines = [
      '📍 Field Visit',
      curLoc?.address ? (curLoc.address.length > 70 ? curLoc.address.slice(0, 70) + '…' : curLoc.address) : 'Address: not captured',
      `Lat ${curLoc?.lat ?? '—'}, Lng ${curLoc?.lng ?? '—'}`,
      `${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')} · ${me?.full_name || me?.email || ''}`,
    ]
    const pad = Math.round(W * 0.025), fs = Math.max(13, Math.round(W * 0.022)), lh = fs * 1.5, panelH = lines.length * lh + pad * 1.5
    const g = ctx.createLinearGradient(0, H - panelH, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0.82)')
    ctx.fillStyle = g; ctx.fillRect(0, H - panelH, W, panelH)
    ctx.fillStyle = '#10b981'; ctx.fillRect(0, H - panelH, Math.round(W * 0.012), panelH)
    ctx.textBaseline = 'top'
    lines.forEach((ln, i) => { ctx.fillStyle = i === 0 ? '#34d399' : '#fff'; ctx.font = `${i === 0 ? '800' : '500'} ${i === 0 ? fs + 2 : fs}px Arial, sans-serif`; ctx.fillText(ln, pad * 1.6, H - panelH + pad + i * lh) })
    return new Promise(res => cv.toBlob(b => res(b), 'image/jpeg', 0.85))
  }

  // capture → stamp → AUTO upload + create row → open form
  async function autoUpload(blob, curLoc) {
    setShotUrl(URL.createObjectURL(blob)); setMode('form'); setUploading(true)
    try {
      const path = `${me?.company_id || 'na'}/${me?.id}/${Date.now()}.jpg`
      const up = await supabase.storage.from('visits').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
      if (up.error) throw up.error
      const { data: pub } = supabase.storage.from('visits').getPublicUrl(path)
      const row = {
        company_id: me?.company_id || null, user_id: me?.id, photo_url: pub?.publicUrl || null,
        latitude: curLoc?.lat ?? null, longitude: curLoc?.lng ?? null, address: curLoc?.address || null,
        google_maps_url: curLoc ? `https://www.google.com/maps?q=${curLoc.lat},${curLoc.lng}` : null,
        purpose: 'Client Meeting',
      }
      const ins = await supabase.from('bd_visits').insert([row]).select('id').single()
      if (ins.error) throw ins.error
      setRowId(ins.data.id)
    } catch (e) {
      alert('Upload nahi hua: ' + (e.message || 'error') + '\n(Check: "visits" bucket + storage policies + bd_visits table.)')
      setMode('list')
    }
    setUploading(false)
  }

  async function capture() {
    const v = videoRef.current
    if (!v || !v.videoWidth) { setCamErr('Camera ready nahi hai, thoda ruko.'); return }
    const blob = await stampToCanvas(v, v.videoWidth, v.videoHeight, loc); stopCam(); autoUpload(blob, loc)
  }
  function onFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    const img = new Image(); img.onload = async () => { const blob = await stampToCanvas(img, img.width, img.height, loc); autoUpload(blob, loc) }; img.src = URL.createObjectURL(f)
  }

  async function saveDetails() {
    if (!rowId) return
    setSaving(true)
    try {
      const { error } = await supabase.from('bd_visits').update({ client_name: form.client_name || null, industry: form.industry || null, purpose: form.purpose || null, notes: form.notes || null }).eq('id', rowId)
      if (error) throw error
      resetAll(); setMode('list'); await loadVisits(me)
    } catch (e) { alert('Details save nahi hue: ' + (e.message || 'error')) }
    setSaving(false)
  }

  function resetAll() { setShotUrl(null); setRowId(null); setLoc(null); setForm({ client_name: '', industry: '', purpose: 'Client Meeting', notes: '' }); setCamErr('') }
  function cancel() { stopCam(); resetAll(); setMode('list') }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--mu)' }}>Loading visits…</div>

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap');
        .v-wrap{font-family:Outfit,system-ui,sans-serif}.h-title{font-family:Sora,sans-serif}
        .lbl{font-size:11px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.5px}
        .v-card{background:var(--bg2);border:1px solid var(--bd);border-radius:16px;overflow:hidden}
        .v-btn{border:none;border-radius:10px;padding:11px 18px;font-weight:700;cursor:pointer;font-family:inherit;font-size:14px}
        .v-pri{background:#10b981;color:#fff}.v-sec{background:var(--bg3);color:var(--tx);border:1px solid var(--bd2)}
        .v-in{width:100%;background:var(--bg3);border:1px solid var(--bd2);border-radius:9px;padding:10px 12px;color:var(--tx);font-size:14px;font-family:inherit;box-sizing:border-box}
        .v-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
        @keyframes vsp{to{transform:rotate(360deg)}}
      `}} />
      <div className="v-wrap" style={{ padding: '4px 2px 52px', maxWidth: 1100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <div className="lbl" style={{ marginBottom: 5 }}>BD Team · Field</div>
            <h1 className="h-title" style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--tx)' }}>📸 GPS Field Visits</h1>
            <p style={{ fontSize: 13, color: 'var(--mu)', margin: '6px 0 0' }}>Geo-tagged proof of client visits — photo + location + time</p>
          </div>
          {mode === 'list' && <button className="v-btn v-pri" onClick={startCam}>+ New Visit</button>}
        </div>

        {/* CAPTURE */}
        {mode === 'capture' && (
          <div className="v-card" style={{ padding: 16 }}>
            <div style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', aspectRatio: '3/4', maxHeight: '60vh', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
              <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 10, left: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 12, padding: '7px 11px', borderRadius: 8 }}>
                {locating ? '📡 Getting location…' : loc ? `📍 ${loc.address ? loc.address.slice(0, 50) : loc.lat + ', ' + loc.lng}` : '📍 Location pending'}
              </div>
            </div>
            {camErr && <div style={{ color: 'var(--rd)', background: 'var(--rdbg)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginTop: 12 }}>{camErr}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="v-btn v-pri" onClick={capture} disabled={!!camErr}>📷 Capture & Upload</button>
              <button className="v-btn v-sec" onClick={() => fileRef.current?.click()}>🖼️ Upload photo</button>
              <button className="v-btn v-sec" onClick={cancel}>Cancel</button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
            </div>
          </div>
        )}

        {/* FORM (photo already auto-uploaded) */}
        {mode === 'form' && (
          <div className="v-card" style={{ padding: 16 }}>
            <div style={{ position: 'relative' }}>
              {shotUrl && <img src={shotUrl} alt="visit" style={{ width: '100%', maxHeight: '45vh', objectFit: 'contain', borderRadius: 12, background: '#000' }} />}
              <div style={{ position: 'absolute', top: 10, left: 10, background: uploading ? 'rgba(0,0,0,0.6)' : '#10b981', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 7 }}>
                {uploading ? <><span style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'vsp .8s linear infinite' }} /> Uploading…</> : '✓ Photo saved'}
              </div>
            </div>
            <div style={{ marginTop: 14, fontWeight: 700, fontSize: 15 }} className="h-title">Meeting Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div><label className="lbl">Company name</label><input className="v-in" style={{ marginTop: 5 }} value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="e.g. Annray Testing & Certification" /></div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 150 }}><label className="lbl">Industry</label>
                  <select className="v-in" style={{ marginTop: 5 }} value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}>
                    <option value="">Select industry…</option>{INDUSTRIES.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 150 }}><label className="lbl">Purpose</label>
                  <select className="v-in" style={{ marginTop: 5 }} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}>
                    {['Client Meeting', 'New Prospect', 'Follow-up', 'Requirement Discussion', 'Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="lbl">Meeting notes</label><textarea className="v-in" rows={3} style={{ marginTop: 5, resize: 'none' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Discussion, requirement, next step…" /></div>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>📍 {loc?.address || (loc ? `${loc.lat}, ${loc.lng}` : 'No location')}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="v-btn v-pri" onClick={saveDetails} disabled={saving || uploading}>{saving ? 'Saving…' : uploading ? 'Wait for upload…' : '✓ Save Details'}</button>
                <button className="v-btn v-sec" onClick={cancel}>Done / Skip</button>
              </div>
            </div>
          </div>
        )}

        {/* LIST */}
        {mode === 'list' && (
          visits.length === 0 ? (
            <div className="v-card" style={{ textAlign: 'center', padding: 50, color: 'var(--mu)' }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>📸</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>No visits logged yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Tap “+ New Visit” when you reach a client.</div>
            </div>
          ) : (
            <div className="v-grid">
              {visits.map(v => (
                <div key={v.id} className="v-card">
                  {v.photo_url && <img src={v.photo_url} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />}
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{v.client_name || 'Field Visit'}</div>
                    <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 2 }}>{[v.purpose, v.industry].filter(Boolean).join(' · ')}</div>
                    <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 8 }}>📍 {v.address ? (v.address.length > 50 ? v.address.slice(0, 50) + '…' : v.address) : `${v.latitude}, ${v.longitude}`}</div>
                    {v.notes && <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 6 }}>{v.notes}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--mu2)' }}>{v.created_at ? new Date(v.created_at).toLocaleString('en-IN') : ''}</span>
                      {v.google_maps_url && <a href={v.google_maps_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>Map →</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </>
  )
}
