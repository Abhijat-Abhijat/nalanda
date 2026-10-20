import { describe, it, expect } from 'vitest';
import { WorldSchema, type World } from './schema';
import { validateWorlds } from './content/validate';

const q = (id: string, conceptId = 'c1') => ({
  kind: 'choice' as const, id, conceptId, prompt: 'P?', options: ['a', 'b'], answer: 0, explain: 'because',
});
const lesson = (id: string, quiz = [q(`${id}-q1`), q(`${id}-q2`), q(`${id}-q3`)]) => ({
  id, title: 'T', conceptIds: ['c1'],
  story: [{ t: 'text' as const, md: 'once' }],
  layers: [0, 1, 2].map((i) => ({ title: `L${i}`, blocks: [{ t: 'text' as const, md: 'x' }] })),
  exercise: q(`${id}-ex`), quiz,
});
const world = (): World => WorldSchema.parse({
  id: 'w', title: 'W', hue: '#000', tagline: 't', intro: [{ t: 'text', md: 'hi' }],
  chapters: [{
    id: 'ch', title: 'C', summary: 's', lessons: [lesson('l1')],
    exam: Array.from({ length: 8 }, (_, i) => q(`e${i}`)),
  }],
  boss: { id: 'boss', title: 'B', steps: [q('boss-1')] },
});

describe('schema', () => {
  it('accepts a minimal valid world', () => {
    expect(validateWorlds([world()])).toEqual([]);
  });
  it('rejects a lesson with fewer than 3 quiz questions', () => {
    const w = JSON.parse(JSON.stringify(world()));
    w.chapters[0].lessons[0].quiz = [q('a'), q('b')];
    expect(() => WorldSchema.parse(w)).toThrow();
  });
  it('reports duplicate ids', () => {
    const w = world();
    w.chapters[0].lessons[0].quiz[0].id = 'e0';
    expect(validateWorlds([w]).some((e) => e.includes('duplicate id'))).toBe(true);
  });
  it('reports a choice answer out of range', () => {
    const w = world();
    (w.chapters[0].exam[0] as { answer: number }).answer = 5;
    expect(validateWorlds([w]).some((e) => e.includes('answer index'))).toBe(true);
  });
  it('reports a quiz concept missing from the lesson conceptIds', () => {
    const w = world();
    w.chapters[0].lessons[0].quiz[0].conceptId = 'nope';
    expect(validateWorlds([w]).some((e) => e.includes('conceptId'))).toBe(true);
  });
  it('reports a fill prompt without a blank', () => {
    const w = world();
    w.chapters[0].exam[0] = { kind: 'fill', id: 'f1', conceptId: 'c1', prompt: 'no blank', answers: ['x'], explain: 'e' };
    expect(validateWorlds([w]).some((e) => e.includes('blank'))).toBe(true);
  });
});
