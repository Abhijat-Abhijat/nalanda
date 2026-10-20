import { loadPyodide, type PyodideInterface } from 'pyodide';
import { PY_HARNESS } from './harness';
import { withPrelude } from './preludes';
import type { Case, CaseOutcome } from '../types';

// Node-only: used by the test suites to run the same harness the browser worker runs.
let cached: Promise<PyodideInterface> | null = null;
export function getTestPyodide() {
  return (cached ??= loadPyodide().then((py) => { py.runPython(PY_HARNESS); return py; }));
}

export async function pyRunCases(code: string, fnName: string, cases: Case[], jsStarter: string): Promise<CaseOutcome> {
  const py = await getTestPyodide();
  const { source, offset } = withPrelude(code, jsStarter);
  return JSON.parse(py.globals.get('run_cases')(source, fnName, JSON.stringify(cases), offset));
}
