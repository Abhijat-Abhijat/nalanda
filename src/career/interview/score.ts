import type { RoundResult } from '../schema';
import type { Session } from './session';
import type { SectionKind } from './templates';

export type Answers = Record<number, { correct?: boolean; selfScore?: number }>;
const WEIGHT: Record<SectionKind, number> = { coding: 40, concepts: 20, design: 25, behavioural: 15 };
const ORDER: SectionKind[] = ['coding', 'concepts', 'design', 'behavioural'];
const TIPS: Record<SectionKind, string> = {
  coding: 'Coding was the weakest area: practise two problems a day from the Algorithms world, timing yourself to 20 minutes each.',
  concepts: 'Concept questions need work: clear your Review pond daily and redo chapter exams you scored under 80% on.',
  design: 'System design needs depth: work through the System design case studies and state requirements and trade-offs out loud.',
  behavioural: 'Behavioural answers need structure: prepare six stories using situation, task, action, result, each with a measured result.',
};

const ratio = (s: RoundResult['sections'][number]) => (s.selfScore === null ? (s.total ? s.correct / s.total : 0) : s.selfScore / 4);

export function scoreSession(s: Session, answers: Answers): { score: number; sections: RoundResult['sections'] } {
  const sections: RoundResult['sections'] = [];
  let weighted = 0, weights = 0;
  for (const kind of ORDER) {
    const idx = s.items.flatMap((it, i) => (it.kind === kind ? [i] : []));
    if (!idx.length) continue;
    if (kind === 'coding' || kind === 'concepts') {
      const correct = idx.filter((i) => answers[i]?.correct === true).length;
      sections.push({ kind, correct, total: idx.length, selfScore: null });
      weighted += (correct / idx.length) * WEIGHT[kind];
    } else {
      const avg = idx.reduce((n, i) => n + (answers[i]?.selfScore ?? 0), 0) / idx.length;
      sections.push({ kind, correct: 0, total: idx.length, selfScore: Math.round(avg) });
      weighted += (avg / 4) * WEIGHT[kind];
    }
    weights += WEIGHT[kind];
  }
  return { score: weights ? Math.round((weighted / weights) * 100) : 0, sections };
}

export function debrief(sections: RoundResult['sections']): string[] {
  const lines = sections.filter((s) => ratio(s) < 0.6).map((s) => TIPS[s.kind]);
  const w = sections.reduce((n, s) => n + WEIGHT[s.kind], 0);
  const r = w ? sections.reduce((n, s) => n + ratio(s) * WEIGHT[s.kind], 0) / w : 0;
  if (r >= 0.7) lines.push('Pass-level performance for this round. Repeat with new questions to confirm.');
  return lines;
}
