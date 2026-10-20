import { describe, it, expect } from 'vitest';
import { worlds } from './index';
import { WorldSchema } from '../schema';
import { validateWorlds } from './validate';
import { solutionPasses } from '../exercises/solutions';

describe('content', () => {
  it('has at least one world', () => {
    expect(worlds.length).toBeGreaterThan(0);
  });
  it('parses against the schema and passes cross-reference checks', () => {
    worlds.forEach((w) => expect(() => WorldSchema.parse(w)).not.toThrow());
    expect(validateWorlds(worlds)).toEqual([]);
  });
  it('every lesson has a story with a narrative and an analogy', () => {
    for (const w of worlds) for (const c of w.chapters) for (const l of c.lessons) {
      const kinds = new Set(l.story.map((b) => b.t));
      expect([w.id, c.id, l.id, ['text', 'analogy'].every((k) => kinds.has(k as never))]).toEqual([w.id, c.id, l.id, true]);
    }
  });
  it('every lesson reads like a tutorial: examples, a reference table or syntax, and interview questions', () => {
    for (const w of worlds) for (const c of w.chapters) for (const l of c.lessons) {
      const blocks = l.layers.flatMap((x) => x.blocks);
      const has = (t: string) => blocks.some((b) => b.t === t);
      const examples = blocks.filter((b) => b.t === 'example').length;
      expect([w.id, c.id, l.id, examples >= 2, has('syntax') || has('table'), has('faq')]).toEqual([w.id, c.id, l.id, true, true, true]);
    }
  });
  it('every chapter exam covers every lesson concept', () => {
    for (const w of worlds) for (const c of w.chapters) {
      const covered = new Set(c.exam.map((q) => q.conceptId));
      for (const l of c.lessons) for (const id of l.conceptIds) expect([c.id, id, covered.has(id)]).toEqual([c.id, id, true]);
    }
  });
  it('every chapter exam has at least two order or fill questions', () => {
    for (const w of worlds) for (const c of w.chapters) {
      expect([c.id, c.exam.filter((q) => q.kind === 'order' || q.kind === 'fill').length >= 2]).toEqual([c.id, true]);
    }
  });
  it('every exercise, quiz, exam question, and boss step passes its reference solution', async () => {
    for (const w of worlds) {
      const tasks = [
        ...w.chapters.flatMap((c) => [...c.lessons.map((l) => l.exercise), ...c.lessons.flatMap((l) => l.quiz), ...c.exam]),
        ...w.boss.steps,
      ];
      for (const t of tasks) expect([t.id, await solutionPasses(t)]).toEqual([t.id, true]);
    }
  }, 120_000); // runs every reference solution in the catalogue; grows with content
});
