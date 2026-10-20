import { useState } from 'react';
import { PROMPTS } from '../../career/interview/prompts';
import { parseFeedback, type MockFeedback, type MockBody } from '../../career/ai';
import { useCareer } from '../../career/store';

const KEY = import.meta.env.VITE_MOCK_INTERVIEW_KEY as string | undefined;

export async function requestFeedback(url: string, req: MockBody, fetchImpl: typeof fetch = fetch, rubricLength = 4): Promise<MockFeedback> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 35_000);
  let body: unknown;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  // The Supabase anon key lets the function keep JWT verification on.
  if (KEY) { headers.authorization = `Bearer ${KEY}`; headers.apikey = KEY; }
  try {
    const res = await fetchImpl(url, { method: 'POST', headers, body: JSON.stringify(req), signal: ctrl.signal });
    if (!res.ok) throw new Error('unavailable');
    body = await res.json();
  } catch {
    throw new Error('unavailable');
  } finally {
    clearTimeout(timer);
  }
  // Trust nothing from the network: re-validate and recompute the overall score.
  const fb = parseFeedback(JSON.stringify(body), rubricLength);
  if (!fb) throw new Error('bad_response');
  return fb;
}

const ENDPOINT = import.meta.env.VITE_MOCK_INTERVIEW_URL as string | undefined;

export default function MockInterviewPage({ endpoint = ENDPOINT }: { endpoint?: string }) {
  const [kind, setKind] = useState<'design' | 'behavioural'>('design');
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [fb, setFb] = useState<MockFeedback | null>(null);
  const [failed, setFailed] = useState(!endpoint);
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState([false, false, false, false]);
  const prompt = PROMPTS[kind][idx];
  const reset = () => { setFb(null); setChecks([false, false, false, false]); };
  const ask = async () => {
    if (!endpoint) return;
    setBusy(true);
    try {
      setFb(await requestFeedback(endpoint,{ promptId: prompt.id, answer }, fetch, prompt.rubric.length));
      useCareer.getState().log('mock');
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="narrow">
      <h1>AI mock interview</h1>
      <label>Type <select value={kind} onChange={(e) => { setKind(e.target.value as 'design' | 'behavioural'); setIdx(0); reset(); }}><option value="design">System design</option><option value="behavioural">Behavioural</option></select></label>{' '}
      <label>Question <select value={idx} onChange={(e) => { setIdx(Number(e.target.value)); reset(); }}>{PROMPTS[kind].map((p, i) => <option key={p.id} value={i}>{p.prompt}</option>)}</select></label>
      <h2>{prompt.prompt}</h2>
      <label htmlFor="answer">Your answer</label>
      <textarea id="answer" rows={12} maxLength={8000} value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <p className="muted">{answer.length} / 8,000 characters (at least 50)</p>
      {endpoint && !failed ? (
        <>
          <p className="notice">Your answer will be sent to an AI model to generate feedback. It is not stored.</p>
          <button className="btn primary" disabled={busy || answer.trim().length < 50} onClick={ask}>{busy ? 'Scoring…' : 'Get AI feedback'}</button>
        </>
      ) : (
        <section>
          <p>AI feedback is unavailable right now. Score yourself with the rubric instead.</p>
          {endpoint ? <button className="btn" onClick={() => setFailed(false)}>Try AI again</button> : null}
          {prompt.rubric.map((r, k) => (
            <label key={r} className="rubric-line"><input type="checkbox" checked={checks[k]} onChange={(e) => { const n = [...checks]; n[k] = e.target.checked; setChecks(n); }} /> {r}</label>
          ))}
          <p>Self-score: {checks.filter(Boolean).length} of 4</p>
        </section>
      )}
      {fb ? (
        <section aria-label="AI feedback">
          <h2>Overall {fb.overall}%</h2>
          <ul>{prompt.rubric.map((r, k) => <li key={r}>{r}: {fb.scores[k]} of 4</li>)}</ul>
          <h3>Strengths</h3><ul>{fb.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
          <h3>Improve next time</h3><ul>{fb.improvements.map((s) => <li key={s}>{s}</li>)}</ul>
          <p>{fb.summary}</p>
          <p className="muted">AI feedback can be wrong. Treat it as one opinion alongside the rubric.</p>
        </section>
      ) : null}
    </article>
  );
}
