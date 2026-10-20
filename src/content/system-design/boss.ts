import type { Boss } from '../../schema';

export const sdBoss: Boss = {
  id: 'sd-boss',
  title: 'The concert ticket rush',
  steps: [
    {
      kind: 'choice', id: 'sd-boss-1', conceptId: 'sd-estimation',
      prompt: 'A stadium of 60,000 seats goes on sale at 10:00. Two million fans are waiting. What is the most important property to protect first?',
      options: ['No seat is ever sold twice, even if the site is slow for some fans', 'Every fan sees a page in under 100 ms', 'The seat map animates smoothly', 'All fans get a seat'],
      answer: 0,
      explain: 'Correctness of inventory is the one-way door: overselling cannot be undone. Use a queue or waiting room to protect it, and accept that many fans wait.',
    },
    {
      kind: 'js-code', id: 'sd-boss-2', conceptId: 'sd-api-design', fnName: 'allocateSeats',
      prompt: 'Requests arrive in order. Write allocateSeats(seats, requests) where seats are seat ids in best-first order and requests are { user, count }. Give each request the next count unsold seats in order, or nothing if fewer than count remain (later smaller requests may still succeed). Return an object mapping each user to their seat ids ([] if unlucky).',
      starter: 'function allocateSeats(seats, requests) {\n  // your code\n}',
      cases: [
        { args: [['A1', 'A2', 'A3', 'A4'], [{ user: 'asha', count: 2 }, { user: 'ben', count: 3 }, { user: 'chen', count: 2 }]], expect: { asha: ['A1', 'A2'], ben: [], chen: ['A3', 'A4'] } },
        { args: [['S1'], [{ user: 'x', count: 1 }, { user: 'y', count: 1 }]], expect: { x: ['S1'], y: [] } },
      ],
      solution: 'function allocateSeats(s,r){let i=0;const o={};for(const q of r){if(s.length-i>=q.count){o[q.user]=s.slice(i,i+q.count);i+=q.count}else o[q.user]=[]}return o}',
      hint: 'Keep an index of the next unsold seat.',
    },
    {
      kind: 'order', id: 'sd-boss-3', conceptId: 'sd-tradeoffs',
      prompt: 'Order a sensible design for the sale.',
      items: ['Put fans in a virtual waiting room and admit them at a controlled rate', 'Reserve seats with a short hold that expires if payment does not complete', 'Take payment with an idempotency key', 'Confirm the order and release any expired holds back to sale'],
      explain: 'Control the arrival rate, hold inventory briefly, pay safely, then confirm or release.',
    },
  ],
};
