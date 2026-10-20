import { sameResult } from '../exercises/js-code/runCases';
import type { Case, CaseOutcome, CaseResult } from './types';

// Harness programs print one {"ok":...} line per case; anything else is learner debug output.
export function parseHarnessOutput(stdout: string, cases: Case[], missingMsg: string): CaseOutcome {
  const lines = stdout.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{"ok"'));
  const results: CaseResult[] = cases.map((c, i) => {
    const line = lines[i];
    if (!line) return { ok: false, error: missingMsg };
    let r: { ok: boolean; got?: unknown; error?: string };
    try { r = JSON.parse(line); } catch { return { ok: false, error: missingMsg }; }
    if (!r.ok) return { ok: false, error: r.error ?? missingMsg };
    return sameResult(r.got, c.expect) ? { ok: true } : { ok: false, got: r.got };
  });
  return { passed: results.every((r) => r.ok), results };
}

export function mapErrorLines(text: string, offset: number): string {
  const fix = (n: string) => String(Math.max(1, Number(n) - offset));
  return text
    .replace(/(main\.cpp:)(\d+)(:)/g, (_m, a, n, b) => a + fix(n) + b)
    .replace(/(Main\.java:)(\d+)(:)/g, (_m, a, n, b) => a + fix(n) + b)
    .replace(/\(at line (\d+)\)/g, (_m, n) => `(at line ${fix(n)})`);
}
