# Nalanda

Nalanda is a gamified, story-driven learning site. Each topic starts with the history of why it was invented, explained for a five-year-old, then goes deeper, then makes you practice in the browser and checks what you learned. It runs entirely in your browser with no backend.

## Run it

```
npm install
npm run dev        # local dev server
npm run build      # type-check and build a static site into dist/
npm test           # unit and content tests
npm run e2e        # browser smoke tests (builds and previews the site first)
```

## Your progress

Progress is saved in your browser's local storage under the key `nalanda.progress.v1`. Use the Progress page to export a backup file, import one, or reset. If your browser blocks storage or the saved data cannot be read, the app keeps working in memory, shows a banner, and never overwrites the stored data.

## Add content

Lessons, chapters, and worlds are plain TypeScript data under `src/content/`. See [docs/authoring.md](docs/authoring.md).

## Worlds in this version

- **AI Engineer:** from the perceptron to embeddings and retrieval.
- **Git and Shell:** a simulated terminal and git.
- **SQL:** a live SQL engine in the browser.
- **HTTP and Web:** build and check real HTTP requests.

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
