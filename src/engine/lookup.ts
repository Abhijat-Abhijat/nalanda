import type { Question, World } from '../schema';

const QUIZ_KINDS = new Set(['choice', 'order', 'fill']);

export function findQuestionsByConcept(worlds: World[], conceptIds: string[]): Question[] {
  const want = new Set(conceptIds);
  const out: Question[] = [];
  for (const w of worlds) for (const c of w.chapters) {
    for (const l of c.lessons) {
      if (QUIZ_KINDS.has(l.exercise.kind) && want.has(l.exercise.conceptId)) out.push(l.exercise as Question);
      out.push(...l.quiz.filter((q) => want.has(q.conceptId)));
    }
    out.push(...c.exam.filter((q) => want.has(q.conceptId)));
  }
  return out;
}

type Outline = { id: string; chapters: { id: string; lessons: { id: string; title: string; conceptIds: string[] }[] }[] };

export function conceptTitle(worlds: Outline[], conceptId: string): string {
  for (const w of worlds) for (const c of w.chapters) for (const l of c.lessons) if (l.conceptIds.includes(conceptId)) return l.title;
  return conceptId;
}

export function lessonPathForConcept(worlds: Outline[], conceptId: string): string {
  for (const w of worlds) for (const c of w.chapters) for (const l of c.lessons) if (l.conceptIds.includes(conceptId)) return `/w/${w.id}/${c.id}/${l.id}`;
  return '/';
}
