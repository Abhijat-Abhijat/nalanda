import { useCareer } from '../../career/store';
import { weekKey, weekCounts, calendar } from '../../career/goals';
import { dayKey } from '../../engine/streak';

const FIELDS = [
  { key: 'lessons', label: 'Lessons per week', unit: 'lessons', max: 100 },
  { key: 'interviews', label: 'Interview rounds per week', unit: 'interview rounds', max: 50 },
  { key: 'applications', label: 'Applications per week', unit: 'applications', max: 100 },
] as const;

export default function GoalsPage() {
  const data = useCareer((s) => s.data);
  const setGoals = useCareer((s) => s.setGoals);
  const today = dayKey(new Date());
  const counts = weekCounts(data.activity, weekKey(today));
  const cal = calendar(data.activity, today);
  const peak = Math.max(1, ...cal.map((c) => c.total));
  return (
    <article className="narrow">
      <h1>Weekly goals</h1>
      <p className="lede">Small, steady targets beat cramming. This week started on {weekKey(today)}.</p>
      <ul className="goal-list">
        {FIELDS.map((f) => (
          <li key={f.key}>
            <label>{f.label} <input type="number" min={0} max={f.max} value={data.goals[f.key]} aria-label={f.label}
              onChange={(e) => setGoals({ ...data.goals, [f.key]: Math.max(0, Math.min(f.max, Number(e.target.value) || 0)) })} /></label>
            <progress max={Math.max(1, data.goals[f.key])} value={Math.min(counts[f.key], data.goals[f.key])} aria-hidden="true" />
            <span>{counts[f.key]} of {data.goals[f.key]} {f.unit}</span>
          </li>
        ))}
      </ul>
      <h2>Last 12 weeks</h2>
      <ol className="week-bars" aria-label="Activity per week">
        {cal.map((c) => (
          <li key={c.week} title={`Week of ${c.week}: ${c.total} activities`}>
            <span style={{ height: `${(c.total / peak) * 100}%` }} />
            <span className="sr-only">Week of {c.week}: {c.total} activities</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
