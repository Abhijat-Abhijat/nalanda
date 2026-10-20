import type { Boss } from '../../schema';

export const engBoss: Boss = {
  id: 'eng-boss',
  title: 'The legacy invoice module',
  steps: [
    {
      kind: 'choice', id: 'eng-boss-1', conceptId: 'eng-legacy',
      prompt: 'You must change how invoices split payments in a 1,200-line module with no tests, written by someone who left years ago. What do you do first?',
      options: ['Write tests that pin down its current behaviour on real examples', 'Rewrite the whole module from scratch over the weekend', 'Make the change directly and deploy on Friday', 'Add comments to every line'],
      answer: 0,
      explain: 'Characterisation tests capture what the code does today, so every later step can be checked against them.',
    },
    {
      kind: 'js-code', id: 'eng-boss-2', conceptId: 'eng-functions', fnName: 'splitEvenly',
      prompt: 'Extract the payment split into a small pure function. Write splitEvenly(cents, n) returning n whole-cent parts that sum to cents and differ by at most 1, with the larger parts first.',
      starter: 'function splitEvenly(cents, n) {\n  // your code\n}',
      cases: [
        { args: [1000, 3], expect: [334, 333, 333] },
        { args: [10, 4], expect: [3, 3, 2, 2] },
        { args: [6, 3], expect: [2, 2, 2] },
        { args: [0, 2], expect: [0, 0] },
      ],
      solution: 'function splitEvenly(c,n){const b=Math.floor(c/n),r=c%n;return Array.from({length:n},(_,i)=>b+(i<r?1:0))}',
      hint: 'Give everyone the floor, then hand out the remainder one cent at a time.',
    },
    {
      kind: 'order', id: 'eng-boss-3', conceptId: 'eng-refactoring',
      prompt: 'Order the safe way to change the legacy module.',
      items: ['Pin current behaviour with characterisation tests', 'Extract the split logic into a pure function, tests still green', 'Change the behaviour and update the tests that describe it', 'Ship behind a flag and remove the old path once it is proven'],
      explain: 'Tests first, refactor without changing behaviour, then change behaviour, then ship carefully.',
    },
  ],
};
