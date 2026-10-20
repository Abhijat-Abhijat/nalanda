import { describe, it, expect } from 'vitest';
import { validateWorlds } from './validate';
import { jsEx } from './helpers';
import type { World } from '../schema';

const worldWith = (ex: ReturnType<typeof jsEx>): World => ({
  id: 'w', title: 'W', hue: '#000000', tagline: 't', intro: [],
  chapters: [{ id: 'c', title: 'C', summary: 's', exam: [], lessons: [{ id: 'l1', title: 'L', conceptIds: ['k'], story: [], layers: [], exercise: ex, quiz: [] }] }],
  boss: { id: 'b', title: 'B', steps: [] },
} as unknown as World);

describe('python exercise rule', () => {
  it('jsEx with py sets langs and py.solution', () => {
    const ex = jsEx('x', 'k', 'p', 'f', 'function f(a) {}', [{ args: [1], expect: 1 }], 'function f(a){return a}', 'h', 'def f(a):\n    return a');
    expect(ex.langs).toEqual(['js', 'ts', 'py']);
    expect(ex.py).toEqual({ solution: 'def f(a):\n    return a' });
  });
  it('jsEx without py leaves langs unset', () => {
    const ex = jsEx('x', 'k', 'p', 'f', 'function f(a) {}', [{ args: [1], expect: 1 }], 'function f(a){return a}', 'h');
    expect(ex.langs).toBeUndefined();
  });
  it('flags langs with py but no py.solution', () => {
    const ex = { ...jsEx('x', 'k', 'p', 'f', 'function f(a) {}', [{ args: [1], expect: 1 }], 'function f(a){return a}', 'h'), langs: ['js', 'py'] as ('js' | 'py')[] };
    expect(validateWorlds([worldWith(ex)]).some((e) => e.includes('needs py.solution'))).toBe(true);
  });
});

describe('java and cpp exercise rules', () => {
  const base = () => jsEx('x', 'k', 'p', 'f', 'function f(a) {}', [{ args: [1], expect: 1 }], 'function f(a){return a}', 'h');
  it('jsEx with java and cpp sets langs in order', () => {
    const ex = jsEx('x', 'k', 'p', 'f', 'function f(a) {}', [{ args: [1], expect: 1 }], 'function f(a){return a}', 'h', 'def f(a):\n    return a', { sig: '(int a) -> int', java: 'class Solution {}', cpp: 'class Solution {};' });
    expect(ex.langs).toEqual(['js', 'ts', 'py', 'java', 'cpp']);
    expect(ex.sig).toBe('(int a) -> int');
  });
  it('flags java without sig or solution', () => {
    const errs = validateWorlds([worldWith({ ...base(), langs: ['js', 'java'] })]);
    expect(errs.some((e) => e.includes('needs sig'))).toBe(true);
    expect(errs.some((e) => e.includes('needs java.solution'))).toBe(true);
  });
  it('flags a sig whose parameter count differs from the JS function', () => {
    const errs = validateWorlds([worldWith({ ...base(), langs: ['js', 'cpp'], sig: '(int a, int b) -> int', cpp: { solution: 'x' } })]);
    expect(errs.some((e) => e.includes('parameter count'))).toBe(true);
  });
  it('flags an unparsable sig', () => {
    const errs = validateWorlds([worldWith({ ...base(), langs: ['js', 'cpp'], sig: 'nope', cpp: { solution: 'x' } })]);
    expect(errs.some((e) => e.includes('bad signature'))).toBe(true);
  });
});
