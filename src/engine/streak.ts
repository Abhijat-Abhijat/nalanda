export type Streak = { count: number; last: string | null };

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const toUtc = (k: string): number => {
  const [y, m, d] = k.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
export const dayDiff = (a: string, b: string): number => Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
export const addDays = (key: string, n: number): string => {
  const t = new Date(toUtc(key) + n * 86_400_000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
};

export function nextStreak(prev: Streak, today: string): Streak {
  if (prev.last === null) return { count: 1, last: today };
  const diff = dayDiff(prev.last, today);
  if (diff <= 0) return prev;
  if (diff === 1) return { count: prev.count + 1, last: today };
  return { count: 1, last: today };
}

export function currentStreak(s: Streak, today: string): number {
  if (s.last === null) return 0;
  return dayDiff(s.last, today) <= 1 ? s.count : 0;
}
