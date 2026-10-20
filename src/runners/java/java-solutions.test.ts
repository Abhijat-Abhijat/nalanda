import { describe, it, expect } from 'vitest';
import { worlds } from '../../content/index';
import type { JsEx, Task } from '../../schema';
import { javaBatch, hasJavac } from './testJava';

const WORLDS = ['algorithms', 'cs-fundamentals', 'java'];
// Flipped to true by the final content task, once every exercise in WORLDS has a Java solution.
const REQUIRE_ALL = true;

// One javac run per chapter keeps the suite fast.
const groups = (worldId: string) => {
  const w = worlds.find((x) => x.id === worldId)!;
  const raw: { name: string; tasks: Task[] }[] = [...w.chapters.map((c) => ({ name: c.id, tasks: c.lessons.map((l) => l.exercise) })), { name: `${worldId}-boss`, tasks: w.boss.steps }];
  return raw.map((g) => ({ name: g.name, tasks: g.tasks.filter((t): t is JsEx => t.kind === 'js-code') }));
};

describe.skipIf(!hasJavac)('Java reference solutions', { timeout: 1_800_000 }, () => {
  for (const wid of WORLDS) {
    for (const g of groups(wid)) {
      it(`${g.name}: every java.solution passes`, () => {
        const units = g.tasks.filter((t) => t.java).map((t) => ({ id: t.id, learner: t.java!.solution, fnName: t.fnName, sig: t.sig!, cases: t.cases, jsStarter: t.starter }));
        if (!units.length) return;
        const res = javaBatch(units);
        for (const u of units) {
          const r = res.get(u.id)!;
          expect([u.id, 'compileError' in r ? r.compileError : null, 'compileError' in r ? [] : r.results.filter((x) => !x.ok)]).toEqual([u.id, null, []]);
        }
      });
    }
    it(`${wid}: every code exercise offers Java`, () => {
      const missing = groups(wid).flatMap((g) => g.tasks).filter((t) => !t.langs?.includes('java')).map((t) => t.id);
      if (REQUIRE_ALL) expect(missing).toEqual([]);
    });
  }
});
