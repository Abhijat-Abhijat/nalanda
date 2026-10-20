import { useState } from 'react';
import type { LlmEx } from '../../schema';
import type { RunnerProps } from '../registry';
import { Md } from '../../ui/Md';
import { tokenize } from './tokenizer';
import { VECTORS } from './embeddings';
import { checkLlm } from './index';

export default function Lab({ exercise, onAttempt }: RunnerProps<LlmEx>) {
  const [text, setText] = useState('');
  const [choice, setChoice] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);

  const tokens = tokenize(text);
  const ready = exercise.lab === 'tokenizer' ? text.trim() !== '' : exercise.lab === 'embeddings' ? choice !== '' : picked.length > 0;
  const check = () => {
    const answer = exercise.lab === 'tokenizer' ? text : exercise.lab === 'embeddings' ? choice : picked;
    const ok = checkLlm(exercise, answer);
    setVerdict(ok);
    onAttempt(ok);
  };
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="llm-lab">
      <Md md={exercise.prompt} />

      {exercise.lab === 'tokenizer' && (
        <>
          <label>Your sentence
            <textarea className="fill-input" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <p aria-live="polite">{tokens.length} {tokens.length === 1 ? 'token' : 'tokens'}, target {exercise.targetCount}</p>
          <p className="token-chips">{tokens.map((t, i) => <code key={i} className="chip">{t}</code>)}</p>
        </>
      )}

      {exercise.lab === 'embeddings' && (
        <>
          <svg viewBox="0 0 220 220" role="img" aria-label="A map of words. Words with similar meaning sit close together." className="embed-map">
            <rect x="0" y="0" width="220" height="220" fill="none" stroke="var(--line)" />
            {[exercise.anchor, ...exercise.options].map((w) => {
              const v = VECTORS[w];
              if (!v) return null;
              const x = 10 + v[0] * 200;
              const y = 210 - v[1] * 200;
              const isAnchor = w === exercise.anchor;
              return (
                <g key={w}>
                  <circle cx={x} cy={y} r={isAnchor ? 7 : 5} fill={isAnchor ? 'var(--ai)' : 'var(--muted)'} />
                  <text x={x > 150 ? x - 9 : x + 9} y={y + 4} textAnchor={x > 150 ? 'end' : 'start'} fontSize="12" fontWeight={isAnchor ? 700 : 500} fill="currentColor">{w}</text>
                </g>
              );
            })}
          </svg>
          <fieldset>
            <legend>Which word is closest in meaning to <strong>{exercise.anchor}</strong>?</legend>
            {exercise.options.map((o) => (
              <label key={o} className="option">
                <input type="radio" name={exercise.id} checked={choice === o} onChange={() => setChoice(o)} /> {o}
              </label>
            ))}
          </fieldset>
        </>
      )}

      {exercise.lab === 'retrieval' && (
        <fieldset>
          <legend>Query: <strong>{exercise.query}</strong>. Pick the {exercise.k} best chunks.</legend>
          {exercise.chunks.map((c) => (
            <label key={c.id} className="option">
              <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} /> {c.text}
            </label>
          ))}
        </fieldset>
      )}

      <div className="row">
        <button type="button" className="primary" disabled={!ready} onClick={check}>Check answer</button>
        <button type="button" onClick={() => setShowHint((v) => !v)}>{showHint ? 'Hide hint' : 'Show hint'}</button>
      </div>
      {showHint && <p className="callout tip">{exercise.hint}</p>}
      {verdict === true && <p className="feedback good" role="status">Correct.</p>}
      {verdict === false && <p className="feedback bad" role="status">Not yet. Look again and try another answer.</p>}
    </div>
  );
}
