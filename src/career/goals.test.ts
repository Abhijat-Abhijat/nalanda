import { describe, it, expect } from 'vitest';
import { weekKey, weekCounts, calendar } from './goals';

describe('goals', () => {
  it('maps days to the Monday of their week', () => {
    expect(weekKey('2026-10-16')).toBe('2026-10-12');
    expect(weekKey('2026-10-12')).toBe('2026-10-12');
    expect(weekKey('2026-10-18')).toBe('2026-10-12');
  });
  it('counts activity in a week', () => {
    const act = [
      { day: '2026-10-11', kind: 'lesson' as const },
      { day: '2026-10-12', kind: 'lesson' as const }, { day: '2026-10-13', kind: 'lesson' as const },
      { day: '2026-10-14', kind: 'mock' as const }, { day: '2026-10-15', kind: 'application' as const },
    ];
    expect(weekCounts(act, '2026-10-12')).toEqual({ lessons: 2, interviews: 1, applications: 1, deck: 0, daily: 0 });
  });
  it('builds a 12-week calendar ending this week', () => {
    const cal = calendar([{ day: '2026-10-13', kind: 'lesson' as const }], '2026-10-16');
    expect(cal).toHaveLength(12);
    expect(cal.at(-1)).toEqual({ week: '2026-10-12', total: 1 });
    expect(cal[0].week).toBe('2026-07-27');
  });
});
