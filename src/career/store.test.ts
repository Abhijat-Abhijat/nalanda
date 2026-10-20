// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCareer } from './store';
import { emptyCareer, CAREER_KEY } from './schema';
import { dayKey, addDays } from '../engine/streak';

describe('career store', () => {
  beforeEach(() => { localStorage.clear(); useCareer.getState().resetCareer(); });
  it('persists actions to localStorage', () => {
    useCareer.getState().setPath('backend-senior');
    expect(JSON.parse(localStorage.getItem(CAREER_KEY)!).pathId).toBe('backend-senior');
  });
  it('logs activity for today', () => {
    useCareer.getState().log('interview');
    expect(useCareer.getState().data.activity).toEqual([{ day: dayKey(new Date()), kind: 'interview' }]);
  });
  it('schedules deck cards with review intervals', () => {
    const today = dayKey(new Date());
    useCareer.getState().reviewCard('sd-1', true);
    expect(useCareer.getState().data.deck[0]).toEqual({ id: 'sd-1', box: 2, due: addDays(today, 3) });
    useCareer.getState().reviewCard('sd-1', false);
    expect(useCareer.getState().data.deck[0]).toEqual({ id: 'sd-1', box: 1, due: addDays(today, 1) });
  });
  it('upserts and removes applications', () => {
    const a = { id: 'a1', company: 'Atlassian', role: 'Senior SWE', stage: 'applied' as const, applied: '2026-10-01', next: null, notes: '', updated: '2026-10-01' };
    useCareer.getState().upsertApplication(a);
    useCareer.getState().upsertApplication({ ...a, stage: 'screen' });
    expect(useCareer.getState().data.applications.map((x) => x.stage)).toEqual(['screen']);
    useCareer.getState().removeApplication('a1');
    expect(useCareer.getState().data.applications).toEqual([]);
  });
  it('rejects invalid imports without changing data', () => {
    useCareer.getState().setPath('x');
    expect(useCareer.getState().importCareer('{}')).toBe(false);
    expect(useCareer.getState().data.pathId).toBe('x');
  });
  it('refuses changes the schema would reject, keeping saved data loadable', () => {
    const a = { id: 'a1', company: 'X', role: '', stage: 'applied' as const, applied: '2026-10-01', next: '20255-01-01', notes: '', updated: '2026-10-01' };
    useCareer.getState().upsertApplication(a);
    expect(useCareer.getState().data.applications).toEqual([]);
    expect(useCareer.getState().error).toMatch(/could not be saved/);
    expect(JSON.parse(localStorage.getItem(CAREER_KEY)!).applications).toEqual([]);
  });
  it('flags failed saves', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    useCareer.getState().setPath('y');
    expect(useCareer.getState().saveFailed).toBe(true);
    spy.mockRestore();
    useCareer.getState().setPath('z');
    expect(useCareer.getState().saveFailed).toBe(false);
  });
  it('reset returns defaults', () => {
    useCareer.getState().setPath('x');
    useCareer.getState().resetCareer();
    expect(useCareer.getState().data).toEqual(emptyCareer());
  });
});
