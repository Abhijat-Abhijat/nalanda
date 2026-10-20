import { Link } from 'react-router-dom';
import { TEMPLATES } from '../../career/interview/templates';
import { useCareer } from '../../career/store';

export default function InterviewPage() {
  const history = useCareer((s) => s.data.interviews);
  const seed = Date.now() % 2147483647;
  return (
    <article className="narrow wide">
      <h1>Interview simulator</h1>
      <p className="lede">Timed rounds modelled on real interview loops. Coding and concept questions are scored automatically; design and behavioural answers are self-scored against a rubric. 70% or more counts as a pass for career paths.</p>
      <ul className="hub-grid">
        {TEMPLATES.map((t) => (
          <li key={t.id}><Link className="hub-card" to={`/career/interview/${t.id}/${seed}`}><strong>{t.title}</strong><span className="muted">{t.minutes} minutes · {t.sections.map((s) => `${s.count} ${s.kind}`).join(', ')}</span><span>Start</span></Link></li>
        ))}
      </ul>
      <h2>History</h2>
      {history.length === 0 ? <p className="muted">No rounds yet.</p> : (
        <table className="score-table">
          <thead><tr><th>Date</th><th>Round</th><th>Score</th></tr></thead>
          <tbody>{[...history].reverse().map((r) => <tr key={r.id}><td>{r.day}</td><td>{TEMPLATES.find((t) => t.id === r.template)?.title ?? r.template}</td><td>{r.score}%</td></tr>)}</tbody>
        </table>
      )}
    </article>
  );
}
