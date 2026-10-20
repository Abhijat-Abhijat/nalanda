import type { DeckCard } from './schema';
import type { DeckItem } from './deck-data';

export function dueCards(role: string, cards: DeckItem[], deck: DeckCard[], today: string): DeckItem[] {
  const state = new Map(deck.map((c) => [c.id, c]));
  const mine = cards.filter((c) => c.role === role);
  const fresh = mine.filter((c) => !state.has(c.id));
  const due = mine
    .filter((c) => state.has(c.id) && state.get(c.id)!.due <= today)
    .sort((a, b) => state.get(a.id)!.due.localeCompare(state.get(b.id)!.due));
  return [...fresh, ...due].slice(0, 20);
}

export function deckStats(role: string, cards: DeckItem[], deck: DeckCard[]) {
  const box = new Map(deck.map((c) => [c.id, c.box]));
  const mine = cards.filter((c) => c.role === role);
  const mastered = mine.filter((c) => (box.get(c.id) ?? 0) >= 3).length;
  const learning = mine.filter((c) => box.has(c.id) && box.get(c.id)! < 3).length;
  return { total: mine.length, mastered, learning, fresh: mine.length - mastered - learning };
}
