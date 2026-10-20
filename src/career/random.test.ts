import { describe, it, expect } from 'vitest';
import { hashString, mulberry32, pickN, newId } from './random';

describe('random', () => {
  it('hashes with FNV-1a', () => {
    expect(hashString('')).toBe(2166136261);
    expect(hashString('a')).toBe(3826002220);
  });
  it('is deterministic per seed and stays in range', () => {
    const a = mulberry32(42), b = mulberry32(42);
    const xs = [a(), a(), a()];
    expect(xs).toEqual([b(), b(), b()]);
    for (const x of xs) expect(x >= 0 && x < 1).toBe(true);
  });
  it('picks n distinct items deterministically without mutating input', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const p1 = pickN(items, 3, mulberry32(7));
    expect(p1).toEqual(pickN(items, 3, mulberry32(7)));
    expect(new Set(p1).size).toBe(3);
    expect(pickN(items, 20, mulberry32(1))).toHaveLength(8);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it('creates unique ids', () => {
    expect(newId()).not.toBe(newId());
  });
});
