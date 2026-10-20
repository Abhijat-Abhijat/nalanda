import { Link } from 'react-router-dom';
import { weekKey, weekCounts } from '../../career/goals';
import { dayKey } from '../../engine/streak';
import { PATHS, pathProgress } from '../../career/paths';
import { usePathContext } from './usePathContext';
import { stepLabel } from './stepLabel';

export const HUB_TOOLS = [
  { to: '/career/paths', title: 'Career paths', desc: 'A route from where you are to a target role, with your next step.' },
  { to: '/career/interview', title: 'Interview simulator', desc: 'Timed rounds that mirror real interview loops, with a debrief.' },
  { to: '/career/mock', title: 'AI mock interview', desc: 'Answer a design or behavioural prompt and get rubric-based feedback.' },
  { to: '/career/deck', title: 'Interview deck', desc: 'Spaced-repetition cards for frequently asked questions.' },
  { to: '/career/daily', title: 'Daily problem', desc: 'One coding exercise and one concept question each day.' },
  { to: '/projects', title: 'Portfolio projects', desc: 'Thirty projects that show senior and staff skills.' },
  { to: '/career/portfolio', title: 'Portfolio export', desc: 'A printable record of what you have learned and built.' },
  { to: '/career/resume', title: 'Resume builder', desc: 'Write measured bullets with a checker, then export.' },
  { to: '/career/match', title: 'Job description matcher', desc: 'See covered skills, gaps, and a two-week study plan.' },
  { to: '/career/goals', title: 'Weekly goals', desc: 'Set weekly targets and see your last twelve weeks.' },
  { to: '/career/applications', title: 'Application tracker', desc: 'Track companies, stages, and dates on this device.' },
  { to: '/career/data', title: 'Career data', desc: 'Export, import, or reset your career data.' },
];

export default function CareerHub() {
  const ctx = usePathContext();
  const c = weekCounts(ctx.career.activity, weekKey(dayKey(new Date())));
  const g = ctx.career.goals;
  const mine = PATHS.find((p) => p.id === ctx.career.pathId);
  const next = mine ? pathProgress(mine, ctx).next : null;
  return (
    <article className="narrow wide">
      <h1>Career</h1>
      <p className="lede">Tools to turn what you learn into interviews and offers. Everything stays on this device unless you export it.</p>
      <section className="notice">
        <p>This week: {c.lessons} of {g.lessons} lessons, {c.interviews} of {g.interviews} interview rounds, {c.applications} of {g.applications} applications. <Link to="/career/goals">Goals</Link></p>
        {next ? <p>Next on your path: <Link to={stepLabel(next.step).to}>{stepLabel(next.step).text}</Link></p> : null}
      </section>
      <ul className="hub-grid">
        {HUB_TOOLS.map((t) => (
          <li key={t.to}><Link to={t.to} className="hub-card"><strong>{t.title}</strong><span className="muted">{t.desc}</span></Link></li>
        ))}
      </ul>
    </article>
  );
}
