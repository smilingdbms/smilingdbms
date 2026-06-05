import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../src/lib/supabase'
import { PACKAGES, getPackage } from '../../src/lib/permissions-catalog'

// ── Admin contact for upgrade / custom requests ──────────────
// ⚠️ Apna WhatsApp number yahan daalo (country code ke saath, bina + ke). e.g. 919876543210
const ADMIN_WHATSAPP = '918757966669'
const ADMIN_EMAIL = 'smilingdbms@gmail.com'

export default function BillingPage() {
  const router = useRouter()
  const [appUser, setAppUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [seatsUsed, setSeatsUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<any>(null)        // {type:'standard',pkg} | {type:'custom'}
  const [customMsg, setCustomMsg] = useState('')
  const [customSeats, setCustomSeats] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/'); return }
    const { data: user } = await supabase.from('app_users').select('*').eq('id', session.user.id).single()
    if (!user || !['account_owner', 'admin', 'super_admin', 'platform_admin', 'platform_manager'].includes(user.role)) {
      router.push('/dashboard'); return
    }
    setAppUser(user)

    if (user.company_id) {
      const { data: co } = await supabase.from('companies').select('*').eq('id', user.company_id).single()
      setCompany(co)
      const { count } = await supabase.from('app_users').select('*', { count: 'exact', head: true })
        .eq('company_id', user.company_id).eq('status', 'active')
      setSeatsUsed(count || 0)
    }
    setLoading(false)
  }

  const pkg = getPackage(company?.package_code)
  const seatLimit = company?.seat_limit || pkg.seats
  const sorted = [...PACKAGES].sort((a, b) => a.sort - b.sort)

  const inr = (n: number) => (n === 0 ? 'Free' : '₹' + n.toLocaleString('en-IN'))
  const capLabel = (n: number) => (n >= 1000 ? (n / 1000) + 'k' : '' + n)

  function openUpgrade(p: any) { setDone(false); setModal({ type: 'standard', pkg: p }) }
  function openCustom() { setDone(false); setCustomMsg(''); setCustomSeats(''); setModal({ type: 'custom' }) }
  function closeModal() { setModal(null); setDone(false) }

  function buildText() {
    const co = company?.name || 'My company'
    if (modal?.type === 'custom') {
      return `Hi, ${co} needs a CUSTOM plan on RecruitBase Pro.\nCurrent plan: ${pkg.name}\nSeats needed: ${customSeats || '?'}\nRequirement: ${customMsg || '-'}`
    }
    return `Hi, ${co} wants to UPGRADE to the ${modal?.pkg?.name} plan (${inr(modal?.pkg?.price_monthly)}/mo) on RecruitBase Pro.\nCurrent plan: ${pkg.name}`
  }

  const waLink = () => `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(buildText())}`
  const mailLink = () => `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent('RecruitBase Pro — ' + (modal?.type === 'custom' ? 'Custom plan request' : 'Upgrade request'))}&body=${encodeURIComponent(buildText())}`

  async function submit() {
    if (!appUser?.company_id) { setDone(true); return }
    setSending(true)
    try {
      await supabase.from('upgrade_requests').insert({
        company_id: appUser.company_id,
        current_plan: pkg.code,
        requested_plan: modal.type === 'custom' ? 'custom' : modal.pkg.code,
        request_type: modal.type,
        message: modal.type === 'custom' ? `Seats: ${customSeats || '-'} | ${customMsg}` : `Upgrade to ${modal.pkg.name}`,
        requested_by: appUser.id,
      })
    } catch (e) { /* request still works via WhatsApp/Email below */ }
    setSending(false)
    setDone(true)
  }

  const S: any = {
    card: { background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 14, padding: 20, marginBottom: 16 },
    pkgCard: (cur: boolean) => ({ background: 'var(--bg2)', border: `1.5px solid ${cur ? 'var(--ac)' : 'var(--bd)'}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column' as const, gap: 4 }),
    capRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--mu)', padding: '3px 0' },
    btn: (primary: boolean) => ({ padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', border: primary ? 'none' : '1px solid var(--bd)', background: primary ? 'var(--ac)' : 'transparent', color: primary ? '#fff' : 'var(--mu)' }),
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--ac,#6c8cff)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>

        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>💳 Billing & Plan</div>
        <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 20 }}>Apna plan, seats aur usage dekhein. Upgrade ya custom plan request karein.</div>

        {/* Current plan */}
        <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Current Plan</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ac)' }}>📦 {pkg.name}</div>
            <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 2 }}>{pkg.price_monthly === 0 ? 'Free forever' : inr(pkg.price_monthly) + '/month'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Seats</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: seatsUsed >= seatLimit ? '#ff9f43' : 'var(--tx)' }}>{seatsUsed} / {seatLimit}</div>
            <div style={{ fontSize: 11, color: 'var(--mu)' }}>{seatsUsed >= seatLimit ? 'Full — upgrade for more' : (seatLimit - seatsUsed) + ' available'}</div>
          </div>
        </div>

        {/* Available plans */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: 1, margin: '6px 2px 12px' }}>Available Plans</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: 14, marginBottom: 16 }}>
          {sorted.map(p => {
            const isCurrent = p.code === pkg.code
            const isHigher = p.sort > pkg.sort
            return (
              <div key={p.code} style={S.pkgCard(isCurrent)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{p.name}</div>
                  {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--acbg)', color: 'var(--ac)', padding: '2px 8px', borderRadius: 20 }}>Current</span>}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{inr(p.price_monthly)}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--mu)' }}>{p.price_monthly === 0 ? '' : '/mo'}</span></div>
                <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 8 }}>
                  <div style={S.capRow}><span>Seats</span><span style={{ color: 'var(--tx)', fontWeight: 600 }}>{p.seats}</span></div>
                  <div style={S.capRow}><span>Candidates</span><span style={{ color: 'var(--tx)', fontWeight: 600 }}>{capLabel(p.candidate_cap)}</span></div>
                  <div style={S.capRow}><span>Active jobs</span><span style={{ color: 'var(--tx)', fontWeight: 600 }}>{p.active_job_cap}</span></div>
                  <div style={S.capRow}><span>CV parse/day</span><span style={{ color: 'var(--tx)', fontWeight: 600 }}>{p.cv_parse_daily}</span></div>
                  <div style={S.capRow}><span>Bulk msg/mo</span><span style={{ color: 'var(--tx)', fontWeight: 600 }}>{p.bulk_msg_monthly || '—'}</span></div>
                  <div style={S.capRow}><span>Permissions</span><span style={{ color: 'var(--tx)', fontWeight: 600 }}>{p.perms.length}</span></div>
                </div>
                <div style={{ marginTop: 12 }}>
                  {isCurrent ? <button disabled style={{ ...S.btn(false), width: '100%', opacity: 0.6, cursor: 'default' }}>Your plan</button>
                    : isHigher ? <button onClick={() => openUpgrade(p)} style={{ ...S.btn(true), width: '100%' }}>Upgrade →</button>
                    : <button onClick={openCustom} style={{ ...S.btn(false), width: '100%' }}>Contact to change</button>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Custom plan */}
        <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderStyle: 'dashed' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>🛠️ Need a custom plan?</div>
            <div style={{ fontSize: 12, color: 'var(--mu)' }}>Zyada seats, special features ya kuch alag — apni requirement batayein, hum tailor kar denge.</div>
          </div>
          <button onClick={openCustom} style={{ ...S.btn(true), whiteSpace: 'nowrap' }}>Request Custom Plan</button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--mu)', textAlign: 'center', marginBottom: 24 }}>
          Standard plan upgrades par instant card payment jaldi aa raha hai. Tab tak request bhej dein — hum process kar denge.
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', border: '1px solid var(--bd2)', borderRadius: 16, padding: 22, width: '100%', maxWidth: 440, boxShadow: 'var(--shl)' }}>
            {!done ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
                  {modal.type === 'custom' ? '🛠️ Custom Plan Request' : `⬆️ Upgrade to ${modal.pkg.name}`}
                </div>
                <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 16 }}>
                  {modal.type === 'custom' ? 'Apni requirement likhein — hum WhatsApp/Email pe respond karenge.' : `${inr(modal.pkg.price_monthly)}/mo · ${modal.pkg.seats} seats · ${modal.pkg.perms.length} permissions`}
                </div>

                {modal.type === 'custom' && (
                  <>
                    <label style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 600, display: 'block', marginBottom: 4 }}>How many seats do you need?</label>
                    <input value={customSeats} onChange={e => setCustomSeats(e.target.value)} placeholder="e.g. 30"
                      style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 8, padding: '9px 12px', color: 'var(--tx)', fontSize: 13, fontFamily: 'inherit', marginBottom: 12 }} />
                    <label style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Your requirement</label>
                    <textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} rows={4} placeholder="Kaunse features, special needs, budget — jo bhi chahiye likhein..."
                      style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 8, padding: '9px 12px', color: 'var(--tx)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', marginBottom: 16 }} />
                  </>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={submit} disabled={sending || (modal.type === 'custom' && !customMsg.trim())}
                    style={{ ...S.btn(true), flex: 1, opacity: (sending || (modal.type === 'custom' && !customMsg.trim())) ? 0.6 : 1 }}>
                    {sending ? 'Sending...' : 'Send Request'}
                  </button>
                  <button onClick={closeModal} style={{ ...S.btn(false) }}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>✅ Request submitted</div>
                <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 16 }}>Hamari team jaldi respond karegi. Fast response ke liye seedhe ping kar dein:</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <a href={waLink()} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '10px', borderRadius: 9, background: 'rgba(37,211,102,0.12)', color: '#25d366', border: '1px solid rgba(37,211,102,0.25)', fontSize: 13, fontWeight: 700 }}>💬 WhatsApp</a>
                  <a href={mailLink()} style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '10px', borderRadius: 9, background: 'var(--acbg)', color: 'var(--ac)', border: '1px solid var(--bd)', fontSize: 13, fontWeight: 700 }}>✉ Email</a>
                </div>
                <button onClick={closeModal} style={{ ...S.btn(false), width: '100%' }}>Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
