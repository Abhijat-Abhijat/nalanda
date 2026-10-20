import type { Question } from '../schema';

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const drawExam = (pool: Question[], n: number, rng: () => number = Math.random): Question[] =>
  shuffle(pool, rng).slice(0, Math.min(n, pool.length));

export function scoreExam(results: boolean[]) {
  const total = results.length;
  const correct = results.filter(Boolean).length;
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, pct, passed: total > 0 && pct >= 70 };
}

export function recordHistory(history: Record<string, boolean[]>, conceptId: string, correct: boolean) {
  return { ...history, [conceptId]: [...(history[conceptId] ?? []), correct].slice(-5) };
}

export function mastery(history: Record<string, boolean[]>, conceptId: string): number {
  const h = history[conceptId] ?? [];
  return h.length === 0 ? 0 : Math.round((h.filter(Boolean).length / h.length) * 100);
}
