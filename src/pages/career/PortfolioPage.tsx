import { useMemo } from 'react';
import { catalog } from '../../content/catalog';
import { projects } from '../../content/projects';
import { useStore } from '../../engine/store';
import { useCareer } from '../../career/store';
import { buildPortfolio, portfolioMarkdown } from '../../career/portfolio';
import { dayKey } from '../../engine/streak';
import { downloadText } from './download';

export default function PortfolioPage() {
  const progress = useStore((s) => s.progress);
  const career = useCareer((s) => s.data);
  const setResume = useCareer((s) => s.setResume);
  const p = useMemo(() => buildPortfolio(progress, career, catalog, projects), [progress, career]);
  return (
    <article className="narrow wide portfolio">
      <div className="no-print">
        <h1>Portfolio export</h1>
        <p className="lede">A record of what you have learned and built on Nalanda. Print it to PDF or download it, then link it from applications.</p>
        <label>Your name <input value={career.resume.name} maxLength={120} onChange={(e) => setResume({ ...career.resume, name: e.target.value })} aria-label="Your name" /></label>{' '}
        <label>Headline <input value={career.resume.headline} maxLength={200} onChange={(e) => setResume({ ...career.resume, headline: e.target.value })} aria-label="Headline" placeholder="Senior backend engineer" /></label>
        <p>
          <button className="btn primary" onClick={() => window.print()}>Print or save as PDF</button>{' '}
          <button className="btn" onClick={() => downloadText('nalanda-portfolio.md', portfolioMarkdown(p, dayKey(new Date())), 'text/markdown')}>Download Markdown</button>{' '}
          <button className="btn" onClick={() => downloadText('nalanda-portfolio.json', JSON.stringify(p, null, 2), 'application/json')}>Download JSON</button>
        </p>
      </div>
      <section className="portfolio-sheet">
        <h2>{p.name || 'Nalanda portfolio'}</h2>
        {p.headline ? <p>{p.headline}</p> : null}
        <h3>Learning</h3>
        {p.worlds.length === 0 ? <p>No completed lessons yet.</p> : (
          <table className="score-table">
            <thead><tr><th>World</th><th>Lessons</th><th>Boss</th><th>Chapter exams</th></tr></thead>
            <tbody>{p.worlds.map((w) => <tr key={w.title}><td>{w.title}</td><td>{w.lessons} of {w.total}</td><td>{w.boss ? 'Defeated' : '—'}</td><td>{w.exams.map((e) => `${e.title} ${e.pct}%`).join(', ') || '—'}</td></tr>)}</tbody>
          </table>
        )}
        <h3>Projects</h3>
        {p.projects.length ? <ul>{p.projects.map((x) => <li key={x.title}>{x.title} ({x.status})</li>)}</ul> : <p>No projects in progress yet.</p>}
        <h3>Interview practice</h3>
        <p>{p.interviews.rounds ? `${p.interviews.rounds} simulator rounds, best score ${p.interviews.best}%, ${p.interviews.passed} at pass level.` : 'No simulator rounds yet.'}</p>
        <p className="muted">Figures describe practice on Nalanda, not employment history.</p>
      </section>
    </article>
  );
}
