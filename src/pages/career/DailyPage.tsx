import { useEffect, useState } from 'react';
import { TaskRunner } from '../../exercises/registry';
import { loadPools } from '../../career/interview/pools';
import type { Pools } from '../../career/interview/session';
import { dailyPick, dailyStreak } from '../../career/daily';
import { useCareer } from '../../career/store';
import { dayKey } from '../../engine/streak';

export default function DailyPage({ poolsLoader = loadPools }: { poolsLoader?: () => Promise<Pools> }) {
  const today = dayKey(new Date());
  const [pools, setPools] = useState<Pools | null>(null);
  const [error, setError] = useState(false);
  const done = useCareer((s) => s.data.dailyDone);
  useEffect(() => { poolsLoader().then(setPools).catch(() => setError(true)); }, [poolsLoader]);
  if (error) return <p role="alert">Could not load today's problems. Check your connection and try again.</p>;
  if (!pools) return <p>Loading today's problems…</p>;
  const pick = dailyPick(today, pools);
  const mark = (part: 'code' | 'concept') => (passed: boolean) => {
    if (!passed || useCareer.getState().data.dailyDone[today]?.[part]) return;
    useCareer.getState().markDaily(today, part);
    useCareer.getState().log('daily');
  };
  return (
    <article className="narrow wide">
      <h1>Daily problem</h1>
      <p className="lede">Everyone gets the same two problems today. Streak: {dailyStreak(done, today)} days.</p>
      <h2>Coding{done[today]?.code ? ' (done)' : ''}</h2>
      {pick.code ? <TaskRunner task={pick.code} onAttempt={mark('code')} /> : <p>No coding problem available.</p>}
      <h2>Concept{done[today]?.concept ? ' (done)' : ''}</h2>
      {pick.concept ? <TaskRunner task={pick.concept} onAttempt={mark('concept')} /> : <p>No concept question available.</p>}
    </article>
  );
}
