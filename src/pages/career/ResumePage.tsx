import { useState } from 'react';
import { useCareer } from '../../career/store';
import { lintBullet, ISSUE_TEXT, resumeMarkdown } from '../../career/resume';
import { projects } from '../../content/projects';
import { newId } from '../../career/random';
import { downloadText } from './download';

const uniqueSkills = (text: string) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of text.split(',').map((x) => x.trim()).filter(Boolean)) {
    if (!seen.has(s.toLowerCase())) { seen.add(s.toLowerCase()); out.push(s.slice(0, 60)); }
  }
  return out.slice(0, 60);
};

export default function ResumePage() {
  const r = useCareer((s) => s.data.resume);
  const setResume = useCareer((s) => s.setResume);
  const [skillsText, setSkillsText] = useState(r.skills.join(', '));
  const [msg, setMsg] = useState<string | null>(null);
  const setBullet = (id: string, text: string) => setResume({ ...r, bullets: r.bullets.map((b) => (b.id === id ? { ...b, text } : b)) });
  const addBullet = (text = '', projectId: string | null = null) => {
    if (r.bullets.length < 60) setResume({ ...r, bullets: [...r.bullets, { id: newId(), text, projectId }] });
  };
  const md = resumeMarkdown(r);
  const copy = async () => {
    try { await navigator.clipboard.writeText(md); setMsg('Copied.'); } catch { setMsg('Copy is not available here; use Download Markdown instead.'); }
  };
  return (
    <article className="narrow wide">
      <h1>Resume builder</h1>
      <p className="lede">Write bullets as action, scope, and measured result. The checker flags common problems as you type. Use only numbers you can defend in an interview.</p>
      <div className="no-print resume-form">
        <label>Name <input value={r.name} maxLength={120} onChange={(e) => setResume({ ...r, name: e.target.value })} aria-label="Name" /></label>
        <label>Headline <input value={r.headline} maxLength={200} onChange={(e) => setResume({ ...r, headline: e.target.value })} aria-label="Headline" /></label>
        <label>Summary <textarea rows={3} maxLength={1200} value={r.summary} onChange={(e) => setResume({ ...r, summary: e.target.value })} aria-label="Summary" /></label>
        <label>Skills (comma separated) <input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} onBlur={() => { const s = uniqueSkills(skillsText); setResume({ ...useCareer.getState().data.resume, skills: s }); setSkillsText(s.join(', ')); }} aria-label="Skills (comma separated)" /></label>
        <h2>Highlights</h2>
        <ol className="bullet-list">
          {r.bullets.map((b, i) => {
            const issues = lintBullet(b.text);
            return (
              <li key={b.id}>
                <textarea rows={2} maxLength={400} value={b.text} onChange={(e) => setBullet(b.id, e.target.value)} aria-label={`Bullet ${i + 1}`} />
                {issues.length ? <ul className="lint">{issues.map((x) => <li key={x}>{ISSUE_TEXT[x]}</li>)}</ul> : <p className="muted">Looks good.</p>}
                <button className="btn" onClick={() => setResume({ ...r, bullets: r.bullets.filter((x) => x.id !== b.id) })}>Delete</button>
              </li>
            );
          })}
        </ol>
        <button className="btn" onClick={() => addBullet()}>Add bullet</button>{' '}
        <label>Start from a project <select value="" aria-label="Start from a project" onChange={(e) => { const p = projects.find((x) => x.id === e.target.value); if (p) addBullet(p.bullet, p.id); }}>
          <option value="">Choose…</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select></label>
        <p>
          <button className="btn primary" onClick={() => downloadText('resume.md', md, 'text/markdown')}>Download Markdown</button>{' '}
          <button className="btn" onClick={copy}>Copy</button>{' '}
          <button className="btn" onClick={() => window.print()}>Print</button>
        </p>
        {msg ? <p role="status">{msg}</p> : null}
      </div>
      <section className="portfolio-sheet" aria-label="Preview">
        <h2>{r.name || 'Your name'}</h2>
        {r.headline ? <p><strong>{r.headline}</strong></p> : null}
        {r.summary ? <p>{r.summary}</p> : null}
        <ul>{r.bullets.filter((b) => b.text.trim()).map((b) => <li key={b.id}>{b.text}</li>)}</ul>
        {r.skills.length ? <p>{r.skills.join(' · ')}</p> : null}
      </section>
    </article>
  );
}
