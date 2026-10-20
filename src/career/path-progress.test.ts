import { describe, it, expect } from 'vitest';
import { pathProgress, type CareerPath } from './paths';
import { emptyProgress } from '../engine/progress';
import { emptyCareer } from './schema';

const path: CareerPath = {
  id: 't', title: 'T', role: 'R', level: 'Mid', summary: '',
  stages: [
    { title: 'A', steps: [{ kind: 'chapter', world: 'sql', chapter: 'filtering' }, { kind: 'project', project: 'raft-kv' }] },
    { title: 'B', steps: [{ kind: 'interview', template: 'coding-45', times: 2 }, { kind: 'deck', role: 'backend' }] },
  ],
};
const deck = { backend: ['b1', 'b2'] };

describe('pathProgress', () => {
  it('starts at zero with the first step next', () => {
    const r = pathProgress(path, { progress: emptyProgress(), career: emptyCareer(), deckCardsByRole: deck });
    expect([r.done, r.total, r.pct]).toEqual([0, 4, 0]);
    expect(r.next).toEqual({ stage: 0, step: path.stages[0].steps[0] });
  });
  it('counts chapters, shipped projects, passing rounds, and mastered decks', () => {
    const progress = { ...emptyProgress(), examsPassed: { 'sql/filtering': 80 } };
    const career = {
      ...emptyCareer(),
      projects: { 'raft-kv': 'shipped' as const },
      interviews: [
        { id: '1', template: 'coding-45', seed: 1, day: '2026-10-01', score: 75, sections: [] },
        { id: '2', template: 'coding-45', seed: 2, day: '2026-10-02', score: 60, sections: [] },
        { id: '3', template: 'coding-45', seed: 3, day: '2026-10-03', score: 90, sections: [] },
      ],
      deck: [{ id: 'b1', box: 3 as const, due: '2026-11-01' }, { id: 'b2', box: 2 as const, due: '2026-10-20' }],
    };
    const r = pathProgress(path, { progress, career, deckCardsByRole: deck });
    expect([r.done, r.pct]).toEqual([3, 75]);
    expect(r.next).toEqual({ stage: 1, step: path.stages[1].steps[1] });
    expect(r.stages).toEqual([{ done: 2, total: 2 }, { done: 1, total: 2 }]);
  });
  it('handles an empty path', () => {
    const r = pathProgress({ ...path, stages: [] }, { progress: emptyProgress(), career: emptyCareer(), deckCardsByRole: deck });
    expect([r.total, r.pct, r.next]).toEqual([0, 0, null]);
  });
});
