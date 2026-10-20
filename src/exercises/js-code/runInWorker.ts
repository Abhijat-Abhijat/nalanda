import type { RunOutcome } from './runCases';

export function runInWorker(
  code: string, fnName: string, cases: { args: unknown[]; expect: unknown }[], timeoutMs = 2000,
): Promise<RunOutcome | { timedOut: true }> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => { worker.terminate(); resolve({ timedOut: true }); }, timeoutMs);
    worker.onmessage = (e: MessageEvent<RunOutcome>) => { clearTimeout(timer); worker.terminate(); resolve(e.data); };
    worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); resolve({ passed: false, results: [], error: e.message }); };
    worker.postMessage({ code, fnName, cases });
  });
}
