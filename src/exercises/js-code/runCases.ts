export type CaseResult = { ok: boolean; got?: unknown; error?: string };
export type RunOutcome = { passed: boolean; results: CaseResult[]; error?: string };

// Canonical JSON with object keys sorted, so { a, b } equals { b, a } while arrays stay ordered.
const canon = (v: unknown): string => JSON.stringify(v, (_k, x) =>
  x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : x);
export const sameResult = (a: unknown, b: unknown) => canon(a) === canon(b);

// new Function adds two header lines before the learner's code, so subtract them to get the learner's line.
const lineOf = (e: unknown): string => {
  const m = e instanceof Error ? /<anonymous>:(\d+):\d+/.exec(e.stack ?? '') : null;
  return m ? ` (line ${Math.max(1, Number(m[1]) - 2)})` : '';
};
const describeError = (e: unknown) => `${e instanceof Error ? e.message : String(e)}${lineOf(e)}`;

export function runCases(code: string, fnName: string, cases: { args: unknown[]; expect: unknown }[]): RunOutcome {
  let fn: unknown;
  try {
    fn = new Function(`${code}\n;return typeof ${fnName} === 'function' ? ${fnName} : undefined;`)();
  } catch (e) {
    return { passed: false, results: [], error: e instanceof Error ? e.message : String(e) };
  }
  if (typeof fn !== 'function') return { passed: false, results: [], error: `Define a function named ${fnName}.` };
  const results: CaseResult[] = cases.map((c) => {
    try {
      // Fresh copies, so a function that mutates its input cannot corrupt the shared cases.
      const got = (fn as (...a: unknown[]) => unknown)(...structuredClone(c.args));
      return sameResult(got, c.expect) ? { ok: true } : { ok: false, got };
    } catch (e) {
      return { ok: false, error: describeError(e) };
    }
  });
  return { passed: results.every((r) => r.ok), results };
}
