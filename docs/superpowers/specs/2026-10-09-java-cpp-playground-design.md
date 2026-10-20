# Java and C++ in the playground: Phase B design

Date: 2026-10-09
Status: draft, awaiting review
Builds on: `docs/superpowers/specs/2026-10-09-code-playground-design.md` (Phase A, shipped)

## Goal

Learners can solve every Algorithms and CS Fundamentals coding exercise in **Java** and **C++** as well as JavaScript, TypeScript, and Python, and can run Java and C++ freely in `/playground`. All code runs in the browser with free tools.

## Decisions already made with the user

- **Scope:** the playground plus all 206 exercises (151 Algorithms, 55 CS Fundamentals). Each exercise gets a tested Java and a tested C++ reference solution, as Phase A did for Python.
- **Mixed-type exercises:** use approach 1. Every exercise gets a typed signature, and about 15 exercises with heterogeneous inputs or object results use an `any` type: `Object` in Java and a provided `Json` value type in C++. Prompts and cases stay identical across languages.
- **Licence:** Nalanda becomes an open-source project under MIT. CheerpJ's free Community licence covers FOSS projects, provided it is loaded from Leaning Technologies' CDN and credited. The user publishes the repository publicly.

## Findings from the feasibility test (throwaway code, not kept)

| | C++ | Java |
|---|---|---|
| Tool | `@yowasp/clang` 22.0.0-git20542-10 (Clang/LLD in WebAssembly, ISC licence) | CheerpJ 4.3 runtime (Java 8) + Eclipse compiler ECJ 3.22.0 (EPL-2.0) |
| First-use download | ~19 MB compressed from jsDelivr | ~20 MB (CheerpJ CDN + ECJ jar) |
| First compile | ~7 s in Chromium (includes download) | 9–12 s |
| Later compiles | ~2.5 s | ~3.4 s |
| Run | WASI program via `@bjorn3/browser_wasi_shim` | `cheerpjRunMain`, output on the console |
| Limits | Must build with `-fno-exceptions` (no try/throw) | Java 8 language level only; newer ECJ on CheerpJ's Java 11 runtime failed to locate JDK system files |

Both produced correct output for programs using standard collections (`vector`, `unordered_set`, `sort`; `HashSet`, `ArrayList`, `Collections.sort`).

## Non-goals

- Go, Rust, and other languages.
- Java language levels above 8. A later investigation may revisit this.
- C++ exceptions.
- stdin for Java in the playground, since CheerpJ console input is not supported in this design. C++ playground stdin is supported.

## Design

### 1. Neutral signatures

Each code exercise gains a `sig` string in a small neutral type language, for example `(int[] nums, int k) -> int[]`.

Grammar:

```
sig    := '(' [param (',' param)*] ')' '->' type
param  := type name
type   := base ('[]')* | base '?' ('[]')* | 'map<' type '>' | 'any'
base   := 'int' | 'long' | 'double' | 'bool' | 'string'
```

`int?` is nullable and appears only inside arrays, as in level-order trees: `int?[]`. Map keys are always strings.

Type mapping:

| Neutral | Java parameter / return | C++ parameter / return |
|---|---|---|
| int, long, double, bool, string | int, long, double, boolean, String | int, long long, double, bool, string |
| T[] | T[] (primitive arrays for primitives) | vector<T> (parameters passed by reference) |
| int?[] | Integer[] | vector<optional<int>> |
| map<T> | Map<String, T> (boxed T) | map<string, T> |
| any | Object (Long, Double, String, Boolean, null, List<Object>, Map<String, Object>) | Json (provided value type) |

`src/runners/sig.ts` parses signatures and produces Java and C++ type names and starter code.

### 2. LeetCode-style starters

Learners write a `Solution` class, as on LeetCode and NeetCode.

```java
class Solution {
    public boolean containsDuplicate(int[] nums) {
        // your code
    }
}
```

```cpp
class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // your code
    }
};
```

The C++ starter is preceded by the standard includes (`<bits/stdc++.h>` is not available in libc++, so an explicit list is used) and `using namespace std;`.

### 3. Helpers

The linked-list, tree, heap, random-pointer, and graph helpers already exist in JS and Python. They get Java and C++ versions with the same names and behaviour, and are attached when the JS starter contains the marker class, exactly as in Phase A:

- `ListNode` with `fromArray` and `toArray`
- `TreeNode` with `buildTree` and `treeToArray`
- `Heap` with a comparator
- `RNode` with `buildRandom` and `serializeRandom`
- `GNode` with `buildGraph` and `graphToAdj`

In Java these are static helper methods in a `Helpers` class, imported statically. In C++ they are free functions.

### 4. Harnesses

`src/runners/java/harness.ts` and `src/runners/cpp/harness.ts` generate a complete program from four parts: the helpers, the learner's code, the signature, and the cases.

- **JSON layer.** Each harness includes a small JSON parser and writer: a Java class, and a C++ header with `Json`, `fromJson<T>`, and `toJson<T>`.
- **Per case.** The harness converts the JSON args to the declared parameter types, calls `new Solution().fn(...)`, and prints one line: `{"ok":true,"got":<json>}`, or `{"ok":false,"error":"..."}` when Java throws.
- **Comparison.** The JavaScript side compares `got` with `expect` using the canonical, key-order-insensitive comparison from Phase A, so all languages are judged identically.
- **C++ crashes.** A C++ runtime trap (out-of-bounds, abort) ends the program. The cases that already printed keep their results, and the remaining cases are reported with the error "program crashed".
- **Number rules.** `double` results are printed with full precision. Integer-valued doubles normalise to integers, matching Phase A's rule.

### 5. Runners

Both runners implement the existing `LangRunner` shape (`checkCases`, `runProgram`) and register in `src/runners/index.ts`:

```ts
type Lang = 'js' | 'ts' | 'py' | 'java' | 'cpp';
```

**C++ runner**
- Runs in a module Web Worker.
- Imports `@yowasp/clang` and `@bjorn3/browser_wasi_shim` from jsDelivr, with versions pinned in one constants file.
- Compiles with `clang++ -O1 -fno-exceptions -std=c++17`, then runs the WASI module with a stdin file (playground) and line-buffered stdout and stderr.
- Timeouts: compile 60 s on first use, 20 s after that; run 5 s. On timeout the worker is terminated and recreated, as for Python.

**Java runner**
- CheerpJ needs the DOM and cannot run in a worker. It runs inside a hidden same-origin **iframe** (`/cheerpj.html`, shipped in `public/`), which loads `https://cjrtnc.leaningtech.com/4.3/loader.js`.
- The ECJ jar is served from `public/cheerpj/ecj-3.22.0.jar`, which the iframe sees as `/app/cheerpj/...`.
- The parent page talks to the iframe with `postMessage`. Program output comes back by hooking the iframe's console.
- Timeouts: compile 90 s on first use, 30 s after that; run 5 s. On timeout the iframe is removed and recreated, which stops the stuck JVM.
- **Verification step:** the first implementation task must confirm that removing the iframe really stops a `while (true) {}` program and leaves the page responsive. If it does not, Java's run timeout falls back to a "please reload" message. This is recorded as a ruling.

### 6. UI

- `CodeRunner` tabs gain **Java** and **C++** when `langs` includes them. The CodeMirror modes are `@codemirror/lang-java` and `@codemirror/lang-cpp`.
- Loading notices:
  - Java: "Loading Java (about 20 MB, first time only)..."
  - C++: "Loading C++ compiler (about 19 MB, first time only)..."
- Compile errors are shown with line numbers relative to the learner's code. The harness line offset is subtracted, as for Python.
- The playground gets Java and C++ tabs. C++ supports stdin; Java shows "Input is not supported for Java yet."
- **Footer credit:** "Java runs in your browser with CheerpJ by Leaning Technologies." It links to cheerpj.com and is required by the Community licence.

### 7. Schema and content

`JsEx` changes:

- `langs` extends to `('js' | 'ts' | 'py' | 'java' | 'cpp')[]`.
- New optional fields: `sig: string`, `java: { solution }`, `cpp: { solution }`.

Validation rules:

- If `langs` includes `java` or `cpp`, `sig` is required, and so is the matching solution.
- `sig` must parse, and its parameter count must equal the JS function's parameter count.

The `problem()` and `topic()` builders accept `sig`, `java`, and `cpp`. Content is added chapter by chapter: a signature plus Java and C++ solutions for each exercise, one commit per chapter. The two boss steps are edited directly.

### 8. Testing

**Unit tests (Vitest):**
- the signature parser and type mappings
- starter generation
- JSON parse and print in both harnesses, exercised through the solution suites
- the schema rules

**Java solution suite** (`src/runners/java/java-solutions.test.ts`):
- Uses the local JDK: `javac --release 8` and `java`.
- Compiles each chapter's solutions in one batch: each solution's `Solution` class is wrapped as a static nested class of a per-exercise holder.
- Runs the harness and asserts every case passes.
- If `javac` is missing, the suite is skipped with a visible warning. The user's machine has JDK 17.

**C++ solution suite** (`src/runners/cpp/cpp-solutions.test.ts`):
- Uses `@yowasp/clang` as a devDependency (about 105 MB installed) in Node, with the same flags as the browser.
- Batches one translation unit per chapter, with each exercise in its own namespace.
- Runs the program with `node:wasi`.

**Coverage gate:** every Algorithms and CS exercise must offer `java` and `cpp` once content is complete (`REQUIRE_ALL`), as in Phase A.

**End-to-end tests (Playwright):**
- The playground compiles and runs C++ `std::cout << 6 * 7` and shows `42`.
- The playground runs Java `System.out.println(6 * 7)` and shows `42`.
- One Algorithms exercise passes in Java and in C++.
- A C++ endless loop times out and the next run works.

### 9. Licence and credits

- Add an MIT `LICENSE` file (copyright "Nalanda contributors").
- Set `"license": "MIT"` in `package.json`.
- Add a README section listing third-party runtimes and their licences: CheerpJ (Community licence, CDN-loaded), ECJ (EPL-2.0, jar redistributed unmodified), YoWASP Clang (ISC), Pyodide (MPL-2.0), browser_wasi_shim (MIT/Apache-2.0).
- Publishing the repository publicly is the user's step. The free CheerpJ licence depends on it.

## Risks

- **Java timeouts:** iframe removal may not stop CheerpJ cleanly. This is verified first, with a documented fallback.
- **Download size:** about 20 MB per language on first use. The language is loaded only when its tab is selected, and a notice is shown.
- **Content volume:** 206 signatures plus 412 solutions. They are written and verified chapter by chapter with the suites.
- **CDN availability:** jsDelivr and CheerpJ's CDN must be reachable. Errors are shown clearly, and the other languages keep working.
- **Licence:** if Nalanda is later run by a company rather than as an open-source project, CheerpJ needs a commercial licence. A note in the README says so.
