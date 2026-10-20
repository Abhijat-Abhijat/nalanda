import type { Task } from '../schema';
import type { Pools } from './interview/session';
import { hashString } from './random';
import { addDays } from '../engine/streak';

export function dailyPick(day: string, pools: Pools): { code: Task | null; concept: Task | null } {
  return {
    code: pools.coding.length ? pools.coding[hashString(`code:${day}`) % pools.coding.length] : null,
    concept: pools.concepts.length ? pools.concepts[hashString(`concept:${day}`) % pools.concepts.length] : null,
  };
}

export function dailyStreak(done: Record<string, { code: boolean; concept: boolean }>, today: string): number {
  const full = (d: string) => !!done[d]?.code && !!done[d]?.concept;
  let day = full(today) ? today : addDays(today, -1);
  let n = 0;
  while (full(day)) { n++; day = addDays(day, -1); }
  return n;
}
