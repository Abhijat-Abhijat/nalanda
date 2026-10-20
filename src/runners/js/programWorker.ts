/// <reference lib="webworker" />
const fmt = (a: unknown) => {
  if (typeof a === 'string') return a;
  try { return JSON.stringify(a); } catch { return String(a); }
};

// Runs a whole playground program with console output captured and input() reading stdin lines.
self.onmessage = (e: MessageEvent<{ code: string; stdin: string }>) => {
  const out: string[] = []; const err: string[] = [];
  const lines = e.data.stdin ? e.data.stdin.split('\n') : [];
  const log = (...a: unknown[]) => { out.push(a.map(fmt).join(' ')); };
  const error = (...a: unknown[]) => { err.push(a.map(fmt).join(' ')); };
  try {
    new Function('console', 'input', e.data.code)({ log, info: log, error, warn: error }, () => lines.shift() ?? null);
  } catch (x) {
    err.push(x instanceof Error ? `${x.name}: ${x.message}` : String(x));
  }
  self.postMessage({ stdout: out.join('\n'), stderr: err.join('\n') });
};
