import { addDays } from '../engine/streak';
import type { CareerData } from './schema';

const dow = (day: string) => { const [y, m, d] = day.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
export const weekKey = (day: string): string => addDays(day, -((dow(day) + 6) % 7));

export function weekCounts(activity: CareerData['activity'], week: string) {
  const c = { lessons: 0, interviews: 0, applications: 0, deck: 0, daily: 0 };
  for (const a of activity) {
    if (weekKey(a.day) !== week) continue;
    if (a.kind === 'lesson') c.lessons++;
    else if (a.kind === 'interview' || a.kind === 'mock') c.interviews++;
    else if (a.kind === 'application') c.applications++;
    else c[a.kind]++;
  }
  return c;
}

export function calendar(activity: CareerData['activity'], today: string, weeks = 12) {
  const end = weekKey(today);
  const totals = new Map<string, number>();
  for (const a of activity) { const w = weekKey(a.day); totals.set(w, (totals.get(w) ?? 0) + 1); }
  return Array.from({ length: weeks }, (_, i) => {
    const week = addDays(end, -7 * (weeks - 1 - i));
    return { week, total: totals.get(week) ?? 0 };
  });
}
