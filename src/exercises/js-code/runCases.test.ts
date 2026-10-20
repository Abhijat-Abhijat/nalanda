import { describe, it, expect } from 'vitest';
import { runCases } from './runCases';

const cases = [{ args: [2, 3], expect: 5 }, { args: [0, 0], expect: 0 }];

describe('runCases', () => {
  it('ignores object key order when comparing results', () => {
    const out = runCases('function f() { return { b: 2, a: { y: 1, x: [1, { q: 1, p: 2 }] } }; }', 'f', [{ args: [], expect: { a: { x: [1, { p: 2, q: 1 }], y: 1 }, b: 2 } }]);
    expect(out.passed).toBe(true);
  });
  it('gives each run fresh copies of the case args', () => {
    const cases = [{ args: [[1, 2, 3]], expect: [3, 2, 1] }];
    const code = 'function rev(a) { return a.reverse(); }';
    expect(runCases(code, 'rev', cases).passed).toBe(true);
    expect(runCases(code, 'rev', cases).passed).toBe(true);
    expect(cases[0].args).toEqual([[1, 2, 3]]);
  });
  it('passes a correct function', () => {
    expect(runCases('function add(a,b){return a+b}', 'add', cases).passed).toBe(true);
  });
  it('fails a wrong function and reports what it returned', () => {
    const r = runCases('function add(a,b){return a-b}', 'add', cases);
    expect(r.passed).toBe(false);
    expect(r.results[0]).toEqual({ ok: false, got: -1 });
  });
  it('reports a thrown error per case without crashing', () => {
    const r = runCases('function add(){ throw new Error("boom") }', 'add', cases);
    expect(r.results[0].error).toBe('boom (line 1)');
    expect(r.passed).toBe(false);
  });
  it('reports the line of a thrown error in the learner code', () => {
    const r = runCases('function add(a, b) {\n  const x = 1;\n  throw new Error("oops");\n}', 'add', cases);
    expect(r.results[0].error).toBe('oops (line 3)');
  });
  it('reports a syntax error', () => {
    const r = runCases('function add( {', 'add', cases);
    expect(r.passed).toBe(false);
    expect(r.error).toMatch(/syntax|unexpected/i);
  });
  it('reports a missing function name', () => {
    const r = runCases('const x = 1;', 'add', cases);
    expect(r.error).toBe('Define a function named add.');
  });
  it('compares objects and arrays by value', () => {
    const r = runCases('function f(){ return {a:[1,2]} }', 'f', [{ args: [], expect: { a: [1, 2] } }]);
    expect(r.passed).toBe(true);
  });
});
