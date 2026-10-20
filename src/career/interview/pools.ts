import type { Task, World } from '../../schema';
import { loadWorld } from '../../content/load';
import type { Pools } from './session';

export const CODING_WORLDS = ['algorithms'];
export const CONCEPT_WORLDS = ['system-design', 'cs-fundamentals', 'backend', 'databases', 'career'];

export function poolsFromWorlds(worlds: World[]): Pools {
  const coding: Task[] = [];
  const concepts: Task[] = [];
  for (const w of worlds) for (const c of w.chapters) {
    if (CODING_WORLDS.includes(w.id)) for (const l of c.lessons) if (l.exercise.kind === 'js-code') coding.push(l.exercise);
    if (CONCEPT_WORLDS.includes(w.id)) {
      for (const l of c.lessons) for (const q of l.quiz) if (q.kind === 'choice') concepts.push(q);
      for (const q of c.exam) if (q.kind === 'choice') concepts.push(q);
    }
  }
  return { coding, concepts };
}

export async function loadPools(): Promise<Pools> {
  const pending = [...CODING_WORLDS, ...CONCEPT_WORLDS].map((id) => loadWorld(id)).filter((p): p is Promise<World> => p !== null);
  return poolsFromWorlds(await Promise.all(pending));
}
