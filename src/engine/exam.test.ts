import { describe, it, expect } from 'vitest';
import { shuffle, drawExam, scoreExam, recordHistory, mastery } from './exam';
import type { Question } from '../schema';

const qs: Question[] = Array.from({ length: 12 }, (_, i) => ({
  kind: 'choice', id: `q${i}`, conceptId: 'c', prompt: 'p', options: ['a', 'b'], answer: 0, explain: 'e',
}));

describe('exam', () => {
  it('shuffle keeps all items and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, () => 0.3);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
  it('draws n unique questions, or all when the pool is smaller', () => {
    const drawn = drawExam(qs, 8);
    expect(drawn).toHaveLength(8);
    expect(new Set(drawn.map((q) => q.id)).size).toBe(8);
    expect(drawExam(qs.slice(0, 3), 8)).toHaveLength(3);
  });
  it('scores with a 70 percent pass mark', () => {
    expect(scoreExam([true, true, true, true, true, true, true, false, false, false])).toEqual({ correct: 7, total: 10, pct: 70, passed: true });
    expect(scoreExam([true, false]).passed).toBe(false);
    expect(scoreExam([])).toEqual({ correct: 0, total: 0, pct: 0, passed: false });
  });
  it('keeps only the last 5 answers per concept', () => {
    let h: Record<string, boolean[]> = {};
    for (const c of [false, false, true, true, true, true, true]) h = recordHistory(h, 'x', c);
    expect(h.x).toEqual([true, true, true, true, true]);
    expect(mastery(h, 'x')).toBe(100);
  });
  it('mastery is a percentage and 0 with no history', () => {
    expect(mastery({ x: [true, false, true, false] }, 'x')).toBe(50);
    expect(mastery({}, 'x')).toBe(0);
  });
});
