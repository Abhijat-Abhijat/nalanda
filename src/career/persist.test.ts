import { describe, it, expect } from 'vitest';
import { emptyCareer, CAREER_KEY } from './schema';
import { loadCareer, saveCareer, exportCareer, parseCareerImport } from './persist';

const mem = (init: Record<string, string> = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe('career persistence', () => {
  it('returns defaults when empty', () => {
    expect(loadCareer(mem())).toEqual({ data: emptyCareer(), status: 'empty', raw: null });
  });
  it('round-trips through save and load', () => {
    const s = mem();
    expect(saveCareer(s, { ...emptyCareer(), pathId: 'backend-senior' })).toBe(true);
    expect(loadCareer(s).data.pathId).toBe('backend-senior');
  });
  it('keeps corrupt data untouched and reports it', () => {
    const s = mem({ [CAREER_KEY]: '{"version":1,"goals":"nope"}' });
    const r = loadCareer(s);
    expect(r.status).toBe('corrupt');
    expect(r.raw).toBe('{"version":1,"goals":"nope"}');
    expect(r.data).toEqual(emptyCareer());
  });
  it('reports unavailable storage', () => {
    expect(loadCareer({ getItem: () => { throw new Error('denied'); } }).status).toBe('unavailable');
  });
  it('imports only valid exports', () => {
    expect(parseCareerImport('nope')).toBeNull();
    expect(parseCareerImport(exportCareer(emptyCareer()))).toEqual(emptyCareer());
  });
  it('rejects oversized notes', () => {
    const bad = { ...emptyCareer(), applications: [{ id: 'a', company: 'X', role: 'Y', stage: 'applied', applied: null, next: null, notes: 'n'.repeat(5001), updated: '2026-10-16' }] };
    expect(parseCareerImport(JSON.stringify(bad))).toBeNull();
  });
});
