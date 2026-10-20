import type { Case, CaseOutcome, Lang, RunResult } from './types';
import { runInWorker } from '../exercises/js-code/runInWorker';
import { onPyStatus, ensurePython, type PyStatus } from './py/client';
import { onJavaStatus, ensureJava } from './java/client';
import { onCppStatus, ensureCpp } from './cpp/client';
import { clip } from './clip';
export { clip, onPyStatus, ensurePython, type PyStatus };

export const LANG_LABEL: Record<Lang, string> = { js: 'JavaScript', ts: 'TypeScript', py: 'Python', java: 'Java', cpp: 'C++' };
export const LOAD_NOTICE: Partial<Record<Lang, string>> = {
  py: 'Loading Python (about 10 MB, first time only)...',
  java: 'Loading Java (about 20 MB, first time only)...',
  cpp: 'Loading C++ compiler (about 19 MB, first time only)...',
};
export const LOAD_FAIL: Partial<Record<Lang, string>> = {
  py: "Couldn't load Python. Check your connection and try again.",
  java: "Couldn't load Java. Check your connection and try again.",
  cpp: "Couldn't load the C++ compiler. Check your connection and try again.",
};

export function ensureLang(lang: Lang): Promise<void> {
  if (lang === 'py') return ensurePython();
  if (lang === 'java') return ensureJava();
  if (lang === 'cpp') return ensureCpp();
  return Promise.resolve();
}

// JS and TS run in a plain worker and are always ready.
export function onLangStatus(lang: Lang, cb: (s: PyStatus) => void): () => void {
  if (lang === 'py') return onPyStatus(cb);
  if (lang === 'java') return onJavaStatus(cb);
  if (lang === 'cpp') return onCppStatus(cb);
  cb('ready');
  return () => {};
}

async function toJs(lang: Lang, code: string) {
  if (lang !== 'ts') return code;
  const { stripTypes } = await import('./ts/strip');
  return stripTypes(code);
}

export async function checkCases(lang: Lang, code: string, fnName: string, cases: Case[], jsStarter: string, sig?: string): Promise<CaseOutcome> {
  if (lang === 'py') return (await import('./py/client')).pyCheck(code, fnName, cases, jsStarter);
  if (lang === 'java' || lang === 'cpp') {
    if (!sig) return { passed: false, results: [], error: 'This exercise has no signature for this language.' };
    return lang === 'java'
      ? (await import('./java/client')).javaCheckCases(code, fnName, sig, cases, jsStarter)
      : (await import('./cpp/client')).cppCheckCases(code, fnName, sig, cases, jsStarter);
  }
  let js: string;
  try { js = await toJs(lang, code); } catch (e) { return { passed: false, results: [], error: e instanceof Error ? e.message : String(e) }; }
  const r = await runInWorker(js, fnName, cases);
  return 'timedOut' in r ? { passed: false, results: [], timedOut: true } : r;
}

export async function runProgram(lang: Lang, code: string, stdin: string): Promise<RunResult> {
  if (lang === 'java') return (await import('./java/client')).javaRun(code);
  if (lang === 'cpp') return (await import('./cpp/client')).cppRun(code, stdin);
  if (lang === 'py') {
    const r = await (await import('./py/client')).pyRun(code, stdin);
    return { ...r, stdout: clip(r.stdout), stderr: clip(r.stderr) };
  }
  let js: string;
  try { js = await toJs(lang, code); } catch (e) { return { stdout: '', stderr: e instanceof Error ? e.message : String(e), ms: 0 }; }
  const t0 = performance.now();
  return new Promise((resolve) => {
    const w = new Worker(new URL('./js/programWorker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => { w.terminate(); resolve({ stdout: '', stderr: '', ms: 5000, timedOut: true }); }, 5_000);
    w.onmessage = (e: MessageEvent<{ stdout: string; stderr: string }>) => {
      clearTimeout(timer); w.terminate();
      resolve({ stdout: clip(e.data.stdout), stderr: clip(e.data.stderr), ms: Math.round(performance.now() - t0) });
    };
    w.onerror = (e) => { clearTimeout(timer); w.terminate(); resolve({ stdout: '', stderr: e.message, ms: Math.round(performance.now() - t0) }); };
    w.postMessage({ code: js, stdin });
  });
}
