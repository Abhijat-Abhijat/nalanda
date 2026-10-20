import { describe, it, expect } from 'vitest';
import { isLessonUnlocked, isExamUnlocked, isBossUnlocked, lessonKey, chapterKey } from './unlock';
import { emptyProgress } from './engine/progress';
import type { World } from './schema';

const world = {
  id: 'w',
  chapters: [
    { id: 'c1', lessons: [{ id: 'l1' }, { id: 'l2' }] },
    { id: 'c2', lessons: [{ id: 'l3' }] },
  ],
} as unknown as World;

describe('unlock rules', () => {
  it('unlocks only the first lesson at the start', () => {
    const p = emptyProgress();
    expect(isLessonUnlocked(world, 0, 0, p)).toBe(true);
    expect(isLessonUnlocked(world, 0, 1, p)).toBe(false);
    expect(isLessonUnlocked(world, 1, 0, p)).toBe(false);
  });
  it('unlocks the next lesson after one is done', () => {
    const p = { ...emptyProgress(), lessonsDone: { [lessonKey('w', 'c1', 'l1')]: true as const } };
    expect(isLessonUnlocked(world, 0, 1, p)).toBe(true);
  });
  it('unlocks the exam after all lessons and the next chapter after the exam', () => {
    let p = { ...emptyProgress(), lessonsDone: { [lessonKey('w', 'c1', 'l1')]: true as const, [lessonKey('w', 'c1', 'l2')]: true as const } };
    expect(isExamUnlocked(world, 0, p)).toBe(true);
    expect(isLessonUnlocked(world, 1, 0, p)).toBe(false);
    p = { ...p, examsPassed: { [chapterKey('w', 'c1')]: 80 } };
    expect(isLessonUnlocked(world, 1, 0, p)).toBe(true);
  });
  it('unlocks the boss only after every chapter exam', () => {
    let p = { ...emptyProgress(), examsPassed: { [chapterKey('w', 'c1')]: 90 } };
    expect(isBossUnlocked(world, p)).toBe(false);
    p = { ...p, examsPassed: { ...p.examsPassed, [chapterKey('w', 'c2')]: 90 } };
    expect(isBossUnlocked(world, p)).toBe(true);
  });
});
