import { useState } from 'react';
import { useCareer } from '../../career/store';
import { STAGES, STAGE_LABEL, funnel, upcoming } from '../../career/applications';
import { newId } from '../../career/random';
import { dayKey } from '../../engine/streak';
import type { Application, Stage } from '../../career/schema';

export default function ApplicationsPage() {
  const apps = useCareer((s) => s.data.applications);
  const { upsertApplication, removeApplication, log } = useCareer.getState();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const today = dayKey(new Date());
  const f = funnel(apps);
  const soon = upcoming(apps, today);
  const add = () => {
    const c = company.trim();
    if (!c) { setError('Enter a company name.'); return; }
    if (apps.length >= 500) { setError('You can track up to 500 applications.'); return; }
    upsertApplication({ id: newId(), company: c, role: role.trim(), stage: 'applied', applied: today, next: null, notes: '', updated: today });
    log('application');
    setCompany(''); setRole(''); setError(null);
  };
  const update = (a: Application, patch: Partial<Application>) => upsertApplication({ ...a, ...patch, updated: today });
  return (
    <article className="narrow wide">
      <h1>Application tracker</h1>
      <p className="lede">Stays on this device. Export it from Career data for a backup.</p>
      <dl className="tiles">
        <div><dt>Applied</dt><dd>{f.applied}</dd></div>
        <div><dt>Screens ({f.responseRate}% response)</dt><dd>{f.screen}</dd></div>
        <div><dt>Onsites · offers</dt><dd>{f.onsite} · {f.offer}</dd></div>
      </dl>
      <form className="app-form" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <label>Company <input value={company} maxLength={120} onChange={(e) => setCompany(e.target.value)} aria-label="Company" /></label>
        <label>Role <input value={role} maxLength={120} onChange={(e) => setRole(e.target.value)} aria-label="Role" /></label>
        <button className="btn primary" type="submit">Add application</button>
        {error ? <p role="alert">{error}</p> : null}
      </form>
      {soon.length ? <><h2>Coming up</h2><ul>{soon.map((a) => <li key={a.id}>{a.next}: {a.company} ({STAGE_LABEL[a.stage]})</li>)}</ul></> : null}
      <h2>All applications</h2>
      {apps.length === 0 ? <p className="muted">No applications yet.</p> : (
        <ul className="app-list">
          {apps.map((a) => (
            <li key={a.id} className="app-card">
              <p><strong>{a.company}</strong> <span className="muted">{a.role}</span></p>
              <label>Stage <select value={a.stage} aria-label={`Stage for ${a.company}`} onChange={(e) => update(a, { stage: e.target.value as Stage })}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select></label>
              <label>Next date <input type="date" max="9999-12-31" value={a.next ?? ''} onChange={(e) => update(a, { next: /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) ? e.target.value : null })} aria-label={`Next date for ${a.company}`} /></label>
              <label>Notes <textarea rows={3} maxLength={5000} value={a.notes} onChange={(e) => update(a, { notes: e.target.value })} aria-label={`Notes for ${a.company}`} /></label>
              <span className="muted">{a.notes.length}/5000</span>
              <button className="btn" onClick={() => { if (window.confirm(`Delete ${a.company}?`)) removeApplication(a.id); }}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
