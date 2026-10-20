import type { Block, World } from '../schema';

// The small, always-loaded part of a world: enough for the home page, world map, progress, and unlock rules.
// Full lessons, exams, and bosses are loaded on demand (see load.ts).
export type LessonOutline = { id: string; title: string; conceptIds: string[] };
export type ChapterOutline = { id: string; title: string; summary: string; lessons: LessonOutline[] };
export type WorldOutline = {
  id: string; title: string; hue: string; tagline: string; intro: Block[];
  chapters: ChapterOutline[]; boss: { id: string; title: string };
};

export const toOutline = (w: World): WorldOutline => ({
  id: w.id, title: w.title, hue: w.hue, tagline: w.tagline, intro: w.intro,
  chapters: w.chapters.map((c) => ({
    id: c.id, title: c.title, summary: c.summary,
    lessons: c.lessons.map((l) => ({ id: l.id, title: l.title, conceptIds: l.conceptIds })),
  })),
  boss: { id: w.boss.id, title: w.boss.title },
});
