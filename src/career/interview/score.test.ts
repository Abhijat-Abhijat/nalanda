import { describe, it, expect } from 'vitest';
import { scoreSession, debrief } from './score';
import type { Session } from './session';
import { PROMPTS } from './prompts';

const t = { kind: 'choice', id: 'x' } as never;
const session: Session = {
  templateId: 'onsite-senior', seed: 1, minutes: 120,
  items: [{ kind: 'coding', task: t }, { kind: 'coding', task: t }, { kind: 'concepts', task: t }, { kind: 'concepts', task: t }, { kind: 'design', prompt: PROMPTS.design[0] }, { kind: 'behavioural', prompt: PROMPTS.behavioural[0] }],
};

describe('scoreSession', () => {
  it('weights sections and treats unanswered items as zero', () => {
    const r = scoreSession(session, { 0: { correct: true }, 2: { correct: true }, 3: { correct: true }, 4: { selfScore: 2 }, 5: { selfScore: 4 } });
    // coding 0.5×40=20; concepts 1×20=20; design 0.5×25=12.5; behavioural 1×15=15 → 67.5
    expect(r.score).toBe(68);
    expect(r.sections).toEqual([
      { kind: 'coding', correct: 1, total: 2, selfScore: null },
      { kind: 'concepts', correct: 2, total: 2, selfScore: null },
      { kind: 'design', correct: 0, total: 1, selfScore: 2 },
      { kind: 'behavioural', correct: 0, total: 1, selfScore: 4 },
    ]);
  });
  it('normalises weights when only some sections exist', () => {
    const s: Session = { ...session, items: session.items.slice(0, 2) };
    expect(scoreSession(s, { 0: { correct: true }, 1: { correct: true } }).score).toBe(100);
    expect(scoreSession(s, {}).score).toBe(0);
  });
});

describe('debrief', () => {
  it('gives tips only for weak sections', () => {
    const lines = debrief([{ kind: 'coding', correct: 0, total: 2, selfScore: null }, { kind: 'behavioural', correct: 0, total: 1, selfScore: 4 }]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/Coding/);
  });
  it('adds a pass line at 70% or more', () => {
    expect(debrief([{ kind: 'coding', correct: 2, total: 2, selfScore: null }]).at(-1)).toMatch(/Pass-level/);
  });
});
