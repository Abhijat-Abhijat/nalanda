import { describe, it, expect } from 'vitest';
import { emptyProgress, applyAnswer, applyAttempt, applyCompleteLesson, applyExamPass, applyBossPass, applyReview } from './progress';
import { evaluateBadges } from './badges';

const T1 = '2026-10-02';

describe('applyAnswer', () => {
  it('records history and adds a miss to the pond', () => {
    const p = applyAnswer(emptyProgress(), 'c1', false, T1);
    expect(p.history.c1).toEqual([false]);
    expect(p.review).toEqual([{ conceptId: 'c1', box: 1, due: '2026-10-03' }]);
  });
  it('a correct answer for a concept in the pond advances it and counts cleared items', () => {
    let p = applyAnswer(emptyProgress(), 'c1', false, T1);
    p = { ...p, review: [{ conceptId: 'c1', box: 4, due: T1 }] };
    p = applyAnswer(p, 'c1', true, T1);
    expect(p.review).toEqual([]);
    expect(p.reviewCleared).toBe(1);
  });
  it('a correct answer for a concept not in the pond leaves the pond empty', () => {
    expect(applyAnswer(emptyProgress(), 'c1', true, T1).review).toEqual([]);
  });
});

describe('review pond timing', () => {
  it('does not advance a concept that is not due yet', () => {
    let p = applyAnswer(emptyProgress(), 'c1', false, T1);
    p = applyAnswer(p, 'c1', true, T1);
    expect(p.review).toEqual([{ conceptId: 'c1', box: 1, due: '2026-10-03' }]);
    expect(p.reviewCleared).toBe(0);
  });
  it('advances a concept once it is due', () => {
    let p = applyAnswer(emptyProgress(), 'c1', false, T1);
    p = applyAnswer(p, 'c1', true, '2026-10-03');
    expect(p.review).toEqual([{ conceptId: 'c1', box: 2, due: '2026-10-06' }]);
  });
  it('a review answer keeps the streak alive', () => {
    let p = applyAnswer(emptyProgress(), 'c1', false, T1);
    p = applyReview(p, 'c1', true, '2026-10-03');
    expect(p.streak).toEqual({ count: 1, last: '2026-10-03' });
    p = applyReview(p, 'c1', true, '2026-10-04');
    expect(p.streak.count).toBe(2);
  });
});

describe('applyCompleteLesson', () => {
  const r = { exerciseFirstTry: true, quizCorrect: 3, quizTotal: 3 };
  it('awards lesson, first-try, and quiz xp once', () => {
    const p = applyCompleteLesson(emptyProgress(), 'w/c/l', r, T1);
    expect(p.xp).toBe(50 + 20 + 15);
    expect(p.lessonsDone['w/c/l']).toBe(true);
    expect(p.streak).toEqual({ count: 1, last: T1 });
    expect(p.perfectQuizzes).toBe(1);
    const again = applyCompleteLesson(p, 'w/c/l', r, '2026-10-03');
    expect(again.xp).toBe(p.xp);
    expect(again.streak.count).toBe(2);
  });
  it('skips the first-try bonus when not first try', () => {
    const p = applyCompleteLesson(emptyProgress(), 'w/c/l', { exerciseFirstTry: false, quizCorrect: 2, quizTotal: 3 }, T1);
    expect(p.xp).toBe(50 + 10);
    expect(p.perfectQuizzes).toBe(0);
  });
});

describe('exam, boss, attempts, badges', () => {
  it('awards exam xp on the first pass only and keeps the best score', () => {
    let p = applyExamPass(emptyProgress(), 'w/c', 80, T1);
    expect(p.xp).toBe(150);
    p = applyExamPass(p, 'w/c', 100, T1);
    expect(p.xp).toBe(150);
    expect(p.examsPassed['w/c']).toBe(100);
  });
  it('awards boss xp once', () => {
    let p = applyBossPass(emptyProgress(), 'w', T1);
    p = applyBossPass(p, 'w', T1);
    expect(p.xp).toBe(400);
  });
  it('counts attempts per exercise', () => {
    let p = applyAttempt(emptyProgress(), 'ex1');
    p = applyAttempt(p, 'ex1');
    expect(p.attempts.ex1).toBe(2);
  });
  it('earns badges from progress', () => {
    let p = applyCompleteLesson(emptyProgress(), 'w/c/l', { exerciseFirstTry: true, quizCorrect: 3, quizTotal: 3 }, T1);
    p = applyExamPass(p, 'w/c', 90, T1);
    p = applyBossPass(p, 'w', T1);
    expect(p.badges).toEqual(['chapter-cleared', 'first-lesson', 'perfect-quiz', 'world-cleared']);
    const streaky = { ...emptyProgress(), streak: { count: 7, last: T1 } };
    expect(evaluateBadges(streaky)).toEqual(['streak-3', 'streak-7']);
  });
});
