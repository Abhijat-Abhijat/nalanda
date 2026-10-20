import { describe, it, expect } from 'vitest';
import { worlds } from '../../content/index';
import type { JsEx, Task } from '../../schema';
import { pyRunCases } from './testPyodide';

const PY_WORLDS = ['algorithms', 'cs-fundamentals'];
// Flipped to true by the final content task, once every exercise in PY_WORLDS has a Python solution.
const REQUIRE_ALL = true;

const codeTasks = (worldId: string): JsEx[] => {
  const w = worlds.find((x) => x.id === worldId)!;
  const tasks: Task[] = [...w.chapters.flatMap((c) => c.lessons.map((l) => l.exercise)), ...w.boss.steps];
  return tasks.filter((t): t is JsEx => t.kind === 'js-code');
};

describe('python reference solutions', { timeout: 600_000 }, () => {
  for (const wid of PY_WORLDS) {
    it(`${wid}: every py.solution passes its cases`, async () => {
      for (const t of codeTasks(wid).filter((x) => x.py)) {
        const out = await pyRunCases(t.py!.solution, t.fnName, t.cases, t.starter);
        expect([t.id, out.passed, out.error ?? null, out.results.filter((r) => !r.ok)]).toEqual([t.id, true, null, []]);
      }
    });
    it(`${wid}: every code exercise offers Python`, () => {
      const missing = codeTasks(wid).filter((t) => !t.langs?.includes('py')).map((t) => t.id);
      if (REQUIRE_ALL) expect(missing).toEqual([]);
    });
  }
});
