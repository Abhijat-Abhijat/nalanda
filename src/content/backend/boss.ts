import type { Boss } from '../../schema';

export const beBoss: Boss = {
  id: 'be-boss',
  title: 'Keep the order API standing on sale day',
  steps: [
    {
      kind: 'js-code', id: 'be-boss-1', conceptId: 'be-rate-limiting', fnName: 'tokenBucket',
      prompt: 'Rate-limit the order API with a token bucket: write tokenBucket(capacity, refillPerSec, requestTimes) where requestTimes are seconds (sorted). The bucket starts full; tokens refill continuously up to capacity; each request takes one token if at least one is available. Return an array of true (allowed) or false (rejected).',
      starter: 'function tokenBucket(capacity, refillPerSec, requestTimes) {\n  // your code\n}',
      cases: [
        { args: [2, 1, [0, 0, 0, 1, 1]], expect: [true, true, false, true, false] },
        { args: [1, 0.5, [0, 1, 2, 3]], expect: [true, false, true, false] },
      ],
      solution: 'function tokenBucket(c,r,ts){let tokens=c,last=ts.length?ts[0]:0;return ts.map(t=>{tokens=Math.min(c,tokens+(t-last)*r);last=t;if(tokens>=1){tokens-=1;return true}return false})}',
      hint: 'Before each request add (now - last) * refill tokens, capped at capacity; allow if tokens >= 1 and subtract one.',
    },
    {
      kind: 'choice', id: 'be-boss-2', conceptId: 'be-idempotency',
      prompt: 'Mobile clients retry POST /orders on timeouts, creating duplicate orders. Best fix?',
      options: ['Require an Idempotency-Key header and return the stored result for repeats', 'Tell clients never to retry', 'Increase the server timeout', 'Use GET for creating orders'],
      answer: 0,
      explain: 'Idempotency keys make retries safe.',
    },
    {
      kind: 'order', id: 'be-boss-3', conceptId: 'be-queues',
      prompt: 'Order the checkout flow that keeps the API fast under load.',
      items: ['Validate the request and reserve stock in a transaction', 'Write the order and an outbox event in the same transaction', 'Return 202 Accepted with the order id', 'A worker publishes the event and sends the confirmation email'],
      explain: 'Do the essential work synchronously, the rest asynchronously and reliably.',
    },
  ],
};
