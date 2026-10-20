import type { Boss } from '../../schema';

export const msBoss: Boss = {
  id: 'ms-boss',
  title: 'The Black Friday slowdown',
  steps: [
    {
      kind: 'choice', id: 'ms-boss-1', conceptId: 'ms-golden-signals',
      prompt: 'At 09:02 on Black Friday, support reports that checkout "feels slow". Nothing has alerted. What do you look at first?',
      options: ['The golden signals for checkout: latency percentiles, traffic, errors, and saturation', 'The average CPU of one random server', 'Last month\'s uptime report', 'The source code of the checkout page'],
      answer: 0,
      explain: 'Start with what users experience (latency, errors) and what is filling up (saturation), split by service.',
    },
    {
      kind: 'js-code', id: 'ms-boss-2', conceptId: 'ms-percentiles', fnName: 'slowestService',
      prompt: 'Traces show five services on the checkout path. Write slowestService(spans) where spans are { service, ms }. Return the service with the highest p99 latency (nearest-rank: sort its durations and take position ceil(0.99 × n)). On a tie, return the alphabetically first name.',
      starter: 'function slowestService(spans) {\n  // your code\n}',
      cases: [
        { args: [[{ service: 'cart', ms: 30 }, { service: 'cart', ms: 40 }, { service: 'payments', ms: 20 }, { service: 'payments', ms: 900 }, { service: 'search', ms: 100 }]], expect: 'payments' },
        { args: [[{ service: 'b', ms: 50 }, { service: 'a', ms: 50 }]], expect: 'a' },
      ],
      solution: 'function slowestService(spans){const by={};for(const s of spans)(by[s.service]??=[]).push(s.ms);let best=null,bv=-1;for(const name of Object.keys(by).sort()){const v=by[name].sort((a,b)=>a-b);const p=v[Math.ceil(0.99*v.length)-1];if(p>bv){bv=p;best=name}}return best}',
      hint: 'Group durations by service, compute each p99, and keep the largest.',
    },
    {
      kind: 'order', id: 'ms-boss-3', conceptId: 'ms-observability',
      prompt: 'Order a sensible response once the slow payment service is found.',
      items: ['Confirm the impact on users from the golden signals', 'Follow example traces into the slow payment calls', 'Read the logs for those trace ids to find the cause', 'Fix or mitigate, then watch the signals recover'],
      explain: 'Metrics tell you that something is wrong, traces tell you where, and logs tell you why.',
    },
  ],
};
