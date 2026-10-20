import type { Boss } from '../../schema';

export const carBoss: Boss = {
  id: 'car-boss',
  title: 'The final-round interview',
  steps: [
    {
      kind: 'choice', id: 'car-boss-1', conceptId: 'car-framework',
      prompt: 'The interviewer says: "Find the busiest three-hour window in our sales data." Before writing any code, what do you do?',
      options: ['Ask clarifying questions: input format, window boundaries, ties, and size of the data', 'Start coding immediately to save time', 'Say you have seen this problem before', 'Ask for a different problem'],
      answer: 0,
      explain: 'Clarifying inputs, edge cases, and scale first shows structured thinking and avoids solving the wrong problem.',
    },
    {
      kind: 'js-code', id: 'car-boss-2', conceptId: 'car-patterns', fnName: 'maxWindowSum',
      prompt: 'Sales per hour arrive as an array. Write maxWindowSum(sales, k) returning the largest sum of any k consecutive hours, in O(n) time with a sliding window. Assume 1 ≤ k ≤ sales.length.',
      starter: 'function maxWindowSum(sales, k) {\n  // your code\n}',
      cases: [
        { args: [[2, 1, 5, 1, 3, 2], 3], expect: 9 },
        { args: [[5], 1], expect: 5 },
        { args: [[4, -1, 2, 1], 2], expect: 3 },
        { args: [[-3, -2, -5], 2], expect: -5 },
      ],
      solution: 'function maxWindowSum(a,k){let s=0;for(let i=0;i<k;i++)s+=a[i];let best=s;for(let i=k;i<a.length;i++){s+=a[i]-a[i-k];if(s>best)best=s}return best}',
      hint: 'Add the new hour and subtract the hour leaving the window.',
    },
    {
      kind: 'order', id: 'car-boss-3', conceptId: 'car-star',
      prompt: 'The last question: "Tell me about a time you disagreed with a teammate." Order your answer.',
      items: ['Situation: the context in one or two sentences', 'Task: what you were responsible for', 'Action: what you specifically did', 'Result: the outcome, with a number if possible, and what you learned'],
      explain: 'STAR keeps behavioural answers focused and makes your own contribution clear.',
    },
  ],
};
