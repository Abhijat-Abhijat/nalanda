import { describe, it, expect } from 'vitest';
import { dayKey, dayDiff, addDays, nextStreak, currentStreak } from './streak';

describe('day arithmetic', () => {
  it('formats a local date', () => {
    expect(dayKey(new Date(2026, 9, 2, 23, 59))).toBe('2026-10-02');
  });
  it('diffs across month ends', () => {
    expect(dayDiff('2026-10-31', '2026-11-01')).toBe(1);
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('is not affected by daylight-saving dates', () => {
    expect(dayDiff('2026-03-28', '2026-03-29')).toBe(1);
    expect(dayDiff('2026-10-24', '2026-10-25')).toBe(1);
    expect(dayDiff('2026-03-29', '2026-03-30')).toBe(1);
  });
});

describe('nextStreak', () => {
  it('starts at 1', () => {
    expect(nextStreak({ count: 0, last: null }, '2026-10-02')).toEqual({ count: 1, last: '2026-10-02' });
  });
  it('does not double count the same day', () => {
    const s = { count: 4, last: '2026-10-02' };
    expect(nextStreak(s, '2026-10-02')).toEqual(s);
  });
  it('extends on the next day', () => {
    expect(nextStreak({ count: 4, last: '2026-10-02' }, '2026-10-03')).toEqual({ count: 5, last: '2026-10-03' });
  });
  it('resets after a gap', () => {
    expect(nextStreak({ count: 9, last: '2026-10-02' }, '2026-10-05')).toEqual({ count: 1, last: '2026-10-05' });
  });
  it('ignores a clock that moved backwards', () => {
    const s = { count: 3, last: '2026-10-05' };
    expect(nextStreak(s, '2026-10-02')).toEqual(s);
  });
});

describe('currentStreak', () => {
  it('shows the count while today or yesterday was active', () => {
    expect(currentStreak({ count: 3, last: '2026-10-02' }, '2026-10-02')).toBe(3);
    expect(currentStreak({ count: 3, last: '2026-10-02' }, '2026-10-03')).toBe(3);
  });
  it('shows 0 once a full day was missed', () => {
    expect(currentStreak({ count: 3, last: '2026-10-02' }, '2026-10-04')).toBe(0);
  });
});
