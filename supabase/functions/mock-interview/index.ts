import { buildMessages, parseFeedback, validateRequest } from '../../../src/career/ai.ts';

const MODEL = 'claude-sonnet-5-5';
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ALLOWED.includes(origin) ? origin : ALLOWED[0] ?? '',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  Vary: 'Origin',
});

// ponytail: per-isolate memory, so limits reset when Supabase recycles the isolate; use a shared store (Redis, a table) if abuse appears.
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 20;
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: { ...headers, 'Access-Control-Allow-Headers': 'content-type, authorization, apikey' } });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (limited(ip)) return Response.json({ error: 'rate_limited' }, { status: 429, headers });
  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: 'invalid_json' }, { status: 400, headers }); }
  const r = validateRequest(body);
  if (!r) return Response.json({ error: 'invalid_request' }, { status: 400, headers });
  const { system, user } = buildMessages(r);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 800, system, messages: [{ role: 'user', content: user }] }),
    });
    if (!res.ok) return Response.json({ error: 'upstream' }, { status: 502, headers });
    const data = await res.json();
    const text = (data.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('');
    const fb = parseFeedback(text, r.rubric.length);
    return fb ? Response.json(fb, { headers }) : Response.json({ error: 'bad_model_output' }, { status: 502, headers });
  } catch {
    return Response.json({ error: 'timeout' }, { status: 504, headers });
  } finally {
    clearTimeout(timer);
  }
});
