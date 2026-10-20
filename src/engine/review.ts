import { addDays } from './streak';
import type { ReviewItem } from './types';

export const INTERVALS = [1, 3, 7, 21] as const;

export function addMiss(items: ReviewItem[], conceptId: string, today: string): ReviewItem[] {
  const rest = items.filter((i) => i.conceptId !== conceptId);
  return [...rest, { conceptId, box: 1, due: addDays(today, INTERVALS[0]) }];
}

export function answerReview(
  items: ReviewItem[], conceptId: string, correct: boolean, today: string,
): { items: ReviewItem[]; cleared: boolean } {
  const item = items.find((i) => i.conceptId === conceptId);
  if (!item) return { items, cleared: false };
  const rest = items.filter((i) => i !== item);
  if (!correct) return { items: [...rest, { conceptId, box: 1, due: addDays(today, INTERVALS[0]) }], cleared: false };
  if (item.box === 4) return { items: rest, cleared: true };
  const box = (item.box + 1) as 2 | 3 | 4;
  return { items: [...rest, { conceptId, box, due: addDays(today, INTERVALS[item.box]) }], cleared: false };
}

export const dueItems = (items: ReviewItem[], today: string): ReviewItem[] => items.filter((i) => i.due <= today);
