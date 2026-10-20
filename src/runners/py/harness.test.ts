import { describe, it, expect } from 'vitest';
import { pyRunCases, getTestPyodide } from './testPyodide';
import { preludeFor, pyStarter } from './preludes';

const LIST_STARTER = 'class ListNode { constructor(val, next = null) {} }\nfunction reverseList(values) {\n  // your code\n}';

describe('python harness', { timeout: 120_000 }, () => {
  it('passes a correct solution', async () => {
    const out = await pyRunCases('def add(a, b):\n    return a + b', 'add', [{ args: [1, 2], expect: 3 }], 'function add(a, b) {}');
    expect(out).toEqual({ passed: true, results: [{ ok: true }] });
  });
  it('normalise: whole floats become ints, tuples become lists, bools stay bools', async () => {
    const code = 'def f(k):\n    return [2.0, (1, 2), True, None, 18.5][k]';
    const cases = [{ args: [0], expect: 2 }, { args: [1], expect: [1, 2] }, { args: [2], expect: true }, { args: [2], expect: 1 }, { args: [3], expect: null }, { args: [4], expect: 18.5 }];
    const out = await pyRunCases(code, 'f', cases, 'function f(k) {}');
    expect(out.results.map((r) => r.ok)).toEqual([true, true, true, false, true, true]);
  });
  it('ignores dict key order when comparing results', async () => {
    const out = await pyRunCases(`def f():
    return {'b': 2, 'a': 1}`, 'f', [{ args: [], expect: { a: 1, b: 2 } }], 'function f() {}');
    expect(out.passed).toBe(true);
  });
  it('fresh args per case', async () => {
    const code = 'def f(a):\n    a.append(9)\n    return len(a)';
    const out = await pyRunCases(code, 'f', [{ args: [[1]], expect: 2 }, { args: [[1]], expect: 2 }], 'function f(a) {}');
    expect(out.passed).toBe(true);
  });
  it('reports wrong value with got', async () => {
    const out = await pyRunCases('def f():\n    return 4', 'f', [{ args: [], expect: 5 }], 'function f() {}');
    expect(out.results[0]).toEqual({ ok: false, got: 4 });
  });
  it('sys.exit inside a learner function becomes a case error', async () => {
    const out = await pyRunCases(`import sys
def f():
    sys.exit(1)`, 'f', [{ args: [], expect: 1 }], 'function f() {}');
    expect(out.passed).toBe(false);
    expect(out.results[0].error).toMatch(/^SystemExit/);
  });
  it('missing function message', async () => {
    const out = await pyRunCases('x = 1', 'f', [{ args: [], expect: 1 }], 'function f() {}');
    expect(out.error).toBe('Define a function named f.');
  });
  it('runtime error names type and learner line, after the prelude', async () => {
    const code = 'def reverseList(values):\n    head = fromArray(values)\n    return 1 / 0';
    const out = await pyRunCases(code, 'reverseList', [{ args: [[1]], expect: [1] }], LIST_STARTER);
    expect(out.results[0].error).toBe('ZeroDivisionError: division by zero (line 3)');
  });
  it('syntax error reports learner line', async () => {
    const out = await pyRunCases('def f(:\n    pass', 'f', [{ args: [], expect: 1 }], 'function f() {}');
    expect(out.error).toMatch(/^SyntaxError: .*\(line 1\)$/);
  });
  it('list, tree, and heap preludes work', async () => {
    const list = 'def reverseList(values):\n    prev, cur = None, fromArray(values)\n    while cur:\n        cur.next, prev, cur = prev, cur, cur.next\n    return toArray(prev)';
    expect((await pyRunCases(list, 'reverseList', [{ args: [[1, 2, 3]], expect: [3, 2, 1] }], LIST_STARTER)).passed).toBe(true);
    const tree = 'def roundTrip(a):\n    return treeToArray(buildTree(a))';
    const treeStarter = 'class TreeNode { }\nfunction roundTrip(a) {}';
    expect((await pyRunCases(tree, 'roundTrip', [{ args: [[3, 9, 20, null, null, 15, 7]], expect: [3, 9, 20, null, null, 15, 7] }], treeStarter)).passed).toBe(true);
    const heap = 'def sortDesc(a):\n    h = Heap(lambda x, y: y - x)\n    for x in a: h.push(x)\n    return [h.pop() for _ in range(h.size())]';
    expect((await pyRunCases(heap, 'sortDesc', [{ args: [[2, 5, 1]], expect: [5, 2, 1] }], 'class Heap { }\nfunction sortDesc(a) {}')).passed).toBe(true);
  });
  it('random-pointer and graph preludes round-trip', async () => {
    const rnd = `def roundTrip(pairs):
    return serializeRandom(buildRandom(pairs))`;
    expect((await pyRunCases(rnd, 'roundTrip', [{ args: [[[7, null], [13, 0], [11, 4], [10, 2], [1, 0]]], expect: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] }], `class RNode {}
function roundTrip(pairs) {}`)).passed).toBe(true);
    const g = `def roundTrip(adj):
    return graphToAdj(buildGraph(adj))`;
    expect((await pyRunCases(g, 'roundTrip', [{ args: [[[2, 4], [1, 3], [2, 4], [1, 3]]], expect: [[2, 4], [1, 3], [2, 4], [1, 3]] }, { args: [[]], expect: [] }], `class GNode {}
function roundTrip(adj) {}`)).passed).toBe(true);
  });
  it('run_program prints stdout, reads stdin, and prints tracebacks to stderr', async () => {
    const py = await getTestPyodide();
    const out: string[] = []; const err: string[] = [];
    py.setStdout({ batched: (s) => out.push(s) }); py.setStderr({ batched: (s) => err.push(s) });
    const lines = ['Ada'];
    py.setStdin({ stdin: () => lines.shift() });
    py.globals.get('run_program')('name = input()\nprint("hi", name)\nprint(1 / 0)');
    expect(out.join('\n')).toContain('hi Ada');
    expect(err.join('\n')).toContain('ZeroDivisionError');
  });
});

describe('preludes and starters', () => {
  it('detects helpers from the JS starter', () => {
    expect(preludeFor('function f() {}')).toBe('');
    expect(preludeFor(LIST_STARTER)).toContain('class ListNode');
    expect(preludeFor('class TreeNode {}\nclass Heap {}')).toMatch(/class TreeNode[\s\S]*class Heap/);
  });
  it('detects random-pointer and graph helpers', () => {
    expect(preludeFor('class RNode {}')).toContain('def serializeRandom');
    expect(preludeFor('class GNode {}')).toContain('def graphToAdj');
  });
  it('builds a Python stub from the JS signature', () => {
    expect(pyStarter('reverseList', LIST_STARTER)).toBe('def reverseList(values):\n    # your code\n    pass\n');
    expect(pyStarter('combine', 'function combine(n, k) {\n}')).toBe('def combine(n, k):\n    # your code\n    pass\n');
  });
});
