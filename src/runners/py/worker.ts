/// <reference lib="webworker" />
import { PY_HARNESS, PYODIDE_CDN } from './harness';

type Msg =
  | { id: number; type: 'init' }
  | { id: number; type: 'cases'; source: string; offset: number; fnName: string; cases: string }
  | { id: number; type: 'program'; code: string; stdin: string };

type Py = {
  runPython: (code: string) => unknown;
  globals: { get: (name: string) => (...args: unknown[]) => unknown };
  setStdout: (o: { batched: (s: string) => void }) => void;
  setStderr: (o: { batched: (s: string) => void }) => void;
  setStdin: (o: { stdin: () => string | undefined }) => void;
};

// Pyodide comes from the CDN so the site bundle stays small; the browser caches it after the first load.
let pyPromise: Promise<Py> | null = null;
const getPy = () => (pyPromise ??= (async () => {
  const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_CDN}pyodide.mjs`);
  const py: Py = await loadPyodide({ indexURL: PYODIDE_CDN });
  py.runPython(PY_HARNESS);
  return py;
})());

self.onmessage = async (e: MessageEvent<Msg>) => {
  const m = e.data;
  try {
    const py = await getPy();
    if (m.type === 'init') return self.postMessage({ id: m.id, ok: true });
    if (m.type === 'cases') {
      py.setStdout({ batched: () => {} }); py.setStderr({ batched: () => {} });
      const outcome = JSON.parse(String(py.globals.get('run_cases')(m.source, m.fnName, m.cases, m.offset)));
      return self.postMessage({ id: m.id, ok: true, outcome });
    }
    const out: string[] = []; const err: string[] = [];
    const lines = m.stdin ? m.stdin.split('\n') : [];
    py.setStdout({ batched: (s) => out.push(s) });
    py.setStderr({ batched: (s) => err.push(s) });
    py.setStdin({ stdin: () => lines.shift() });
    py.globals.get('run_program')(m.code);
    self.postMessage({ id: m.id, ok: true, stdout: out.join('\n'), stderr: err.join('\n') });
  } catch (error) {
    // Only a failed load should force a reload; a failed run keeps the loaded interpreter.
    if (m.type === 'init') pyPromise = null;
    self.postMessage({ id: m.id, ok: false, error: String(error) });
  }
};
