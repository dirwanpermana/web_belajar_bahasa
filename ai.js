// Vercel Serverless Function: proxy ke Claude API untuk fitur "guru AI".
// Env wajib : ANTHROPIC_API_KEY
// Env opsi  : ACCESS_CODE (kode akses agar endpoint tidak dipakai orang lain),
//             MODEL_DEFAULT, MODEL_QUICK, ALLOWED_ORIGIN, MAX_PER_HOUR
const hits = new Map(); // rate limit sederhana per IP (per instance)

module.exports = async (req, res) => {
  const origin = process.env.ALLOWED_ORIGIN;
  if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-access-code');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = process.env.ANTHROPIC_API_KEY;
  if (req.method === 'GET') return res.status(200).json({ ok: true, ai: !!key, needCode: !!process.env.ACCESS_CODE });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!key) return res.status(503).json({ error: 'AI belum dikonfigurasi (ANTHROPIC_API_KEY kosong)' });

  if (process.env.ACCESS_CODE && req.headers['x-access-code'] !== process.env.ACCESS_CODE) return res.status(401).json({ error: 'kode akses salah' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now(), limit = +(process.env.MAX_PER_HOUR || 120);
  const list = (hits.get(ip) || []).filter(t => now - t < 3600e3);
  if (list.length >= limit) return res.status(429).json({ error: 'terlalu banyak permintaan' });
  list.push(now); hits.set(ip, list);

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const prompt = body && body.prompt;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 20000) return res.status(400).json({ error: 'prompt tidak valid' });

  const model = body.tier === 'quick' ? (process.env.MODEL_QUICK || 'claude-haiku-5-5') : (process.env.MODEL_DEFAULT || 'claude-sonnet-5-5');
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: (data.error && data.error.message) || 'upstream error' });
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return res.status(200).json({ text, truncated: data.stop_reason === 'max_tokens' });
  } catch (e) {
    return res.status(502).json({ error: 'gagal menghubungi Claude API' });
  }
};
