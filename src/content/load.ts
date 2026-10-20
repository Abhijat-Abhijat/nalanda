import { useEffect, useState } from 'react';
import { WorldSchema, type World } from '../schema';

// One code-split chunk per world, so opening the site does not download every lesson.
export const loaders: Record<string, () => Promise<unknown>> = {
  'ai-engineer': () => import('./ai-engineer').then((m) => m.aiWorld),
  'git-shell': () => import('./git-shell').then((m) => m.gitShellWorld),
  sql: () => import('./sql').then((m) => m.sqlWorld),
  'http-web': () => import('./http-web').then((m) => m.httpWebWorld),
  javascript: () => import('./javascript').then((m) => m.jsWorld),
  python: () => import('./python').then((m) => m.pyWorld),
  frontend: () => import('./frontend').then((m) => m.feWorld),
  backend: () => import('./backend').then((m) => m.beWorld),
  databases: () => import('./databases').then((m) => m.dbWorld),
  devops: () => import('./devops').then((m) => m.doWorld),
  algorithms: () => import('./algorithms').then((m) => m.alWorld),
  'cs-fundamentals': () => import('./cs').then((m) => m.csWorld),
  cloud: () => import('./cloud').then((m) => m.clWorld),
  monitoring: () => import('./monitoring').then((m) => m.msWorld),
  'system-design': () => import('./system-design').then((m) => m.sdWorld),
  security: () => import('./security').then((m) => m.secWorld),
  engineering: () => import('./engineering').then((m) => m.engWorld),
  career: () => import('./career').then((m) => m.careerWorld),
  'ai-advanced': () => import('./ai-advanced').then((m) => m.aaWorld),
  java: () => import('./java').then((m) => m.jvWorld),
  cpp: () => import('./cpp').then((m) => m.cxWorld),
  payments: () => import('./payments').then((m) => m.pmWorld),
};

const cache = new Map<string, Promise<World>>();

export function loadWorld(id: string): Promise<World> | null {
  const load = loaders[id];
  if (!load) return null;
  let p = cache.get(id);
  if (!p) {
    p = load().then((w) => WorldSchema.parse(w));
    // A failed download is not cached, so the next visit tries again.
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}

export type WorldState = { status: 'loading' } | { status: 'ready'; world: World } | { status: 'error' };

export function useWorld(id: string | undefined): WorldState {
  const [state, setState] = useState<{ id?: string; s: WorldState }>({ s: { status: 'loading' } });
  useEffect(() => {
    if (!id) return;
    let live = true;
    const p = loadWorld(id);
    if (!p) { setState({ id, s: { status: 'error' } }); return; }
    p.then((world) => live && setState({ id, s: { status: 'ready', world } }), () => live && setState({ id, s: { status: 'error' } }));
    return () => { live = false; };
  }, [id]);
  return state.id === id ? state.s : { status: 'loading' };
}
