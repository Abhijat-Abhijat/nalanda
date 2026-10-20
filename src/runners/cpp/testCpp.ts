// Node-only: compiles harness programs with @yowasp/clang for the test suites.
import * as clang from '@yowasp/clang';
import * as shim from '@bjorn3/browser_wasi_shim';
import { compileCpp, runWasm, type WasiShim } from './build';
import { cppProgram, type CppUnit } from './harness';
import { parseHarnessOutput, mapErrorLines } from '../results';
import type { Case, CaseOutcome } from '../types';

// runClang exists at runtime but is missing from the package's type declarations.
const runClang = (clang as unknown as { runClang: never }).runClang;

export async function cppCheck(learner: string, fnName: string, sig: string, cases: Case[], jsStarter: string): Promise<CaseOutcome> {
  const { source, offsets } = cppProgram([{ id: 'x', learner, fnName, sig, cases, jsStarter }]);
  const c = await compileCpp(runClang, source);
  if (!c.ok) return { passed: false, results: [], error: mapErrorLines(c.error, offsets[0]) };
  const r = await runWasm(shim as unknown as WasiShim, c.wasm, '');
  return parseHarnessOutput(r.stdout, cases, 'program crashed');
}

export async function cppRunProgram(source: string, stdin: string): Promise<{ exit: number; stdout: string; stderr: string }> {
  const c = await compileCpp(runClang, source);
  if (!c.ok) throw new Error(c.error);
  return runWasm(shim as unknown as WasiShim, c.wasm, stdin);
}

// A crash inside one unit stops the units after it; the suite reports the first failing id.
export async function cppBatch(units: CppUnit[]): Promise<Map<string, CaseOutcome | { compileError: string }>> {
  const { source } = cppProgram(units, true);
  const c = await compileCpp(runClang, source);
  const out = new Map<string, CaseOutcome | { compileError: string }>();
  if (!c.ok) { units.forEach((u) => out.set(u.id, { compileError: c.error })); return out; }
  const r = await runWasm(shim as unknown as WasiShim, c.wasm, '');
  const chunks = r.stdout.split(/^@@/m).slice(1);
  units.forEach((u, i) => out.set(u.id, parseHarnessOutput((chunks[i] ?? '').replace(/^[^\n]*\n/, ''), u.cases, 'program crashed')));
  return out;
}
