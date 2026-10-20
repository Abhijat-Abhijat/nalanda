import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { projects, TRACKS, type Project, type Track } from '../content/projects';
import { catalog } from '../content/catalog';
import { useCareer } from '../career/store';

type Status = 'idea' | 'building' | 'shipped';
const STATUS_LABEL: Record<Status, string> = { idea: 'Not started', building: 'Building', shipped: 'Shipped' };

// Statuses used to live under their own key; move them into career data once.
function migrateOldStatuses() {
  try {
    const raw = localStorage.getItem('nalanda-project-status');
    if (!raw || !useCareer.getState().canSave) return;
    const old = JSON.parse(raw) as Record<string, string>;
    for (const [id, st] of Object.entries(old)) {
      if (st === 'idea' || st === 'building' || st === 'shipped') useCareer.getState().setProjectStatus(id, st);
    }
    if (!useCareer.getState().saveFailed) localStorage.removeItem('nalanda-project-status');
  } catch { /* unreadable old data: ignore */ }
}

const worldTitle = (id: string) => catalog.find((w) => w.id === id)?.title ?? id;

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <h4>{title}</h4>
      <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </>
  );
}

function ProjectCard({ p, status, onStatus }: { p: Project; status: Status; onStatus: (s: Status) => void }) {
  return (
    <li className="project" data-status={status}>
      <details>
        <summary>
          <span className="project-title">{p.title}</span>
          <span className="project-meta">
            <span className="chip">{p.track}</span>
            <span className="chip">{p.signal} signal</span>
            <span className="chip">{p.effort}</span>
            {status !== 'idea' ? <span className="chip project-status">{STATUS_LABEL[status]}</span> : null}
          </span>
          <span className="project-pitch muted">{p.pitch}</span>
        </summary>
        <div className="project-body">
          <h4>Why it gets attention</h4>
          <p>{p.why}</p>
          <List title="Minimum version to ship" items={p.mvp} />
          <List title="Stretch goals (staff-level depth)" items={p.stretch} />
          <List title="Evidence to publish" items={p.proof} />
          <h4>Suggested stack</h4>
          <p>{p.stack.join(' · ')}</p>
          <h4>Resume bullet template</h4>
          <blockquote>{p.bullet}</blockquote>
          <p className="muted">Replace every bracketed value with numbers you actually measured.</p>
          <List title="Be ready to discuss in interviews" items={p.interview} />
          <h4>Learn the foundations in Nalanda</h4>
          <p>{p.worlds.map((w, i) => <span key={w}>{i ? ' · ' : ''}<Link to={`/w/${w}`}>{worldTitle(w)}</Link></span>)}</p>
          <label className="project-status-pick">
            Status{' '}
            <select value={status} onChange={(e) => onStatus(e.target.value as Status)} aria-label={`Status for ${p.title}`}>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </label>
        </div>
      </details>
    </li>
  );
}

export default function ProjectsPage() {
  const [track, setTrack] = useState<Track | 'all'>('all');
  const [signal, setSignal] = useState<'all' | 'Senior' | 'Staff'>('all');
  const [query, setQuery] = useState('');
  useEffect(() => migrateOldStatuses(), []);
  const status = useCareer((s) => s.data.projects);
  const setOne = (id: string, s: Status) => useCareer.getState().setProjectStatus(id, s);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) =>
      (track === 'all' || p.track === track) &&
      (signal === 'all' || p.signal === signal) &&
      (!q || [p.title, p.pitch, p.stack.join(' ')].join(' ').toLowerCase().includes(q)));
  }, [track, signal, query]);

  const shipped = projects.filter((p) => status[p.id] === 'shipped').length;
  const building = projects.filter((p) => status[p.id] === 'building').length;

  return (
    <article className="narrow wide projects-page">
      <h1>Portfolio projects for big tech</h1>
      <p className="lede">Thirty projects for an engineer with around eleven years of experience who is aiming at senior or staff roles at Google, Atlassian, and other large technology companies.</p>

      <section className="projects-guide">
        <h2>How to use this list</h2>
        <ul>
          <li><strong>Choose 3 or 4 projects and go deep.</strong> Thirty shallow demos signal less than three projects with design docs, benchmarks, tests, and a write-up of what you learned.</li>
          <li><strong>Projects support your work history; they do not replace it.</strong> At 11 years, interviewers mainly probe the scope and impact of your real work, so match projects to the team you want to join.</li>
          <li><strong>Show senior and staff signals.</strong> Write a design doc with alternatives you rejected, measure results, document failure modes, and explain the trade-offs. Staff-level projects also show influence beyond one codebase, for example open-source design work or a platform others adopt.</li>
          <li><strong>Publish evidence.</strong> A public repository, a README with architecture and benchmark methodology, and a blog post give recruiters and interviewers something concrete to read.</li>
          <li><strong>Interviews still decide.</strong> Large companies run coding, system design, and behavioural or values interviews. Projects give you strong stories for them, so also practise in the Algorithms, System design, and Career worlds.</li>
        </ul>
      </section>

      <dl className="tiles">
        <div><dt>Projects</dt><dd>{projects.length}</dd></div>
        <div><dt>Building</dt><dd>{building}</dd></div>
        <div><dt>Shipped</dt><dd>{shipped}</dd></div>
      </dl>

      <div className="project-filters" role="group" aria-label="Filter projects">
        <label>Track{' '}
          <select value={track} onChange={(e) => setTrack(e.target.value as Track | 'all')}>
            <option value="all">All tracks</option>
            {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>Signal{' '}
          <select value={signal} onChange={(e) => setSignal(e.target.value as 'all' | 'Senior' | 'Staff')}>
            <option value="all">Senior and staff</option>
            <option value="Senior">Senior</option>
            <option value="Staff">Staff</option>
          </select>
        </label>
        <label>Search{' '}
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kafka, CRDT, Rust…" />
        </label>
      </div>

      <p className="muted" aria-live="polite">{shown.length} of {projects.length} projects shown</p>
      {shown.length === 0 ? <p>No projects match these filters.</p> : (
        <ol className="project-list">
          {shown.map((p) => <ProjectCard key={p.id} p={p} status={status[p.id] ?? 'idea'} onStatus={(s) => setOne(p.id, s)} />)}
        </ol>
      )}
    </article>
  );
}
