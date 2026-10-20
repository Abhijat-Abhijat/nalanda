import { z } from 'zod';
import { emptyProgress } from './progress';
import type { Progress } from './types';

export const STORAGE_KEY = 'nalanda.progress.v1';
export type LoadStatus = 'ok' | 'empty' | 'corrupt' | 'newer' | 'unavailable';

const Review = z.object({ conceptId: z.string(), box: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), due: z.string() });
export const ProgressSchema = z.object({
  version: z.literal(1),
  xp: z.number(),
  streak: z.object({ count: z.number(), last: z.string().nullable() }),
  lessonsDone: z.record(z.string(), z.literal(true)),
  attempts: z.record(z.string(), z.number()),
  examsPassed: z.record(z.string(), z.number()),
  bossesPassed: z.record(z.string(), z.literal(true)),
  history: z.record(z.string(), z.array(z.boolean())),
  review: z.array(Review),
  badges: z.array(z.string()),
  perfectQuizzes: z.number(),
  reviewCleared: z.number(),
});

export function loadProgress(storage: Pick<Storage, 'getItem'>): { progress: Progress; status: LoadStatus; raw: string | null } {
  let raw: string | null;
  try { raw = storage.getItem(STORAGE_KEY); } catch { return { progress: emptyProgress(), status: 'unavailable', raw: null }; }
  if (raw === null) return { progress: emptyProgress(), status: 'empty', raw: null };
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return { progress: emptyProgress(), status: 'corrupt', raw }; }
  const v = (data as { version?: unknown } | null)?.version;
  if (typeof v === 'number' && v > 1) return { progress: emptyProgress(), status: 'newer', raw };
  const parsed = ProgressSchema.safeParse(data);
  if (!parsed.success) return { progress: emptyProgress(), status: 'corrupt', raw };
  return { progress: parsed.data, status: 'ok', raw };
}

export function saveProgress(storage: Pick<Storage, 'setItem'>, p: Progress): boolean {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(p)); return true; } catch { return false; }
}

export const exportJson = (p: Progress): string => JSON.stringify(p, null, 2);

export function parseImport(text: string): Progress | null {
  try {
    const r = ProgressSchema.safeParse(JSON.parse(text));
    return r.success ? r.data : null;
  } catch { return null; }
}
