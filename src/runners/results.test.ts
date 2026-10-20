import { describe, it, expect } from 'vitest';
import { parseHarnessOutput, mapErrorLines } from './results';

const cases = [{ args: [1], expect: { a: 1, b: [2] } }, { args: [2], expect: 0.3 }, { args: [3], expect: 5 }];

describe('harness output', () => {
  it('compares each line canonically and reports missing lines', () => {
    const out = 'debug print\n{"ok":true,"got":{"b":[2],"a":1}}\n{"ok":true,"got":0.30000000000000004}\n';
    const r = parseHarnessOutput(out, cases, 'program crashed');
    expect(r.results[0]).toEqual({ ok: true });
    expect(r.results[1]).toEqual({ ok: false, got: 0.30000000000000004 });
    expect(r.results[2]).toEqual({ ok: false, error: 'program crashed' });
    expect(r.passed).toBe(false);
  });
  it('passes through harness errors', () => {
    const r = parseHarnessOutput('{"ok":false,"error":"ArithmeticException: / by zero"}', [cases[0]], 'x');
    expect(r.results[0]).toEqual({ ok: false, error: 'ArithmeticException: / by zero' });
  });
  it('maps error line numbers', () => {
    expect(mapErrorLines('main.cpp:212:5: error: x\nmain.cpp:3:1: note', 200)).toBe('main.cpp:12:5: error: x\nmain.cpp:1:1: note');
    expect(mapErrorLines('1. ERROR in /str/r1/Main.java (at line 140)', 130)).toBe('1. ERROR in /str/r1/Main.java (at line 10)');
    expect(mapErrorLines('Main.java:150: error: ; expected', 130)).toBe('Main.java:20: error: ; expected');
  });
});
