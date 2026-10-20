# Authoring guide

Nalanda content is plain TypeScript data under `src/content/`. You do not touch the engine to add lessons, chapters, or worlds.

## Add a lesson

1. Open the chapter file, for example `src/content/sql/ch1.ts`.
2. Copy an existing lesson object and edit it. Every lesson needs:
   - `id`, `title`, and `conceptIds` (the ideas it teaches).
   - `story`: at least a narrative `text` block, an `analogy` block a five-year-old could follow, and a `timeline` block with the real history.
   - `layers`: exactly three, titled "The simple idea", "How it really works", and "Under the hood". The first needs no jargon.
   - `exercise`: one task (see exercise kinds below).
   - `quiz`: 3 to 5 questions. Each `conceptId` must be listed in the lesson's `conceptIds`.
3. Run `npm test`. The content test checks the schema, unique ids, concept references, and replays every reference solution.

## Add a chapter

A chapter has 3 or so lessons and an `exam` of 8 to 14 questions (8 are drawn each attempt). The exam must cover every concept taught in the chapter and include at least two `order` or `fill` questions.

## Add a world

1. Create `src/content/<world>/` with chapter files, a `boss.ts`, and an `index.ts` that exports a `World`.
2. Register it in the `raw` list in `src/content/index.ts`.
3. A boss has several `steps`. Every step must pass for the boss to be beaten.

## Rules for good content

- Write history from checked facts. Verify dates and names against a second source before publishing a lesson.
- Explanations (`explain`) say why the right answer is right.
- Buttons and prompts say exactly what they do ("Run query", "Check answer").
- Never use real credentials, personal data, or live services in examples.

## Exercise kinds

| Kind | Key fields | Checked by |
|---|---|---|
| `choice` | `options`, `answer` (index) | exact index |
| `order` | `items` in the correct order | exact sequence (shown shuffled) |
| `fill` | `prompt` with `___`, `answers` | case-insensitive text match |
| `sql-query` | `dbId`, `solution`, `ordered` | result of the learner's query vs the solution's result |
| `terminal` | `initial` (cwd, files, dirs, optional setup commands), `checks`, `solution` | simulated shell and git end state |
| `http-builder` | `starter`, `rules`, `solution` | rules over method, host, path, query, headers, JSON body |
| `js-code` | `fnName`, `cases`, `solution` | cases run in a Web Worker with a 2 second timeout |
| `llm-lab` | `lab` of `tokenizer`, `embeddings`, or `retrieval` | toy local models, no network |

Every exercise has a reference solution (or, for quiz kinds, an answer) that the content test replays through the same validator the learner uses.

## Tiny examples

```ts
// choice
{ kind: 'choice', id: 'x-1', conceptId: 'c', prompt: 'Which code means not found?', options: ['200', '404'], answer: 1, explain: '404 means Not Found.' }

// sql-query
{ kind: 'sql-query', id: 'x-2', conceptId: 'c', prompt: 'Show every customer.', dbId: 'shop', starter: '', ordered: false,
  solution: 'SELECT * FROM customers', hint: 'Use SELECT * FROM.' }

// terminal
{ kind: 'terminal', id: 'x-3', conceptId: 'c', prompt: 'Make a file.', hint: 'Use touch.',
  initial: { cwd: '/home/learner', files: {}, dirs: [] },
  checks: [{ type: 'exists', path: '/home/learner/a.txt' }], solution: ['touch a.txt'] }
```

## Commands

- `npm run dev` runs the site locally.
- `npm test` runs unit and content tests.
- `npm run build` type-checks and builds a static site into `dist/`.
- `npm run e2e` runs the browser smoke tests.
