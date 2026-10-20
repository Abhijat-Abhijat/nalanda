import { describe, it, expect } from 'vitest';
import { DECK_CARDS } from './deck-data';
import { dueCards, deckStats } from './deck';
import { DECK_ROLES } from './paths';

describe('interview deck', () => {
  it('has at least 15 cards per role with unique ids and real answers', () => {
    for (const r of DECK_ROLES) expect([r, DECK_CARDS.filter((c) => c.role === r).length >= 15]).toEqual([r, true]);
    expect(new Set(DECK_CARDS.map((c) => c.id)).size).toBe(DECK_CARDS.length);
    for (const c of DECK_CARDS) expect([c.id, c.q.length > 10, c.a.length > 60]).toEqual([c.id, true, true]);
  });
  it('orders new cards first, then due cards, and skips cards not yet due', () => {
    const cards = [
      { id: 'x-1', role: 'backend' as const, q: 'q1', a: 'a' }, { id: 'x-2', role: 'backend' as const, q: 'q2', a: 'a' },
      { id: 'x-3', role: 'backend' as const, q: 'q3', a: 'a' }, { id: 'x-4', role: 'frontend' as const, q: 'q4', a: 'a' },
    ];
    const deck = [{ id: 'x-1', box: 2 as const, due: '2026-10-10' }, { id: 'x-2', box: 3 as const, due: '2026-12-01' }];
    expect(dueCards('backend', cards, deck, '2026-10-16').map((c) => c.id)).toEqual(['x-3', 'x-1']);
  });
  it('caps a session at 20 cards', () => {
    expect(dueCards('backend', DECK_CARDS.concat(Array.from({ length: 30 }, (_, i) => ({ id: `extra-${i}`, role: 'backend' as const, q: 'q', a: 'a' }))), [], '2026-10-16')).toHaveLength(20);
  });
  it('counts mastery', () => {
    const deck = [{ id: 'backend-1', box: 3 as const, due: '2026-12-01' }, { id: 'backend-2', box: 1 as const, due: '2026-10-17' }];
    const s = deckStats('backend', DECK_CARDS, deck);
    expect([s.mastered, s.learning, s.fresh]).toEqual([1, 1, s.total - 2]);
  });
});
