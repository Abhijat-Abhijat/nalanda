import { describe, it, expect } from 'vitest';
import { XP, cumulativeXpForLevel, levelForXp } from './xp';

describe('xp', () => {
  it('has the spec values', () => {
    expect(XP).toEqual({ lesson: 50, firstTry: 20, quizCorrect: 5, exam: 150, boss: 400 });
  });
  it('cumulative xp per level', () => {
    expect([1, 2, 3, 4].map(cumulativeXpForLevel)).toEqual([0, 100, 300, 600]);
  });
  it('level boundaries', () => {
    expect(levelForXp(0)).toEqual({ level: 1, intoLevel: 0, needed: 100 });
    expect(levelForXp(99)).toEqual({ level: 1, intoLevel: 99, needed: 100 });
    expect(levelForXp(100)).toEqual({ level: 2, intoLevel: 0, needed: 200 });
    expect(levelForXp(299)).toEqual({ level: 2, intoLevel: 199, needed: 200 });
    expect(levelForXp(300)).toEqual({ level: 3, intoLevel: 0, needed: 300 });
  });
  it('treats negative xp as zero', () => {
    expect(levelForXp(-5).level).toBe(1);
  });
});
