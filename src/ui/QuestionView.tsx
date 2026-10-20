import { useMemo, useState } from 'react';
import type { Question } from '../schema';
import { checkQuestion } from '../exercises/quiz';
import { shuffle } from '../engine/exam';
import { Md } from './Md';
import { CheckMark, CrossMark } from './Sketch';

function shuffleDifferent(items: string[]): string[] {
  for (let t = 0; t < 10; t++) {
    const s = shuffle(items);
    if (s.some((v, i) => v !== items[i])) return s;
  }
  return [...items].reverse();
}

export function QuestionView({ q, onAnswered, allowRetry = false }: {
  q: Question; onAnswered: (correct: boolean) => void; allowRetry?: boolean;
}) {
  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState('');
  // Options are shown in a random order so the right answer is not always in the same place.
  // `choice` always stores the original option index, so scoring is unaffected.
  const optionOrder = useMemo(() => (q.kind === 'choice' ? shuffle(q.options.map((_, i) => i)) : []), [q, round]);
  const [order, setOrder] = useState<string[]>(() => (q.kind === 'order' ? shuffleDifferent(q.items) : []));
  const [result, setResult] = useState<boolean | null>(null);
  const done = result !== null;

  const ready = q.kind === 'choice' ? choice !== null : q.kind === 'fill' ? text.trim() !== '' : true;
  const check = () => {
    const answer = q.kind === 'choice' ? (choice as number) : q.kind === 'order' ? order : text;
    const ok = checkQuestion(q, answer);
    setResult(ok);
    onAnswered(ok);
  };
  const retry = () => {
    setResult(null); setChoice(null); setText('');
    if (q.kind === 'order') setOrder(shuffleDifferent(q.items));
    setRound((r) => r + 1);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  return (
    <section className="question" aria-live="polite">
      <Md md={q.prompt} />
      {q.kind === 'choice' && (
        <fieldset disabled={done}>
          <legend className="sr-only">Choose one answer</legend>
          {optionOrder.map((i) => (
            <label key={q.options[i]} className="option">
              <input type="radio" name={`${q.id}-${round}`} checked={choice === i} onChange={() => setChoice(i)} /> {q.options[i]}
            </label>
          ))}
        </fieldset>
      )}
      {q.kind === 'fill' && (
        <input className="fill-input" aria-label="Your answer" value={text} disabled={done} onChange={(e) => setText(e.target.value)} />
      )}
      {q.kind === 'order' && (
        <ol className="order-list">
          {order.map((item, i) => (
            <li key={item}>
              <span>{item}</span>
              <button type="button" disabled={done} aria-label={`Move up ${item}`} onClick={() => move(i, -1)}>Move up</button>
              <button type="button" disabled={done} aria-label={`Move down ${item}`} onClick={() => move(i, 1)}>Move down</button>
            </li>
          ))}
        </ol>
      )}
      {!done && <button type="button" className="primary" disabled={!ready} onClick={check}>Check answer</button>}
      {done && (
        <div className={result ? 'feedback good' : 'feedback bad'} role="status">
          {result ? <CheckMark /> : <CrossMark />}
          <strong>{result ? 'Correct.' : 'Not quite.'}</strong> <Md md={q.explain} />
          {!result && allowRetry && <button type="button" onClick={retry}>Try again</button>}
        </div>
      )}
    </section>
  );
}
