// @ts-nocheck
// ════════════════════════════════════════════════════════════════
// LocationPicker — reusable location capture component
// • "Use My Location" → browser GPS (free, unlimited)
// • Interactive OpenStreetMap (Leaflet via CDN) — click or drag pin
// • Manual address (auto-filled via free OSM reverse-geocode, editable)
// • Auto-generates a Google Maps link from coordinates
// No API key, no npm install, no billing. Loads Leaflet from CDN.
//
// Props:
//   value   : { latitude, longitude, address, google_maps_url }
//   onChange: (partial) => void   // parent merges into its form
// ════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'

export default function LocationPicker({ value, onChange }: any) {
  const latitude  = value?.latitude
  const longitude = value?.longitude
  const address   = value?.address || ''
  const gmaps     = value?.google_maps_url || ''

  const mapRef    = useRef<any>(null)   // the <div> the map mounts into
  const mapObj    = useRef<any>(null)   // Leaflet map instance
  const markerObj = useRef<any>(null)   // Leaflet marker instance
  const [ready, setReady]       = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [err, setErr]           = useState('')

  // ── 1. Load Leaflet from CDN (once) ──
  useEffect(() => {
    let cancelled = false
    const done = () => { if (!cancelled) setReady(true) }
    if (typeof window !== 'undefined' && (window as any).L) { done(); return }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'; link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    let script = document.getElementById('leaflet-js') as any
    if (!script) {
      script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = done
      script.onerror = () => setErr('Map could not load. Check internet connection.')
      document.body.appendChild(script)
    } else {
      const t = setInterval(() => { if ((window as any).L) { clearInterval(t); done() } }, 100)
      setTimeout(() => clearInterval(t), 6000)
    }
    return () => { cancelled = true }
  }, [])

  // ── 2. Init the map once Leaflet is ready ──
  useEffect(() => {
    if (!ready || !mapRef.current || mapObj.current) return
    const L = (window as any).L
    // Fix default marker icon paths to the CDN (otherwise icons break)
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
    const hasCoords = !!(latitude && longitude)
    const center = hasCoords ? [latitude, longitude] : [22.5, 78.9] // India center
    const zoom   = hasCoords ? 14 : 4
    const map = L.map(mapRef.current).setView(center, zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }).addTo(map)
    mapObj.current = map
    if (hasCoords) addOrMoveMarker(latitude, longitude)
    map.on('click', (e: any) => setCoords(e.latlng.lat, e.latlng.lng, true))
    setTimeout(() => map.invalidateSize(), 250) // ensure correct size after layout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // ── 3. If coords arrive from parent AFTER init (e.g. edit page loads), show them ──
  useEffect(() => {
    if (!mapObj.current || !(window as any).L) return
    if (latitude && longitude && !markerObj.current) {
      addOrMoveMarker(latitude, longitude)
      mapObj.current.setView([latitude, longitude], 14)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, ready])

  function addOrMoveMarker(lat: number, lng: number) {
    const L = (window as any).L
    if (!mapObj.current) return
    if (markerObj.current) {
      markerObj.current.setLatLng([lat, lng])
    } else {
      markerObj.current = L.marker([lat, lng], { draggable: true }).addTo(mapObj.current)
      markerObj.current.on('dragend', () => {
        const p = markerObj.current.getLatLng()
        setCoords(p.lat, p.lng, true)
      })
    }
  }

  // Set coordinates → update marker, google link, parent, then reverse-geocode
  function setCoords(lat: number, lng: number, recenter = false) {
    const rlat = Number(lat.toFixed(6)), rlng = Number(lng.toFixed(6))
    addOrMoveMarker(rlat, rlng)
    if (recenter && mapObj.current) mapObj.current.setView([rlat, rlng], Math.max(mapObj.current.getZoom(), 14))
    onChange({
      latitude: rlat,
      longitude: rlng,
      google_maps_url: `https://www.google.com/maps?q=${rlat},${rlng}`,
    })
    reverseGeocode(rlat, rlng)
  }

  // Browser GPS
  function detect() {
    setErr('')
    if (!navigator.geolocation) { setErr('Geolocation not supported by this browser.'); return }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setDetecting(false); setCoords(pos.coords.latitude, pos.coords.longitude, true) },
      (e)   => { setDetecting(false); setErr(e.code === 1 ? 'Permission denied. Allow location access and retry.' : 'Could not get location: ' + e.message) },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  // Free reverse geocoding (OSM Nominatim) → fills address + city/state/pincode
  async function reverseGeocode(lat: number, lng: number) {
    try {
      setGeocoding(true)
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`, { headers: { Accept: 'application/json' } })
      const d = await r.json()
      setGeocoding(false)
      if (!d) return
      const a = d.address || {}
      // City can appear under several keys depending on the place
      const city = a.city || a.town || a.municipality || a.city_district || a.village || a.suburb || a.county || ''
      const state = a.state || ''
      const pincode = a.postcode || ''
      const patch: any = {}
      if (d.display_name) patch.address = d.display_name
      if (city)    patch.city = city
      if (state)   patch.state = state
      if (pincode) patch.pincode = pincode
      if (Object.keys(patch).length) onChange(patch)
    } catch { setGeocoding(false) }
  }

  // ── Styles ──
  const IS: any = { width:'100%', background:'var(--bg3)', border:'1px solid var(--bd2)', borderRadius:8, padding:'9px 12px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const LS: any = { display:'block', fontSize:10, fontWeight:600, color:'var(--mu)', textTransform:'uppercase', letterSpacing:1, marginBottom:4, marginTop:12 }

  return (
    <div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginTop:8 }}>
        <button type="button" onClick={detect} disabled={detecting}
          style={{ background:'var(--acbg)', color:'var(--ac)', border:'1px solid var(--bd2)', borderRadius:8, padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:detecting?0.6:1 }}>
          {detecting ? '📡 Detecting…' : '📍 Use My Current Location'}
        </button>
        {latitude && longitude ? (
          <span style={{ fontSize:12, color:'var(--gn)', fontWeight:600 }}>
            ✓ {latitude}, {longitude}
          </span>
        ) : (
          <span style={{ fontSize:12, color:'var(--mu)' }}>Click on the map, drag the pin, or use GPS</span>
        )}
      </div>

      {err && <div style={{ marginTop:8, fontSize:12, color:'var(--rd)', background:'var(--rdbg)', padding:'8px 12px', borderRadius:8 }}>{err}</div>}

      {/* Map */}
      <div style={{ marginTop:10, borderRadius:12, overflow:'hidden', border:'1px solid var(--bd2)' }}>
        {!ready && <div style={{ height:280, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg3)', color:'var(--mu)', fontSize:13 }}>Loading map…</div>}
        <div ref={mapRef} style={{ height: ready ? 300 : 0, width:'100%' }} />
      </div>

      {/* Address (auto-filled, editable) */}
      <label style={LS}>Full Address {geocoding && <span style={{ color:'var(--ac)', textTransform:'none', letterSpacing:0 }}>· fetching…</span>}</label>
      <textarea rows={2} style={{ ...IS, resize:'none' }} value={address}
        onChange={e => onChange({ address: e.target.value })}
        placeholder="Auto-filled from the map pin — you can edit it" />

      {/* Google Maps link (auto) */}
      {gmaps && (
        <div style={{ marginTop:8 }}>
          <a href={gmaps} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:12, color:'var(--ac)', textDecoration:'none', fontWeight:600 }}>
            🔗 Open in Google Maps
          </a>
        </div>
      )}
    </div>
  )
}
