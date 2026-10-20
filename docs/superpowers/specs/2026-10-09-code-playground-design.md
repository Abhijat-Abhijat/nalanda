# Multi-language code playground: Phase A design

Date: 2026-10-09
Status: draft, awaiting review

## Goal

Learners can write and run code the way they do on NeetCode, in more languages than JavaScript. This happens in two places:

1. **Code exercises.** The Algorithms (NeetCode 150) and CS Fundamentals exercises get language tabs: JavaScript, TypeScript, and Python. All languages are checked against the same test cases.
2. **The `/playground` page.** A free-form editor where learners can pick JavaScript, TypeScript, Python, or SQL, run code, and see the output.

All code runs in the learner's browser. There is no server, so there is nothing to pay for and nothing to secure on a backend, and the site stays fully static.

## What the user asked for

- "In NeetCode I can code and run it in Python, Java, SQL, and all. I also want that playground to be there."
- Runtime: free options only, and browser-only if a free server is not possible. No dependable free server runner was found: the public Piston instance's status is unconfirmed, and Judge0's free tier needs a secret key, which a static site cannot hold. So the runtime is browser-only.
- Scope: Phase A first, covering the playground plus JS, TS, and Python on exercises. Java and C++ come in Phase B, which gets its own spec.
- Python reference solutions are required for every exercise that offers Python, so tests verify each one.

## Non-goals (Phase A)

- Java, C++, Go, and Rust. Phase B will evaluate CheerpJ (Java, free Community licence, loaded from its CDN) and `@yowasp/clang` (C++).
- Converting the Python world's 60 choice and order exercises into coding exercises. This is a follow-up content task.
- Accounts, sharing links, or saving code on a server.
- Language tabs on exercises in other worlds, such as the JS/TS, Frontend, and Backend worlds. Those exercises depend on JavaScript-specific behaviour.

## Current state

- `js-code` exercises (`src/schema.ts` `JsEx`) have `starter`, `fnName`, `cases` (JSON `args` and `expect`), `solution`, and `hint`.
- `src/exercises/js-code/runInWorker.ts` already runs code in a module Web Worker with a 2-second timeout. `runCases.ts` compares results with `JSON.stringify`.
- `src/exercises/solutions.ts`, together with the content tests, checks every reference solution against its cases.
- The Algorithms world's `problem()` and the CS world's `topic()` build every exercise. Linked-list, tree, and heap problems put JS helper classes (`ListNode`, `fromArray`, `toArray`, `TreeNode`, `buildTree`, `treeToArray`, `Heap`) at the top of `starter` and `solution`.
- The SQL exercises use sql.js (SQLite in WASM) through `src/exercises/sql-query/sqlRunner.ts`, which uses the `shop` database.
- The editor is CodeMirror 6 via `@uiw/react-codemirror`.

## Design

### 1. Runner layer: `src/runners/`

There is one module per language, all with the same interface:

```ts
type RunResult = { stdout: string; stderr: string; ms: number; timedOut?: boolean };
type CaseResult = { ok: boolean; got?: unknown; error?: string };
type CaseOutcome = { passed: boolean; results: CaseResult[]; error?: string; timedOut?: boolean };

interface LangRunner {
  run(code: string, stdin: string): Promise<RunResult>;                     // playground
  runCases(code: string, fnName: string, cases: Case[]): Promise<CaseOutcome>; // exercises
}
```

- **`js`**: wraps the existing worker. `run` captures `console.log` output into `stdout`.
- **`ts`**: strips types with `sucrase` (the `typescript` transform only, about 200 KB, MIT licence), then hands the result to the `js` runner. Sucrase is loaded lazily.
- **`py`**: Pyodide runs inside its own module Web Worker.
  - Pyodide is loaded from `https://cdn.jsdelivr.net/pyodide/v<version>/full/`, so the site bundle does not grow. `<version>` is the latest stable release when implementation starts, kept in one constant (`PYODIDE_VERSION`) and matching the `pyodide` dev dependency used by tests.
  - The worker is created once and reused, because loading Pyodide takes several seconds the first time and the browser caches it afterwards.
  - On a timeout, the main thread terminates the worker and creates a new one next time. This is the only reliable way to stop an endless `while True`.
  - The timeout is 5 seconds, or 30 seconds while Pyodide is still loading.
  - `stdin` is supplied through `pyodide.setStdin`, so `input()` works in the playground.
- **`sql`** (playground only): reuses `sqlRunner.ts` and returns result tables, not text.

A registry, `getRunner(lang)`, imports each runner lazily, so learners who never touch Python never download it.

### 2. Python test harness

`runCases` for Python works in three steps:

1. Run the learner's code, together with the helper prelude described below, in a fresh namespace.
2. For each case, call `fnName(*args)`. The args are converted from JSON with `json.loads`, so arrays become lists and `null` becomes `None`.
3. Normalise the result and compare it with `expect` using the same canonical JSON as the JS runner. Normalisation has three rules:
   - Floats that are whole numbers become ints, so 5.0 becomes 5.
   - Tuples become lists.
   - A `set` becomes a sorted list. Learners rarely return sets; when they do, the result passes only if the expected value is that sorted list.

   The JS side compares with `JSON.stringify`, which keeps object key order. Python dicts keep insertion order, so this matches.

Errors report the Python exception type, message, and line number in the learner's code. The prelude's line count is subtracted.

### 3. Helper preludes

- `src/runners/py/preludes.ts` exports Python versions of the JS helpers, with the same names, so prompts stay valid for both languages:
  - `ListNode`, `fromArray`, `toArray`
  - `TreeNode`, `buildTree`, `treeToArray`
  - `Heap` with `push`, `pop`, `peek`, `size`, and a `cmp` function
- A prelude is attached when the JS starter contains its marker class: `class ListNode`, `class TreeNode`, or `class Heap`.
- The learner sees the prelude as a collapsed, read-only "Helpers provided" block above the editor, not as starter text.

### 4. Schema and content changes

`JsEx` gains two optional fields:

```ts
langs: z.array(z.enum(['js', 'ts', 'py'])).optional(),  // absent means ['js']
py: z.object({ solution: z.string().min(1) }).optional(),
```

- **Validation rule:** if `langs` includes `'py'`, then `py.solution` is required. This is checked in the existing content validation.
- **TS** needs no separate solution. The JS solution is valid TypeScript, and the test transpiles it to confirm that.
- **Python starter:** generated rather than stored, as `def <fnName>(<params>):\n    # your code\n    pass`. The params come from the JS starter signature.
- **Content work:**
  - `problem()` (Algorithms) and `topic()` (CS) accept a `py` string and set `langs: ['js', 'ts', 'py']`.
  - Python reference solutions are written for all 150 Algorithms exercises, all 54 CS exercises, and the two js-code boss steps (`al-boss-2`, `cs-boss-2`). That is 206 solutions in total, added chapter by chapter, one commit per chapter.

### 5. Exercise UI

`JsRunner` becomes `CodeRunner` and handles any of the exercise's `langs`:

- **Language tabs** appear above the editor only when `langs` has more than one entry. The default tab is the learner's last-used language, which is stored in localStorage and falls back to `js`.
- **Code persistence:** code is saved per exercise per language (`nalanda:code:<exerciseId>:<lang>`). Switching tabs never loses work, and a "Reset" button restores the starter.
- **Editor modes:** CodeMirror language mode is set per tab. This adds `@codemirror/lang-python`, about 30 KB.
- **Python loading:** the first Python run shows "Loading Python (about 10 MB, first time only)...". The Check button stays disabled until Python is ready.
- **Results:** the results list and messages stay as they are today. Timeout messages name the limit.
- **Progress:** passing in any language counts as passing the exercise. Progress logic does not change.
- **Storage access:** every localStorage read and write is wrapped in try/catch.

### 6. Playground page

The playground lives at the route `/playground`, with a "Playground" link in the top nav.

- **Controls:** a language picker (JavaScript, TypeScript, Python, SQL), a CodeMirror editor, a Run button (Ctrl/Cmd+Enter also runs), and a Clear output button.
- **Inputs and outputs:** a stdin textarea (JS, TS, and Python only). The output panel shows stdout, stderr in red, and the elapsed time.
- **SQL:** shows result tables, and a collapsible schema panel lists the `shop` tables.
- **Starters:** each language starts with a short sample program. Code is saved per language in localStorage.
- **Layout:** side by side on wide screens, stacked on phones. It follows the existing site styles.

### 7. Error handling

| Situation | Behaviour |
|---|---|
| Endless loop | Worker terminated after the timeout. The message is "Stopped after 5 s. Check for an endless loop." |
| Pyodide CDN unreachable | "Couldn't load Python. Check your connection and try again." A Retry button appears, and the JS tab still works. |
| Syntax error | Shown with its line number, relative to the learner's code. |
| Huge output | stdout is truncated at 100 KB, with a notice. |
| Missing function | "Define a function named `<fnName>`." in every language. |

### 8. Testing

- **Unit (Vitest):**
  - the Python normaliser rules
  - Python starter generation from JS signatures
  - prelude detection
  - TS transpile of every JS solution in the Algorithms and CS worlds
  - the schema rule that `py` requires `py.solution`
- **Python solutions:** a Vitest suite loads the `pyodide` npm package (a dev dependency only) in Node and runs every `py.solution` against its cases through the same harness code the browser uses. This is the guarantee the user asked for. It is slow, roughly 20 to 40 seconds, so it sits in its own file (`py-solutions.test.ts`) that also runs in the normal `npx vitest run`.
- **E2E (Playwright):**
  - The playground runs Python `print(sum(range(10)))` and shows `45`.
  - The playground runs a SQL query and shows a table.
  - One Algorithms exercise passes in Python. The test unlocks it through the existing test-progress helper.
  - The existing 7 tests still pass.

## Size and performance

- Main bundle change: the playground route and runner registry are lazily loaded, at most about 10 KB in the main chunk.
- Sucrase (about 200 KB) and the Python language mode (about 30 KB) are lazily loaded.
- Pyodide (about 10 MB) comes from the CDN on first Python use only and is cached by the browser.

## Risks

- **jsDelivr dependency for Python.** If the CDN is blocked, Python is unavailable. JS and TS still work, and the error message says why. Self-hosting Pyodide's files in `public/` is possible later if needed.
- **Semantics differ between languages.** Examples: JS `>>> 0` versus unbounded Python ints in `swap32`, and `addInt32` wrap-around. The Python reference solutions must produce the same expected values, and the Python-solutions suite enforces this. Where a prompt is JS-specific, the prompt gets a one-line Python note. An example is "in Python, mask with `& 0xFFFFFFFF`".
- **Content volume.** 206 Python solutions take time to write. They are written and verified chapter by chapter.

## Phase B preview (separate spec)

- Java via CheerpJ: free Community licence, loaded from its CDN, and needs a check of its terms if the site ever earns money.
- C++ via `@yowasp/clang`: about 25 MB gzipped.
- Both need typed function signatures per exercise.
