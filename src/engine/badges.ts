import type { Progress } from './types';

export function evaluateBadges(p: Progress): string[] {
  const earned = new Set(p.badges);
  if (Object.keys(p.lessonsDone).length >= 1) earned.add('first-lesson');
  if (p.streak.count >= 3) earned.add('streak-3');
  if (p.streak.count >= 7) earned.add('streak-7');
  if (p.perfectQuizzes >= 1) earned.add('perfect-quiz');
  if (Object.keys(p.examsPassed).length >= 1) earned.add('chapter-cleared');
  if (Object.keys(p.bossesPassed).length >= 1) earned.add('world-cleared');
  if (p.reviewCleared >= 10) earned.add('review-hero');
  return [...earned].sort();
}
