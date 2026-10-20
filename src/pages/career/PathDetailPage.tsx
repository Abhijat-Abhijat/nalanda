import { Link, useParams } from 'react-router-dom';
import { PATHS, pathProgress, stepDone } from '../../career/paths';
import { useCareer } from '../../career/store';
import { usePathContext } from './usePathContext';
import { stepLabel } from './stepLabel';

export default function PathDetailPage() {
  const { pathId } = useParams();
  const ctx = usePathContext();
  const setPath = useCareer((s) => s.setPath);
  const path = PATHS.find((p) => p.id === pathId);
  if (!path) return <section className="empty"><p>That career path does not exist.</p><Link to="/career/paths">All career paths</Link></section>;
  const r = pathProgress(path, ctx);
  const next = r.next ? stepLabel(r.next.step) : null;
  return (
    <article className="narrow wide">
      <p><Link to="/career/paths">All career paths</Link></p>
      <h1>{path.title}</h1>
      <p className="lede">{path.summary}</p>
      <p><progress max={100} value={r.pct} aria-label="Path progress" /> {r.pct}% Nalanda coverage ({r.done} of {r.total} steps)</p>
      {ctx.career.pathId === path.id ? <p className="muted">This is your path.</p> : <button className="btn primary" onClick={() => setPath(path.id)}>Make this my path</button>}
      {next
        ? <section className="notice"><h2>Next step</h2><Link to={next.to}>{next.text}</Link></section>
        : <section className="notice"><h2>Path complete</h2><p>Keep practising with the simulator, and apply.</p></section>}
      <ol className="path-stages">
        {path.stages.map((st, i) => (
          <li key={st.title}>
            <h2>{st.title} <span className="muted">({r.stages[i].done}/{r.stages[i].total})</span></h2>
            <ul>
              {st.steps.map((s, j) => {
                const l = stepLabel(s);
                const ok = stepDone(s, ctx);
                return <li key={j} className={ok ? 'step done' : 'step'}><span aria-hidden="true">{ok ? '✓ ' : '○ '}</span><Link to={l.to}>{l.text}</Link>{ok ? <span className="sr-only"> (done)</span> : null}</li>;
              })}
            </ul>
          </li>
        ))}
      </ol>
    </article>
  );
}
