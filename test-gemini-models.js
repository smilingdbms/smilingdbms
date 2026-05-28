// ══════════════════════════════════════════════════════════
// Gemini Free Model Finder
// Tests which Gemini models work FREE on your API key.
// Run:  node test-gemini-models.js
// ══════════════════════════════════════════════════════════

const KEY = 'AIzaSyC3o1RkzA1Chy_ZmgR0JVxd8tinKMvRId4'

const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
]

async function test(model) {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with the single word: OK' }] }] }),
      }
    )
    if (r.ok) {
      const d = await r.json()
      const txt = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '(empty)'
      return `WORKS  ✅   reply: ${txt}`
    }
    const err = await r.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${r.status}`
    if (r.status === 429) return `BLOCKED ❌  429 quota/limit 0`
    if (r.status === 404) return `MISSING ⚠️  model not found`
    return `FAIL ❌  ${r.status}  ${msg.slice(0, 60)}`
  } catch (e) {
    return `ERROR ❌  ${e.message}`
  }
}

;(async () => {
  console.log('\nTesting Gemini models on your key...\n')
  for (const m of MODELS) {
    const res = await test(m)
    console.log(`  ${m.padEnd(26)} → ${res}`)
    await new Promise(s => setTimeout(s, 1500)) // gap to avoid rate burst
  }
  console.log('\nDone. Use any model marked WORKS ✅ (free).\n')
})()
