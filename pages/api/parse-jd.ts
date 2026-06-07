// @ts-nocheck
// pages/api/parse-jd.ts
// Extracts structured JD fields from raw JD text using Gemini (free tier,
// ONE call per upload — quota-friendly). Key stays server-side. Graceful.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' })
  const text = (req.body?.text || '').toString().slice(0, 12000)
  if (!text.trim()) return res.status(200).json({ ok: false, error: 'empty' })

  const key = process.env.GEMINI_API_KEY
  if (!key) return res.status(200).json({ ok: false, error: 'no_key' })

  const prompt = `Extract Job Description details into JSON. Return ONLY a minified JSON object, no markdown, with EXACTLY these keys:
{"title":string,"company":string,"location":string,"city":string,"industry":string,"experience_min":number|null,"experience_max":number|null,"qualification":string,"skills":string,"description":string}
- skills: comma-separated key skills.
- experience_min/max: years as numbers (null if not stated).
- description: a clean 3-6 line summary of the role/responsibilities.
- Use "" for any text field not found.
JD TEXT:
"""${text}"""`

  try {
    const model = 'gemini-2.5-flash-lite'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
    const r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 700 } }),
    })
    if (!r.ok) return res.status(200).json({ ok: false, error: 'gemini_' + r.status })
    const data = await r.json()
    let t = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    t = t.replace(/```json|```/g, '').trim()
    const m = t.match(/\{[\s\S]*\}/); if (!m) return res.status(200).json({ ok: false, error: 'parse' })
    const f = JSON.parse(m[0])
    const str = (x) => typeof x === 'string' ? x : ''
    const num = (x) => typeof x === 'number' ? x : null
    const jd = {
      title: str(f.title), company: str(f.company), location: str(f.location), city: str(f.city),
      industry: str(f.industry), experience_min: num(f.experience_min), experience_max: num(f.experience_max),
      qualification: str(f.qualification), skills: str(f.skills), description: str(f.description),
    }
    return res.status(200).json({ ok: true, jd })
  } catch (e) {
    return res.status(200).json({ ok: false, error: 'exception' })
  }
}
