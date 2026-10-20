import { useStore } from '../../engine/store';
import { useCareer } from '../../career/store';
import { DECK_CARDS } from '../../career/deck-data';
import type { PathContext } from '../../career/paths';

const ROLE_CARDS: Record<string, string[]> = {};
for (const c of DECK_CARDS) (ROLE_CARDS[c.role] ??= []).push(c.id);

export function usePathContext(): PathContext {
  const progress = useStore((s) => s.progress);
  const career = useCareer((s) => s.data);
  return { progress, career, deckCardsByRole: ROLE_CARDS };
}
