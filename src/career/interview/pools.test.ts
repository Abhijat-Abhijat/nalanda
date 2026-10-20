import { describe, it, expect } from 'vitest';
import { poolsFromWorlds, CODING_WORLDS, CONCEPT_WORLDS } from './pools';
import { worlds } from '../../content/index';

describe('interview pools', () => {
  it('collects coding exercises and choice questions from the configured worlds', () => {
    const p = poolsFromWorlds(worlds.filter((w) => [...CODING_WORLDS, ...CONCEPT_WORLDS].includes(w.id)));
    expect(p.coding.length).toBeGreaterThanOrEqual(50);
    expect(p.coding.every((t) => t.kind === 'js-code')).toBe(true);
    expect(p.concepts.length).toBeGreaterThanOrEqual(200);
    expect(p.concepts.every((t) => t.kind === 'choice')).toBe(true);
  });
  it('returns empty pools for no worlds', () => {
    expect(poolsFromWorlds([])).toEqual({ coding: [], concepts: [] });
  });
});
