export type Lang = 'js' | 'ts' | 'py' | 'java' | 'cpp';
export type Case = { args: unknown[]; expect: unknown };
export type CaseResult = { ok: boolean; got?: unknown; error?: string };
export type CaseOutcome = { passed: boolean; results: CaseResult[]; error?: string; timedOut?: boolean };
export type RunResult = { stdout: string; stderr: string; ms: number; timedOut?: boolean };
