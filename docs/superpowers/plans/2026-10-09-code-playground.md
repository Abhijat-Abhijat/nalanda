# Multi-language Code Playground (Phase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Learners run JavaScript, TypeScript, and Python against the same test cases in Algorithms and CS Fundamentals exercises. They also get a `/playground` page for JS, TS, Python, and SQL, all running in the browser.

**Architecture:**
- Each language has a runner in `src/runners/`:
  - JS uses the existing Web Worker approach.
  - TS strips types with sucrase, then runs as JS.
  - Python runs on Pyodide (loaded from jsDelivr) in a reusable Web Worker.
- A single Python harness string (`PY_HARNESS`) checks cases. It is shared by the browser worker and by a Node Vitest suite that verifies every Python reference solution.
- The schema gains `langs` and `py.solution` on `js-code` exercises. The Algorithms `problem()` and CS `topic()` builders set them.

**Tech Stack:** Vite 8, React 19, TypeScript, zod 4, Vitest, Playwright, CodeMirror 6 (`@uiw/react-codemirror`), sucrase 3.35, Pyodide 314.0.7 (npm package for tests, CDN for the browser), sql.js.

**Spec:** `docs/superpowers/specs/2026-10-09-code-playground-design.md`

## Global Constraints

- **Browser-only execution.** No server, no API keys.
- **Pyodide version** lives in one constant, `PYODIDE_VERSION = '314.0.7'`. It must equal the `pyodide` devDependency version.
- **Pyodide CDN base:** `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`.
- **Timeouts:**
  - Python run or check: 5 s.
  - Python first load: 30 s.
  - JS and TS checks: 2 s (existing).
  - JS and TS playground runs: 5 s.
- **Messages, used verbatim:**
  - Python load notice: "Loading Python (about 10 MB, first time only)..."
  - Python load failure: "Couldn't load Python. Check your connection and try again."
  - Timeout: "Stopped after 5 s. Check for an endless loop." The existing JS exercise message "Your code ran too long. Check for an endless loop." stays unchanged for JS and TS.
  - Missing function: "Define a function named `<fnName>`." This is identical in all languages; the JS text already exists.
- **Output limit:** playground stdout and stderr are each truncated at 100 KB (100,000 characters), followed by the line "[output truncated]".
- **localStorage keys:**
  - `nalanda:code:<exerciseId>:<lang>` for exercise code.
  - `nalanda:lang` for the last-used exercise language.
  - `nalanda:play:<lang>` for playground code.
  - Every access is wrapped in try/catch.
- **Editor aria-labels:** "JavaScript editor", "TypeScript editor", "Python editor", "SQL editor". An existing e2e test depends on "JavaScript editor".
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Do not edit** the user's permission or hook settings (GateGuard, `ECC_GATEGUARD`, `ECC_DISABLED_HOOKS`).
- **Content prose** is plain British-leaning English, matching the existing lessons. Chat replies stay terse.

## Review Focus

1. **A learner's Python function mutates its input list.** Every case must get fresh args, because the harness `json.loads` per case. Test: Task 2 `fresh args per case`.
2. **Python returns `True` where JS expects `1`, or returns a float like `2.0` where `2` is expected.** Booleans must stay booleans, and whole floats become ints. Test: Task 2 `normalise`.
3. **A Python run times out, then the learner runs again.** The second run must work, on a fresh worker, without a page reload. Test: Task 8 e2e `python timeout then rerun`.
4. **A learner switches tabs JS → Python → JS.** Each tab keeps its own code. Test: Task 5 unit test `codeStore keeps per-language code`.
5. **localStorage throws (private mode).** The runner still renders with starter code. Test: Task 5 `codeStore survives throwing storage`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/schema.ts` (modify) | `JsEx` gains `langs?` and `py?` |
| `src/content/validate.ts` (modify) | Rule: `langs` includes `'py'` requires `py.solution` |
| `src/content/helpers.ts` (modify) | `jsEx(..., py?)` sets `langs` and `py` |
| `src/content/algorithms/h.ts`, `src/content/cs/h.ts` (modify) | Pass `ex.py` through |
| `src/runners/types.ts` | Shared types `Lang`, `Case`, `CaseOutcome`, `RunResult` |
| `src/runners/py/harness.ts` | `PY_HARNESS` Python source, `PYODIDE_VERSION`, `PYODIDE_CDN` |
| `src/runners/py/preludes.ts` | Python `ListNode`/`TreeNode`/`Heap` helpers, `preludeFor(jsStarter)`, `pyStarter(fnName, jsStarter)` |
| `src/runners/py/worker.ts` | Module worker: loads Pyodide, runs harness calls |
| `src/runners/py/client.ts` | Main-thread client: one reusable worker, timeouts, status |
| `src/runners/ts/strip.ts` | `stripTypes(code)` via sucrase |
| `src/runners/js/programWorker.ts` | Worker for playground JS runs (console capture, `input()`) |
| `src/runners/index.ts` | `getRunner(lang)` lazy registry, `clip()` |
| `src/runners/codeStore.ts` | Safe localStorage get and set |
| `src/exercises/js-code/Runner.tsx` (modify) | Language tabs, helpers panel, reset |
| `src/exercises/solutions.ts` (modify) | TS transpile check |
| `src/pages/PlaygroundPage.tsx` | `/playground` page |
| `src/App.tsx`, `src/ui/Layout.tsx`, `src/styles/app.css` (modify) | Route, nav link, styles |
| `src/runners/py/py-solutions.test.ts` | Runs every `py.solution` in Node Pyodide |
| `e2e/playground.spec.ts` | Playground and Python exercise e2e tests |

Note on the spec: spec §1 lists `sql` as a `LangRunner`. The plan instead calls the existing `runQuery` directly from the playground, because SQL returns tables, not text, and no other caller needs a SQL `LangRunner`. Ledger this as a ruling.

---

### Task 1: Schema, validation, and builder wiring

**Files:**
- Modify: `src/schema.ts` (the `JsEx` object, around line 94)
- Modify: `src/content/validate.ts:10-16` (`checkTask`)
- Modify: `src/content/helpers.ts:32-33` (`jsEx`)
- Modify: `src/content/algorithms/h.ts` (`Problem.ex` type and the `problem()` exercise line)
- Modify: `src/content/cs/h.ts` (`Topic.ex` type and the `topic()` exercise line)
- Test: `src/schema.test.ts` (add a case), `src/content/validate.test.ts` (create if absent; otherwise add)

**Interfaces:**
- Produces:
  - `JsEx.langs?: ('js'|'ts'|'py')[]` and `JsEx.py?: { solution: string }`.
  - `jsEx(id, conceptId, prompt, fnName, starter, cases, solution, hint, py?: string): JsEx`. When `py` is given, it returns `langs: ['js','ts','py']` and `py: { solution: py }`.
  - The `Problem.ex.py?: string` and `Topic.ex.py?: string` fields.

- [ ] **Step 1: Write the failing tests**

Append to `src/content/validate.test.ts`. Create it with these imports if it does not exist.

```ts
import { describe, it, expect } from 'vitest';
import { validateWorlds } from './validate';
import { jsEx } from './helpers';
import type { World } from '../schema';

const worldWith = (ex: ReturnType<typeof jsEx>): World => ({
  id: 'w', title: 'W', hue: '#000000', tagline: 't', intro: [],
  chapters: [{ id: 'c', title: 'C', summary: 's', exam: [], lessons: [{ id: 'l1', title: 'L', conceptIds: ['k'], story: [], layers: [], exercise: ex, quiz: [] }] }],
  boss: { title: 'B', steps: [] },
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
```

Before running, read `src/schema.ts` and check that the `World`, `Chapter`, and `Lesson` field names used in `worldWith` match. Adjust them if they differ; the cast keeps this test independent of unrelated required fields.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/content/validate.test.ts`
Expected: FAIL. `jsEx` takes no 9th argument, and `langs` is undefined or a TS error.

- [ ] **Step 3: Implement**

In `src/schema.ts`, inside `JsEx`, after `hint: z.string().min(1),` add:

```ts
  langs: z.array(z.enum(['js', 'ts', 'py'])).optional(),
  py: z.object({ solution: z.string().min(1) }).optional(),
```

In `src/content/helpers.ts`, replace `jsEx`:

```ts
export const jsEx = (id: string, conceptId: string, prompt: string, fnName: string, starter: string, cases: JsEx['cases'], solution: string, hint: string, py?: string): JsEx =>
  ({ kind: 'js-code', id, conceptId, prompt, fnName, starter, cases, solution, hint, ...(py ? { langs: ['js', 'ts', 'py'] as JsEx['langs'], py: { solution: py } } : {}) });
```

In `src/content/validate.ts`, inside `checkTask`, add:

```ts
    if (t.kind === 'js-code' && t.langs?.includes('py') && !t.py?.solution) errors.push(`python exercise needs py.solution at ${where}`);
```

In `src/content/algorithms/h.ts`:
- Add `py?: string` to `Problem['ex']`.
- Change the exercise line to pass `p.ex.py` as the last argument of `jsEx(...)`.

In `src/content/cs/h.ts`:
- Add `py?: string` to `Topic['ex']`.
- Pass `t.ex.py` as the last argument of `jsEx(...)`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/content && npx tsc --noEmit -p .`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/schema.ts src/content/validate.ts src/content/validate.test.ts src/content/helpers.ts src/content/algorithms/h.ts src/content/cs/h.ts
git commit -m "Add optional Python language fields to code exercises

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Python harness, preludes, and starter generation (verified in Node Pyodide)

**Files:**
- Create: `src/runners/types.ts`, `src/runners/py/harness.ts`, `src/runners/py/preludes.ts`
- Create: `src/runners/py/testPyodide.ts` (Node-only test helper)
- Test: `src/runners/py/harness.test.ts`
- Modify: `package.json` (devDependency `pyodide@314.0.7`)

**Interfaces:**
- Produces:
  - `types.ts`:
    ```ts
    export type Lang = 'js' | 'ts' | 'py';
    export type Case = { args: unknown[]; expect: unknown };
    export type CaseResult = { ok: boolean; got?: unknown; error?: string };
    export type CaseOutcome = { passed: boolean; results: CaseResult[]; error?: string; timedOut?: boolean };
    export type RunResult = { stdout: string; stderr: string; ms: number; timedOut?: boolean };
    ```
  - `harness.ts`:
    - `PYODIDE_VERSION`, `PYODIDE_CDN`, and `PY_HARNESS: string`.
    - `PY_HARNESS` defines the Python functions `run_cases(code: str, fn_name: str, cases_json: str, offset: int) -> str` (returns CaseOutcome JSON) and `run_program(code: str) -> None` (prints a traceback to stderr on error).
  - `preludes.ts`:
    - `preludeFor(jsStarter: string): string` returns the Python helper source, or `''`.
    - `pyStarter(fnName: string, jsStarter: string): string`.
    - `lineCount(s: string): number`.
  - `testPyodide.ts`: `getTestPyodide(): Promise<PyodideInterface>` (cached), and `pyRunCases(code, fnName, cases, jsStarter): Promise<CaseOutcome>`.

- [ ] **Step 1: Install the test dependency**

Run: `npm i -D pyodide@314.0.7`
Expected: `package.json` devDependencies include `"pyodide": "314.0.7"`. If npm reports that version is missing, run `npm view pyodide version`, use that version in both `package.json` and `PYODIDE_VERSION`, and ledger the change.

- [ ] **Step 2: Write the failing tests** (`src/runners/py/harness.test.ts`)

```ts
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
  it('fresh args per case', async () => {
    const code = 'def f(a):\n    a.append(9)\n    return len(a)';
    const out = await pyRunCases(code, 'f', [{ args: [[1]], expect: 2 }, { args: [[1]], expect: 2 }], 'function f(a) {}');
    expect(out.passed).toBe(true);
  });
  it('reports wrong value with got', async () => {
    const out = await pyRunCases('def f():\n    return 4', 'f', [{ args: [], expect: 5 }], 'function f() {}');
    expect(out.results[0]).toEqual({ ok: false, got: 4 });
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
  it('builds a Python stub from the JS signature', () => {
    expect(pyStarter('reverseList', LIST_STARTER)).toBe('def reverseList(values):\n    # your code\n    pass\n');
    expect(pyStarter('combine', 'function combine(n, k) {\n}')).toBe('def combine(n, k):\n    # your code\n    pass\n');
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run src/runners/py/harness.test.ts`
Expected: FAIL. The modules `./testPyodide` and `./preludes` are not found.

- [ ] **Step 4: Implement**

`src/runners/types.ts`: the exact type block shown in Interfaces.

`src/runners/py/harness.ts`:

```ts
export const PYODIDE_VERSION = '314.0.7';
export const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Python source shared by the browser worker and the Node test suite.
export const PY_HARNESS = String.raw`
import json, sys, traceback
sys.setrecursionlimit(3000)

def _norm(v):
    if v is None or isinstance(v, (bool, str)):
        return v
    if isinstance(v, float):
        return int(v) if v.is_integer() and abs(v) < 2**53 else v
    if isinstance(v, int):
        return v
    if isinstance(v, (list, tuple)):
        return [_norm(x) for x in v]
    if isinstance(v, (set, frozenset)):
        return sorted(_norm(x) for x in v)
    if isinstance(v, dict):
        return {str(k): _norm(x) for k, x in v.items()}
    return repr(v)

def _canon(v):
    return json.dumps(v, separators=(',', ':'), ensure_ascii=False)

def _describe(e, offset):
    line = None
    if isinstance(e, SyntaxError) and e.filename == '<learner>':
        line = e.lineno
    else:
        for fr in traceback.extract_tb(e.__traceback__):
            if fr.filename == '<learner>':
                line = fr.lineno
    msg = type(e).__name__ + ': ' + (e.msg if isinstance(e, SyntaxError) else str(e))
    if line is not None:
        msg += ' (line ' + str(max(1, line - offset)) + ')'
    return msg

def run_cases(code, fn_name, cases_json, offset):
    ns = {'__name__': '__learner__'}
    try:
        exec(compile(code, '<learner>', 'exec'), ns)
    except BaseException as e:
        return json.dumps({'passed': False, 'results': [], 'error': _describe(e, offset)})
    fn = ns.get(fn_name)
    if not callable(fn):
        return json.dumps({'passed': False, 'results': [], 'error': 'Define a function named ' + fn_name + '.'})
    results = []
    for c in json.loads(cases_json):
        try:
            got = _norm(fn(*c['args']))
            if _canon(got) == _canon(_norm(c['expect'])):
                results.append({'ok': True})
            else:
                results.append({'ok': False, 'got': got})
        except Exception as e:
            results.append({'ok': False, 'error': _describe(e, offset)})
    return json.dumps({'passed': all(r['ok'] for r in results), 'results': results})

def run_program(code):
    try:
        exec(compile(code, '<learner>', 'exec'), {'__name__': '__main__'})
    except BaseException:
        etype, e, tb = sys.exc_info()
        frames = [f for f in traceback.extract_tb(tb) if f.filename == '<learner>']
        print('Traceback (most recent call last):', file=sys.stderr)
        print(''.join(traceback.format_list(frames)), end='', file=sys.stderr)
        print(''.join(traceback.format_exception_only(etype, e)), end='', file=sys.stderr)
`;
```

`src/runners/py/preludes.ts`:

```ts
const PY_LIST = `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def fromArray(a):
    head = None
    for v in reversed(a):
        head = ListNode(v, head)
    return head

def toArray(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out`;

const PY_TREE = `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def buildTree(a):
    if not a or a[0] is None:
        return None
    root = TreeNode(a[0])
    q = deque([root])
    i = 1
    while q and i < len(a):
        n = q.popleft()
        if i < len(a) and a[i] is not None:
            n.left = TreeNode(a[i])
            q.append(n.left)
        i += 1
        if i < len(a) and a[i] is not None:
            n.right = TreeNode(a[i])
            q.append(n.right)
        i += 1
    return root

def treeToArray(root):
    out, q = [], deque([root])
    while q:
        n = q.popleft()
        if n:
            out.append(n.val)
            q.append(n.left)
            q.append(n.right)
        else:
            out.append(None)
    while out and out[-1] is None:
        out.pop()
    return out`;

const PY_HEAP = `class Heap:
    """Binary heap; cmp(a, b) < 0 means a comes out first. Default: min-heap."""
    def __init__(self, cmp=lambda a, b: a - b):
        self.a = []
        self.cmp = cmp
    def size(self):
        return len(self.a)
    def peek(self):
        return self.a[0] if self.a else None
    def push(self, x):
        a = self.a
        a.append(x)
        i = len(a) - 1
        while i > 0:
            p = (i - 1) // 2
            if self.cmp(a[i], a[p]) >= 0:
                break
            a[i], a[p] = a[p], a[i]
            i = p
    def pop(self):
        a = self.a
        if not a:
            return None
        top = a[0]
        last = a.pop()
        if a:
            a[0] = last
            i = 0
            while True:
                l, r, m = 2 * i + 1, 2 * i + 2, i
                if l < len(a) and self.cmp(a[l], a[m]) < 0: m = l
                if r < len(a) and self.cmp(a[r], a[m]) < 0: m = r
                if m == i: break
                a[i], a[m] = a[m], a[i]
                i = m
        return top`;

export function preludeFor(jsStarter: string): string {
  const parts: string[] = [];
  if (jsStarter.includes('class ListNode')) parts.push(PY_LIST);
  if (jsStarter.includes('class TreeNode')) parts.push(PY_TREE);
  if (jsStarter.includes('class Heap')) parts.push(PY_HEAP);
  return parts.join('\n\n');
}

export const lineCount = (s: string) => (s ? s.split('\n').length : 0);

export function pyStarter(fnName: string, jsStarter: string): string {
  const m = new RegExp(`function\\s+${fnName}\\s*\\(([^)]*)\\)`).exec(jsStarter);
  const params = (m?.[1] ?? '').split(',').map((p) => p.trim().replace(/\s*=.*$/, '')).filter(Boolean).join(', ');
  return `def ${fnName}(${params}):\n    # your code\n    pass\n`;
}

// Learner code with the helper prelude in front, plus the prelude's line count so errors point at the learner's line.
export function withPrelude(code: string, jsStarter: string): { source: string; offset: number } {
  const pre = preludeFor(jsStarter);
  return pre ? { source: `${pre}\n\n${code}`, offset: lineCount(pre) + 1 } : { source: code, offset: 0 };
}
```

`src/runners/py/testPyodide.ts` (only imported by tests; Node resolves `pyodide` from `node_modules`):

```ts
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { PY_HARNESS } from './harness';
import { withPrelude } from './preludes';
import type { Case, CaseOutcome } from '../types';

let cached: Promise<PyodideInterface> | null = null;
export function getTestPyodide() {
  return (cached ??= loadPyodide().then((py) => { py.runPython(PY_HARNESS); return py; }));
}

export async function pyRunCases(code: string, fnName: string, cases: Case[], jsStarter: string): Promise<CaseOutcome> {
  const py = await getTestPyodide();
  const { source, offset } = withPrelude(code, jsStarter);
  return JSON.parse(py.globals.get('run_cases')(source, fnName, JSON.stringify(cases), offset));
}
```

Line-offset check: with a prelude of N lines, the source is `prelude + '\n\n' + code`. The learner's line 1 sits at source line N + 2, so offset = N + 1. This is what `withPrelude` returns.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/runners/py/harness.test.ts`
Expected: PASS (11 tests). The first test may take 5–20 s while Pyodide loads.

If `setStdin({ stdin })` semantics differ in this Pyodide version, read `node_modules/pyodide/pyodide.d.ts` for `setStdin` and adapt only the test's stdin wiring. Ledger it, because Task 4's worker uses the same call.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/runners
git commit -m "Add Python harness, helper preludes, and starter generation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: TypeScript stripping and the TS check in solution tests

**Files:**
- Create: `src/runners/ts/strip.ts`
- Test: `src/runners/ts/strip.test.ts`
- Modify: `src/exercises/solutions.ts` (the `js-code` case)
- Modify: `package.json` (dependency `sucrase@^3.35.1`)

**Interfaces:**
- Produces: `stripTypes(code: string): string`. It throws sucrase's error on a syntax error.

- [ ] **Step 1: Install**

Run: `npm i sucrase@^3.35.1`

- [ ] **Step 2: Write the failing test**

```ts
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
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run src/runners/ts/strip.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement**

`src/runners/ts/strip.ts`:

```ts
import { transform } from 'sucrase';

// Type-only removal; sucrase preserves line numbers, so error lines still match the learner's code.
export const stripTypes = (code: string) => transform(code, { transforms: ['typescript'], disableESTransforms: true }).code;
```

In `src/exercises/solutions.ts`:
- Add `import { stripTypes } from '../runners/ts/strip';`.
- Replace the `js-code` line with:

```ts
    case 'js-code':
      return runCases(task.solution, task.fnName, task.cases).passed
        && (!task.langs?.includes('ts') || runCases(stripTypes(task.solution), task.fnName, task.cases).passed);
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/runners/ts src/content`
Expected: PASS. The content suite still passes, because no exercise has `langs` yet.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/runners/ts src/exercises/solutions.ts
git commit -m "Strip TypeScript types with sucrase and check TS solutions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Browser runners (Python worker and client, JS program worker, registry)

**Files:**
- Create: `src/runners/py/worker.ts`, `src/runners/py/client.ts`, `src/runners/js/programWorker.ts`, `src/runners/index.ts`
- Test: `src/runners/index.test.ts` (covers `clip` only; the worker paths are exercised by e2e in Task 8)

**Interfaces:**
- Consumes: `PY_HARNESS`, `PYODIDE_CDN` (Task 2); `withPrelude` (Task 2); `stripTypes` (Task 3); `runInWorker` (existing, `src/exercises/js-code/runInWorker.ts`); types from `src/runners/types.ts`.
- Produces:
  - `src/runners/index.ts`:
    ```ts
    export type PyStatus = 'idle' | 'loading' | 'ready' | 'error';
    export const LANG_LABEL: Record<Lang, string>; // { js: 'JavaScript', ts: 'TypeScript', py: 'Python' }
    export function clip(s: string, limit?: number): string; // default 100_000
    export function runProgram(lang: Lang, code: string, stdin: string): Promise<RunResult>;
    export function checkCases(lang: Lang, code: string, fnName: string, cases: Case[], jsStarter: string): Promise<CaseOutcome>;
    export function ensurePython(): Promise<void>; // rejects with Error('Couldn't load Python. Check your connection and try again.')
    export function onPyStatus(cb: (s: PyStatus) => void): () => void; // returns unsubscribe; calls cb immediately with the current status
    ```
  - For JS and TS, `checkCases` maps the existing `{ timedOut: true }` result to `{ passed: false, results: [], timedOut: true }`.

- [ ] **Step 1: Write the failing test** (`src/runners/index.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { clip, LANG_LABEL } from './index';

describe('runner registry helpers', () => {
  it('clips long output with a notice', () => {
    expect(clip('abcdef', 3)).toBe('abc\n[output truncated]');
    expect(clip('abc', 3)).toBe('abc');
  });
  it('labels languages', () => {
    expect(LANG_LABEL).toEqual({ js: 'JavaScript', ts: 'TypeScript', py: 'Python' });
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/runners/index.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the Python worker** (`src/runners/py/worker.ts`)

```ts
/// <reference lib="webworker" />
import { PY_HARNESS, PYODIDE_CDN } from './harness';

type Msg =
  | { id: number; type: 'init' }
  | { id: number; type: 'cases'; source: string; offset: number; fnName: string; cases: string }
  | { id: number; type: 'program'; code: string; stdin: string };

let pyPromise: Promise<any> | null = null;
const getPy = () => (pyPromise ??= (async () => {
  const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_CDN}pyodide.mjs`);
  const py = await loadPyodide({ indexURL: PYODIDE_CDN });
  py.runPython(PY_HARNESS);
  return py;
})());

self.onmessage = async (e: MessageEvent<Msg>) => {
  const m = e.data;
  try {
    const py = await getPy();
    if (m.type === 'init') return self.postMessage({ id: m.id, ok: true });
    if (m.type === 'cases') {
      py.setStdout({ batched: () => {} }); py.setStderr({ batched: () => {} });
      return self.postMessage({ id: m.id, ok: true, outcome: JSON.parse(py.globals.get('run_cases')(m.source, m.fnName, m.cases, m.offset)) });
    }
    const out: string[] = []; const err: string[] = [];
    const lines = m.stdin.split('\n');
    py.setStdout({ batched: (s: string) => out.push(s) });
    py.setStderr({ batched: (s: string) => err.push(s) });
    py.setStdin({ stdin: () => lines.shift() });
    py.globals.get('run_program')(m.code);
    self.postMessage({ id: m.id, ok: true, stdout: out.join('\n'), stderr: err.join('\n') });
  } catch (error) {
    pyPromise = null;
    self.postMessage({ id: m.id, ok: false, error: String(error) });
  }
};
```

- [ ] **Step 4: Implement the Python client** (`src/runners/py/client.ts`)

```ts
import type { Case, CaseOutcome, RunResult } from '../types';
import { withPrelude } from './preludes';

export type PyStatus = 'idle' | 'loading' | 'ready' | 'error';
const LOAD_FAIL = "Couldn't load Python. Check your connection and try again.";
let worker: Worker | null = null;
let status: PyStatus = 'idle';
let nextId = 1;
const listeners = new Set<(s: PyStatus) => void>();
const setStatus = (s: PyStatus) => { status = s; listeners.forEach((cb) => cb(s)); };

export function onPyStatus(cb: (s: PyStatus) => void) { listeners.add(cb); cb(status); return () => { listeners.delete(cb); }; }

function kill() { worker?.terminate(); worker = null; setStatus('idle'); }

// One request on the shared worker; on timeout the worker is killed so the next call starts fresh.
function call<T>(msg: Record<string, unknown>, timeoutMs: number): Promise<T | { timedOut: true }> {
  worker ??= new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const w = worker; const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { w.removeEventListener('message', onMsg); kill(); resolve({ timedOut: true }); }, timeoutMs);
    function onMsg(e: MessageEvent) {
      if (e.data.id !== id) return;
      clearTimeout(timer); w.removeEventListener('message', onMsg);
      if (e.data.ok) resolve(e.data as T); else reject(new Error(e.data.error));
    }
    w.addEventListener('message', onMsg);
    w.postMessage({ ...msg, id });
  });
}

export async function ensurePython(): Promise<void> {
  if (status === 'ready') return;
  setStatus('loading');
  try {
    const r = await call<{ ok: true }>({ type: 'init' }, 30_000);
    if ('timedOut' in r) throw new Error('timeout');
    setStatus('ready');
  } catch {
    kill(); setStatus('error');
    throw new Error(LOAD_FAIL);
  }
}

export async function pyCheck(code: string, fnName: string, cases: Case[], jsStarter: string): Promise<CaseOutcome> {
  await ensurePython();
  const { source, offset } = withPrelude(code, jsStarter);
  const r = await call<{ outcome: CaseOutcome }>({ type: 'cases', source, offset, fnName, cases: JSON.stringify(cases) }, 5_000);
  return 'timedOut' in r ? { passed: false, results: [], timedOut: true } : r.outcome;
}

export async function pyRun(code: string, stdin: string): Promise<RunResult> {
  await ensurePython();
  const t0 = performance.now();
  const r = await call<{ stdout: string; stderr: string }>({ type: 'program', code, stdin }, 5_000);
  const ms = Math.round(performance.now() - t0);
  return 'timedOut' in r ? { stdout: '', stderr: '', ms, timedOut: true } : { stdout: r.stdout, stderr: r.stderr, ms };
}
```

- [ ] **Step 5: Implement the JS program worker** (`src/runners/js/programWorker.ts`)

```ts
/// <reference lib="webworker" />
const fmt = (a: unknown) => (typeof a === 'string' ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })());

self.onmessage = (e: MessageEvent<{ code: string; stdin: string }>) => {
  const out: string[] = []; const err: string[] = [];
  const lines = e.data.stdin.split('\n');
  const cons = { log: (...a: unknown[]) => out.push(a.map(fmt).join(' ')), error: (...a: unknown[]) => err.push(a.map(fmt).join(' ')) };
  try {
    new Function('console', 'input', e.data.code)({ ...cons, info: cons.log, warn: cons.error }, () => lines.shift() ?? null);
  } catch (x) {
    err.push(x instanceof Error ? `${x.name}: ${x.message}` : String(x));
  }
  self.postMessage({ stdout: out.join('\n'), stderr: err.join('\n') });
};
```

- [ ] **Step 6: Implement the registry** (`src/runners/index.ts`)

```ts
import type { Case, CaseOutcome, Lang, RunResult } from './types';
import { runInWorker } from '../exercises/js-code/runInWorker';
export { onPyStatus, ensurePython, type PyStatus } from './py/client';

export const LANG_LABEL: Record<Lang, string> = { js: 'JavaScript', ts: 'TypeScript', py: 'Python' };
export const clip = (s: string, limit = 100_000) => (s.length > limit ? `${s.slice(0, limit)}\n[output truncated]` : s);

async function toJs(lang: Lang, code: string) {
  if (lang !== 'ts') return code;
  const { stripTypes } = await import('./ts/strip');
  return stripTypes(code);
}

export async function checkCases(lang: Lang, code: string, fnName: string, cases: Case[], jsStarter: string): Promise<CaseOutcome> {
  if (lang === 'py') return (await import('./py/client')).pyCheck(code, fnName, cases, jsStarter);
  let js: string;
  try { js = await toJs(lang, code); } catch (e) { return { passed: false, results: [], error: e instanceof Error ? e.message : String(e) }; }
  const r = await runInWorker(js, fnName, cases);
  return 'timedOut' in r ? { passed: false, results: [], timedOut: true } : r;
}

export async function runProgram(lang: Lang, code: string, stdin: string): Promise<RunResult> {
  if (lang === 'py') {
    const r = await (await import('./py/client')).pyRun(code, stdin);
    return { ...r, stdout: clip(r.stdout), stderr: clip(r.stderr) };
  }
  let js: string;
  try { js = await toJs(lang, code); } catch (e) { return { stdout: '', stderr: e instanceof Error ? e.message : String(e), ms: 0 }; }
  const t0 = performance.now();
  return new Promise((resolve) => {
    const w = new Worker(new URL('./js/programWorker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => { w.terminate(); resolve({ stdout: '', stderr: '', ms: 5000, timedOut: true }); }, 5_000);
    w.onmessage = (e: MessageEvent<{ stdout: string; stderr: string }>) => {
      clearTimeout(timer); w.terminate();
      resolve({ stdout: clip(e.data.stdout), stderr: clip(e.data.stderr), ms: Math.round(performance.now() - t0) });
    };
  });
}
```

Note: `index.ts` re-exports from `./py/client`, which pulls a small client module into the importer's chunk, but not Pyodide. Pyodide loads only inside the worker from the CDN.

- [ ] **Step 7: Run tests, types, and build**

Run: `npx vitest run src/runners && npx tsc --noEmit -p . && npm run -s build`
Expected: tests PASS, no type errors, build succeeds. The build output lists separate worker chunks.

- [ ] **Step 8: Commit**

```bash
git add src/runners
git commit -m "Add browser runners for Python, TypeScript, and JavaScript programs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Language tabs in the code exercise runner

**Files:**
- Create: `src/runners/codeStore.ts`
- Test: `src/runners/codeStore.test.ts`
- Modify: `src/exercises/js-code/Runner.tsx` (full rewrite below)
- Modify: `src/styles/app.css` (append styles)
- Modify: `package.json` (dependency `@codemirror/lang-python@^6.2.1`)

**Interfaces:**
- Consumes:
  - `checkCases`, `ensurePython`, `onPyStatus`, `LANG_LABEL` (Task 4)
  - `pyStarter`, `preludeFor` (Task 2)
  - `JsEx.langs` (Task 1)
- Produces:
  - `codeStore.get(key: string): string | null`
  - `codeStore.set(key: string, value: string): void`
  - `codeStore.remove(key: string): void`
  - None of these ever throw.

- [ ] **Step 1: Install**

Run: `npm i @codemirror/lang-python@^6.2.1`

- [ ] **Step 2: Write the failing test** (`src/runners/codeStore.test.ts`)

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { codeStore } from './codeStore';

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe('codeStore', () => {
  it('codeStore keeps per-language code', () => {
    codeStore.set('nalanda:code:x:js', 'js code');
    codeStore.set('nalanda:code:x:py', 'py code');
    expect(codeStore.get('nalanda:code:x:js')).toBe('js code');
    expect(codeStore.get('nalanda:code:x:py')).toBe('py code');
    codeStore.remove('nalanda:code:x:py');
    expect(codeStore.get('nalanda:code:x:py')).toBeNull();
  });
  it('codeStore survives throwing storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(codeStore.get('k')).toBeNull();
    expect(() => codeStore.set('k', 'v')).not.toThrow();
  });
});
```

Check `vite.config.ts` / the vitest config for `environment: 'jsdom'` (or `happy-dom`). If the default environment is `node`, add `// @vitest-environment jsdom` as the file's first line. Existing UI tests such as `src/ui/QuestionView.test.tsx` show which environment the repo uses.

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run src/runners/codeStore.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement `codeStore`**

```ts
export const codeStore = {
  get(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* storage unavailable: keep in memory only */ } },
  remove(key: string) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};
```

- [ ] **Step 5: Rewrite `src/exercises/js-code/Runner.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';
import type { JsEx } from '../../schema';
import type { RunnerProps } from '../registry';
import { Md } from '../../ui/Md';
import { checkCases, ensurePython, onPyStatus, LANG_LABEL, type PyStatus } from '../../runners';
import { codeStore } from '../../runners/codeStore';
import { preludeFor, pyStarter } from '../../runners/py/preludes';
import type { CaseResult, Lang } from '../../runners/types';

const LANG_KEY = 'nalanda:lang';
const editorExt = (lang: Lang) => [
  lang === 'py' ? python() : javascript({ typescript: lang === 'ts' }),
  EditorView.contentAttributes.of({ 'aria-label': `${LANG_LABEL[lang]} editor` }),
];

export default function JsRunner({ exercise, onAttempt }: RunnerProps<JsEx>) {
  const langs: Lang[] = exercise.langs ?? ['js'];
  const starterFor = (l: Lang) => (l === 'py' ? pyStarter(exercise.fnName, exercise.starter) : exercise.starter);
  const keyFor = (l: Lang) => `nalanda:code:${exercise.id}:${l}`;
  const [lang, setLang] = useState<Lang>(() => {
    const saved = codeStore.get(LANG_KEY) as Lang | null;
    return saved && langs.includes(saved) ? saved : langs[0];
  });
  const [code, setCode] = useState(() => codeStore.get(keyFor(lang)) ?? starterFor(lang));
  const [results, setResults] = useState<CaseResult[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [running, setRunning] = useState(false);
  const [pyStatus, setPyStatus] = useState<PyStatus>('idle');
  const prelude = useMemo(() => (lang === 'py' ? preludeFor(exercise.starter) : ''), [lang, exercise.starter]);

  useEffect(() => onPyStatus(setPyStatus), []);
  useEffect(() => { if (lang === 'py') ensurePython().catch(() => {}); }, [lang]);

  const clearResults = () => { setResults(null); setPassed(null); setMessage(null); };
  const switchTo = (l: Lang) => {
    setLang(l); codeStore.set(LANG_KEY, l);
    setCode(codeStore.get(keyFor(l)) ?? starterFor(l)); clearResults();
  };
  const edit = (v: string) => { setCode(v); codeStore.set(keyFor(lang), v); };
  const reset = () => { codeStore.remove(keyFor(lang)); setCode(starterFor(lang)); clearResults(); };

  const check = async () => {
    setRunning(true);
    try {
      const out = await checkCases(lang, code, exercise.fnName, exercise.cases, exercise.starter);
      if (out.timedOut) {
        setResults(null); setPassed(false);
        setMessage(lang === 'py' ? 'Stopped after 5 s. Check for an endless loop.' : 'Your code ran too long. Check for an endless loop.');
        onAttempt(false);
        return;
      }
      setResults(out.results); setPassed(out.passed); setMessage(out.error ?? null);
      onAttempt(out.passed);
    } catch (e) {
      setResults(null); setPassed(null); setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const pyBusy = lang === 'py' && pyStatus === 'loading';
  return (
    <div className="js-runner">
      <Md md={exercise.prompt} />
      {langs.length > 1 && (
        <div className="lang-tabs" role="tablist" aria-label="Language">
          {langs.map((l) => (
            <button key={l} type="button" role="tab" aria-selected={l === lang} className={l === lang ? 'active' : ''} onClick={() => switchTo(l)}>{LANG_LABEL[l]}</button>
          ))}
        </div>
      )}
      {prelude && (
        <details className="helpers">
          <summary>Helpers provided</summary>
          <pre><code>{prelude}</code></pre>
        </details>
      )}
      {pyBusy && <p className="muted" role="status">Loading Python (about 10 MB, first time only)...</p>}
      {lang === 'py' && pyStatus === 'error' && (
        <p className="feedback bad" role="alert">
          Couldn't load Python. Check your connection and try again.{' '}
          <button type="button" onClick={() => ensurePython().catch(() => {})}>Retry</button>
        </p>
      )}
      <CodeMirror value={code} height="200px" extensions={editorExt(lang)} onChange={edit} />
      <div className="row">
        <button type="button" className="primary" disabled={running || pyBusy} onClick={check}>Check answer</button>
        <button type="button" onClick={() => setShowHint((v) => !v)}>{showHint ? 'Hide hint' : 'Show hint'}</button>
        <button type="button" onClick={reset}>Reset</button>
      </div>
      {showHint && <p className="callout tip">{exercise.hint}</p>}
      {message && <p className="feedback bad" role="alert">{message}</p>}
      {passed && <p className="feedback good" role="status">All cases passed.</p>}
      {results && (
        <ul>
          {results.map((r, i) => (
            <li key={i}>
              Case {i + 1}: {r.ok ? 'passed' : r.error ? `error: ${r.error}` : `expected ${JSON.stringify(exercise.cases[i].expect)}, got ${JSON.stringify(r.got)}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Key-reuse note: `LessonPage` and `BossPage` must remount the runner per exercise. Check the existing `TaskRunner` usage for a `key={task.id}`. If it is missing, add `key={task.id}` where `TaskRunner` is rendered, so state does not leak between exercises.

- [ ] **Step 6: Append styles to `src/styles/app.css`**

```css
.lang-tabs { display: flex; gap: 0.25rem; margin: 0.75rem 0 0.5rem; flex-wrap: wrap; }
.lang-tabs button { border-radius: 999px; padding: 0.3rem 0.9rem; }
.lang-tabs button.active { background: var(--ink, currentColor); color: var(--bg, #fff); }
.helpers { margin: 0.5rem 0; }
.helpers pre { max-height: 16rem; overflow: auto; font-size: 0.8rem; }
```

Before saving, open `src/styles/tokens.css` and replace `var(--ink, ...)` and `var(--bg, ...)` with the token names the repo actually defines for text and background.

- [ ] **Step 7: Run the tests and e2e**

Run: `npx vitest run && npx tsc --noEmit -p . && npx playwright test`
Expected: vitest all PASS (170 existing plus the new ones), e2e 7/7. The JS-only exercises look as before except for the new Reset button.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/runners/codeStore.ts src/runners/codeStore.test.ts src/exercises/js-code/Runner.tsx src/styles/app.css
git commit -m "Add language tabs, saved code, and Python support to code exercises

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Playground page

**Files:**
- Create: `src/pages/PlaygroundPage.tsx`
- Modify: `src/App.tsx` (lazy route `/playground`)
- Modify: `src/ui/Layout.tsx:21-25` (nav link)
- Modify: `src/styles/app.css` (append)

**Interfaces:**
- Consumes:
  - `runProgram`, `ensurePython`, `onPyStatus`, `LANG_LABEL` (Task 4)
  - `codeStore` (Task 5)
  - `runQuery(dbId: 'shop', sql: string): Promise<QueryResult>` (existing, `src/exercises/sql-query/sqlRunner.ts`)

- [ ] **Step 1: Write the page**

```tsx
import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { EditorView, keymap } from '@codemirror/view';
import { runProgram, ensurePython, onPyStatus, LANG_LABEL, type PyStatus } from '../runners';
import { codeStore } from '../runners/codeStore';
import { runQuery, type QueryResult } from '../exercises/sql-query/sqlRunner';
import type { Lang, RunResult } from '../runners/types';

type PlayLang = Lang | 'sql';
const LABEL: Record<PlayLang, string> = { ...LANG_LABEL, sql: 'SQL' };
const SAMPLE: Record<PlayLang, string> = {
  js: "// input() reads the next stdin line\nconst name = input() ?? 'world';\nconsole.log(`Hello, ${name}!`);\nconsole.log([3, 1, 2].sort((a, b) => a - b));",
  ts: "function greet(name: string): string {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet(input() ?? 'world'));",
  py: "name = input() or 'world'\nprint(f'Hello, {name}!')\nprint(sorted([3, 1, 2]))",
  sql: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 5;',
};

export default function PlaygroundPage() {
  const [lang, setLang] = useState<PlayLang>(() => (codeStore.get('nalanda:play:lang') as PlayLang | null) ?? 'py');
  const [code, setCode] = useState(() => codeStore.get(`nalanda:play:${lang}`) ?? SAMPLE[lang]);
  const [stdin, setStdin] = useState('');
  const [out, setOut] = useState<RunResult | null>(null);
  const [table, setTable] = useState<QueryResult | null>(null);
  const [schema, setSchema] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [pyStatus, setPyStatus] = useState<PyStatus>('idle');

  useEffect(() => onPyStatus(setPyStatus), []);
  useEffect(() => {
    if (lang === 'py') ensurePython().catch(() => {});
    if (lang === 'sql' && !schema) runQuery('shop', "SELECT name, sql FROM sqlite_master WHERE type = 'table' ORDER BY name").then(setSchema);
  }, [lang, schema]);

  const pick = (l: PlayLang) => {
    setLang(l); codeStore.set('nalanda:play:lang', l);
    setCode(codeStore.get(`nalanda:play:${l}`) ?? SAMPLE[l]); setOut(null); setTable(null);
  };
  const edit = (v: string) => { setCode(v); codeStore.set(`nalanda:play:${lang}`, v); };
  const run = async () => {
    setRunning(true);
    try {
      if (lang === 'sql') setTable(await runQuery('shop', code));
      else setOut(await runProgram(lang, code, stdin));
    } catch (e) {
      setOut({ stdout: '', stderr: e instanceof Error ? e.message : String(e), ms: 0 });
    } finally { setRunning(false); }
  };

  const pyBusy = lang === 'py' && pyStatus === 'loading';
  const ext = [
    lang === 'py' ? python() : lang === 'sql' ? sql() : javascript({ typescript: lang === 'ts' }),
    EditorView.contentAttributes.of({ 'aria-label': `${LABEL[lang]} editor` }),
    keymap.of([{ key: 'Mod-Enter', run: () => { if (!running && !pyBusy) void run(); return true; } }]),
  ];

  return (
    <section className="playground">
      <h1>Playground</h1>
      <p className="muted">Write code in any language and run it in your browser. Ctrl/Cmd + Enter runs it.</p>
      <div className="lang-tabs" role="tablist" aria-label="Language">
        {(Object.keys(LABEL) as PlayLang[]).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={l === lang} className={l === lang ? 'active' : ''} onClick={() => pick(l)}>{LABEL[l]}</button>
        ))}
      </div>
      <div className="play-grid">
        <div>
          <CodeMirror value={code} height="320px" extensions={ext} onChange={edit} />
          {lang !== 'sql' && (
            <label className="stdin">Input (stdin)
              <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3} />
            </label>
          )}
          <div className="row">
            <button type="button" className="primary" disabled={running || pyBusy} onClick={run}>Run</button>
            <button type="button" onClick={() => { setOut(null); setTable(null); }}>Clear output</button>
          </div>
        </div>
        <div className="play-output" aria-live="polite">
          {pyBusy && <p className="muted" role="status">Loading Python (about 10 MB, first time only)...</p>}
          {lang === 'py' && pyStatus === 'error' && (
            <p className="feedback bad" role="alert">Couldn't load Python. Check your connection and try again.{' '}
              <button type="button" onClick={() => ensurePython().catch(() => {})}>Retry</button></p>
          )}
          {out && (out.timedOut
            ? <p className="feedback bad" role="alert">Stopped after 5 s. Check for an endless loop.</p>
            : <>
                <pre className="stdout">{out.stdout || ' '}</pre>
                {out.stderr && <pre className="stderr">{out.stderr}</pre>}
                <p className="muted">Ran in {out.ms} ms</p>
              </>)}
          {table && (table.ok
            ? <div className="table-wrap"><table><thead><tr>{table.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v === null ? 'NULL' : String(v)}</td>)}</tr>)}</tbody></table></div>
            : <pre className="stderr">{table.error}</pre>)}
          {lang === 'sql' && schema?.ok && (
            <details className="helpers"><summary>Tables in the shop database</summary>
              <pre><code>{schema.rows.map((r) => String(r[1])).join('\n\n')}</code></pre></details>
          )}
        </div>
      </div>
    </section>
  );
}
```

Before saving, check two things against the shop seed:
- In `src/exercises/sql-query/seeds.ts`, confirm that a `products` table with `name` and `price` columns exists. If not, change `SAMPLE.sql` to a valid query on a real table.
- Confirm `@codemirror/lang-sql` exports `sql` (the SQL runner already imports it).

- [ ] **Step 2: Add the route and nav link**

In `src/App.tsx`:
- Add `import { lazy, Suspense } from 'react';` and `const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage'));`.
- Inside the `Layout` route, before the `*` route, add:

```tsx
          <Route path="/playground" element={<Suspense fallback={<p>Loading the playground...</p>}><PlaygroundPage /></Suspense>} />
```

In `src/ui/Layout.tsx`, after the Progress `NavLink`, add:

```tsx
            <NavLink to="/playground" className={tab}>Playground</NavLink>
```

- [ ] **Step 3: Append styles**

```css
.playground h1 { margin-bottom: 0.25rem; }
.play-grid { display: grid; gap: 1rem; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 900px) { .play-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
.play-output pre { white-space: pre-wrap; word-break: break-word; margin: 0 0 0.5rem; padding: 0.75rem; border-radius: 10px; background: var(--surface-2); min-height: 3rem; }
.play-output pre.stderr { color: var(--bad, #b42318); }
.stdin { display: block; margin-top: 0.5rem; font-size: 0.9rem; }
.stdin textarea { display: block; width: 100%; font-family: inherit; }
.table-wrap { overflow-x: auto; }
```

Swap `var(--bad, ...)` for the repo's error colour token from `tokens.css`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit -p . && npm run -s build && npx playwright test`
Expected: build succeeds, and the playground is a separate chunk. e2e 7/7, which includes the phone-width overflow test.

Then take a screenshot: `MSYS_NO_PATHCONV=1 node .superpowers/lesson-shot.mjs /playground .superpowers/play.png`. Read the image and check the layout: no overflow, tabs visible.

- [ ] **Step 5: Commit**

```bash
git add src/pages/PlaygroundPage.tsx src/App.tsx src/ui/Layout.tsx src/styles/app.css
git commit -m "Add a playground page for JavaScript, TypeScript, Python, and SQL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Python solution suite (runs every `py.solution`)

**Files:**
- Create: `src/runners/py/py-solutions.test.ts`

**Interfaces:**
- Consumes: `worlds` (`src/content/index.ts`), `pyRunCases` (Task 2), `JsEx.py` and `JsEx.langs` (Task 1).
- Produces: a suite that later content tasks rely on to verify their Python solutions. It is also the coverage gate: once Task 13 flips `REQUIRE_ALL` to `true`, every js-code task in `algorithms` and `cs-fundamentals` must offer Python.

- [ ] **Step 1: Write the suite**

```ts
import { describe, it, expect } from 'vitest';
import { worlds } from '../../content/index';
import type { JsEx, Task } from '../../schema';
import { pyRunCases } from './testPyodide';

const PY_WORLDS = ['algorithms', 'cs-fundamentals'];
// Flipped to true by the final content task, once every exercise in PY_WORLDS has a Python solution.
const REQUIRE_ALL = false;

const codeTasks = (worldId: string): JsEx[] => {
  const w = worlds.find((x) => x.id === worldId)!;
  const tasks: Task[] = [...w.chapters.flatMap((c) => c.lessons.map((l) => l.exercise)), ...w.boss.steps];
  return tasks.filter((t): t is JsEx => t.kind === 'js-code');
};

describe('python reference solutions', { timeout: 600_000 }, () => {
  for (const wid of PY_WORLDS) {
    it(`${wid}: every py.solution passes its cases`, async () => {
      for (const t of codeTasks(wid).filter((x) => x.py)) {
        const out = await pyRunCases(t.py!.solution, t.fnName, t.cases, t.starter);
        expect([t.id, out.passed, out.error ?? null, out.results.filter((r) => !r.ok)]).toEqual([t.id, true, null, []]);
      }
    });
    it(`${wid}: every code exercise offers Python`, () => {
      const missing = codeTasks(wid).filter((t) => !t.langs?.includes('py')).map((t) => t.id);
      if (REQUIRE_ALL) expect(missing).toEqual([]);
    });
  }
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/runners/py/py-solutions.test.ts`
Expected: PASS. No solutions exist yet, and the coverage check is not enforced.

- [ ] **Step 3: Commit**

```bash
git add src/runners/py/py-solutions.test.ts
git commit -m "Add a test suite that runs every Python reference solution

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: End-to-end tests for Python and the playground

**Files:**
- Create: `e2e/playground.spec.ts`

**Interfaces:**
- Consumes:
  - the `/playground` route (Task 6)
  - language tabs (Task 5)
  - the first Algorithms lesson `/#/w/algorithms/al-arrays/l1` (`containsDuplicate`, open on a fresh profile), which needs `py` on `nc-…` lesson 1. Task 9 adds that solution, so run this task after Task 9's first chapter, or write the tests now and run them after Task 9.

- [ ] **Step 1: Write the tests**

```ts
import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 120_000 });

test('playground runs Python print', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'Python' }).click();
  const editor = page.getByRole('textbox', { name: 'Python editor' });
  await editor.fill('print(sum(range(10)))');
  await expect(page.getByRole('button', { name: 'Run' })).toBeEnabled({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('pre.stdout')).toHaveText('45', { timeout: 30_000 });
});

test('playground runs a SQL query and shows a table', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'SQL' }).click();
  await page.getByRole('textbox', { name: 'SQL editor' }).fill('SELECT 1 AS one, 2 AS two;');
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.getByRole('columnheader', { name: 'two' })).toBeVisible();
});

test('python timeout then rerun works without a reload', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'Python' }).click();
  const editor = page.getByRole('textbox', { name: 'Python editor' });
  const run = page.getByRole('button', { name: 'Run' });
  await editor.fill('while True:\n    pass');
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(page.getByText('Stopped after 5 s. Check for an endless loop.')).toBeVisible({ timeout: 15_000 });
  await editor.fill('print("again")');
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(page.locator('pre.stdout')).toHaveText('again', { timeout: 60_000 });
});

test('an algorithms exercise passes in Python', async ({ page }) => {
  await page.goto('/#/w/algorithms/al-arrays/l1');
  await page.getByRole('tab', { name: 'Python' }).click();
  await page.getByRole('textbox', { name: 'Python editor' }).fill('def containsDuplicate(nums):\n    return len(set(nums)) != len(nums)');
  const check = page.getByRole('button', { name: 'Check answer' });
  await expect(check).toBeEnabled({ timeout: 60_000 });
  await check.click();
  await expect(page.getByText('All cases passed.')).toBeVisible({ timeout: 30_000 });
});
```

Check `LessonPage` to see whether the exercise is visible on load or behind a "Start exercise" step or a layer stepper. If it is behind one, add the clicks needed to reach it, copying how `e2e/smoke.spec.ts` reaches exercises.

These tests need internet access for the Pyodide CDN. If the e2e environment is offline, tag the Python tests with `test.skip(!!process.env.OFFLINE, 'needs CDN')` and say so in the final report.

- [ ] **Step 2: Run after Task 9's first chapter is committed**

Run: `npx playwright test`
Expected: 11 passed (7 existing plus 4 new).

- [ ] **Step 3: Commit**

```bash
git add e2e/playground.spec.ts
git commit -m "Add end-to-end tests for the playground and Python exercises

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tasks 9–12: Python reference solutions (content)

These follow one procedure per chapter. Each task lists its chapters; commit once per chapter.

**Per-chapter procedure:**

1. Open the chapter file. For every `problem({...})` or `topic({...})`, add `py: '<python solution>'` inside `ex: {...}` after `solution`.
2. Write the Python solution in idiomatic Python:
   - Use the same function name (`fn`) and parameter names as the JS signature.
   - Use the helper names from the preludes (`fromArray`, `toArray`, `buildTree`, `treeToArray`, `ListNode`, `TreeNode`, `Heap`) wherever the JS solution uses them.
   - Do not paste the prelude into the solution; the harness adds it.
3. Encode newlines as `\n`, with four-space indents, inside a single-quoted TS string. Escape `'` as `\'`. For solutions longer than about 12 lines, use a template literal instead, and make sure it contains no `${`.
4. Where a prompt relies on JavaScript-only behaviour, append one sentence for Python learners to the prompt. JS-only behaviour includes 32-bit `|`, `>>>`, `~` overflow, `Number` precision, `Map` insertion order, and `typeof`. Example: " In Python, mask results with `& 0xFFFFFFFF` to stay within 32 bits."
5. Verify, then commit:

```bash
npx vitest run src/runners/py/py-solutions.test.ts src/content && npx tsc --noEmit -p .
git add src/content/<world>/<file>.ts
git commit -m "Add Python solutions to <chapter title>

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: all PASS. If a Python solution fails, fix the solution, never the cases. If a case is impossible in Python, stop and ledger a ruling before changing any expected value.

#### Task 9: Algorithms, chapters 1–6

`src/content/algorithms/`: `arrays.ts`, `two-pointers.ts`, `sliding-window.ts`, `stack.ts`, `binary-search.ts`, `linked-list.ts`

After `arrays.ts` is committed, run Task 8's e2e tests.

#### Task 10: Algorithms, chapters 7–12

`trees.ts`, `heap.ts`, `backtracking.ts`, `tries.ts`, `graphs.ts`, `adv-graphs.ts`

#### Task 11: Algorithms, chapters 13–18, and the Algorithms boss

- `dp1.ts`, `dp2.ts`, `greedy.ts`, `intervals.ts`, `math.ts`, `bits.ts`
- Watch for JS-only behaviour in `bits.ts`; it needs Python prompt notes and masking.
- `boss.ts` step `al-boss-2` (`topWords`): add `langs: ['js', 'ts', 'py']` and `py: { solution: '...' }` directly on the step object.

#### Task 12: CS Fundamentals, all 9 chapters, and the CS boss

- `src/content/cs/`: `complexity.ts`, `data-structures.ts`, `sorting.ts`, `recursion.ts`, `numbers.ts`, `architecture.ts`, `os.ts`, `concurrency.ts`, `theory.ts`
- `boss.ts` step `cs-boss-2` (`findDuplicates`): same as above.
- JS-specific exercises that need care:
  - `numbers.ts`: `toTwos`, `addInt32`, `swap32`. Python must emulate the 32-bit results; add prompt notes.
  - `theory.ts`: `inferType`, where Python must map `bool` before `int`, `int`/`float` to `'number'`, `None` to `'null'`, `list`, and `dict`.
  - `concurrency.ts`: `eventOrder`, which is fine in Python.

---

### Task 13: Coverage gate, full verification, progress note

**Files:**
- Modify: `src/runners/py/py-solutions.test.ts` (`REQUIRE_ALL = true`)

- [ ] **Step 1: Flip the gate**

Set `const REQUIRE_ALL = true;`.

- [ ] **Step 2: Run everything**

Run: `npx vitest run && npx tsc --noEmit -p . && npm run -s build && npx playwright test`
Expected:
- vitest: all PASS, including both `every code exercise offers Python` tests (206 exercises).
- Build: succeeds.
- Playwright: 11 passed.

- [ ] **Step 3: Screenshot check**

Run:
```bash
MSYS_NO_PATHCONV=1 node .superpowers/lesson-shot.mjs /w/algorithms/al-arrays/l1 .superpowers/py-ex.png
MSYS_NO_PATHCONV=1 node .superpowers/lesson-shot.mjs /playground .superpowers/play.png
```

Read both images. Check that the language tabs render, the editor is visible, and nothing overflows.

- [ ] **Step 4: Commit and record progress**

```bash
git add src/runners/py/py-solutions.test.ts
git commit -m "Require Python solutions for every Algorithms and CS exercise

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Append to `.superpowers/progress.md`: "Playground Phase A done: JS/TS/Python tabs on 206 exercises, /playground (JS, TS, Python, SQL). Next: Phase B spec (Java via CheerpJ, C++ via @yowasp/clang) or resume Cloud world."
