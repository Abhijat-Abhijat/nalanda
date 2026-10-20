import type { Boss } from '../../schema';

export const clBoss: Boss = {
  id: 'cl-boss',
  title: 'The surprise cloud bill',
  steps: [
    {
      kind: 'choice', id: 'cl-boss-1', conceptId: 'cl-shared-responsibility',
      prompt: 'A startup moves its shop to the cloud. A month later customer files appear on a search engine. The storage bucket was public. Whose responsibility was it?',
      options: ['The customer: data and configuration are always theirs', 'The provider: they host the bucket', 'Nobody: it was an accident', 'The search engine'],
      answer: 0,
      explain: 'Security in the cloud (data, identities, configuration) is always the customer\'s job. Turn on account-wide public access blocks.',
    },
    {
      kind: 'js-code', id: 'cl-boss-2', conceptId: 'cl-pricing', fnName: 'monthlyBill',
      prompt: 'The same month the bill tripled. Write monthlyBill(items) where each item is { name, qty, rate }. Return { total, top }: total is the sum of qty × rate rounded to 2 decimals, and top is the name of the most expensive line item.',
      starter: 'function monthlyBill(items) {\n  // your code\n}',
      cases: [
        { args: [[{ name: 'ec2', qty: 730, rate: 0.1 }, { name: 'egress', qty: 2000, rate: 0.09 }, { name: 's3', qty: 500, rate: 0.023 }]], expect: { total: 264.5, top: 'egress' } },
        { args: [[{ name: 'nat', qty: 730, rate: 0.045 }]], expect: { total: 32.85, top: 'nat' } },
      ],
      solution: 'function monthlyBill(items){let total=0,top=null,best=-1;for(const i of items){const c=i.qty*i.rate;total+=c;if(c>best){best=c;top=i.name}}return{total:Math.round(total*100)/100,top}}',
      hint: 'Keep a running total and remember the largest single cost.',
    },
    {
      kind: 'order', id: 'cl-boss-3', conceptId: 'cl-regions',
      prompt: 'Order a sensible plan to make the shop resilient and affordable.',
      items: ['Block public access and review IAM permissions', 'Spread the app across two availability zones', 'Put a CDN in front to cut egress and latency', 'Commit to the steady baseline with a savings plan'],
      explain: 'Fix security first, then reliability, then cost.',
    },
  ],
};
