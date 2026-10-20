import { Link } from 'react-router-dom';
import { catalog as worlds } from '../content/catalog';
import { useStore } from '../engine/store';
import { dueItems } from '../engine/review';
import { dayKey } from '../engine/streak';
import { isLessonUnlocked, lessonKey } from '../unlock';
import { BrushEdge, PaperPlane, Scribble, WorldIcon } from '../ui/Sketch';

// Faint letters scattered around the hero, like loose type on a desk. Positions are fixed so the page never shifts.
const LETTERS = 'selectjoinmergecurltokenembedragshellquery'.split('').map((ch, i) => ({
  ch,
  x: (i * 37 + 11) % 96 + 2,
  y: i % 2 === 0 ? (i * 13) % 22 + 4 : 72 + (i * 17) % 22,
  r: ((i * 29) % 50) - 25,
}));

export default function Home() {
  const p = useStore((s) => s.progress);
  if (worlds.length === 0) return <p className="page">No worlds yet. Add content under src/content.</p>;

  let next: { to: string; title: string } | null = null;
  let started = false;
  outer: for (const w of worlds) {
    for (const [ci, c] of w.chapters.entries()) {
      for (const [li, l] of c.lessons.entries()) {
        const done = !!p.lessonsDone[lessonKey(w.id, c.id, l.id)];
        if (done) { started = true; continue; }
        if (isLessonUnlocked(w, ci, li, p)) { next = { to: `/w/${w.id}/${c.id}/${l.id}`, title: l.title }; break outer; }
      }
    }
  }
  const due = dueItems(p.review, dayKey(new Date())).length;

  return (
    <>
      <section className="night-hero">
        <div className="letters" aria-hidden="true">
          {LETTERS.map((l, i) => <span key={i} style={{ left: `${l.x}%`, top: `${l.y}%`, transform: `rotate(${l.r}deg)` }}>{l.ch}</span>)}
        </div>
        <PaperPlane className="hero-plane" />
        <div className="night-in">
          <h1>Learn the story behind the code.<span className="caret" aria-hidden="true" /></h1>
          <p className="night-lede">
            {started
              ? `Welcome back. ${due > 0 ? `${due} ${due === 1 ? 'idea is' : 'ideas are'} waiting in your review pond.` : 'Pick up where you left off.'}`
              : 'Nalanda teaches software and AI engineering the way good teachers do: where an idea came from, why it changed, then hands-on practice.'}
          </p>
          <div className="hero-actions">
            {next && <Link className="btn light" to={next.to}>{started ? 'Continue' : 'Start'}: {next.title}</Link>}
            {due > 0 && <Link className="btn outline-light" to="/review">Review pond ({due})</Link>}
          </div>
        </div>
        <BrushEdge />
      </section>

      <div className="home-body">
        <section className="statement">
          <h2>Made for <span className="accent">curious</span> engineers</h2>
          <p className="statement-sub">
            Plenty of courses hand you syntax and a checklist. <em>That's not us.</em> Every lesson starts with the people and problems behind an idea,
            then takes you <span className="underlined">deeper, layer by layer<Scribble /></span>, and ends with you doing it for real.
          </p>
        </section>

        <h2 id="worlds" className="section-title">Choose a world</h2>
        <ul className="worlds">
          {worlds.map((w) => {
            const total = w.chapters.reduce((n, c) => n + c.lessons.length, 0);
            const done = w.chapters.reduce((n, c) => n + c.lessons.filter((l) => p.lessonsDone[lessonKey(w.id, c.id, l.id)]).length, 0);
            const pct = total === 0 ? 0 : Math.round((done / total) * 100);
            return (
              <li key={w.id} className="world-card" style={{ ['--hue' as string]: w.hue }}>
                <Link to={`/w/${w.id}`}>
                  <WorldIcon id={w.id} className="world-icon" />
                  <span className="world-text">
                    <h3>{w.title}</h3>
                    <span className="muted">{w.tagline}</span>
                    <span className="bar" role="progressbar" aria-label={`${w.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></span>
                    <span className="card-foot"><span>{done} of {total} lessons</span><span className="go">{done === 0 ? 'Start' : done === total ? 'Review' : 'Continue'} &rarr;</span></span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
