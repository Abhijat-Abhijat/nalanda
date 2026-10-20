import type { Case, CaseOutcome, RunResult } from '../types';
import type { PyStatus } from '../py/client';
import { cppProgram } from './harness';
import { parseHarnessOutput, mapErrorLines } from '../results';
import { clip } from '../clip';

const LOAD_FAIL = "Couldn't load the C++ compiler. Check your connection and try again.";
let worker: Worker | null = null;
let status: PyStatus = 'idle';
let warmed = false;
let nextId = 1;
const listeners = new Set<(s: PyStatus) => void>();
const setStatus = (s: PyStatus) => { status = s; listeners.forEach((cb) => cb(s)); };
export function onCppStatus(cb: (s: PyStatus) => void) { listeners.add(cb); cb(status); return () => { listeners.delete(cb); }; }
function kill() { worker?.terminate(); worker = null; warmed = false; setStatus('idle'); }

// On timeout the worker is terminated, which stops a stuck compile or an endless loop.
function call<T>(msg: Record<string, unknown>, timeoutMs: number, transfer: Transferable[] = []): Promise<T | { timedOut: true }> {
  worker ??= new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const w = worker;
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { w.removeEventListener('message', onMsg); if (worker === w) kill(); else w.terminate(); resolve({ timedOut: true }); }, timeoutMs);
    function onMsg(e: MessageEvent) {
      if (e.data.id !== id) return;
      clearTimeout(timer);
      w.removeEventListener('message', onMsg);
      if (e.data.ok) resolve(e.data as T); else reject(new Error(e.data.error));
    }
    w.addEventListener('message', onMsg);
    w.postMessage({ ...msg, id }, transfer);
  });
}

export async function ensureCpp(): Promise<void> {
  if (status === 'ready') return;
  setStatus('loading');
  try {
    const r = await call<{ ok: true }>({ type: 'init' }, 60_000);
    if ('timedOut' in r) throw new Error('timeout');
    warmed = true;
    setStatus('ready');
  } catch {
    kill();
    setStatus('error');
    throw new Error(LOAD_FAIL);
  }
}

type Built = { ok: true; wasm: Uint8Array } | { ok: false; error: string };
async function build(source: string): Promise<Built | 'timeout'> {
  await ensureCpp();
  const r = await call<{ result: Built }>({ type: 'compile', source }, warmed ? 20_000 : 60_000);
  return 'timedOut' in r ? 'timeout' : r.result;
}
const exec = (wasm: Uint8Array, stdin: string) => call<{ result: { exit: number; stdout: string; stderr: string } }>({ type: 'run', wasm, stdin }, 5_000, [wasm.buffer as ArrayBuffer]);

export async function cppCheckCases(code: string, fnName: string, sig: string, cases: Case[], jsStarter: string): Promise<CaseOutcome> {
  const { source, offsets } = cppProgram([{ id: 'x', learner: code, fnName, sig, cases, jsStarter }]);
  const b = await build(source);
  if (b === 'timeout') return { passed: false, results: [], timedOut: true };
  if (!b.ok) return { passed: false, results: [], error: mapErrorLines(b.error, offsets[0]) };
  const r = await exec(b.wasm, '');
  if ('timedOut' in r) return { passed: false, results: [], timedOut: true };
  return parseHarnessOutput(r.result.stdout, cases, 'program crashed');
}

export async function cppRun(code: string, stdin: string): Promise<RunResult> {
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);
  const b = await build(code);
  if (b === 'timeout') return { stdout: '', stderr: '', ms: ms(), timedOut: true };
  if (!b.ok) return { stdout: '', stderr: clip(b.error), ms: ms() };
  const r = await exec(b.wasm, stdin);
  return 'timedOut' in r ? { stdout: '', stderr: '', ms: ms(), timedOut: true } : { stdout: clip(r.result.stdout), stderr: clip(r.result.stderr), ms: ms() };
}
