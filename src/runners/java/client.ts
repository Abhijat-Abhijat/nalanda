import type { Case, CaseOutcome, RunResult } from '../types';
import type { PyStatus } from '../py/client';
import { javaProgram, javaPlaygroundSource, hitGuard, withoutGuard } from './harness';
import { parseHarnessOutput, mapErrorLines } from '../results';
import { clip } from '../clip';

// CheerpJ needs the DOM, so Java runs inside a hidden same-origin iframe (public/cheerpj.html).
const LOAD_FAIL = "Couldn't load Java. Check your connection and try again.";
let frame: HTMLIFrameElement | null = null;
let frameReady: Promise<void> | null = null;
let status: PyStatus = 'idle';
let warmed = false;
let nextId = 1;
const listeners = new Set<(s: PyStatus) => void>();
const setStatus = (s: PyStatus) => { status = s; listeners.forEach((cb) => cb(s)); };
export function onJavaStatus(cb: (s: PyStatus) => void) { listeners.add(cb); cb(status); return () => { listeners.delete(cb); }; }

function kill() { frame?.remove(); frame = null; frameReady = null; warmed = false; setStatus('idle'); }

function ensureFrame(): Promise<void> {
  if (frameReady) return frameReady;
  const f = document.createElement('iframe');
  f.src = new URL('cheerpj.html', document.baseURI).href;
  f.title = 'Java runtime';
  f.setAttribute('aria-hidden', 'true');
  f.tabIndex = -1;
  f.style.cssText = 'position:absolute;width:1px;height:1px;border:0;left:-9999px;top:0';
  frame = f;
  frameReady = new Promise((resolve) => {
    const onMsg = (e: MessageEvent) => { if (e.source === f.contentWindow && e.data?.type === 'frame-ready') { removeEventListener('message', onMsg); resolve(); } };
    addEventListener('message', onMsg);
  });
  document.body.appendChild(f);
  return frameReady;
}

// On timeout the iframe is removed, which discards the stuck JVM.
async function call<T>(msg: Record<string, unknown>, timeoutMs: number): Promise<T | { timedOut: true }> {
  await ensureFrame();
  const f = frame!;
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { removeEventListener('message', onMsg); if (frame === f) kill(); else f.remove(); resolve({ timedOut: true }); }, timeoutMs);
    function onMsg(e: MessageEvent) {
      if (e.source !== f.contentWindow || e.data?.id !== id) return;
      clearTimeout(timer);
      removeEventListener('message', onMsg);
      if (e.data.ok) resolve(e.data as T); else reject(new Error(e.data.error));
    }
    addEventListener('message', onMsg);
    f.contentWindow!.postMessage({ ...msg, id }, location.origin);
  });
}

export async function ensureJava(): Promise<void> {
  if (status === 'ready') return;
  setStatus('loading');
  try {
    const r = await call<{ ok: true }>({ type: 'init' }, 90_000);
    if ('timedOut' in r) throw new Error('timeout');
    setStatus('ready');
  } catch {
    kill();
    setStatus('error');
    throw new Error(LOAD_FAIL);
  }
}

async function compileAndRun(source: string): Promise<{ timedOut: true } | { compileError: string } | { out: string; err: string }> {
  await ensureJava();
  const c = await call<{ exit: number; dir: string; text: string }>({ type: 'compile', source }, warmed ? 30_000 : 90_000);
  if ('timedOut' in c) return c;
  warmed = true;
  if (c.exit !== 0) return { compileError: c.text };
  // The loop guard ends runaway programs after about 4 s; this timer is only a backstop.
  const r = await call<{ exit: number; out: string; err: string }>({ type: 'run', dir: c.dir }, 10_000);
  return 'timedOut' in r ? r : { out: r.out, err: r.err };
}

export async function javaCheckCases(code: string, fnName: string, sig: string, cases: Case[], jsStarter: string): Promise<CaseOutcome> {
  const { source, offset } = javaProgram({ learner: code, fnName, sig, cases, jsStarter });
  const r = await compileAndRun(source);
  if ('timedOut' in r) return { passed: false, results: [], timedOut: true };
  if ('compileError' in r) return { passed: false, results: [], error: mapErrorLines(r.compileError, offset) };
  if (hitGuard(r.out)) return { passed: false, results: [], timedOut: true };
  return parseHarnessOutput(r.out, cases, 'no output');
}

export async function javaRun(code: string): Promise<RunResult> {
  const t0 = performance.now();
  const r = await compileAndRun(javaPlaygroundSource(code));
  const ms = Math.round(performance.now() - t0);
  if ('timedOut' in r) return { stdout: '', stderr: '', ms, timedOut: true };
  if ('compileError' in r) return { stdout: '', stderr: clip(r.compileError), ms };
  if (hitGuard(r.out)) return { stdout: clip(withoutGuard(r.out)), stderr: '', ms, timedOut: true };
  return { stdout: clip(r.out), stderr: clip(r.err), ms };
}
