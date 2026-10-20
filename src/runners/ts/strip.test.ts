import { describe, it, expect } from 'vitest';
import { stripTypes } from './strip';
import { runCases } from '../../exercises/js-code/runCases';

describe('stripTypes', () => {
  it('removes annotations and keeps behaviour', () => {
    const ts = 'function add(a: number, b: number): number {\n  const xs: number[] = [a, b];\n  return xs.reduce((s, x) => s + x, 0);\n}\ninterface P { x: number }';
    const out = runCases(stripTypes(ts), 'add', [{ args: [2, 3], expect: 5 }]);
    expect(out.passed).toBe(true);
  });
  it('keeps line numbers stable', () => {
    expect(stripTypes('type A = number;\nfunction f(): A { return 1 }').split('\n').length).toBe(2);
  });
  it('throws on a syntax error', () => {
    expect(() => stripTypes('function (')).toThrow();
  });
});
