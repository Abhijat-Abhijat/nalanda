import { describe, it, expect } from 'vitest';
import { PATHS, TEMPLATE_IDS, DECK_ROLES } from './paths';
import { catalog } from '../content/catalog';
import { projects } from '../content/projects';

describe('career paths', () => {
  it('has six paths with unique ids', () => {
    expect(PATHS.map((p) => p.id)).toEqual(['backend-senior', 'frontend-senior', 'fullstack-mid', 'sre-devops', 'ai-engineer', 'staff-generalist']);
  });
  it('references only real worlds, chapters, projects, templates, and deck roles', () => {
    const chapters = new Set(catalog.flatMap((w) => w.chapters.map((c) => `${w.id}/${c.id}`)));
    const worlds = new Set(catalog.map((w) => w.id));
    const projectIds = new Set(projects.map((p) => p.id));
    for (const p of PATHS) for (const st of p.stages) for (const s of st.steps) {
      if (s.kind === 'chapter') expect([p.id, `${s.world}/${s.chapter}`, chapters.has(`${s.world}/${s.chapter}`)]).toEqual([p.id, `${s.world}/${s.chapter}`, true]);
      if (s.kind === 'world') expect(worlds.has(s.world)).toBe(true);
      if (s.kind === 'project') expect([s.project, projectIds.has(s.project)]).toEqual([s.project, true]);
      if (s.kind === 'interview') expect((TEMPLATE_IDS as readonly string[]).includes(s.template)).toBe(true);
      if (s.kind === 'deck') expect((DECK_ROLES as readonly string[]).includes(s.role)).toBe(true);
    }
  });
  it('ends every path with an interview stage', () => {
    for (const p of PATHS) expect(p.stages.at(-1)!.steps.some((s) => s.kind === 'interview')).toBe(true);
  });
});
