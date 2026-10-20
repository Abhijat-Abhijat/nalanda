import { describe, it, expect } from 'vitest';
import { buildSession } from './session';
import { TEMPLATES } from './templates';
import { PROMPTS } from './prompts';
import { TEMPLATE_IDS } from '../paths';
import type { Task } from '../../schema';

const choice = (id: string) => ({ kind: 'choice', id, conceptId: 'c', prompt: 'p', options: ['a', 'b'], answer: 0, explain: '' }) as unknown as Task;
const code = (id: string) => ({ kind: 'js-code', id }) as unknown as Task;
const pools = { coding: Array.from({ length: 10 }, (_, i) => code(`c${i}`)), concepts: Array.from({ length: 30 }, (_, i) => choice(`q${i}`)) };

describe('buildSession', () => {
  it('defines one template per template id', () => {
    expect(TEMPLATES.map((t) => t.id).sort()).toEqual([...TEMPLATE_IDS].sort());
  });
  it('gives every prompt a four-line rubric and unique ids', () => {
    const all = [...PROMPTS.design, ...PROMPTS.behavioural];
    for (const p of all) expect(p.rubric).toHaveLength(4);
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
  });
  it('builds sections in template order and is deterministic per seed', () => {
    const t = TEMPLATES.find((x) => x.id === 'onsite-senior')!;
    const s1 = buildSession(t, 123, pools);
    expect(s1.items.map((i) => i.kind)).toEqual(['coding', 'coding', ...Array(10).fill('concepts'), 'design', 'behavioural', 'behavioural']);
    expect(buildSession(t, 123, pools)).toEqual(s1);
    expect(buildSession(t, 124, pools)).not.toEqual(s1);
    expect(s1.minutes).toBe(120);
  });
  it('uses fewer items when a pool is small', () => {
    const t = TEMPLATES.find((x) => x.id === 'phone-screen')!;
    expect(buildSession(t, 1, { coding: [], concepts: pools.concepts.slice(0, 3) }).items.map((i) => i.kind)).toEqual(['concepts', 'concepts', 'concepts']);
  });
});
