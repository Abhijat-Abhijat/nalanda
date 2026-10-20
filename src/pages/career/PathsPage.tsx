import { Link } from 'react-router-dom';
import { PATHS, pathProgress } from '../../career/paths';
import { usePathContext } from './usePathContext';

export default function PathsPage() {
  const ctx = usePathContext();
  return (
    <article className="narrow wide">
      <h1>Career paths</h1>
      <p className="lede">Pick a target role. Each path orders chapters, projects, and interview practice, and always shows your next step. Percentages show Nalanda coverage, not a guarantee of any interview result.</p>
      <ul className="hub-grid">
        {PATHS.map((p) => (
          <li key={p.id}>
            <Link className="hub-card" to={`/career/paths/${p.id}`}>
              <strong>{p.title}</strong>
              <span className="muted">{p.summary}</span>
              <span>{pathProgress(p, ctx).pct}% Nalanda coverage{ctx.career.pathId === p.id ? ' · your path' : ''}</span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
