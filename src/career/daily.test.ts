import { describe, it, expect } from 'vitest';
import { dailyPick, dailyStreak } from './daily';
import type { Task } from '../schema';

const t = (id: string) => ({ id }) as unknown as Task;
const pools = { coding: [t('c0'), t('c1'), t('c2')], concepts: [t('q0'), t('q1')] };

describe('daily problem', () => {
  it('is deterministic per day and varies across days', () => {
    expect(dailyPick('2026-10-16', pools)).toEqual(dailyPick('2026-10-16', pools));
    const ids = ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'].map((d) => dailyPick(d, pools).code!.id);
    expect(new Set(ids).size).toBeGreaterThan(1);
  });
  it('handles empty pools', () => {
    expect(dailyPick('2026-10-16', { coding: [], concepts: [] })).toEqual({ code: null, concept: null });
  });
  it('counts a streak of fully completed days', () => {
    const done = { '2026-10-14': { code: true, concept: true }, '2026-10-15': { code: true, concept: true }, '2026-10-16': { code: true, concept: false } };
    expect(dailyStreak(done, '2026-10-16')).toBe(2);
    expect(dailyStreak(done, '2026-10-18')).toBe(0);
  });
});
