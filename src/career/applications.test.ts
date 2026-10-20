import { describe, it, expect } from 'vitest';
import { funnel, upcoming } from './applications';
import type { Application } from './schema';

const app = (id: string, stage: Application['stage'], next: string | null = null): Application => ({ id, company: id, role: 'SWE', stage, applied: '2026-10-01', next, notes: '', updated: '2026-10-01' });

describe('applications', () => {
  it('computes a funnel', () => {
    const apps = [app('a', 'wishlist'), app('b', 'applied'), app('c', 'screen'), app('d', 'onsite'), app('e', 'offer'), app('f', 'rejected')];
    expect(funnel(apps)).toEqual({ applied: 5, screen: 3, onsite: 2, offer: 1, responseRate: 60 });
    expect(funnel([])).toEqual({ applied: 0, screen: 0, onsite: 0, offer: 0, responseRate: 0 });
  });
  it('lists upcoming dates in order', () => {
    const apps = [app('a', 'screen', '2026-10-20'), app('b', 'onsite', '2026-10-17'), app('c', 'applied', '2026-10-01'), app('d', 'applied')];
    expect(upcoming(apps, '2026-10-16').map((a) => a.id)).toEqual(['b', 'a']);
  });
});
