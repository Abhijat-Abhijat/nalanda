export const XP = { lesson: 50, firstTry: 20, quizCorrect: 5, exam: 150, boss: 400 } as const;

export const cumulativeXpForLevel = (level: number): number => 50 * (level - 1) * level;

export function levelForXp(xp: number): { level: number; intoLevel: number; needed: number } {
  const safe = Math.max(0, xp);
  let level = 1;
  while (cumulativeXpForLevel(level + 1) <= safe) level++;
  return { level, intoLevel: safe - cumulativeXpForLevel(level), needed: 100 * level };
}
