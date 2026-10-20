import type { Task } from '../../schema';
import { mulberry32, pickN } from '../random';
import { PROMPTS, type OpenPrompt } from './prompts';
import type { RoundTemplate } from './templates';

export type Pools = { coding: Task[]; concepts: Task[] };
export type SessionItem = { kind: 'coding' | 'concepts'; task: Task } | { kind: 'design' | 'behavioural'; prompt: OpenPrompt };
export type Session = { templateId: RoundTemplate['id']; seed: number; minutes: number; items: SessionItem[] };

export function buildSession(t: RoundTemplate, seed: number, pools: Pools): Session {
  const rnd = mulberry32(seed);
  const items: SessionItem[] = [];
  for (const sec of t.sections) {
    if (sec.kind === 'coding' || sec.kind === 'concepts') {
      for (const task of pickN(pools[sec.kind], sec.count, rnd)) items.push({ kind: sec.kind, task });
    } else {
      for (const prompt of pickN(PROMPTS[sec.kind], sec.count, rnd)) items.push({ kind: sec.kind, prompt });
    }
  }
  return { templateId: t.id, seed, minutes: t.minutes, items };
}
