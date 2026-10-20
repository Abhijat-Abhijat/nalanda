import { describe, it, expect } from 'vitest';
import { projects, TRACKS } from './projects';
import { catalog } from './catalog';

describe('portfolio projects', () => {
  it('has exactly 30 projects with unique ids', () => {
    expect(projects).toHaveLength(30);
    expect(new Set(projects.map((p) => p.id)).size).toBe(30);
  });
  it('covers every track and links only to existing worlds', () => {
    const worlds = new Set(catalog.map((w) => w.id));
    for (const t of TRACKS) expect(projects.some((p) => p.track === t)).toBe(true);
    for (const p of projects) for (const w of p.worlds) expect([p.id, w, worlds.has(w)]).toEqual([p.id, w, true]);
  });
  it('gives every project a plan, evidence, and a resume bullet with placeholders to fill', () => {
    for (const p of projects) {
      expect([p.id, p.mvp.length >= 3, p.proof.length >= 2, p.interview.length >= 2, /\[[^\]]+\]/.test(p.bullet)]).toEqual([p.id, true, true, true, true]);
    }
  });
});
