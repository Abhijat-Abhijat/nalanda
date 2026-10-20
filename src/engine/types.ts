import type { Streak } from './streak';

export type ReviewItem = { conceptId: string; box: 1 | 2 | 3 | 4; due: string };

export type Progress = {
  version: 1;
  xp: number;
  streak: Streak;
  lessonsDone: Record<string, true>;
  attempts: Record<string, number>;
  examsPassed: Record<string, number>;
  bossesPassed: Record<string, true>;
  history: Record<string, boolean[]>;
  review: ReviewItem[];
  badges: string[];
  perfectQuizzes: number;
  reviewCleared: number;
};
