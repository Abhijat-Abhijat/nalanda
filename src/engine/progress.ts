import { XP } from './xp';
import { nextStreak } from './streak';
import { addMiss, answerReview } from './review';
import { recordHistory } from './exam';
import { evaluateBadges } from './badges';
import type { Progress } from './types';

export const emptyProgress = (): Progress => ({
  version: 1, xp: 0, streak: { count: 0, last: null }, lessonsDone: {}, attempts: {},
  examsPassed: {}, bossesPassed: {}, history: {}, review: [], badges: [], perfectQuizzes: 0, reviewCleared: 0,
});

const finish = (p: Progress): Progress => ({ ...p, badges: evaluateBadges(p) });

export function applyAnswer(p: Progress, conceptId: string, correct: boolean, today: string): Progress {
  const history = recordHistory(p.history, conceptId, correct);
  if (!correct) return finish({ ...p, history, review: addMiss(p.review, conceptId, today) });
  // A correct answer only moves a concept up a box when it is actually due, so answering early cannot skip the spacing.
  const due = p.review.some((i) => i.conceptId === conceptId && i.due <= today);
  if (!due) return finish({ ...p, history });
  const r = answerReview(p.review, conceptId, true, today);
  return finish({ ...p, history, review: r.items, reviewCleared: p.reviewCleared + (r.cleared ? 1 : 0) });
}

export const applyReview = (p: Progress, conceptId: string, correct: boolean, today: string): Progress =>
  finish({ ...applyAnswer(p, conceptId, correct, today), streak: nextStreak(p.streak, today) });

export const applyAttempt = (p: Progress, exerciseId: string): Progress =>
  ({ ...p, attempts: { ...p.attempts, [exerciseId]: (p.attempts[exerciseId] ?? 0) + 1 } });

export function applyCompleteLesson(
  p: Progress, key: string, r: { exerciseFirstTry: boolean; quizCorrect: number; quizTotal: number }, today: string,
): Progress {
  const streak = nextStreak(p.streak, today);
  if (p.lessonsDone[key]) return finish({ ...p, streak });
  const xp = p.xp + XP.lesson + (r.exerciseFirstTry ? XP.firstTry : 0) + r.quizCorrect * XP.quizCorrect;
  const perfect = r.quizTotal > 0 && r.quizCorrect === r.quizTotal ? 1 : 0;
  return finish({ ...p, xp, streak, lessonsDone: { ...p.lessonsDone, [key]: true }, perfectQuizzes: p.perfectQuizzes + perfect });
}

export function applyExamPass(p: Progress, key: string, pct: number, today: string): Progress {
  const first = p.examsPassed[key] === undefined;
  return finish({
    ...p, xp: p.xp + (first ? XP.exam : 0), streak: nextStreak(p.streak, today),
    examsPassed: { ...p.examsPassed, [key]: Math.max(pct, p.examsPassed[key] ?? 0) },
  });
}

export function applyBossPass(p: Progress, worldId: string, today: string): Progress {
  const first = !p.bossesPassed[worldId];
  return finish({
    ...p, xp: p.xp + (first ? XP.boss : 0), streak: nextStreak(p.streak, today),
    bossesPassed: { ...p.bossesPassed, [worldId]: true },
  });
}
