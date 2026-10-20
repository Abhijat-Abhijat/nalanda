import type { Progress } from './engine/types';

// Only ids are needed, so both a full World and its lightweight outline work here.
type World = { id: string; chapters: { id: string; lessons: { id: string }[] }[] };

export const lessonKey = (w: string, c: string, l: string) => `${w}/${c}/${l}`;
export const chapterKey = (w: string, c: string) => `${w}/${c}`;

const chapterLessonsDone = (world: World, ci: number, p: Progress) =>
  world.chapters[ci].lessons.every((l) => p.lessonsDone[lessonKey(world.id, world.chapters[ci].id, l.id)]);

export function isLessonUnlocked(world: World, ci: number, li: number, p: Progress): boolean {
  if (ci > 0 && p.examsPassed[chapterKey(world.id, world.chapters[ci - 1].id)] === undefined) return false;
  if (li === 0) return true;
  const prev = world.chapters[ci].lessons[li - 1];
  return !!p.lessonsDone[lessonKey(world.id, world.chapters[ci].id, prev.id)];
}

export const isExamUnlocked = (world: World, ci: number, p: Progress): boolean =>
  (ci === 0 || p.examsPassed[chapterKey(world.id, world.chapters[ci - 1].id)] !== undefined) && chapterLessonsDone(world, ci, p);

export const isBossUnlocked = (world: World, p: Progress): boolean =>
  world.chapters.every((c) => p.examsPassed[chapterKey(world.id, c.id)] !== undefined);
