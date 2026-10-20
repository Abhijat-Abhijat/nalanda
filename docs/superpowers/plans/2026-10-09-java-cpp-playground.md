# Java and C++ Playground (Phase B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Learners solve all 206 Algorithms and CS exercises in Java and C++ (LeetCode-style `class Solution`) and run Java and C++ in `/playground`, all in the browser.

**Architecture:**
- Each exercise gains a neutral signature (`sig`) that maps to Java and C++ types.
- Generated harness programs parse the JSON cases, call `Solution`, and print one JSON result line per case. TypeScript compares each result with the existing canonical comparison.
- C++ compiles with `@yowasp/clang` in a Web Worker and runs with `@bjorn3/browser_wasi_shim`.
- Java compiles with ECJ inside CheerpJ, running in a hidden same-origin iframe.
- Node test suites verify every reference solution: the local JDK for Java, and `@yowasp/clang` for C++.

**Tech Stack:**
- TypeScript, React 19, Vite 8, Vitest, Playwright
- CodeMirror 6, plus `@codemirror/lang-java` 6.0.2 and `@codemirror/lang-cpp` 6.0.3
- `@yowasp/clang` 22.0.0-git20542-10 and `@bjorn3/browser_wasi_shim` 0.4.2
- CheerpJ 4.3 (CDN) and ECJ 3.22.0
- Local JDK 17 for tests

**Spec:** `docs/superpowers/specs/2026-10-09-java-cpp-playground-design.md`

## Global Constraints

- **Browser-only execution.** CheerpJ loads from `https://cjrtnc.leaningtech.com/4.3/loader.js` and is never self-hosted.
- **C++ flags everywhere:** `-std=c++17 -O1 -fno-exceptions`.
- **Java:** CheerpJ runs with `version: 8`, and ECJ compiles with `-8 -encoding UTF-8`. Local tests use `javac --release 8 -encoding UTF-8`.
- **Pinned versions,** all in `src/runners/versions.ts`:
  - `@yowasp/clang` `22.0.0-git20542-10`
  - `@bjorn3/browser_wasi_shim` `0.4.2`
  - CheerpJ `4.3`
  - ECJ `3.22.0`
- **Timeouts:**
  - C++: compile 60 s on first use, then 20 s; run 5 s.
  - Java: compile 90 s on first use, then 30 s; run 5 s.
- **Notices (verbatim):**
  - "Loading Java (about 20 MB, first time only)..."
  - "Loading C++ compiler (about 19 MB, first time only)..."
  - "Couldn't load Java. Check your connection and try again."
  - "Couldn't load the C++ compiler. Check your connection and try again."
  - "Stopped after 5 s. Check for an endless loop."
  - "Input is not supported for Java yet."
- **Footer credit (verbatim):** "Java runs in your browser with CheerpJ by Leaning Technologies." It links to https://cheerpj.com.
- **Lang union:** `'js' | 'ts' | 'py' | 'java' | 'cpp'`. Tab labels are "Java" and "C++".
- **Comparison:** Phase A's canonical, key-order-insensitive check (`sameResult`).
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Never** edit permission or hook settings.

## Review Focus

1. **Java learner code with its own `import java.util.*;` lines.** It must compile, because the harness hoists imports above its own classes. Test: Task 5 `hoists learner imports`.
2. **C++ learner code with its own `#include` and `using namespace std;` lines.** It must compile in both single and batch mode. Test: Task 4 `hoists learner includes`.
3. **Floating-point results**, such as `0.1 + 0.2` or a whole-number double. They must compare equal to the JS expectation in both languages. Test: Tasks 4 and 5 `numbers round-trip`.
4. **Non-ASCII strings in cases** (`"é"`, `"😀"`). They must round-trip through both JSON layers. Test: Tasks 4 and 5 `unicode round-trip`.
5. **A learner who prints debug output.** It must not break result parsing. Test: Tasks 4 and 5 `ignores debug output`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/runners/versions.ts` | Pinned versions and CDN URLs |
| `src/runners/sig.ts` | Parse signatures, map to Java and C++ types, build starters, read JS params |
| `src/runners/results.ts` | `parseHarnessOutput`, `mapErrorLines` |
| `src/runners/clip.ts` | `clip` (moved out of `index.ts` to avoid a circular import) |
| `src/exercises/js-code/runCases.ts` (modify) | Export `sameResult` |
| `src/runners/cpp/prelude.ts` | C++ includes, `Json`, `Conv<T>` (string) |
| `src/runners/cpp/helpers.ts` | C++ ListNode, TreeNode, Heap, RNode, GNode (string) |
| `src/runners/cpp/harness.ts` | `cppProgram(units)` |
| `src/runners/cpp/build.ts` | `compileCpp`, `runWasm`, shared by worker and Node |
| `src/runners/cpp/testCpp.ts` | Node-only test helper |
| `src/runners/cpp/worker.ts`, `client.ts` | Browser runner |
| `src/runners/java/prelude.ts` | Java imports, `Json`, `J` (string) |
| `src/runners/java/helpers.ts` | Java helper classes (string) |
| `src/runners/java/harness.ts` | `javaProgram(unit)` |
| `src/runners/java/testJava.ts` | Node-only: local javac/java batch runner |
| `src/runners/java/client.ts` | Browser runner (iframe bridge) |
| `public/cheerpj.html`, `public/cheerpj/ecj-3.22.0.jar`, `public/cheerpj/ECJ-NOTICE.txt` | CheerpJ frame and compiler |
| `src/runners/index.ts` (modify) | Register java and cpp; `ensureLang`, `onLangStatus` |
| `src/exercises/js-code/Runner.tsx`, `src/pages/PlaygroundPage.tsx` (modify) | Tabs, editors, notices |
| `src/schema.ts`, `src/content/validate.ts`, `src/content/helpers.ts`, `src/content/algorithms/h.ts`, `src/content/cs/h.ts` (modify) | Fields and rules |
| `src/runners/java/java-solutions.test.ts`, `src/runners/cpp/cpp-solutions.test.ts` | Verify every solution |
| `e2e/java-cpp.spec.ts` | End-to-end tests |
| `LICENSE`, `README.md`, `package.json`, `src/ui/Layout.tsx`, `src/styles/app.css` | Licence and credit |

---

### Task 1: Signatures, schema fields, and validation

**Files:**
- Create: `src/runners/versions.ts`, `src/runners/sig.ts`, `src/runners/sig.test.ts`
- Modify: `src/schema.ts` (JsEx), `src/content/helpers.ts` (jsEx), `src/content/validate.ts`, `src/content/validate.test.ts`, `src/content/algorithms/h.ts`, `src/content/cs/h.ts`

**Interfaces:**
- Produces, in `sig.ts`:

  ```ts
  type SigType = { k: 'prim'; name: 'int'|'long'|'double'|'bool'|'string' } | { k: 'arr'; of: SigType } | { k: 'opt'; of: SigType } | { k: 'map'; of: SigType } | { k: 'any' };
  type Sig = { params: { type: SigType; name: string }[]; ret: SigType };
  parseSig(s: string): Sig            // throws Error('bad signature: <s>')
  javaType(t: SigType, boxed?: boolean): string
  cppType(t: SigType): string
  cppParamType(t: SigType): string    // prims by value, others "T&"
  javaStarter(fn: string, sig: Sig): string
  cppStarter(fn: string, sig: Sig): string
  jsParamNames(fn: string, jsStarter: string): string[]
  ```

- Produces, in the schema:
  - `JsEx.langs?: ('js'|'ts'|'py'|'java'|'cpp')[]`
  - `JsEx.sig?: string`
  - `JsEx.java?: { solution: string }`
  - `JsEx.cpp?: { solution: string }`
- Produces `jsEx(id, conceptId, prompt, fnName, starter, cases, solution, hint, py?, extra?: { sig?: string; java?: string; cpp?: string })`.
  - When any optional language is present, `langs` is `['js','ts', ...py?['py'], ...java?['java'], ...cpp?['cpp']]`.
  - Otherwise `langs` is unset.

- [ ] **Step 1: Write the failing tests** (`src/runners/sig.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { parseSig, javaType, cppType, cppParamType, javaStarter, cppStarter, jsParamNames } from './sig';

describe('signatures', () => {
  it('parses params and return', () => {
    const s = parseSig('(int[] nums, int k) -> int[]');
    expect(s.params.map((p) => p.name)).toEqual(['nums', 'k']);
    expect(javaType(s.params[0].type)).toBe('int[]');
    expect(cppType(s.ret)).toBe('vector<int>');
  });
  it('maps nullable, nested, map, and any types', () => {
    const t = (x: string) => parseSig(`(${x} a) -> int`).params[0].type;
    expect(javaType(t('int?[]'))).toBe('Integer[]');
    expect(cppType(t('int?[]'))).toBe('vector<optional<int>>');
    expect(javaType(t('string[][]'))).toBe('String[][]');
    expect(javaType(t('map<int[]>'))).toBe('Map<String, int[]>');
    expect(javaType(t('map<int>'))).toBe('Map<String, Integer>');
    expect(cppType(t('map<int[]>'))).toBe('map<string, vector<int>>');
    expect(javaType(t('any'))).toBe('Object');
    expect(cppType(t('any'))).toBe('Json');
    expect(cppType(t('long'))).toBe('long long');
    expect(javaType(t('bool'))).toBe('boolean');
    expect(cppParamType(t('int'))).toBe('int');
    expect(cppParamType(t('string'))).toBe('string&');
    expect(cppParamType(t('int[]'))).toBe('vector<int>&');
  });
  it('rejects bad signatures', () => {
    expect(() => parseSig('(int[] nums) int')).toThrow('bad signature');
    expect(() => parseSig('(float x) -> int')).toThrow('bad signature');
  });
  it('generates LeetCode-style starters', () => {
    const s = parseSig('(int[] nums) -> bool');
    expect(javaStarter('containsDuplicate', s)).toBe('class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // your code\n    }\n}\n');
    expect(cppStarter('containsDuplicate', s)).toBe('class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // your code\n    }\n};\n');
  });
  it('reads JS parameter names from the starter', () => {
    expect(jsParamNames('f', 'class X {}\nfunction f(a, b = 2) {\n}')).toEqual(['a', 'b']);
    expect(jsParamNames('g', 'function g() {}')).toEqual([]);
  });
});
```

Append to `src/content/validate.test.ts`, reusing its `worldWith` helper:

```ts
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
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/runners/sig.test.ts src/content/validate.test.ts`
Expected: FAIL. `./sig` is missing, and `jsEx` takes no extra argument yet.

- [ ] **Step 3: Implement `versions.ts` and `sig.ts`**

`src/runners/versions.ts`:

```ts
export const CLANG_VERSION = '22.0.0-git20542-10';
export const WASI_SHIM_VERSION = '0.4.2';
export const CLANG_URL = `https://cdn.jsdelivr.net/npm/@yowasp/clang@${CLANG_VERSION}/gen/bundle.js`;
export const WASI_SHIM_URL = `https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@${WASI_SHIM_VERSION}/+esm`;
export const CHEERPJ_LOADER = 'https://cjrtnc.leaningtech.com/4.3/loader.js';
export const ECJ_JAR = 'cheerpj/ecj-3.22.0.jar';
export const CPP_FLAGS = ['-std=c++17', '-O1', '-fno-exceptions'];
```

`src/runners/sig.ts`:

```ts
export type Prim = 'int' | 'long' | 'double' | 'bool' | 'string';
export type SigType = { k: 'prim'; name: Prim } | { k: 'arr'; of: SigType } | { k: 'opt'; of: SigType } | { k: 'map'; of: SigType } | { k: 'any' };
export type Sig = { params: { type: SigType; name: string }[]; ret: SigType };

const PRIMS: Prim[] = ['int', 'long', 'double', 'bool', 'string'];

function parseType(src: string, whole: string): SigType {
  let s = src.trim();
  let dims = 0;
  while (s.endsWith('[]')) { dims++; s = s.slice(0, -2).trim(); }
  let t: SigType;
  if (s === 'any') t = { k: 'any' };
  else if (s.startsWith('map<') && s.endsWith('>')) t = { k: 'map', of: parseType(s.slice(4, -1), whole) };
  else if (s.endsWith('?') && PRIMS.includes(s.slice(0, -1) as Prim)) t = { k: 'opt', of: { k: 'prim', name: s.slice(0, -1) as Prim } };
  else if (PRIMS.includes(s as Prim)) t = { k: 'prim', name: s as Prim };
  else throw new Error(`bad signature: ${whole}`);
  for (let i = 0; i < dims; i++) t = { k: 'arr', of: t };
  return t;
}

export function parseSig(s: string): Sig {
  const m = /^\s*\((.*)\)\s*->\s*(.+?)\s*$/.exec(s);
  if (!m) throw new Error(`bad signature: ${s}`);
  const params: Sig['params'] = [];
  let depth = 0, cur = '';
  const parts: string[] = [];
  for (const ch of m[1]) {
    if (ch === '<') depth++;
    if (ch === '>') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  for (const p of parts) {
    const pm = /^\s*(.+?)\s+([A-Za-z_]\w*)\s*$/.exec(p);
    if (!pm) throw new Error(`bad signature: ${s}`);
    params.push({ type: parseType(pm[1], s), name: pm[2] });
  }
  return { params, ret: parseType(m[2], s) };
}

const JAVA_PRIM: Record<Prim, [string, string]> = { int: ['int', 'Integer'], long: ['long', 'Long'], double: ['double', 'Double'], bool: ['boolean', 'Boolean'], string: ['String', 'String'] };

export function javaType(t: SigType, boxed = false): string {
  switch (t.k) {
    case 'prim': return JAVA_PRIM[t.name][boxed ? 1 : 0];
    case 'opt': return javaType(t.of, true);
    case 'arr': return `${javaType(t.of)}[]`;
    case 'map': return `Map<String, ${javaType(t.of, true)}>`;
    case 'any': return 'Object';
  }
}

const CPP_PRIM: Record<Prim, string> = { int: 'int', long: 'long long', double: 'double', bool: 'bool', string: 'string' };

export function cppType(t: SigType): string {
  switch (t.k) {
    case 'prim': return CPP_PRIM[t.name];
    case 'opt': return `optional<${cppType(t.of)}>`;
    case 'arr': return `vector<${cppType(t.of)}>`;
    case 'map': return `map<string, ${cppType(t.of)}>`;
    case 'any': return 'Json';
  }
}

export const cppParamType = (t: SigType) => (t.k === 'prim' && t.name !== 'string' ? cppType(t) : `${cppType(t)}&`);

export function javaStarter(fn: string, sig: Sig): string {
  const ps = sig.params.map((p) => `${javaType(p.type)} ${p.name}`).join(', ');
  return `class Solution {\n    public ${javaType(sig.ret)} ${fn}(${ps}) {\n        // your code\n    }\n}\n`;
}

export function cppStarter(fn: string, sig: Sig): string {
  const ps = sig.params.map((p) => `${cppParamType(p.type)} ${p.name}`).join(', ');
  return `class Solution {\npublic:\n    ${cppType(sig.ret)} ${fn}(${ps}) {\n        // your code\n    }\n};\n`;
}

export function jsParamNames(fn: string, jsStarter: string): string[] {
  const m = new RegExp(`function\\s+${fn}\\s*\\(([^)]*)\\)`).exec(jsStarter);
  return (m?.[1] ?? '').split(',').map((p) => p.trim().replace(/\s*=.*$/, '')).filter(Boolean);
}
```

- [ ] **Step 4: Schema, builders, and validation**

In `src/schema.ts` (`JsEx`), replace the `langs` line and add three fields:

```ts
  langs: z.array(z.enum(['js', 'ts', 'py', 'java', 'cpp'])).optional(),
  sig: z.string().optional(),
  java: z.object({ solution: z.string().min(1) }).optional(),
  cpp: z.object({ solution: z.string().min(1) }).optional(),
```

In `src/content/helpers.ts`, replace `jsEx`:

```ts
export const jsEx = (id: string, conceptId: string, prompt: string, fnName: string, starter: string, cases: JsEx['cases'], solution: string, hint: string, py?: string, extra: { sig?: string; java?: string; cpp?: string } = {}): JsEx => {
  const langs = ['js', 'ts', ...(py ? ['py'] : []), ...(extra.java ? ['java'] : []), ...(extra.cpp ? ['cpp'] : [])] as NonNullable<JsEx['langs']>;
  return {
    kind: 'js-code', id, conceptId, prompt, fnName, starter, cases, solution, hint,
    ...(langs.length > 2 ? { langs } : {}),
    ...(py ? { py: { solution: py } } : {}),
    ...(extra.sig ? { sig: extra.sig } : {}),
    ...(extra.java ? { java: { solution: extra.java } } : {}),
    ...(extra.cpp ? { cpp: { solution: extra.cpp } } : {}),
  };
};
```

In `src/content/validate.ts`, add `import { parseSig, jsParamNames } from '../runners/sig';`. Then, inside `checkTask` after the Python rule:

```ts
    if (t.kind === 'js-code' && (t.langs?.includes('java') || t.langs?.includes('cpp'))) {
      if (!t.sig) errors.push(`exercise needs sig at ${where}`);
      else {
        try {
          const n = parseSig(t.sig).params.length;
          if (n !== jsParamNames(t.fnName, t.starter).length) errors.push(`sig parameter count differs from JS at ${where}`);
        } catch (e) { errors.push(`${(e as Error).message} at ${where}`); }
      }
      if (t.langs.includes('java') && !t.java?.solution) errors.push(`exercise needs java.solution at ${where}`);
      if (t.langs.includes('cpp') && !t.cpp?.solution) errors.push(`exercise needs cpp.solution at ${where}`);
    }
```

Builders:
- `src/content/algorithms/h.ts`: add `sig?: string; java?: string; cpp?: string` to `Problem['ex']`. In `problem()`, change the jsEx call's last argument from `p.ex.py` to `p.ex.py, { sig: p.ex.sig, java: p.ex.java, cpp: p.ex.cpp }`.
- `src/content/cs/h.ts`: add the same three fields to `Topic['ex']` and pass `t.ex.py, { sig: t.ex.sig, java: t.ex.java, cpp: t.ex.cpp }`.

- [ ] **Step 5: Run the tests and type-check**

Run: `npx vitest run src/runners/sig.test.ts src/content && npx tsc --noEmit -p .`
Expected: all PASS, no type errors. No content has java or cpp yet.

- [ ] **Step 6: Commit**

```bash
git add src/runners/versions.ts src/runners/sig.ts src/runners/sig.test.ts src/schema.ts src/content/helpers.ts src/content/validate.ts src/content/validate.test.ts src/content/algorithms/h.ts src/content/cs/h.ts
git commit -m "Add neutral exercise signatures and Java/C++ exercise fields

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: MIT licence and CheerpJ credit

**Files:**
- Create: `LICENSE`
- Modify: `package.json` (`"license": "MIT"`), `README.md` (append a section), `src/ui/Layout.tsx` (footer after `<main>`), `src/styles/app.css`
- Test: `src/ui/Layout.test.tsx` (create if absent; jsdom pattern as in `src/ui/QuestionView.test.tsx`)

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';

describe('Layout footer', () => {
  it('credits CheerpJ', () => {
    render(<MemoryRouter><Routes><Route element={<Layout />}><Route path="/" element={<p>home</p>} /></Route></Routes></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'CheerpJ' });
    expect(link.getAttribute('href')).toBe('https://cheerpj.com');
    expect(screen.getByText(/Java runs in your browser with/)).toBeTruthy();
  });
});
```

If rendering `Layout` needs store setup, copy it from an existing page test.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/ui/Layout.test.tsx`
Expected: FAIL (no CheerpJ link).

- [ ] **Step 3: Implement**

In `Layout.tsx`, after `<main ...>...</main>`:

```tsx
      <footer className="site-footer">
        <p>Java runs in your browser with <a href="https://cheerpj.com" rel="noopener">CheerpJ</a> by Leaning Technologies.</p>
      </footer>
```

In `app.css`, using the page-width token if `tokens.css` defines one (ledger the choice):

```css
.site-footer { max-width: var(--page-width, 1100px); margin: 3rem auto 2rem; padding: 0 16px; color: var(--muted); font-size: 0.85rem; }
```

`LICENSE` holds the standard MIT text with `Copyright (c) 2026 Nalanda contributors`.

Append to `README.md`:

```markdown
## Licence and third-party runtimes

Nalanda is open source under the MIT licence (see `LICENSE`). Code runs in your browser using these projects, each under its own licence:

| Runtime | Used for | Licence | How it is loaded |
|---|---|---|---|
| CheerpJ (Leaning Technologies) | Java | CheerpJ Community Licence (free for FOSS projects, with credit) | From Leaning Technologies' CDN |
| Eclipse Compiler for Java (ECJ) 3.22.0 | Compiling Java | EPL-2.0 | Unmodified jar in `public/cheerpj/` |
| YoWASP Clang | Compiling C++ | ISC (LLVM: Apache-2.0 with LLVM exception) | From jsDelivr |
| browser_wasi_shim | Running C++ programs | MIT / Apache-2.0 | From jsDelivr |
| Pyodide | Python | MPL-2.0 | From jsDelivr |

If Nalanda is ever operated by a company rather than as an open-source project, CheerpJ requires a commercial licence.
```

- [ ] **Step 4: Run the test and the phone-width e2e**

Run: `npx vitest run src/ui/Layout.test.tsx && npx playwright test -g "phone width"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add LICENSE package.json README.md src/ui/Layout.tsx src/ui/Layout.test.tsx src/styles/app.css
git commit -m "License Nalanda under MIT and credit CheerpJ

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Shared harness result parsing

**Files:**
- Create: `src/runners/results.ts`, `src/runners/results.test.ts`
- Modify: `src/exercises/js-code/runCases.ts` (export `sameResult`)

**Interfaces:**
- Produces:
  - `sameResult(a: unknown, b: unknown): boolean`, exported from `runCases.ts`.
  - `parseHarnessOutput(stdout: string, cases: Case[], missingMsg: string): CaseOutcome`.
  - `mapErrorLines(text: string, offset: number): string`. It rewrites `main.cpp:N:`, `Main.java:N:` and `(at line N)` by subtracting `offset`, never going below 1.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/runners/results.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement**

In `runCases.ts`, rename `const same = ...` to `export const sameResult = (a: unknown, b: unknown) => canon(a) === canon(b);` and update its callers.

`src/runners/results.ts`:

```ts
import { sameResult } from '../exercises/js-code/runCases';
import type { Case, CaseOutcome, CaseResult } from './types';

export function parseHarnessOutput(stdout: string, cases: Case[], missingMsg: string): CaseOutcome {
  const lines = stdout.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{"ok"'));
  const results: CaseResult[] = cases.map((c, i) => {
    const line = lines[i];
    if (!line) return { ok: false, error: missingMsg };
    let r: { ok: boolean; got?: unknown; error?: string };
    try { r = JSON.parse(line); } catch { return { ok: false, error: missingMsg }; }
    if (!r.ok) return { ok: false, error: r.error ?? missingMsg };
    return sameResult(r.got, c.expect) ? { ok: true } : { ok: false, got: r.got };
  });
  return { passed: results.every((r) => r.ok), results };
}

export function mapErrorLines(text: string, offset: number): string {
  const fix = (n: string) => String(Math.max(1, Number(n) - offset));
  return text
    .replace(/(main\.cpp:)(\d+)(:)/g, (_m, a, n, b) => a + fix(n) + b)
    .replace(/(Main\.java:)(\d+)(:)/g, (_m, a, n, b) => a + fix(n) + b)
    .replace(/\(at line (\d+)\)/g, (_m, n) => `(at line ${fix(n)})`);
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/runners/results.test.ts src/exercises`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/runners/results.ts src/runners/results.test.ts src/exercises/js-code/runCases.ts
git commit -m "Parse harness output and map compiler error lines

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: C++ harness, helpers, and Node test runner

**Files:**
- Create: `src/runners/cpp/prelude.ts`, `src/runners/cpp/helpers.ts`, `src/runners/cpp/harness.ts`, `src/runners/cpp/build.ts`, `src/runners/cpp/testCpp.ts`, `src/runners/cpp/harness.test.ts`
- Modify: `package.json` (devDependencies `@yowasp/clang@22.0.0-git20542-10`, `@bjorn3/browser_wasi_shim@0.4.2`)

**Interfaces:**
- Consumes: `parseSig` and `cppType` (Task 1); `parseHarnessOutput` and `mapErrorLines` (Task 3); `CPP_FLAGS` (Task 1).
- Produces:
  - `CPP_PRELUDE: string` (includes, `using namespace std;`, `Json`, `JsonParser`, `toJsonText`, `Conv<T>`).
  - `cppHelpersFor(jsStarter): string`.
  - `cppProgram(units: CppUnit[]): { source: string; offsets: number[] }`, where `CppUnit = { id: string; learner: string; fnName: string; sig: string; cases: Case[]; jsStarter: string }`. One unit gives an `int main` that runs it directly; several units print `@@<id>` before each.
  - `compileCpp(runClang, source): Promise<{ ok: true; wasm: Uint8Array } | { ok: false; error: string }>`.
  - `runWasm(shim, wasm, stdin): Promise<{ exit: number; stdout: string; stderr: string }>`.
  - Node-only (`testCpp.ts`): `cppCheck(learner, fnName, sig, cases, jsStarter): Promise<CaseOutcome>` and `cppBatch(units): Promise<Map<string, CaseOutcome | { compileError: string }>>`.

- [ ] **Step 1: Install dev dependencies**

Run: `npm i -D @yowasp/clang@22.0.0-git20542-10 @bjorn3/browser_wasi_shim@0.4.2`, then remove any `^` so both are pinned exactly.

- [ ] **Step 2: Write the failing tests** (`src/runners/cpp/harness.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { cppCheck } from './testCpp';

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
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run src/runners/cpp/harness.test.ts`
Expected: FAIL (`./testCpp` missing).

- [ ] **Step 4: Implement `prelude.ts`** (`export const CPP_PRELUDE = String.raw\`...\``)

```cpp
#include <algorithm>
#include <climits>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <deque>
#include <functional>
#include <iostream>
#include <list>
#include <map>
#include <numeric>
#include <optional>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;

struct Json {
  enum Kind { Null, Bool, Num, Str, Arr, Obj } kind = Null;
  bool b = false; double num = 0; string str; vector<Json> arr; vector<pair<string, Json>> obj;
  Json() {}
  Json(bool v) : kind(Bool), b(v) {}
  Json(int v) : kind(Num), num(v) {}
  Json(long long v) : kind(Num), num((double)v) {}
  Json(double v) : kind(Num), num(v) {}
  Json(const char* v) : kind(Str), str(v) {}
  Json(const string& v) : kind(Str), str(v) {}
  static Json array() { Json j; j.kind = Arr; return j; }
  static Json object() { Json j; j.kind = Obj; return j; }
  bool isNull() const { return kind == Null; }
  size_t size() const { return kind == Arr ? arr.size() : obj.size(); }
  const Json& operator[](size_t i) const { return arr[i]; }
  const Json& get(const string& k) const { static Json none; for (auto& p : obj) if (p.first == k) return p.second; return none; }
  void set(const string& k, Json v) { for (auto& p : obj) if (p.first == k) { p.second = v; return; } obj.emplace_back(k, v); }
  void push(Json v) { arr.push_back(v); }
  long long asInt() const { return (long long)num; }
  double asDouble() const { return num; }
  const string& asString() const { return str; }
  bool asBool() const { return b; }
};

static void appendUtf8(string& o, unsigned cp) {
  if (cp < 0x80) o += (char)cp;
  else if (cp < 0x800) { o += (char)(0xC0 | (cp >> 6)); o += (char)(0x80 | (cp & 0x3F)); }
  else if (cp < 0x10000) { o += (char)(0xE0 | (cp >> 12)); o += (char)(0x80 | ((cp >> 6) & 0x3F)); o += (char)(0x80 | (cp & 0x3F)); }
  else { o += (char)(0xF0 | (cp >> 18)); o += (char)(0x80 | ((cp >> 12) & 0x3F)); o += (char)(0x80 | ((cp >> 6) & 0x3F)); o += (char)(0x80 | (cp & 0x3F)); }
}

struct JsonParser {
  const string& s; size_t i = 0;
  explicit JsonParser(const string& src) : s(src) {}
  void ws() { while (i < s.size() && isspace((unsigned char)s[i])) i++; }
  string parseString() {
    string out; i++;
    while (s[i] != '"') {
      char c = s[i++];
      if (c != '\\') { out += c; continue; }
      char e = s[i++];
      if (e == 'n') out += '\n'; else if (e == 't') out += '\t'; else if (e == 'r') out += '\r';
      else if (e == 'b') out += '\b'; else if (e == 'f') out += '\f';
      else if (e == 'u') {
        unsigned cp = (unsigned)strtoul(s.substr(i, 4).c_str(), nullptr, 16); i += 4;
        if (cp >= 0xD800 && cp <= 0xDBFF && s[i] == '\\' && s[i + 1] == 'u') {
          unsigned lo = (unsigned)strtoul(s.substr(i + 2, 4).c_str(), nullptr, 16); i += 6;
          cp = 0x10000 + ((cp - 0xD800) << 10) + (lo - 0xDC00);
        }
        appendUtf8(out, cp);
      } else out += e;
    }
    i++;
    return out;
  }
  Json parse() {
    ws();
    char c = s[i];
    if (c == '{') {
      i++; Json o = Json::object(); ws();
      if (s[i] == '}') { i++; return o; }
      for (;;) { ws(); string k = parseString(); ws(); i++; Json v = parse(); o.obj.emplace_back(k, v); ws(); if (s[i++] == '}') return o; }
    }
    if (c == '[') {
      i++; Json a = Json::array(); ws();
      if (s[i] == ']') { i++; return a; }
      for (;;) { a.arr.push_back(parse()); ws(); if (s[i++] == ']') return a; }
    }
    if (c == '"') return Json(parseString());
    if (s.compare(i, 4, "true") == 0) { i += 4; return Json(true); }
    if (s.compare(i, 5, "false") == 0) { i += 5; return Json(false); }
    if (s.compare(i, 4, "null") == 0) { i += 4; return Json(); }
    size_t st = i;
    while (i < s.size() && (isdigit((unsigned char)s[i]) || strchr("+-.eE", s[i]))) i++;
    return Json(strtod(s.substr(st, i - st).c_str(), nullptr));
  }
};

static void dumpString(string& o, const string& s) {
  o += '"';
  for (unsigned char c : s) {
    if (c == '"') o += "\\\""; else if (c == '\\') o += "\\\\"; else if (c == '\n') o += "\\n";
    else if (c == '\r') o += "\\r"; else if (c == '\t') o += "\\t";
    else if (c < 0x20) { char b[8]; snprintf(b, sizeof b, "\\u%04x", c); o += b; }
    else o += (char)c;
  }
  o += '"';
}

static void dump(string& o, const Json& j) {
  switch (j.kind) {
    case Json::Null: o += "null"; break;
    case Json::Bool: o += j.b ? "true" : "false"; break;
    case Json::Num: {
      char b[40];
      if (!std::isfinite(j.num)) snprintf(b, sizeof b, "null");
      else if (j.num == std::floor(j.num) && std::fabs(j.num) < 9007199254740992.0) snprintf(b, sizeof b, "%lld", (long long)j.num);
      else snprintf(b, sizeof b, "%.17g", j.num);
      o += b; break;
    }
    case Json::Str: dumpString(o, j.str); break;
    case Json::Arr: o += '['; for (size_t k = 0; k < j.arr.size(); k++) { if (k) o += ','; dump(o, j.arr[k]); } o += ']'; break;
    case Json::Obj: o += '{'; for (size_t k = 0; k < j.obj.size(); k++) { if (k) o += ','; dumpString(o, j.obj[k].first); o += ':'; dump(o, j.obj[k].second); } o += '}'; break;
  }
}
static string toJsonText(const Json& j) { string o; dump(o, j); return o; }

template <class T> struct Conv;
template <> struct Conv<int> { static int from(const Json& j) { return (int)j.num; } static Json to(int v) { return Json(v); } };
template <> struct Conv<long long> { static long long from(const Json& j) { return (long long)j.num; } static Json to(long long v) { return Json(v); } };
template <> struct Conv<double> { static double from(const Json& j) { return j.num; } static Json to(double v) { return Json(v); } };
template <> struct Conv<bool> { static bool from(const Json& j) { return j.b; } static Json to(bool v) { return Json(v); } };
template <> struct Conv<string> { static string from(const Json& j) { return j.str; } static Json to(const string& v) { return Json(v); } };
template <> struct Conv<Json> { static Json from(const Json& j) { return j; } static Json to(const Json& v) { return v; } };
template <class T> struct Conv<vector<T>> {
  static vector<T> from(const Json& j) { vector<T> v; for (auto& e : j.arr) v.push_back(Conv<T>::from(e)); return v; }
  static Json to(const vector<T>& v) { Json a = Json::array(); for (const auto& e : v) a.push(Conv<T>::to(e)); return a; }
};
template <class T> struct Conv<optional<T>> {
  static optional<T> from(const Json& j) { if (j.isNull()) return nullopt; return Conv<T>::from(j); }
  static Json to(const optional<T>& v) { return v ? Conv<T>::to(*v) : Json(); }
};
template <class T> struct Conv<map<string, T>> {
  static map<string, T> from(const Json& j) { map<string, T> m; for (auto& p : j.obj) m[p.first] = Conv<T>::from(p.second); return m; }
  static Json to(const map<string, T>& m) { Json o = Json::object(); for (auto& p : m) o.set(p.first, Conv<T>::to(p.second)); return o; }
};
```

- [ ] **Step 5: Implement `helpers.ts`**

Export five string constants and `cppHelpersFor(jsStarter)`. It joins the blocks whose marker appears in the starter: `class ListNode`, `class TreeNode`, `class Heap`, `class RNode`, `class GNode`.

```cpp
// CPP_LIST
struct ListNode { int val; ListNode* next; ListNode(int v = 0, ListNode* n = nullptr) : val(v), next(n) {} };
static ListNode* fromArray(const vector<int>& a) { ListNode* h = nullptr; for (int i = (int)a.size() - 1; i >= 0; i--) h = new ListNode(a[i], h); return h; }
static vector<int> toArray(ListNode* h) { vector<int> o; for (; h; h = h->next) o.push_back(h->val); return o; }

// CPP_TREE
struct TreeNode { int val; TreeNode* left; TreeNode* right; TreeNode(int v = 0, TreeNode* l = nullptr, TreeNode* r = nullptr) : val(v), left(l), right(r) {} };
static TreeNode* buildTree(const vector<optional<int>>& a) {
  if (a.empty() || !a[0]) return nullptr;
  TreeNode* root = new TreeNode(*a[0]); deque<TreeNode*> q{root}; size_t i = 1;
  while (!q.empty() && i < a.size()) {
    TreeNode* n = q.front(); q.pop_front();
    if (i < a.size() && a[i]) { n->left = new TreeNode(*a[i]); q.push_back(n->left); } i++;
    if (i < a.size() && a[i]) { n->right = new TreeNode(*a[i]); q.push_back(n->right); } i++;
  }
  return root;
}
static TreeNode* buildTree(const vector<int>& a) { vector<optional<int>> o(a.begin(), a.end()); return buildTree(o); }
static vector<optional<int>> treeToArray(TreeNode* root) {
  vector<optional<int>> o; deque<TreeNode*> q{root};
  while (!q.empty()) { TreeNode* n = q.front(); q.pop_front(); if (n) { o.push_back(n->val); q.push_back(n->left); q.push_back(n->right); } else o.push_back(nullopt); }
  while (!o.empty() && !o.back()) o.pop_back();
  return o;
}

// CPP_HEAP: cmp(a, b) < 0 means a comes out first; default min-heap
template <class T> struct Heap {
  vector<T> a; function<int(const T&, const T&)> cmp;
  Heap() : cmp([](const T& x, const T& y) { return x < y ? -1 : (y < x ? 1 : 0); }) {}
  explicit Heap(function<int(const T&, const T&)> c) : cmp(c) {}
  int size() const { return (int)a.size(); }
  T peek() const { return a[0]; }
  void push(T x) { a.push_back(x); size_t i = a.size() - 1; while (i > 0) { size_t p = (i - 1) / 2; if (cmp(a[i], a[p]) >= 0) break; swap(a[i], a[p]); i = p; } }
  T pop() {
    T top = a[0]; T last = a.back(); a.pop_back();
    if (!a.empty()) { a[0] = last; size_t i = 0; for (;;) { size_t l = 2 * i + 1, r = l + 1, m = i; if (l < a.size() && cmp(a[l], a[m]) < 0) m = l; if (r < a.size() && cmp(a[r], a[m]) < 0) m = r; if (m == i) break; swap(a[i], a[m]); i = m; } }
    return top;
  }
};

// CPP_RANDOM
struct RNode { int val; RNode* next = nullptr; RNode* random = nullptr; explicit RNode(int v) : val(v) {} };
static RNode* buildRandom(const vector<vector<optional<int>>>& pairs) {
  vector<RNode*> ns; for (auto& p : pairs) ns.push_back(new RNode(*p[0]));
  for (size_t i = 0; i < ns.size(); i++) { ns[i]->next = i + 1 < ns.size() ? ns[i + 1] : nullptr; ns[i]->random = pairs[i][1] ? ns[*pairs[i][1]] : nullptr; }
  return ns.empty() ? nullptr : ns[0];
}
static vector<vector<optional<int>>> serializeRandom(RNode* h) {
  vector<RNode*> ns; for (; h; h = h->next) ns.push_back(h);
  vector<vector<optional<int>>> o;
  for (auto* n : ns) { optional<int> r; for (size_t i = 0; i < ns.size(); i++) if (ns[i] == n->random) r = (int)i; o.push_back({ n->val, r }); }
  return o;
}

// CPP_GRAPH
struct GNode { int val; vector<GNode*> neighbors; explicit GNode(int v) : val(v) {} };
static GNode* buildGraph(const vector<vector<int>>& adj) {
  vector<GNode*> ns; for (size_t i = 0; i < adj.size(); i++) ns.push_back(new GNode((int)i + 1));
  for (size_t i = 0; i < adj.size(); i++) for (int v : adj[i]) ns[i]->neighbors.push_back(ns[v - 1]);
  return ns.empty() ? nullptr : ns[0];
}
static vector<vector<int>> graphToAdj(GNode* node) {
  if (!node) return {};
  map<int, GNode*> seen{{node->val, node}}; deque<GNode*> q{node};
  while (!q.empty()) { GNode* n = q.front(); q.pop_front(); for (GNode* m : n->neighbors) if (!seen.count(m->val)) { seen[m->val] = m; q.push_back(m); } }
  vector<vector<int>> o; for (auto& kv : seen) { vector<int> nb; for (GNode* m : kv.second->neighbors) nb.push_back(m->val); o.push_back(nb); }
  return o;
}
```

- [ ] **Step 6: Implement `harness.ts`**

```ts
import { CPP_PRELUDE } from './prelude';
import { cppHelpersFor } from './helpers';
import { parseSig, cppType } from '../sig';
import type { Case } from '../types';

export type CppUnit = { id: string; learner: string; fnName: string; sig: string; cases: Case[]; jsStarter: string };
const lineCount = (s: string) => s.split('\n').length;

// Move #include and "using namespace std;" lines to the top, leaving blank lines so line numbers stay put.
export function hoistIncludes(code: string): { body: string; hoisted: string[] } {
  const hoisted: string[] = [];
  const body = code.split('\n').map((l) => (/^\s*(#include\b|using\s+namespace\s+std\s*;)/.test(l) ? (hoisted.push(l.trim()), '') : l)).join('\n');
  return { body, hoisted };
}

export function cppProgram(units: CppUnit[]): { source: string; offsets: number[] } {
  const includes = new Set<string>();
  const bodies = units.map((u) => { const h = hoistIncludes(u.learner); h.hoisted.filter((x) => x.startsWith('#')).forEach((x) => includes.add(x)); return h.body; });
  let text = CPP_PRELUDE + [...includes].join('\n') + '\n';
  const offsets: number[] = [];
  units.forEach((u, idx) => {
    const sig = parseSig(u.sig);
    const head = `namespace U${idx} {\n${cppHelpersFor(u.jsStarter)}\n`;
    offsets.push(lineCount(text + head) - 1);
    const conv = sig.params.map((p, i) => `  auto a${i} = Conv<${cppType(p.type)}>::from(args[${i}]);`).join('\n');
    const call = sig.params.map((_p, i) => `a${i}`).join(', ');
    const runCase = `static void runCase(const string& argsText) {\n  JsonParser p(argsText); Json args = p.parse();\n${conv}\n  Solution s;\n  auto r = s.${u.fnName}(${call});\n  cout << "{\\"ok\\":true,\\"got\\":" << toJsonText(Conv<${cppType(sig.ret)}>::to(r)) << "}" << endl;\n}\n`;
    const runAll = `static void runAll() {\n${u.cases.map((c) => `  runCase(R"NALANDA(${JSON.stringify(c.args)})NALANDA");`).join('\n')}\n}\n`;
    text += head + bodies[idx] + '\n' + runCase + runAll + '}\n';
  });
  const batch = units.length > 1;
  text += 'int main() {\n' + units.map((u, idx) => (batch ? `  cout << "@@${u.id}" << endl;\n` : '') + `  U${idx}::runAll();`).join('\n') + '\n  return 0;\n}\n';
  return { source: text, offsets };
}
```

`offsets[i]` is the number of lines before the learner's first line. The test `reports compile errors on the learner line` checks it: `sol()` puts the method on line 3.

- [ ] **Step 7: Implement `build.ts`** (shared by the worker and Node)

```ts
import { CPP_FLAGS } from '../versions';

type RunClang = (args: string[], files: Record<string, string>, opts?: { stdout?: (b: Uint8Array | null) => void; stderr?: (b: Uint8Array | null) => void }) => Promise<Record<string, unknown>>;
export type WasiShim = {
  WASI: new (args: string[], env: string[], fds: unknown[]) => { wasiImport: WebAssembly.ModuleImports; start(i: unknown): number };
  File: new (d: Uint8Array) => unknown; OpenFile: new (f: unknown) => unknown;
  ConsoleStdout: { lineBuffered(w: (l: string) => void): unknown };
};

export async function compileCpp(runClang: RunClang, source: string): Promise<{ ok: true; wasm: Uint8Array } | { ok: false; error: string }> {
  const dec = new TextDecoder();
  let err = '';
  const sink = (b: Uint8Array | null) => { if (b) err += dec.decode(b, { stream: true }); };
  try {
    const out = await runClang(['clang++', ...CPP_FLAGS, 'main.cpp', '-o', 'main.wasm'], { 'main.cpp': source }, { stdout: sink, stderr: sink });
    return { ok: true, wasm: out['main.wasm'] as Uint8Array };
  } catch {
    return { ok: false, error: err.trim() || 'Compilation failed.' };
  }
}

export async function runWasm(shim: WasiShim, wasm: Uint8Array, stdin: string): Promise<{ exit: number; stdout: string; stderr: string }> {
  const out: string[] = []; const err: string[] = [];
  const wasi = new shim.WASI([], [], [new shim.OpenFile(new shim.File(new TextEncoder().encode(stdin))), shim.ConsoleStdout.lineBuffered((l) => out.push(l)), shim.ConsoleStdout.lineBuffered((l) => err.push(l))]);
  const { instance } = await WebAssembly.instantiate(wasm, { wasi_snapshot_preview1: wasi.wasiImport });
  let exit: number;
  try { exit = wasi.start(instance); } catch (e) { err.push(String(e)); exit = -1; }
  return { exit, stdout: out.join('\n'), stderr: err.join('\n') };
}
```

- [ ] **Step 8: Implement `testCpp.ts`** (Node only)

```ts
import { runClang } from '@yowasp/clang';
import * as shim from '@bjorn3/browser_wasi_shim';
import { compileCpp, runWasm, type WasiShim } from './build';
import { cppProgram, type CppUnit } from './harness';
import { parseHarnessOutput, mapErrorLines } from '../results';
import type { Case, CaseOutcome } from '../types';

export async function cppCheck(learner: string, fnName: string, sig: string, cases: Case[], jsStarter: string): Promise<CaseOutcome> {
  const { source, offsets } = cppProgram([{ id: 'x', learner, fnName, sig, cases, jsStarter }]);
  const c = await compileCpp(runClang as never, source);
  if (!c.ok) return { passed: false, results: [], error: mapErrorLines(c.error, offsets[0]) };
  const r = await runWasm(shim as unknown as WasiShim, c.wasm, '');
  return parseHarnessOutput(r.stdout, cases, 'program crashed');
}

export async function cppBatch(units: CppUnit[]): Promise<Map<string, CaseOutcome | { compileError: string }>> {
  const { source } = cppProgram(units);
  const c = await compileCpp(runClang as never, source);
  const out = new Map<string, CaseOutcome | { compileError: string }>();
  if (!c.ok) { units.forEach((u) => out.set(u.id, { compileError: c.error })); return out; }
  const r = await runWasm(shim as unknown as WasiShim, c.wasm, '');
  const chunks = r.stdout.split(/^@@/m).slice(1);
  units.forEach((u, i) => out.set(u.id, parseHarnessOutput((chunks[i] ?? '').replace(/^[^\n]*\n/, ''), u.cases, 'program crashed')));
  return out;
}
```

A crash in one batch unit stops the units after it. The suite reports the first failing id; fix that one and rerun.

- [ ] **Step 9: Run the tests**

Run: `npx vitest run src/runners/cpp/harness.test.ts`
Expected: 10 PASS. The first run takes 10–20 s.

If one fails, use systematic debugging and fix the harness. Change a test only when it contradicts the spec, and ledger that as a ruling.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/runners/cpp
git commit -m "Add the C++ harness, helpers, and a Node test runner

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Java harness, helpers, and Node test runner

**Files:**
- Create: `src/runners/java/prelude.ts`, `src/runners/java/helpers.ts`, `src/runners/java/harness.ts`, `src/runners/java/testJava.ts`, `src/runners/java/harness.test.ts`

**Interfaces:**
- Consumes: `parseSig` and `javaType` (Task 1); `parseHarnessOutput` and `mapErrorLines` (Task 3).
- Produces:
  - `JAVA_PRELUDE` (imports, `Json`, `J`).
  - `javaHelpersFor(jsStarter)`. It always ends with `class Helpers { ... }`, which holds the static methods for the helpers present.
  - `javaProgram(unit: { learner; fnName; sig; cases; jsStarter; pkg?: string }): { source: string; offset: number }`.
  - Node-only (`testJava.ts`):
    - `hasJavac: boolean`
    - `javaCheck(learner, fnName, sig, cases, jsStarter): CaseOutcome`
    - `javaBatch(units: { id; learner; fnName; sig; cases; jsStarter }[]): Map<string, CaseOutcome | { compileError: string }>`

- [ ] **Step 1: Write the failing tests** (`src/runners/java/harness.test.ts`)

```ts
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
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/runners/java/harness.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement `prelude.ts`** (`export const JAVA_PRELUDE = String.raw\`...\``)

```java
import java.util.*;
import java.util.function.*;

final class Json {
  private final String s; private int i;
  private Json(String s) { this.s = s; }
  static Object parse(String s) { return new Json(s).value(); }
  private void ws() { while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++; }
  private Object value() {
    ws(); char c = s.charAt(i);
    if (c == '{') { i++; Map<String, Object> m = new LinkedHashMap<>(); ws(); if (s.charAt(i) == '}') { i++; return m; }
      while (true) { ws(); String k = str(); ws(); i++; m.put(k, value()); ws(); if (s.charAt(i++) == '}') return m; } }
    if (c == '[') { i++; List<Object> a = new ArrayList<>(); ws(); if (s.charAt(i) == ']') { i++; return a; }
      while (true) { a.add(value()); ws(); if (s.charAt(i++) == ']') return a; } }
    if (c == '"') return str();
    if (s.startsWith("true", i)) { i += 4; return Boolean.TRUE; }
    if (s.startsWith("false", i)) { i += 5; return Boolean.FALSE; }
    if (s.startsWith("null", i)) { i += 4; return null; }
    int st = i; while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) i++;
    String n = s.substring(st, i);
    if (n.indexOf('.') >= 0 || n.indexOf('e') >= 0 || n.indexOf('E') >= 0) return Double.parseDouble(n);
    return Long.parseLong(n);
  }
  private String str() {
    StringBuilder b = new StringBuilder(); i++;
    while (true) {
      char c = s.charAt(i++);
      if (c == '"') return b.toString();
      if (c != '\\') { b.append(c); continue; }
      char e = s.charAt(i++);
      switch (e) {
        case 'n': b.append('\n'); break; case 't': b.append('\t'); break; case 'r': b.append('\r'); break;
        case 'b': b.append('\b'); break; case 'f': b.append('\f'); break;
        case 'u': b.append((char) Integer.parseInt(s.substring(i, i + 4), 16)); i += 4; break;
        default: b.append(e);
      }
    }
  }
  static String write(Object v) { StringBuilder b = new StringBuilder(); write(b, v); return b.toString(); }
  private static void write(StringBuilder b, Object v) {
    if (v == null) { b.append("null"); return; }
    if (v instanceof Boolean) { b.append(v.toString()); return; }
    if (v instanceof Double || v instanceof Float) {
      double d = ((Number) v).doubleValue();
      if (Double.isNaN(d) || Double.isInfinite(d)) b.append("null");
      else if (d == Math.rint(d) && Math.abs(d) < 9007199254740992.0) b.append((long) d);
      else b.append(Double.toString(d));
      return;
    }
    if (v instanceof Number) { b.append(((Number) v).longValue()); return; }
    if (v instanceof Character || v instanceof CharSequence) { writeStr(b, v.toString()); return; }
    if (v instanceof Map) { b.append('{'); boolean first = true; for (Map.Entry<?, ?> e : ((Map<?, ?>) v).entrySet()) { if (!first) b.append(','); first = false; writeStr(b, String.valueOf(e.getKey())); b.append(':'); write(b, e.getValue()); } b.append('}'); return; }
    if (v instanceof Iterable) { b.append('['); boolean first = true; for (Object e : (Iterable<?>) v) { if (!first) b.append(','); first = false; write(b, e); } b.append(']'); return; }
    if (v.getClass().isArray()) { b.append('['); int n = java.lang.reflect.Array.getLength(v); for (int k = 0; k < n; k++) { if (k > 0) b.append(','); write(b, java.lang.reflect.Array.get(v, k)); } b.append(']'); return; }
    writeStr(b, v.toString());
  }
  private static void writeStr(StringBuilder b, String s) {
    b.append('"');
    for (int k = 0; k < s.length(); k++) {
      char c = s.charAt(k);
      if (c == '"') b.append("\\\""); else if (c == '\\') b.append("\\\\"); else if (c == '\n') b.append("\\n");
      else if (c == '\r') b.append("\\r"); else if (c == '\t') b.append("\\t");
      else if (c < 0x20) b.append(String.format("\\u%04x", (int) c)); else b.append(c);
    }
    b.append('"');
  }
}

final class J {
  @SuppressWarnings("unchecked") static List<Object> list(Object o) { return (List<Object>) o; }
  static int i(Object o) { return ((Number) o).intValue(); }
  static long l(Object o) { return ((Number) o).longValue(); }
  static double d(Object o) { return ((Number) o).doubleValue(); }
  static boolean b(Object o) { return (Boolean) o; }
  static String s(Object o) { return (String) o; }
  static Integer oi(Object o) { return o == null ? null : ((Number) o).intValue(); }
  static Long ol(Object o) { return o == null ? null : ((Number) o).longValue(); }
  static Double od(Object o) { return o == null ? null : ((Number) o).doubleValue(); }
  static Boolean ob(Object o) { return (Boolean) o; }
  static String os(Object o) { return (String) o; }
  static int[] ia(Object o) { List<Object> x = list(o); int[] r = new int[x.size()]; for (int k = 0; k < r.length; k++) r[k] = i(x.get(k)); return r; }
  static long[] la(Object o) { List<Object> x = list(o); long[] r = new long[x.size()]; for (int k = 0; k < r.length; k++) r[k] = l(x.get(k)); return r; }
  static double[] da(Object o) { List<Object> x = list(o); double[] r = new double[x.size()]; for (int k = 0; k < r.length; k++) r[k] = d(x.get(k)); return r; }
  static boolean[] ba(Object o) { List<Object> x = list(o); boolean[] r = new boolean[x.size()]; for (int k = 0; k < r.length; k++) r[k] = b(x.get(k)); return r; }
  @SuppressWarnings("unchecked") static <T> Map<String, T> map(Object o, Function<Object, T> f) { Map<String, Object> m = (Map<String, Object>) o; Map<String, T> r = new LinkedHashMap<>(); for (Map.Entry<String, Object> e : m.entrySet()) r.put(e.getKey(), f.apply(e.getValue())); return r; }
}
```

- [ ] **Step 4: Implement `helpers.ts`**

```ts
const LIST_CLASS = 'class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; } }';
const LIST_METHODS = `  static ListNode fromArray(int[] a) { ListNode h = null; for (int i = a.length - 1; i >= 0; i--) h = new ListNode(a[i], h); return h; }
  static int[] toArray(ListNode h) { List<Integer> o = new ArrayList<>(); for (; h != null; h = h.next) o.add(h.val); int[] r = new int[o.size()]; for (int i = 0; i < r.length; i++) r[i] = o.get(i); return r; }`;
const TREE_CLASS = 'class TreeNode { int val; TreeNode left, right; TreeNode() {} TreeNode(int val) { this.val = val; } TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; } }';
const TREE_METHODS = `  static TreeNode buildTree(Integer[] a) {
    if (a.length == 0 || a[0] == null) return null;
    TreeNode root = new TreeNode(a[0]); Deque<TreeNode> q = new ArrayDeque<>(); q.add(root); int i = 1;
    while (!q.isEmpty() && i < a.length) {
      TreeNode n = q.poll();
      if (i < a.length && a[i] != null) { n.left = new TreeNode(a[i]); q.add(n.left); } i++;
      if (i < a.length && a[i] != null) { n.right = new TreeNode(a[i]); q.add(n.right); } i++;
    }
    return root;
  }
  static TreeNode buildTree(int[] a) { Integer[] b = new Integer[a.length]; for (int i = 0; i < a.length; i++) b[i] = a[i]; return buildTree(b); }
  static Integer[] treeToArray(TreeNode root) {
    List<Integer> o = new ArrayList<>(); LinkedList<TreeNode> q = new LinkedList<>(); q.add(root);
    while (!q.isEmpty()) { TreeNode n = q.poll(); if (n != null) { o.add(n.val); q.add(n.left); q.add(n.right); } else o.add(null); }
    while (!o.isEmpty() && o.get(o.size() - 1) == null) o.remove(o.size() - 1);
    return o.toArray(new Integer[0]);
  }`;
const HEAP_CLASS = `class Heap<T> {
  private final ArrayList<T> a = new ArrayList<>(); private final Comparator<T> cmp;
  @SuppressWarnings("unchecked") Heap() { this((x, y) -> ((Comparable<T>) x).compareTo(y)); }
  Heap(Comparator<T> cmp) { this.cmp = cmp; }
  int size() { return a.size(); }
  T peek() { return a.isEmpty() ? null : a.get(0); }
  void push(T x) { a.add(x); int i = a.size() - 1; while (i > 0) { int p = (i - 1) / 2; if (cmp.compare(a.get(i), a.get(p)) >= 0) break; Collections.swap(a, i, p); i = p; } }
  T pop() {
    if (a.isEmpty()) return null;
    T top = a.get(0); T last = a.remove(a.size() - 1);
    if (!a.isEmpty()) { a.set(0, last); int i = 0; while (true) { int l = 2 * i + 1, r = l + 1, m = i; if (l < a.size() && cmp.compare(a.get(l), a.get(m)) < 0) m = l; if (r < a.size() && cmp.compare(a.get(r), a.get(m)) < 0) m = r; if (m == i) break; Collections.swap(a, i, m); i = m; } }
    return top;
  }
}`;
const RANDOM_CLASS = 'class RNode { int val; RNode next, random; RNode(int val) { this.val = val; } }';
const RANDOM_METHODS = `  static RNode buildRandom(Integer[][] pairs) {
    RNode[] ns = new RNode[pairs.length]; for (int i = 0; i < ns.length; i++) ns[i] = new RNode(pairs[i][0]);
    for (int i = 0; i < ns.length; i++) { ns[i].next = i + 1 < ns.length ? ns[i + 1] : null; ns[i].random = pairs[i][1] == null ? null : ns[pairs[i][1]]; }
    return ns.length == 0 ? null : ns[0];
  }
  static Integer[][] serializeRandom(RNode h) {
    List<RNode> ns = new ArrayList<>(); for (; h != null; h = h.next) ns.add(h);
    Integer[][] o = new Integer[ns.size()][];
    for (int i = 0; i < o.length; i++) { RNode n = ns.get(i); o[i] = new Integer[] { n.val, n.random == null ? null : ns.indexOf(n.random) }; }
    return o;
  }`;
const GRAPH_CLASS = 'class GNode { int val; List<GNode> neighbors = new ArrayList<>(); GNode(int val) { this.val = val; } }';
const GRAPH_METHODS = `  static GNode buildGraph(int[][] adj) {
    GNode[] ns = new GNode[adj.length]; for (int i = 0; i < ns.length; i++) ns[i] = new GNode(i + 1);
    for (int i = 0; i < ns.length; i++) for (int v : adj[i]) ns[i].neighbors.add(ns[v - 1]);
    return ns.length == 0 ? null : ns[0];
  }
  static int[][] graphToAdj(GNode node) {
    if (node == null) return new int[0][];
    TreeMap<Integer, GNode> seen = new TreeMap<>(); seen.put(node.val, node); Deque<GNode> q = new ArrayDeque<>(); q.add(node);
    while (!q.isEmpty()) { GNode n = q.poll(); for (GNode m : n.neighbors) if (!seen.containsKey(m.val)) { seen.put(m.val, m); q.add(m); } }
    int[][] o = new int[seen.size()][]; int k = 0;
    for (GNode n : seen.values()) { int[] nb = new int[n.neighbors.size()]; for (int i = 0; i < nb.length; i++) nb[i] = n.neighbors.get(i).val; o[k++] = nb; }
    return o;
  }`;

export function javaHelpersFor(jsStarter: string): string {
  const has = (m: string) => jsStarter.includes(m);
  const classes: string[] = []; const methods: string[] = [];
  if (has('class ListNode')) { classes.push(LIST_CLASS); methods.push(LIST_METHODS); }
  if (has('class TreeNode')) { classes.push(TREE_CLASS); methods.push(TREE_METHODS); }
  if (has('class Heap')) classes.push(HEAP_CLASS);
  if (has('class RNode')) { classes.push(RANDOM_CLASS); methods.push(RANDOM_METHODS); }
  if (has('class GNode')) { classes.push(GRAPH_CLASS); methods.push(GRAPH_METHODS); }
  return [...classes, `class Helpers {\n${methods.join('\n')}\n}`].join('\n');
}
```

- [ ] **Step 5: Implement `harness.ts`**

```ts
import { JAVA_PRELUDE } from './prelude';
import { javaHelpersFor } from './helpers';
import { parseSig, javaType, type SigType } from '../sig';
import type { Case } from '../types';

export type JavaUnit = { learner: string; fnName: string; sig: string; cases: Case[]; jsStarter: string; pkg?: string };
const lineCount = (s: string) => s.split('\n').length;

export function hoistImports(code: string): { body: string; imports: string[] } {
  const imports: string[] = [];
  const body = code.split('\n').map((l) => (/^\s*import\s+(static\s+)?[\w.]+(\.\*)?\s*;\s*$/.test(l) ? (imports.push(l.trim()), '') : l)).join('\n');
  return { body, imports };
}

// Solution inherits the static helper methods, so learners call fromArray(...) unqualified.
const extendHelpers = (code: string) => code.replace(/\b(?:public\s+)?class\s+Solution\s*\{/, 'class Solution extends Helpers {');

const PRIM_CONV = { int: 'J.i', long: 'J.l', double: 'J.d', bool: 'J.b', string: 'J.s' } as const;
const OPT_CONV = { int: 'J.oi', long: 'J.ol', double: 'J.od', bool: 'J.ob', string: 'J.os' } as const;
const ARR_CONV = { int: 'J.ia', long: 'J.la', double: 'J.da', bool: 'J.ba' } as const;

function conv(t: SigType, x: string, depth = 0): string {
  const e = `e${depth}`;
  switch (t.k) {
    case 'prim': return `${PRIM_CONV[t.name]}(${x})`;
    case 'opt': return `${OPT_CONV[(t.of as { k: 'prim'; name: keyof typeof OPT_CONV }).name]}(${x})`;
    case 'any': return x;
    case 'map': return `J.map(${x}, ${e} -> ${conv(t.of, e, depth + 1)})`;
    case 'arr':
      if (t.of.k === 'prim' && t.of.name !== 'string') return `${ARR_CONV[t.of.name]}(${x})`;
      return `J.list(${x}).stream().map(${e} -> ${conv(t.of, e, depth + 1)}).toArray(${javaType(t.of)}[]::new)`;
  }
}

const javaString = (s: string) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

export function javaProgram(u: JavaUnit): { source: string; offset: number } {
  const sig = parseSig(u.sig);
  const { body, imports } = hoistImports(u.learner);
  const head = (u.pkg ? `package ${u.pkg};\n` : '') + JAVA_PRELUDE + imports.join('\n') + '\n' + javaHelpersFor(u.jsStarter) + '\n';
  const offset = lineCount(head) - 1;
  const args = sig.params.map((p, i) => conv(p.type, `a.get(${i})`)).join(', ');
  const main = `
public class Main {
  static void runCase(String argsText) {
    try {
      List<Object> a = J.list(Json.parse(argsText));
      Object r = new Solution().${u.fnName}(${args});
      System.out.println("{\\"ok\\":true,\\"got\\":" + Json.write(r) + "}");
    } catch (Throwable t) {
      System.out.println("{\\"ok\\":false,\\"error\\":" + Json.write(t.getClass().getSimpleName() + (t.getMessage() == null ? "" : ": " + t.getMessage())) + "}");
    }
  }
  public static void main(String[] args) {
${u.cases.map((c) => `    runCase(${javaString(JSON.stringify(c.args))});`).join('\n')}
  }
}
`;
  return { source: head + extendHelpers(body) + '\n' + main, offset };
}
```

- [ ] **Step 6: Implement `testJava.ts`** (Node only)

```ts
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { javaProgram, type JavaUnit } from './harness';
import { parseHarnessOutput, mapErrorLines } from '../results';
import type { Case, CaseOutcome } from '../types';

export const hasJavac = (() => { try { execFileSync('javac', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();

type Out = CaseOutcome | { compileError: string };

export function javaBatch(units: (Omit<JavaUnit, 'pkg'> & { id: string })[]): Map<string, Out> {
  const dir = mkdtempSync(join(tmpdir(), 'nalanda-java-'));
  const out = new Map<string, Out>();
  try {
    const files: string[] = [];
    units.forEach((u, i) => {
      const pkg = `p${i}`;
      mkdirSync(join(dir, pkg));
      const f = join(dir, pkg, 'Main.java');
      writeFileSync(f, javaProgram({ ...u, pkg }).source, 'utf8');
      files.push(f);
    });
    const runAll = join(dir, 'RunAll.java');
    writeFileSync(runAll, `public class RunAll { public static void main(String[] a) {\n${units.map((u, i) => `System.out.println("@@${u.id}"); p${i}.Main.main(a);`).join('\n')}\n} }\n`, 'utf8');
    files.push(runAll);
    try {
      execFileSync('javac', ['--release', '8', '-encoding', 'UTF-8', '-nowarn', '-d', join(dir, 'out'), ...files], { stdio: 'pipe' });
    } catch (e) {
      const msg = String((e as { stderr?: Buffer }).stderr ?? e);
      units.forEach((u) => out.set(u.id, { compileError: msg }));
      return out;
    }
    const stdout = execFileSync('java', ['-Dfile.encoding=UTF-8', '-cp', join(dir, 'out'), 'RunAll'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const chunks = stdout.split(/^@@/m).slice(1);
    units.forEach((u, i) => out.set(u.id, parseHarnessOutput((chunks[i] ?? '').replace(/^[^\n]*\n/, ''), u.cases, 'no output')));
    return out;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function javaCheck(learner: string, fnName: string, sig: string, cases: Case[], jsStarter: string): CaseOutcome {
  const r = javaBatch([{ id: 'x', learner, fnName, sig, cases, jsStarter }]).get('x')!;
  if ('compileError' in r) {
    const { offset } = javaProgram({ learner, fnName, sig, cases, jsStarter, pkg: 'p0' });
    return { passed: false, results: [], error: mapErrorLines(r.compileError, offset) };
  }
  return r;
}
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run src/runners/java/harness.test.ts`
Expected: 9 PASS. If the JDK is missing the suite is skipped; report that.

- [ ] **Step 8: Commit**

```bash
git add src/runners/java
git commit -m "Add the Java harness, helpers, and a local-JDK test runner

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Browser C++ runner

**Files:**
- Create: `src/runners/clip.ts` (move `clip` out of `index.ts`, then re-export it from `index.ts`), `src/runners/cpp/worker.ts`, `src/runners/cpp/client.ts`

**Interfaces:**
- Consumes: `compileCpp`, `runWasm`, `cppProgram` (Task 4); `parseHarnessOutput`, `mapErrorLines` (Task 3); `CLANG_URL`, `WASI_SHIM_URL` (Task 1).
- Produces:
  - `ensureCpp(): Promise<void>`
  - `onCppStatus(cb): () => void`
  - `cppCheckCases(code, fnName, sig, cases, jsStarter): Promise<CaseOutcome>`
  - `cppRun(code, stdin): Promise<RunResult>`

- [ ] **Step 1: Write the worker**

```ts
/// <reference lib="webworker" />
import { CLANG_URL, WASI_SHIM_URL } from '../versions';
import { compileCpp, runWasm, type WasiShim } from './build';

type Msg = { id: number; type: 'init' } | { id: number; type: 'compile'; source: string } | { id: number; type: 'run'; wasm: Uint8Array; stdin: string };

let mods: Promise<[{ runClang: never }, WasiShim]> | null = null;
const load = () => (mods ??= Promise.all([import(/* @vite-ignore */ CLANG_URL), import(/* @vite-ignore */ WASI_SHIM_URL)]) as Promise<[{ runClang: never }, WasiShim]>);

self.onmessage = async (e: MessageEvent<Msg>) => {
  const m = e.data;
  try {
    const [clang, shim] = await load();
    if (m.type === 'init') {
      const warm = await compileCpp(clang.runClang, 'int main() { return 0; }');
      return self.postMessage(warm.ok ? { id: m.id, ok: true } : { id: m.id, ok: false, error: warm.error });
    }
    if (m.type === 'compile') return self.postMessage({ id: m.id, ok: true, result: await compileCpp(clang.runClang, m.source) });
    self.postMessage({ id: m.id, ok: true, result: await runWasm(shim, m.wasm, m.stdin) });
  } catch (error) {
    if (m.type === 'init') mods = null;
    self.postMessage({ id: m.id, ok: false, error: String(error) });
  }
};
```

- [ ] **Step 2: Write the client**

```ts
import type { Case, CaseOutcome, RunResult } from '../types';
import type { PyStatus } from '../py/client';
import { cppProgram } from './harness';
import { parseHarnessOutput, mapErrorLines } from '../results';
import { clip } from '../clip';

const LOAD_FAIL = "Couldn't load the C++ compiler. Check your connection and try again.";
let worker: Worker | null = null;
let status: PyStatus = 'idle';
let warmed = false;
let nextId = 1;
const listeners = new Set<(s: PyStatus) => void>();
const setStatus = (s: PyStatus) => { status = s; listeners.forEach((cb) => cb(s)); };
export function onCppStatus(cb: (s: PyStatus) => void) { listeners.add(cb); cb(status); return () => { listeners.delete(cb); }; }
function kill() { worker?.terminate(); worker = null; warmed = false; setStatus('idle'); }

function call<T>(msg: Record<string, unknown>, timeoutMs: number, transfer: Transferable[] = []): Promise<T | { timedOut: true }> {
  worker ??= new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const w = worker; const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { w.removeEventListener('message', onMsg); if (worker === w) kill(); else w.terminate(); resolve({ timedOut: true }); }, timeoutMs);
    function onMsg(e: MessageEvent) {
      if (e.data.id !== id) return;
      clearTimeout(timer); w.removeEventListener('message', onMsg);
      if (e.data.ok) resolve(e.data as T); else reject(new Error(e.data.error));
    }
    w.addEventListener('message', onMsg);
    w.postMessage({ ...msg, id }, transfer);
  });
}

export async function ensureCpp(): Promise<void> {
  if (status === 'ready') return;
  setStatus('loading');
  try {
    const r = await call<{ ok: true }>({ type: 'init' }, 60_000);
    if ('timedOut' in r) throw new Error('timeout');
    warmed = true; setStatus('ready');
  } catch { kill(); setStatus('error'); throw new Error(LOAD_FAIL); }
}

type Built = { ok: true; wasm: Uint8Array } | { ok: false; error: string };
async function build(source: string): Promise<Built | 'timeout'> {
  await ensureCpp();
  const r = await call<{ result: Built }>({ type: 'compile', source }, warmed ? 20_000 : 60_000);
  return 'timedOut' in r ? 'timeout' : r.result;
}
const exec = (wasm: Uint8Array, stdin: string) => call<{ result: { exit: number; stdout: string; stderr: string } }>({ type: 'run', wasm, stdin }, 5_000, [wasm.buffer]);

export async function cppCheckCases(code: string, fnName: string, sig: string, cases: Case[], jsStarter: string): Promise<CaseOutcome> {
  const { source, offsets } = cppProgram([{ id: 'x', learner: code, fnName, sig, cases, jsStarter }]);
  const b = await build(source);
  if (b === 'timeout') return { passed: false, results: [], timedOut: true };
  if (!b.ok) return { passed: false, results: [], error: mapErrorLines(b.error, offsets[0]) };
  const r = await exec(b.wasm, '');
  if ('timedOut' in r) return { passed: false, results: [], timedOut: true };
  return parseHarnessOutput(r.result.stdout, cases, 'program crashed');
}

export async function cppRun(code: string, stdin: string): Promise<RunResult> {
  const t0 = performance.now();
  const b = await build(code);
  const ms = () => Math.round(performance.now() - t0);
  if (b === 'timeout') return { stdout: '', stderr: '', ms: ms(), timedOut: true };
  if (!b.ok) return { stdout: '', stderr: clip(b.error), ms: ms() };
  const r = await exec(b.wasm, stdin);
  return 'timedOut' in r ? { stdout: '', stderr: '', ms: ms(), timedOut: true } : { stdout: clip(r.result.stdout), stderr: clip(r.result.stderr), ms: ms() };
}
```

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit -p . && npm run -s build && du -sh dist`
Expected: no errors. `dist` stays small (no 70 MB wasm).

- [ ] **Step 4: Commit**

```bash
git add src/runners
git commit -m "Add the browser C++ runner

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Browser Java runner (CheerpJ iframe)

**Files:**
- Create: `public/cheerpj.html`, `public/cheerpj/ecj-3.22.0.jar` (downloaded), `public/cheerpj/ECJ-NOTICE.txt`, `src/runners/java/client.ts`, `e2e/java-cpp.spec.ts` (Java timeout probe; run after Task 8)

**Interfaces:**
- Consumes: `javaProgram` (Task 5); `parseHarnessOutput`, `mapErrorLines` (Task 3).
- Produces:
  - `ensureJava(): Promise<void>`
  - `onJavaStatus(cb)`
  - `javaCheckCases(code, fnName, sig, cases, jsStarter): Promise<CaseOutcome>`
  - `javaRun(code): Promise<RunResult>`

- [ ] **Step 1: Fetch ECJ and verify its checksum**

```bash
mkdir -p public/cheerpj
curl -sL -o public/cheerpj/ecj-3.22.0.jar https://repo1.maven.org/maven2/org/eclipse/jdt/ecj/3.22.0/ecj-3.22.0.jar
echo "expected: $(curl -sL https://repo1.maven.org/maven2/org/eclipse/jdt/ecj/3.22.0/ecj-3.22.0.jar.sha1)"
sha1sum public/cheerpj/ecj-3.22.0.jar
```

Expected: the two SHA-1 values match.

`public/cheerpj/ECJ-NOTICE.txt`:

```
ecj-3.22.0.jar is the unmodified Eclipse Compiler for Java (org.eclipse.jdt:ecj:3.22.0) from Maven Central.
Licence: Eclipse Public License 2.0, https://www.eclipse.org/legal/epl-2.0/
Source: https://github.com/eclipse-jdt/eclipse.jdt.core
```

- [ ] **Step 2: Write `public/cheerpj.html`**

```html
<!doctype html>
<html><head><meta charset="utf-8"><title>Java runtime</title>
<script src="https://cjrtnc.leaningtech.com/4.3/loader.js"></script></head>
<body><script>
  const origin = location.origin;
  const jar = '/app' + new URL('cheerpj/ecj-3.22.0.jar', location.href).pathname;
  let buf = null, ready = null, n = 0;
  const log = console.log.bind(console), err = console.error.bind(console);
  console.log = (...a) => { if (buf) buf.out.push(a.join(' ')); else log(...a); };
  console.error = (...a) => { if (buf) buf.err.push(a.join(' ')); else err(...a); };
  const reply = (msg) => parent.postMessage(msg, origin);
  addEventListener('message', async (e) => {
    if (e.origin !== origin || !e.data || typeof e.data.id !== 'number') return;
    const { id, type, source, dir } = e.data;
    try {
      ready ??= cheerpjInit({ version: 8, status: 'none' });
      await ready;
      if (type === 'init') return reply({ id, ok: true });
      if (type === 'compile') {
        const d = '/files/r' + (++n);
        const path = '/str/r' + n + '/Main.java';
        cheerpOSAddStringFile(path, source);
        buf = { out: [], err: [] };
        const exit = await cheerpjRunMain('org.eclipse.jdt.internal.compiler.batch.Main', jar, '-8', '-encoding', 'UTF-8', '-nowarn', '-d', d, path);
        const text = buf.out.concat(buf.err).join('\n');
        buf = null;
        return reply({ id, ok: true, exit, dir: d, text });
      }
      buf = { out: [], err: [] };
      const exit = await cheerpjRunMain('Main', dir);
      const out = buf.out.join('\n'), errText = buf.err.join('\n');
      buf = null;
      reply({ id, ok: true, exit, out, err: errText });
    } catch (x) {
      buf = null;
      reply({ id, ok: false, error: String(x) });
    }
  });
  reply({ type: 'frame-ready' });
</script></body></html>
```

- [ ] **Step 3: Write `src/runners/java/client.ts`**

```ts
import type { Case, CaseOutcome, RunResult } from '../types';
import type { PyStatus } from '../py/client';
import { javaProgram } from './harness';
import { parseHarnessOutput, mapErrorLines } from '../results';
import { clip } from '../clip';

const LOAD_FAIL = "Couldn't load Java. Check your connection and try again.";
let frame: HTMLIFrameElement | null = null;
let frameReady: Promise<void> | null = null;
let status: PyStatus = 'idle';
let warmed = false;
let nextId = 1;
const listeners = new Set<(s: PyStatus) => void>();
const setStatus = (s: PyStatus) => { status = s; listeners.forEach((cb) => cb(s)); };
export function onJavaStatus(cb: (s: PyStatus) => void) { listeners.add(cb); cb(status); return () => { listeners.delete(cb); }; }

function kill() { frame?.remove(); frame = null; frameReady = null; warmed = false; setStatus('idle'); }

function ensureFrame(): Promise<void> {
  if (frameReady) return frameReady;
  const f = document.createElement('iframe');
  f.src = new URL('cheerpj.html', document.baseURI).href;
  f.title = 'Java runtime';
  f.setAttribute('aria-hidden', 'true');
  f.tabIndex = -1;
  f.style.cssText = 'position:absolute;width:1px;height:1px;border:0;left:-9999px;top:0';
  frame = f;
  frameReady = new Promise((resolve) => {
    const onMsg = (e: MessageEvent) => { if (e.source === f.contentWindow && e.data?.type === 'frame-ready') { removeEventListener('message', onMsg); resolve(); } };
    addEventListener('message', onMsg);
  });
  document.body.appendChild(f);
  return frameReady;
}

async function call<T>(msg: Record<string, unknown>, timeoutMs: number): Promise<T | { timedOut: true }> {
  await ensureFrame();
  const f = frame!; const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { removeEventListener('message', onMsg); if (frame === f) kill(); else f.remove(); resolve({ timedOut: true }); }, timeoutMs);
    function onMsg(e: MessageEvent) {
      if (e.source !== f.contentWindow || e.data?.id !== id) return;
      clearTimeout(timer); removeEventListener('message', onMsg);
      if (e.data.ok) resolve(e.data as T); else reject(new Error(e.data.error));
    }
    addEventListener('message', onMsg);
    f.contentWindow!.postMessage({ ...msg, id }, location.origin);
  });
}

export async function ensureJava(): Promise<void> {
  if (status === 'ready') return;
  setStatus('loading');
  try {
    const r = await call<{ ok: true }>({ type: 'init' }, 90_000);
    if ('timedOut' in r) throw new Error('timeout');
    setStatus('ready');
  } catch { kill(); setStatus('error'); throw new Error(LOAD_FAIL); }
}

async function compileAndRun(source: string): Promise<{ timedOut: true } | { compileError: string } | { out: string; err: string }> {
  await ensureJava();
  const c = await call<{ exit: number; dir: string; text: string }>({ type: 'compile', source }, warmed ? 30_000 : 90_000);
  if ('timedOut' in c) return c;
  warmed = true;
  if (c.exit !== 0) return { compileError: c.text };
  const r = await call<{ exit: number; out: string; err: string }>({ type: 'run', dir: c.dir }, 5_000);
  return 'timedOut' in r ? r : { out: r.out, err: r.err };
}

export async function javaCheckCases(code: string, fnName: string, sig: string, cases: Case[], jsStarter: string): Promise<CaseOutcome> {
  const { source, offset } = javaProgram({ learner: code, fnName, sig, cases, jsStarter });
  const r = await compileAndRun(source);
  if ('timedOut' in r) return { passed: false, results: [], timedOut: true };
  if ('compileError' in r) return { passed: false, results: [], error: mapErrorLines(r.compileError, offset) };
  return parseHarnessOutput(r.out, cases, 'no output');
}

export async function javaRun(code: string): Promise<RunResult> {
  const t0 = performance.now();
  const r = await compileAndRun(code);
  const ms = Math.round(performance.now() - t0);
  if ('timedOut' in r) return { stdout: '', stderr: '', ms, timedOut: true };
  if ('compileError' in r) return { stdout: '', stderr: clip(r.compileError), ms };
  return { stdout: clip(r.out), stderr: clip(r.err), ms };
}
```

- [ ] **Step 4: Write the iframe-kill probe** (`e2e/java-cpp.spec.ts`). Run it after Task 8 Step 6.

```ts
import { test, expect } from '@playwright/test';
test.describe.configure({ timeout: 240_000 });

test('a Java endless loop times out and the next run works', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'Java' }).click();
  const editor = page.getByRole('textbox', { name: 'Java editor' });
  const run = page.getByRole('button', { name: 'Run' });
  await editor.fill('public class Main { public static void main(String[] a) { while (true) {} } }');
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.getByText('Stopped after 5 s. Check for an endless loop.')).toBeVisible({ timeout: 120_000 });
  await editor.fill('public class Main { public static void main(String[] a) { System.out.println(6 * 7); } }');
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.locator('pre.stdout')).toHaveText('42', { timeout: 120_000 });
});
```

If this fails because the page freezes:
- In `javaRun` and `javaCheckCases`, change the Java run timeout to set status `error` and return the stderr "Stopped after 5 s. Reload the page to run Java again."
- Change the test to expect that text.
- Ledger: `Task 7: Ruling: iframe removal does not stop CheerpJ — reload fallback`.

- [ ] **Step 5: Type-check and commit**

Run: `npx tsc --noEmit -p .`

```bash
git add public/cheerpj.html public/cheerpj src/runners/java/client.ts e2e/java-cpp.spec.ts
git commit -m "Add the browser Java runner using CheerpJ in an iframe

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Registry and UI integration

**Files:**
- Modify: `src/runners/types.ts` (`Lang`), `src/runners/index.ts`, `src/exercises/js-code/Runner.tsx`, `src/pages/PlaygroundPage.tsx`, `package.json` (`@codemirror/lang-java@6.0.2`, `@codemirror/lang-cpp@6.0.3`)
- Test: `src/runners/index.test.ts` (extend)

**Interfaces:**
- Produces, from `index.ts`:
  - `ensureLang(lang)`: resolves immediately for js and ts.
  - `onLangStatus(lang, cb)`: for js and ts, calls `cb('ready')` and returns a no-op unsubscribe.
  - `checkCases(lang, code, fnName, cases, jsStarter, sig?)`.
  - `runProgram(lang, code, stdin)`.
  - `LANG_LABEL` (five entries), `LOAD_NOTICE`, `LOAD_FAIL`.

- [ ] **Step 1: Write the failing test** (append to `src/runners/index.test.ts`; update the existing labels test to the five labels)

```ts
import { LOAD_NOTICE, onLangStatus } from './index';

describe('language registry', () => {
  it('labels Java and C++', () => {
    expect(LANG_LABEL).toEqual({ js: 'JavaScript', ts: 'TypeScript', py: 'Python', java: 'Java', cpp: 'C++' });
  });
  it('has the agreed loading notices', () => {
    expect(LOAD_NOTICE.java).toBe('Loading Java (about 20 MB, first time only)...');
    expect(LOAD_NOTICE.cpp).toBe('Loading C++ compiler (about 19 MB, first time only)...');
    expect(LOAD_NOTICE.py).toBe('Loading Python (about 10 MB, first time only)...');
  });
  it('reports JS as always ready', () => {
    const seen: string[] = [];
    onLangStatus('js', (s) => seen.push(s))();
    expect(seen).toEqual(['ready']);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/runners/index.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the registry**

In `types.ts`: `export type Lang = 'js' | 'ts' | 'py' | 'java' | 'cpp';`.

In `index.ts`:
- Import `clip` from `./clip` and re-export it.
- Import `onPyStatus`/`ensurePython` from `./py/client`, `onJavaStatus`/`ensureJava` from `./java/client`, and `onCppStatus`/`ensureCpp` from `./cpp/client`. These modules are small; Pyodide, CheerpJ, and Clang still load lazily from CDNs.
- Add:

```ts
export const LANG_LABEL: Record<Lang, string> = { js: 'JavaScript', ts: 'TypeScript', py: 'Python', java: 'Java', cpp: 'C++' };
export const LOAD_NOTICE: Partial<Record<Lang, string>> = {
  py: 'Loading Python (about 10 MB, first time only)...',
  java: 'Loading Java (about 20 MB, first time only)...',
  cpp: 'Loading C++ compiler (about 19 MB, first time only)...',
};
export const LOAD_FAIL: Partial<Record<Lang, string>> = {
  py: "Couldn't load Python. Check your connection and try again.",
  java: "Couldn't load Java. Check your connection and try again.",
  cpp: "Couldn't load the C++ compiler. Check your connection and try again.",
};
export function ensureLang(lang: Lang): Promise<void> {
  if (lang === 'py') return ensurePython();
  if (lang === 'java') return ensureJava();
  if (lang === 'cpp') return ensureCpp();
  return Promise.resolve();
}
export function onLangStatus(lang: Lang, cb: (s: PyStatus) => void): () => void {
  if (lang === 'py') return onPyStatus(cb);
  if (lang === 'java') return onJavaStatus(cb);
  if (lang === 'cpp') return onCppStatus(cb);
  cb('ready');
  return () => {};
}
```

Extend `checkCases` with a trailing `sig?: string` parameter. At its top:

```ts
  if (lang === 'java' || lang === 'cpp') {
    if (!sig) return { passed: false, results: [], error: 'This exercise has no signature for this language.' };
    return lang === 'java'
      ? (await import('./java/client')).javaCheckCases(code, fnName, sig, cases, jsStarter)
      : (await import('./cpp/client')).cppCheckCases(code, fnName, sig, cases, jsStarter);
  }
```

In `runProgram`: `if (lang === 'java') return (await import('./java/client')).javaRun(code);` and `if (lang === 'cpp') return (await import('./cpp/client')).cppRun(code, stdin);`.

- [ ] **Step 4: Update `Runner.tsx`** (run `npm i @codemirror/lang-java@6.0.2 @codemirror/lang-cpp@6.0.3` first)

- **Imports:** `java` from `@codemirror/lang-java`, `cpp` from `@codemirror/lang-cpp`, `parseSig`/`javaStarter`/`cppStarter` from `../../runners/sig`, `javaHelpersFor` from `../../runners/java/helpers`, `cppHelpersFor` from `../../runners/cpp/helpers`, and `ensureLang`/`onLangStatus`/`LOAD_NOTICE`/`LOAD_FAIL` from `../../runners`.
- **Editor extension:** `lang === 'py' ? python() : lang === 'java' ? java() : lang === 'cpp' ? cpp() : javascript({ typescript: lang === 'ts' })`.
- **`starterFor(l)`:**
  - `'py'` → `pyStarter(...)` (unchanged)
  - `'java'` → `javaStarter(exercise.fnName, parseSig(exercise.sig!))`
  - `'cpp'` → `cppStarter(exercise.fnName, parseSig(exercise.sig!))`
  - anything else → `exercise.starter`
- **Helpers panel text:**
  - `'py'` → `preludeFor(exercise.starter)`
  - `'java'` → `javaHelpersFor(exercise.starter)`, only when the starter contains `class ` (otherwise empty)
  - `'cpp'` → `'// Standard headers are included and using namespace std; is set.\n' + cppHelpersFor(exercise.starter)`
  - otherwise → `''`
- **Status:** state `status` via `useEffect(() => onLangStatus(lang, setStatus), [lang])`, and `useEffect(() => { ensureLang(lang).catch(() => {}); }, [lang])`.
  - `busy = status === 'loading'`; show `LOAD_NOTICE[lang]` while busy.
  - On `status === 'error'`, show `LOAD_FAIL[lang]` and a Retry button calling `ensureLang(lang)`.
- **Timeouts:** for js and ts keep "Your code ran too long. Check for an endless loop."; for all others "Stopped after 5 s. Check for an endless loop."
- **checkCases:** pass `exercise.sig` as the sixth argument.
- **Tabs:** add `disabled={running}` to each tab button.

- [ ] **Step 5: Update `PlaygroundPage.tsx`**

- `PlayLang` includes `java` and `cpp`; `LABEL` uses `LANG_LABEL` plus `sql: 'SQL'`.
- `SAMPLE.java`:

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> v = new ArrayList<>(Arrays.asList(3, 1, 2));
        Collections.sort(v);
        System.out.println("Hello, world! " + v);
    }
}
```

- `SAMPLE.cpp`:

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string name;
    if (!getline(cin, name) || name.empty()) name = "world";
    vector<int> v = {3, 1, 2};
    sort(v.begin(), v.end());
    cout << "Hello, " << name << "! " << v[0] << v[1] << v[2] << endl;
}
```

- Same editor extension mapping and status handling as `Runner.tsx` (SQL counts as always ready).
- For `java`, replace the stdin textarea with `<p className="muted">Input is not supported for Java yet.</p>`.
- Update `isPlayLang` to accept `java` and `cpp`.

- [ ] **Step 6: Run checks**

Run: `npx vitest run && npx tsc --noEmit -p . && npm run -s build && npx playwright test`
Expected: all PASS. This includes the 11 existing e2e tests and Task 7's Java probe (apply its fallback ruling if it fails).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/runners src/exercises/js-code/Runner.tsx src/pages/PlaygroundPage.tsx
git commit -m "Add Java and C++ tabs to exercises and the playground

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Solution suites and end-to-end tests

**Files:**
- Create: `src/runners/java/java-solutions.test.ts`, `src/runners/cpp/cpp-solutions.test.ts`
- Modify: `e2e/java-cpp.spec.ts`

- [ ] **Step 1: Write the C++ solution suite**

```ts
import { describe, it, expect } from 'vitest';
import { worlds } from '../../content/index';
import type { JsEx, Task } from '../../schema';
import { cppBatch } from './testCpp';

const REQUIRE_ALL = false;
const WORLDS = ['algorithms', 'cs-fundamentals'];

describe('C++ reference solutions', { timeout: 1_800_000 }, () => {
  for (const wid of WORLDS) {
    const w = worlds.find((x) => x.id === wid)!;
    const groups = [
      ...w.chapters.map((c) => ({ name: c.id, tasks: c.lessons.map((l) => l.exercise) as Task[] })),
      { name: `${wid}-boss`, tasks: w.boss.steps as Task[] },
    ].map((g) => ({ name: g.name, tasks: g.tasks.filter((t): t is JsEx => t.kind === 'js-code') }));
    for (const g of groups) {
      it(`${g.name}: every cpp.solution passes`, async () => {
        const units = g.tasks.filter((t) => t.cpp).map((t) => ({ id: t.id, learner: t.cpp!.solution, fnName: t.fnName, sig: t.sig!, cases: t.cases, jsStarter: t.starter }));
        if (!units.length) return;
        const res = await cppBatch(units);
        for (const u of units) {
          const r = res.get(u.id)!;
          expect([u.id, 'compileError' in r ? r.compileError : null, 'compileError' in r ? [] : r.results.filter((x) => !x.ok)]).toEqual([u.id, null, []]);
        }
      });
    }
    it(`${wid}: every code exercise offers C++`, () => {
      const missing = groups.flatMap((g) => g.tasks).filter((t) => !t.langs?.includes('cpp')).map((t) => t.id);
      if (REQUIRE_ALL) expect(missing).toEqual([]);
    });
  }
});
```

- [ ] **Step 2: Write the Java solution suite** (same structure)

```ts
import { describe, it, expect } from 'vitest';
import { worlds } from '../../content/index';
import type { JsEx, Task } from '../../schema';
import { javaBatch, hasJavac } from './testJava';

const REQUIRE_ALL = false;
const WORLDS = ['algorithms', 'cs-fundamentals'];

describe.skipIf(!hasJavac)('Java reference solutions', { timeout: 1_800_000 }, () => {
  for (const wid of WORLDS) {
    const w = worlds.find((x) => x.id === wid)!;
    const groups = [
      ...w.chapters.map((c) => ({ name: c.id, tasks: c.lessons.map((l) => l.exercise) as Task[] })),
      { name: `${wid}-boss`, tasks: w.boss.steps as Task[] },
    ].map((g) => ({ name: g.name, tasks: g.tasks.filter((t): t is JsEx => t.kind === 'js-code') }));
    for (const g of groups) {
      it(`${g.name}: every java.solution passes`, () => {
        const units = g.tasks.filter((t) => t.java).map((t) => ({ id: t.id, learner: t.java!.solution, fnName: t.fnName, sig: t.sig!, cases: t.cases, jsStarter: t.starter }));
        if (!units.length) return;
        const res = javaBatch(units);
        for (const u of units) {
          const r = res.get(u.id)!;
          expect([u.id, 'compileError' in r ? r.compileError : null, 'compileError' in r ? [] : r.results.filter((x) => !x.ok)]).toEqual([u.id, null, []]);
        }
      });
    }
    it(`${wid}: every code exercise offers Java`, () => {
      const missing = groups.flatMap((g) => g.tasks).filter((t) => !t.langs?.includes('java')).map((t) => t.id);
      if (REQUIRE_ALL) expect(missing).toEqual([]);
    });
  }
});
```

- [ ] **Step 3: Run both suites**

Run: `npx vitest run src/runners/java/java-solutions.test.ts src/runners/cpp/cpp-solutions.test.ts`
Expected: PASS (no content yet).

- [ ] **Step 4: Add e2e tests to `e2e/java-cpp.spec.ts`**

```ts
test('playground compiles and runs C++', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'C++' }).click();
  await page.getByRole('textbox', { name: 'C++ editor' }).fill('#include <iostream>\nint main() { std::cout << 6 * 7 << std::endl; }');
  const run = page.getByRole('button', { name: 'Run' });
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.locator('pre.stdout')).toHaveText('42', { timeout: 120_000 });
});

test('playground runs Java', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'Java' }).click();
  await page.getByRole('textbox', { name: 'Java editor' }).fill('public class Main { public static void main(String[] a) { System.out.println(6 * 7); } }');
  const run = page.getByRole('button', { name: 'Run' });
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.locator('pre.stdout')).toHaveText('42', { timeout: 120_000 });
});

test('a C++ endless loop times out and the next run works', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'C++' }).click();
  const editor = page.getByRole('textbox', { name: 'C++ editor' });
  const run = page.getByRole('button', { name: 'Run' });
  await editor.fill('int main() { volatile int x = 0; while (true) { x++; } }');
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.getByText('Stopped after 5 s. Check for an endless loop.')).toBeVisible({ timeout: 60_000 });
  await editor.fill('#include <iostream>\nint main() { std::cout << "again" << std::endl; }');
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.locator('pre.stdout')).toHaveText('again', { timeout: 120_000 });
});

for (const [lang, label, code] of [
  ['C++', 'C++ editor', 'class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) { unordered_set<int> s; for (int n : nums) { if (s.count(n)) return true; s.insert(n); } return false; }\n};'],
  ['Java', 'Java editor', 'class Solution {\n    public boolean containsDuplicate(int[] nums) { Set<Integer> s = new HashSet<>(); for (int n : nums) if (!s.add(n)) return true; return false; }\n}'],
] as const) {
  test(`an algorithms exercise passes in ${lang}`, async ({ page }) => {
    await page.goto('/#/w/algorithms/al-arrays/l1');
    await page.getByRole('tab', { name: lang }).click();
    await page.getByRole('textbox', { name: label }).fill(code);
    const check = page.locator('.js-runner').getByRole('button', { name: 'Check answer' });
    await expect(check).toBeEnabled({ timeout: 120_000 });
    await check.click();
    await expect(page.getByText('All cases passed.')).toBeVisible({ timeout: 120_000 });
  });
}
```

The two exercise tests need the arrays chapter content from Task 10. Run them then.

- [ ] **Step 5: Commit**

```bash
git add src/runners/java/java-solutions.test.ts src/runners/cpp/cpp-solutions.test.ts e2e/java-cpp.spec.ts
git commit -m "Add Java and C++ solution suites and end-to-end tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tasks 10–13: Signatures and Java/C++ solutions (content)

**Per-chapter procedure:**

1. Dump the chapter with `npx tsx .superpowers/dumpex.ts <worldId> <chapterId>` (prompt, cases, JS solution).
2. Write a solutions file in the scratchpad, with one section per exercise:

   ```
   ### fnName
   @sig (int[] nums) -> bool
   @java
   class Solution { ... }
   @cpp
   class Solution { ... };
   ```

3. Insert with `python .superpowers/addlang.py <solutions file> <ts files...>`. It inserts `sig: "...", java: "...", cpp: "...", ` before `fn: 'fnName',` in each `ex` object (JSON string literals). It exits with an error if a name matches zero or more than one place, or if that `ex` already has `sig:`.
4. Verify with `npx vitest run src/runners/java/java-solutions.test.ts src/runners/cpp/cpp-solutions.test.ts src/content -t "<chapter-id>"` and `npx tsc --noEmit -p .`. If a solution fails, fix the solution, never the cases.
5. Commit with the message `Add Java and C++ solutions to <chapter title>`.

**Signature rules:**

| Input or output | Signature |
|---|---|
| Level-order tree arrays (with `null`) | `int?[]` |
| Linked-list input | `int[]` |
| Random-pointer pairs | `int?[][]` |
| Graph adjacency | `int[][]` |
| Operation lists mixing strings and numbers | `any` |
| Object results with fixed fields | `any` |
| Objects with arbitrary string keys and uniform values | `map<T>` |
| Values that can exceed 2,147,483,647 | `long` |
| Results that may be `null` | `any` |
| Arbitrarily nested input (`flatten`) | `any` |

**Language rules:**
- **Java:** Java 8 only. No `var`, `List.of`, `Map.of`, records, text blocks, or switch expressions. Both ECJ `-8` and `javac --release 8` reject them.
- **C++:** C++17 that never throws at runtime.

#### Task 10: Algorithms chapters 1–6

First create `.superpowers/addlang.py` (modelled on `.superpowers/addpy.py`; parses `@sig`/`@java`/`@cpp` blocks). Then do arrays, two-pointers, sliding-window, stack, binary-search, and linked-list. After arrays, run Task 9's exercise e2e tests.

#### Task 11: Algorithms chapters 7–12

trees, heap, backtracking, tries, graphs, adv-graphs.

#### Task 12: Algorithms chapters 13–18 and the Algorithms boss

dp1, dp2, greedy, intervals, math, bits, and boss step `al-boss-2`. Create `.superpowers/addbosslang.py`, which inserts `sig`, `java`, `cpp`, and extends `langs` on a boss step found by `fnName`.

#### Task 13: CS Fundamentals and the CS boss

complexity, data-structures, sorting, recursion, numbers, architecture, os, concurrency, theory, and boss step `cs-boss-2`.

---

### Task 14: Coverage gate and full verification

- [ ] **Step 1:** Set `REQUIRE_ALL = true` in both solution suites.
- [ ] **Step 2:** Run `npx vitest run && npx tsc --noEmit -p . && npm run -s build && npx playwright test`.
  Expected: everything PASSES. That includes the coverage tests (206 exercises each) and 17 e2e tests: 11 existing plus 6 new.
- [ ] **Step 3:** Take screenshots of an exercise on the Java tab and on the C++ tab (adapt `.superpowers/py-shot.mjs`), and of `/playground` with C++ selected. Read them.
- [ ] **Step 4:** Commit `Require Java and C++ solutions for every Algorithms and CS exercise`. Append a progress note to `.superpowers/progress.md`.
