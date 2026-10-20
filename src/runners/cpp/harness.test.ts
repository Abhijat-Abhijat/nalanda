import { describe, it, expect } from 'vitest';
import { cppCheck, cppRunProgram } from './testCpp';

const sol = (body: string) => `class Solution {\npublic:\n${body}\n};`;

describe('C++ harness', { timeout: 180_000 }, () => {
  it('passes a correct solution', async () => {
    const out = await cppCheck(sol('bool containsDuplicate(vector<int>& nums) { unordered_set<int> s; for (int n : nums) { if (s.count(n)) return true; s.insert(n); } return false; }'),
      'containsDuplicate', '(int[] nums) -> bool', [{ args: [[1, 2, 3, 1]], expect: true }, { args: [[1, 2]], expect: false }], 'function containsDuplicate(nums) {}');
    expect(out).toEqual({ passed: true, results: [{ ok: true }, { ok: true }] });
  });
  it('reports a wrong value with got', async () => {
    const out = await cppCheck(sol('int f(int a) { return a + 1; }'), 'f', '(int a) -> int', [{ args: [1], expect: 3 }], 'function f(a) {}');
    expect(out.results[0]).toEqual({ ok: false, got: 2 });
  });
  it('numbers round-trip', async () => {
    const out = await cppCheck(sol('double f(int a) { return a == 0 ? 0.1 + 0.2 : 5.0; }'), 'f', '(int a) -> double', [{ args: [0], expect: 0.30000000000000004 }, { args: [1], expect: 5 }], 'function f(a) {}');
    expect(out.passed).toBe(true);
  });
  it('unicode round-trip', async () => {
    const out = await cppCheck(sol('string f(string s) { return s + "!"; }'), 'f', '(string s) -> string', [{ args: ['é😀'], expect: 'é😀!' }], 'function f(s) {}');
    expect(out.passed).toBe(true);
  });
  it('ignores debug output', async () => {
    const out = await cppCheck(sol('int f(int a) { cout << "debug " << a << endl; return a; }'), 'f', '(int a) -> int', [{ args: [7], expect: 7 }], 'function f(a) {}');
    expect(out.passed).toBe(true);
  });
  it('ignores debug output without a trailing newline', async () => {
    const out = await cppCheck(sol('int f(int a) { cout << "dbg " << a; return a; }'), 'f', '(int a) -> int', [{ args: [1], expect: 1 }, { args: [2], expect: 2 }], 'function f(a) {}');
    expect(out).toEqual({ passed: true, results: [{ ok: true }, { ok: true }] });
  });
  it('keeps program output that does not end in a newline', async () => {
    const r = await cppRunProgram(`#include <iostream>
int main() { std::cout << "line1" << std::endl << "tail"; std::cerr << "err"; }`, '');
    expect(r.stdout).toBe(`line1
tail`);
    expect(r.stderr).toBe('err');
  });
  it('hoists learner includes', async () => {
    const learner = '#include <vector>\n#include <algorithm>\nusing namespace std;\n' + sol('vector<int> f(vector<int>& v) { sort(v.begin(), v.end()); return v; }');
    const out = await cppCheck(learner, 'f', '(int[] v) -> int[]', [{ args: [[3, 1, 2]], expect: [1, 2, 3] }], 'function f(v) {}');
    expect(out.passed).toBe(true);
  });
  it('handles nullable trees, maps, and any', async () => {
    const tree = await cppCheck(sol('int depth(vector<optional<int>>& values) { function<int(TreeNode*)> d = [&](TreeNode* n) { return n ? 1 + max(d(n->left), d(n->right)) : 0; }; return d(buildTree(values)); }'),
      'depth', '(int?[] values) -> int', [{ args: [[3, 9, 20, null, null, 15, 7]], expect: 3 }], 'class TreeNode {}\nfunction depth(values) {}');
    expect(tree.passed).toBe(true);
    const mp = await cppCheck(sol('map<string, int> f(map<string, int>& m) { m["z"] = 1; return m; }'), 'f', '(map<int> m) -> map<int>', [{ args: [{ a: 2 }], expect: { z: 1, a: 2 } }], 'function f(m) {}');
    expect(mp.passed).toBe(true);
    const anyOut = await cppCheck(sol('Json f(Json& ops) { Json o = Json::object(); o.set("n", Json((int)ops.size())); o.set("first", ops[0][0]); return o; }'), 'f', '(any ops) -> any', [{ args: [[['push', 5], ['pop']]], expect: { n: 2, first: 'push' } }], 'function f(ops) {}');
    expect(anyOut.passed).toBe(true);
  });
  it('reports compile errors on the learner line', async () => {
    const out = await cppCheck(sol('int f(int a) { return a + ; }'), 'f', '(int a) -> int', [{ args: [1], expect: 1 }], 'function f(a) {}');
    expect(out.error).toMatch(/main\.cpp:3:/);
  });
  it('marks remaining cases when the program crashes', async () => {
    const out = await cppCheck(sol('int f(int a) { if (a == 2) __builtin_trap(); return a; }'), 'f', '(int a) -> int', [{ args: [1], expect: 1 }, { args: [2], expect: 2 }], 'function f(a) {}');
    expect(out.results).toEqual([{ ok: true }, { ok: false, error: 'program crashed' }]);
  });
  it('list, heap, random-pointer, and graph helpers work', async () => {
    const list = await cppCheck(sol('vector<int> rev(vector<int>& values) { ListNode* prev = nullptr; ListNode* cur = fromArray(values); while (cur) { ListNode* nx = cur->next; cur->next = prev; prev = cur; cur = nx; } return toArray(prev); }'),
      'rev', '(int[] values) -> int[]', [{ args: [[1, 2, 3]], expect: [3, 2, 1] }], 'class ListNode {}\nfunction rev(values) {}');
    expect(list.passed).toBe(true);
    const heap = await cppCheck(sol('vector<int> f(vector<int>& a) { Heap<int> h([](const int& x, const int& y) { return y - x; }); for (int x : a) h.push(x); vector<int> o; while (h.size()) o.push_back(h.pop()); return o; }'),
      'f', '(int[] a) -> int[]', [{ args: [[2, 5, 1]], expect: [5, 2, 1] }], 'class Heap {}\nfunction f(a) {}');
    expect(heap.passed).toBe(true);
    const rnd = await cppCheck(sol('vector<vector<optional<int>>> f(vector<vector<optional<int>>>& p) { return serializeRandom(buildRandom(p)); }'),
      'f', '(int?[][] p) -> int?[][]', [{ args: [[[7, null], [13, 0]]], expect: [[7, null], [13, 0]] }], 'class RNode {}\nfunction f(p) {}');
    expect(rnd.passed).toBe(true);
    const g = await cppCheck(sol('vector<vector<int>> f(vector<vector<int>>& adj) { return graphToAdj(buildGraph(adj)); }'),
      'f', '(int[][] adj) -> int[][]', [{ args: [[[2, 4], [1, 3], [2, 4], [1, 3]]], expect: [[2, 4], [1, 3], [2, 4], [1, 3]] }, { args: [[]], expect: [] }], 'class GNode {}\nfunction f(adj) {}');
    expect(g.passed).toBe(true);
  });
});
