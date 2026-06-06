// @ts-nocheck
// pages/api/ai-search.ts
// Converts a recruiter's plain-English query into structured filters using
// Gemini (free tier, light: ONE call per search). API key stays server-side
// in process.env.GEMINI_API_KEY (never in client/code). Graceful on failure.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' })
  const query = (req.body?.query || '').toString().slice(0, 500)
  if (!query.trim()) return res.status(200).json({ ok: false, error: 'empty' })

  const key = process.env.GEMINI_API_KEY
  if (!key) return res.status(200).json({ ok: false, error: 'no_key' })

  const prompt = `You convert a recruiter's candidate-search request into JSON filters.
Return ONLY a minified JSON object, no markdown, no explanation, with EXACTLY these keys:
{"role": string, "skills": string[], "location": string, "min_experience": number|null, "max_ctc": number|null}
- skills: technical/role skills mentioned (lowercase). [] if none.
- location: city only, "" if none.
- min_experience: years as a number, null if not stated.
- max_ctc: budget in LPA (lakhs per annum) as a number, null if not stated.
Request: "${query}"`

  try {
    const model = 'gemini-2.5-flash-lite'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 256 } }),
    })
    if (!r.ok) return res.status(200).json({ ok: false, error: 'gemini_' + r.status })
    const data = await r.json()
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    text = text.replace(/```json|```/g, '').trim()
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return res.status(200).json({ ok: false, error: 'parse' })
    const f = JSON.parse(m[0])
    const filters = {
      role: typeof f.role === 'string' ? f.role : '',
      skills: Array.isArray(f.skills) ? f.skills.filter(x => typeof x === 'string') : [],
      location: typeof f.location === 'string' ? f.location : '',
      min_experience: typeof f.min_experience === 'number' ? f.min_experience : null,
      max_ctc: typeof f.max_ctc === 'number' ? f.max_ctc : null,
    }
    return res.status(200).json({ ok: true, filters })
  } catch (e) {
    return res.status(200).json({ ok: false, error: 'exception' })
  }
}
