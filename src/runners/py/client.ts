import type { Case, CaseOutcome, RunResult } from '../types';
import { withPrelude } from './preludes';

export type PyStatus = 'idle' | 'loading' | 'ready' | 'error';
const LOAD_FAIL = "Couldn't load Python. Check your connection and try again.";
let worker: Worker | null = null;
let status: PyStatus = 'idle';
let nextId = 1;
const listeners = new Set<(s: PyStatus) => void>();
const setStatus = (s: PyStatus) => { status = s; listeners.forEach((cb) => cb(s)); };

export function onPyStatus(cb: (s: PyStatus) => void) { listeners.add(cb); cb(status); return () => { listeners.delete(cb); }; }

function kill() { worker?.terminate(); worker = null; setStatus('idle'); }

// One request on the shared worker; on timeout the worker is killed so the next call starts fresh.
function call<T>(msg: Record<string, unknown>, timeoutMs: number): Promise<T | { timedOut: true }> {
  worker ??= new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const w = worker; const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { w.removeEventListener('message', onMsg); kill(); resolve({ timedOut: true }); }, timeoutMs);
    function onMsg(e: MessageEvent) {
      if (e.data.id !== id) return;
      clearTimeout(timer); w.removeEventListener('message', onMsg);
      if (e.data.ok) resolve(e.data as T); else reject(new Error(e.data.error));
    }
    w.addEventListener('message', onMsg);
    w.postMessage({ ...msg, id });
  });
}

export async function ensurePython(): Promise<void> {
  if (status === 'ready') return;
  setStatus('loading');
  try {
    const r = await call<{ ok: true }>({ type: 'init' }, 30_000);
    if ('timedOut' in r) throw new Error('timeout');
    setStatus('ready');
  } catch {
    kill(); setStatus('error');
    throw new Error(LOAD_FAIL);
  }
}

export async function pyCheck(code: string, fnName: string, cases: Case[], jsStarter: string): Promise<CaseOutcome> {
  await ensurePython();
  const { source, offset } = withPrelude(code, jsStarter);
  const r = await call<{ outcome: CaseOutcome }>({ type: 'cases', source, offset, fnName, cases: JSON.stringify(cases) }, 5_000);
  return 'timedOut' in r ? { passed: false, results: [], timedOut: true } : r.outcome;
}

export async function pyRun(code: string, stdin: string): Promise<RunResult> {
  await ensurePython();
  const t0 = performance.now();
  const r = await call<{ stdout: string; stderr: string }>({ type: 'program', code, stdin }, 5_000);
  const ms = Math.round(performance.now() - t0);
  return 'timedOut' in r ? { stdout: '', stderr: '', ms, timedOut: true } : { stdout: r.stdout, stderr: r.stderr, ms };
}
