import { describe, it, expect } from 'vitest';
import { javaCheck, hasJavac } from './testJava';

const sol = (body: string) => `class Solution {\n${body}\n}`;

describe.skipIf(!hasJavac)('Java harness', { timeout: 120_000 }, () => {
  it('passes a correct solution', () => {
    const out = javaCheck(sol('public boolean containsDuplicate(int[] nums) { Set<Integer> s = new HashSet<>(); for (int n : nums) if (!s.add(n)) return true; return false; }'),
      'containsDuplicate', '(int[] nums) -> bool', [{ args: [[1, 2, 3, 1]], expect: true }, { args: [[1, 2]], expect: false }], 'function containsDuplicate(nums) {}');
    expect(out).toEqual({ passed: true, results: [{ ok: true }, { ok: true }] });
  });
  it('reports exceptions per case', () => {
    const out = javaCheck(sol('public int f(int a) { return 10 / a; }'), 'f', '(int a) -> int', [{ args: [0], expect: 0 }, { args: [5], expect: 2 }], 'function f(a) {}');
    expect(out.results[0].error).toMatch(/^ArithmeticException/);
    expect(out.results[1]).toEqual({ ok: true });
  });
  it('numbers round-trip', () => {
    const out = javaCheck(sol('public double f(int a) { return a == 0 ? 0.1 + 0.2 : 5.0; }'), 'f', '(int a) -> double', [{ args: [0], expect: 0.30000000000000004 }, { args: [1], expect: 5 }], 'function f(a) {}');
    expect(out.passed).toBe(true);
  });
  it('unicode round-trip', () => {
    const out = javaCheck(sol('public String f(String s) { return s + "!"; }'), 'f', '(string s) -> string', [{ args: ['é😀'], expect: 'é😀!' }], 'function f(s) {}');
    expect(out.passed).toBe(true);
  });
  it('ignores debug output', () => {
    const out = javaCheck(sol('public int f(int a) { System.out.println("debug " + a); return a; }'), 'f', '(int a) -> int', [{ args: [7], expect: 7 }], 'function f(a) {}');
    expect(out.passed).toBe(true);
  });
  it('hoists learner imports', () => {
    const learner = 'import java.util.*;\nimport java.util.stream.*;\n' + sol('public List<Integer> f(int[] v) { return Arrays.stream(v).sorted().boxed().collect(Collectors.toList()); }');
    const out = javaCheck(learner, 'f', '(int[] v) -> any', [{ args: [[3, 1, 2]], expect: [1, 2, 3] }], 'function f(v) {}');
    expect(out.passed).toBe(true);
  });
  it('handles nullable trees, nested arrays, maps, and any', () => {
    expect(javaCheck(sol('public int depth(Integer[] values) { return d(buildTree(values)); }\nint d(TreeNode n) { return n == null ? 0 : 1 + Math.max(d(n.left), d(n.right)); }'),
      'depth', '(int?[] values) -> int', [{ args: [[3, 9, 20, null, null, 15, 7]], expect: 3 }], 'class TreeNode {}\nfunction depth(values) {}').passed).toBe(true);
    expect(javaCheck(sol('public int[][] f(int[][] g) { return g; }'), 'f', '(int[][] g) -> int[][]', [{ args: [[[1, 2], [3]]], expect: [[1, 2], [3]] }], 'function f(g) {}').passed).toBe(true);
    expect(javaCheck(sol('public Map<String, Integer> f(Map<String, Integer> m) { m.put("z", 1); return m; }'), 'f', '(map<int> m) -> map<int>', [{ args: [{ a: 2 }], expect: { z: 1, a: 2 } }], 'function f(m) {}').passed).toBe(true);
    expect(javaCheck(sol('public Object f(Object ops) { List<?> l = (List<?>) ops; Map<String, Object> o = new LinkedHashMap<>(); o.put("n", l.size()); o.put("first", ((List<?>) l.get(0)).get(0)); return o; }'),
      'f', '(any ops) -> any', [{ args: [[['push', 5], ['pop']]], expect: { n: 2, first: 'push' } }], 'function f(ops) {}').passed).toBe(true);
  });
  it('reports compile errors on the learner line', () => {
    const out = javaCheck(sol('public int f(int a) { return a + ; }'), 'f', '(int a) -> int', [{ args: [1], expect: 1 }], 'function f(a) {}');
    expect(out.error).toMatch(/Main\.java:2:/);
  });
  it('ignores debug output without a trailing newline', () => {
    const out = javaCheck(sol('public int f(int a) { System.out.print("dbg " + a); return a; }'), 'f', '(int a) -> int', [{ args: [1], expect: 1 }, { args: [2], expect: 2 }], 'function f(a) {}');
    expect(out).toEqual({ passed: true, results: [{ ok: true }, { ok: true }] });
  });
  it('keeps definite assignment in guarded loop conditions', () => {
    const out = javaCheck(sol('public int f(int a) { int y; int i = 0; while ((y = i++) < a) {} return y; }'), 'f', '(int a) -> int', [{ args: [3], expect: 3 }], 'function f(a) {}');
    expect(out.passed).toBe(true);
  });
  it('stops an endless loop instead of hanging', () => {
    const out = javaCheck(sol('public int f(int a) { while (true) { a++; } }'), 'f', '(int a) -> int', [{ args: [1], expect: 1 }], 'function f(a) {}');
    expect(out.timedOut).toBe(true);
  });
  it('list, heap, random-pointer, and graph helpers work', () => {
    expect(javaCheck(sol('public int[] rev(int[] values) { ListNode prev = null, cur = fromArray(values); while (cur != null) { ListNode nx = cur.next; cur.next = prev; prev = cur; cur = nx; } return toArray(prev); }'),
      'rev', '(int[] values) -> int[]', [{ args: [[1, 2, 3]], expect: [3, 2, 1] }], 'class ListNode {}\nfunction rev(values) {}').passed).toBe(true);
    expect(javaCheck(sol('public int[] f(int[] a) { Heap<Integer> h = new Heap<>((x, y) -> y - x); for (int x : a) h.push(x); int[] o = new int[a.length]; for (int i = 0; i < o.length; i++) o[i] = h.pop(); return o; }'),
      'f', '(int[] a) -> int[]', [{ args: [[2, 5, 1]], expect: [5, 2, 1] }], 'class Heap {}\nfunction f(a) {}').passed).toBe(true);
    expect(javaCheck(sol('public Integer[][] f(Integer[][] p) { return serializeRandom(buildRandom(p)); }'),
      'f', '(int?[][] p) -> int?[][]', [{ args: [[[7, null], [13, 0]]], expect: [[7, null], [13, 0]] }], 'class RNode {}\nfunction f(p) {}').passed).toBe(true);
    expect(javaCheck(sol('public int[][] f(int[][] adj) { return graphToAdj(buildGraph(adj)); }'),
      'f', '(int[][] adj) -> int[][]', [{ args: [[[2, 4], [1, 3], [2, 4], [1, 3]]], expect: [[2, 4], [1, 3], [2, 4], [1, 3]] }, { args: [[]], expect: [] }], 'class GNode {}\nfunction f(adj) {}').passed).toBe(true);
  });
});
