import { useState } from 'react';
import { Link } from 'react-router-dom';
import { matchJd, coverage, studyPlan, MAX_JD, type Skill } from '../../career/skills';
import { useStore } from '../../engine/store';
import { catalog } from '../../content/catalog';

const chapterTitle = (w: string, c: string) => catalog.find((x) => x.id === w)?.chapters.find((x) => x.id === c)?.title ?? c;

export default function MatchPage() {
  const progress = useStore((s) => s.progress);
  const [text, setText] = useState('');
  const [found, setFound] = useState<Skill[] | null>(null);
  const covered = found?.filter((s) => coverage(s, progress) >= 0.5) ?? [];
  const gaps = found?.filter((s) => coverage(s, progress) < 0.5) ?? [];
  const plan = studyPlan(gaps, progress);
  return (
    <article className="narrow wide">
      <h1>Job description matcher</h1>
      <p className="lede">Paste a job posting. Nalanda finds the skills it asks for, checks them against your passed chapter exams, and suggests a two-week plan. The text stays in this browser tab.</p>
      <label htmlFor="jd">Job description</label>
      <textarea id="jd" rows={10} maxLength={MAX_JD} value={text} onChange={(e) => setText(e.target.value)} />
      <p className="muted">{text.length.toLocaleString()} / {MAX_JD.toLocaleString()} characters{text.length >= MAX_JD ? '. Limit reached.' : ''}</p>
      <button className="btn primary" onClick={() => setFound(matchJd(text))}>Analyse</button>
      {found && found.length === 0 ? <p>No technical skills recognised. Try pasting the requirements section of the posting.</p> : null}
      {found && found.length > 0 ? (
        <>
          <h2>Covered</h2>
          {covered.length ? <ul>{covered.map((s) => <li key={s.id}>{s.label} ({Math.round(coverage(s, progress) * 100)}%)</li>)}</ul> : <p className="muted">None yet.</p>}
          <h2>Gaps</h2>
          {gaps.length ? <ul>{gaps.map((s) => <li key={s.id}>{s.label}</li>)}</ul> : <p className="muted">No gaps against Nalanda coverage.</p>}
          {plan.length ? (
            <>
              <h2>Two-week plan</h2>
              <table className="score-table">
                <thead><tr><th>Day</th><th>Chapter</th><th>Skill</th></tr></thead>
                <tbody>{plan.map((p) => <tr key={p.day}><td>{p.day}</td><td><Link to={`/w/${p.world}`}>{chapterTitle(p.world, p.chapter)}</Link></td><td>{p.skill}</td></tr>)}</tbody>
              </table>
            </>
          ) : null}
        </>
      ) : null}
    </article>
  );
}
