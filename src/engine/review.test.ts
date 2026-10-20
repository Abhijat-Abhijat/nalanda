import { describe, it, expect } from 'vitest';
import { addMiss, answerReview, dueItems, INTERVALS } from './review';

describe('review pond', () => {
  it('uses the spec intervals', () => expect(INTERVALS).toEqual([1, 3, 7, 21]));
  it('puts a missed concept in box 1, due tomorrow', () => {
    expect(addMiss([], 'c1', '2026-10-02')).toEqual([{ conceptId: 'c1', box: 1, due: '2026-10-03' }]);
  });
  it('resets an existing item to box 1 on a new miss', () => {
    const items = [{ conceptId: 'c1', box: 3 as const, due: '2026-10-01' }];
    expect(addMiss(items, 'c1', '2026-10-02')).toEqual([{ conceptId: 'c1', box: 1, due: '2026-10-03' }]);
  });
  it('moves up a box on a correct review', () => {
    const items = [{ conceptId: 'c1', box: 1 as const, due: '2026-10-03' }];
    const r = answerReview(items, 'c1', true, '2026-10-03');
    expect(r.items).toEqual([{ conceptId: 'c1', box: 2, due: '2026-10-06' }]);
    expect(r.cleared).toBe(false);
  });
  it('returns to box 1 on a wrong review', () => {
    const items = [{ conceptId: 'c1', box: 3 as const, due: '2026-10-03' }];
    const r = answerReview(items, 'c1', false, '2026-10-03');
    expect(r.items).toEqual([{ conceptId: 'c1', box: 1, due: '2026-10-04' }]);
  });
  it('clears an item answered correctly in box 4', () => {
    const items = [{ conceptId: 'c1', box: 4 as const, due: '2026-10-03' }];
    const r = answerReview(items, 'c1', true, '2026-10-03');
    expect(r.items).toEqual([]);
    expect(r.cleared).toBe(true);
  });
  it('ignores answers for concepts not in the pond', () => {
    const r = answerReview([], 'zzz', true, '2026-10-03');
    expect(r).toEqual({ items: [], cleared: false });
  });
  it('lists only items due today or earlier', () => {
    const items = [
      { conceptId: 'a', box: 1 as const, due: '2026-10-02' },
      { conceptId: 'b', box: 2 as const, due: '2026-10-09' },
    ];
    expect(dueItems(items, '2026-10-03').map((i) => i.conceptId)).toEqual(['a']);
  });
});
