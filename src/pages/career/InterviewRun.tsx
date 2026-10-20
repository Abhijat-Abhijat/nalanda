import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TEMPLATES } from '../../career/interview/templates';
import { buildSession, type Pools, type Session } from '../../career/interview/session';
import { loadPools } from '../../career/interview/pools';
import { scoreSession, debrief, type Answers } from '../../career/interview/score';
import { TaskRunner } from '../../exercises/registry';
import { useCareer } from '../../career/store';
import { newId } from '../../career/random';
import { dayKey } from '../../engine/streak';
import type { RoundResult } from '../../career/schema';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function InterviewRun({ poolsLoader = loadPools }: { poolsLoader?: () => Promise<Pools> }) {
  const { templateId, seed: seedText } = useParams();
  const template = TEMPLATES.find((t) => t.id === templateId);
  const seed = Number(seedText) | 0;
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [checks, setChecks] = useState<Record<number, boolean[]>>({});
  const [result, setResult] = useState<RoundResult | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const started = useRef(Date.now());
  const finished = useRef(false);

  useEffect(() => {
    if (!template) return;
    let live = true;
    poolsLoader()
      .then((p) => {
        if (!live) return;
        // Keep the start time per round in sessionStorage so a reload cannot reset the clock.
        const key = `nalanda.interview.${template.id}.${seed}`;
        let start = Date.now();
        try {
          const saved = Number(sessionStorage.getItem(key));
          if (saved > 0 && saved <= start) start = saved; else sessionStorage.setItem(key, String(start));
        } catch { /* storage blocked: the clock restarts on reload */ }
        started.current = start;
        setNow(Date.now());
        setSession(buildSession(template, seed, p));
      })
      .catch(() => { if (live) setError('Could not load questions. Check your connection and try again.'); });
    return () => { live = false; };
  }, [template, seed, poolsLoader]);

  const finish = () => {
    if (finished.current || !session || !template) return;
    finished.current = true;
    const s = scoreSession(session, answers);
    const r: RoundResult = { id: newId(), template: template.id, seed, day: dayKey(new Date()), score: s.score, sections: s.sections };
    useCareer.getState().recordInterview(r);
    useCareer.getState().log('interview');
    setResult(r);
  };

  useEffect(() => {
    if (!session || result) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [session, result]);

  const left = template ? template.minutes * 60_000 - (now - started.current) : 0;
  useEffect(() => { if (session && !result && left <= 0) finish(); });

  if (!template) return <section className="empty"><p>That interview round does not exist.</p><Link to="/career/interview">All rounds</Link></section>;
  if (error) return <p role="alert">{error}</p>;
  if (!session) return <p>Preparing your round…</p>;
  if (result) {
    return (
      <article className="narrow">
        <h1>Your score: {result.score}%</h1>
        <table className="score-table">
          <thead><tr><th>Section</th><th>Result</th></tr></thead>
          <tbody>{result.sections.map((s) => <tr key={s.kind}><td>{s.kind}</td><td>{s.selfScore === null ? `${s.correct} of ${s.total} correct` : `self-score ${s.selfScore} of 4`}</td></tr>)}</tbody>
        </table>
        <h2>Debrief</h2>
        <ul>{debrief(result.sections).map((t) => <li key={t}>{t}</li>)}</ul>
        <p><Link className="btn primary" to={`/career/interview/${template.id}/${(seed + 1) % 2147483647}`} reloadDocument>Try again with new questions</Link> <Link to="/career/interview">All rounds</Link></p>
      </article>
    );
  }

  const item = session.items[i];
  if (!item) return <section className="empty"><p>No questions are available for this round yet.</p><Link to="/career/interview">All rounds</Link></section>;
  const markCorrect = (passed: boolean) => setAnswers((a) => (a[i]?.correct !== undefined ? a : { ...a, [i]: { correct: passed } }));
  const tick = (k: number, on: boolean) => {
    const next = [...(checks[i] ?? [false, false, false, false])];
    next[k] = on;
    setChecks({ ...checks, [i]: next });
    setAnswers({ ...answers, [i]: { selfScore: next.filter(Boolean).length } });
  };
  return (
    <article className="narrow wide interview-run">
      <header className="run-bar">
        <strong>{template.title}</strong>
        <span className="timer">Time left {fmt(left)}</span>
        <span className="sr-only" role="status">{left <= 60_000 ? '1 minute left' : left <= 300_000 ? '5 minutes left' : ''}</span>
        <span>Question {i + 1} of {session.items.length}</span>
      </header>
      {'task' in item
        ? <TaskRunner key={i} task={item.task} onAttempt={markCorrect} />
        : (
          <section key={i}>
            <h2>{item.kind === 'design' ? 'System design' : 'Behavioural'}</h2>
            <p>{item.prompt.prompt}</p>
            <label htmlFor={`ans-${i}`}>Your answer notes (not saved)</label>
            <textarea id={`ans-${i}`} rows={10} />
            <fieldset>
              <legend>Score yourself honestly: tick what your answer did</legend>
              {item.prompt.rubric.map((r, k) => (
                <label key={r} className="rubric-line"><input type="checkbox" checked={checks[i]?.[k] ?? false} onChange={(e) => tick(k, e.target.checked)} /> {r}</label>
              ))}
            </fieldset>
          </section>
        )}
      <p className="run-actions">
        {i + 1 < session.items.length ? <button className="btn" onClick={() => setI(i + 1)}>Next</button> : null}{' '}
        <button className="btn primary" onClick={finish}>Finish round</button>
      </p>
    </article>
  );
}
