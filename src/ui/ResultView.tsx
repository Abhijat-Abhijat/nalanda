import { Link } from 'react-router-dom';
import { scoreExam } from '../engine/exam';

export type ConceptResult = { conceptId: string; correct: boolean };

export function ResultView({ results, titleFor, linkFor }: {
  results: ConceptResult[];
  titleFor: (conceptId: string) => string;
  linkFor: (conceptId: string) => string;
}) {
  const score = scoreExam(results.map((r) => r.correct));
  const byConcept = new Map<string, { right: number; total: number }>();
  for (const r of results) {
    const c = byConcept.get(r.conceptId) ?? { right: 0, total: 0 };
    c.total += 1;
    if (r.correct) c.right += 1;
    byConcept.set(r.conceptId, c);
  }
  const weak = [...byConcept.entries()].filter(([, c]) => c.right < c.total).map(([id]) => id);
  return (
    <section className="results" aria-live="polite">
      <h2>Your result</h2>
      <p>{score.correct} of {score.total} correct ({score.pct}%)</p>
      <p className={score.passed ? 'feedback good' : 'feedback bad'}>
        {score.passed ? 'Passed.' : 'Not passed yet. You need 70%.'}
      </p>
      <h3>By topic</h3>
      <ul className="mastery">
        {[...byConcept.entries()].map(([id, c]) => (
          <li key={id}>
            <label>{titleFor(id)} <meter min={0} max={c.total} value={c.right}>{c.right} of {c.total}</meter></label>
          </li>
        ))}
      </ul>
      {weak.length > 0 && (
        <>
          <h3>Weak concepts</h3>
          <ul>{weak.map((id) => <li key={id}><Link to={linkFor(id)}>{titleFor(id)}</Link></li>)}</ul>
        </>
      )}
    </section>
  );
}
