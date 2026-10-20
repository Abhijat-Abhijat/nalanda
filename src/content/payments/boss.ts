import type { Boss } from '../../schema';

export const pmBoss: Boss = {
  id: 'pm-boss',
  title: 'The double-charged customer',
  steps: [
    {
      kind: 'choice', id: 'pm-boss-1', conceptId: 'pay-idempotency',
      prompt: 'A customer was charged twice for one order. Logs show the checkout service timed out calling the payment API and retried; both attempts succeeded at the provider. What would have prevented the duplicate charge?',
      options: ['Sending the same idempotency key on the retry, derived from the order', 'Retrying faster', 'Increasing the timeout to five minutes', 'Disabling retries and asking the customer to try again'],
      answer: 0,
      explain: 'An idempotency key tied to the order lets the provider recognise the retry and return the original result instead of charging again.',
    },
    {
      kind: 'js-code', id: 'pm-boss-2', conceptId: 'pay-webhooks', fnName: 'applyWebhooks',
      prompt: 'The order service processes payment webhooks. Providers deliver at least once and sometimes out of order. Write applyWebhooks(events) where each event is "id:type". Start in state "pending". Skip events whose id was already seen. Apply only valid transitions: pending + payment_intent.succeeded → paid; pending + payment_intent.payment_failed → failed; paid + charge.refunded → refunded; ignore anything else. Return [finalState, number of transitions applied as a string].',
      starter: 'function applyWebhooks(events) {\n  // your code\n}',
      cases: [
        { args: [['evt_1:payment_intent.succeeded', 'evt_1:payment_intent.succeeded', 'evt_2:charge.refunded']], expect: ['refunded', '2'] },
        { args: [['evt_9:charge.refunded', 'evt_1:payment_intent.payment_failed']], expect: ['failed', '1'] },
        { args: [[]], expect: ['pending', '0'] },
      ],
      solution: "function applyWebhooks(events){const seen=new Set();let state='pending',n=0;const t={'pending|payment_intent.succeeded':'paid','pending|payment_intent.payment_failed':'failed','paid|charge.refunded':'refunded'};for(const e of events){const i=e.indexOf(':');const id=e.slice(0,i),type=e.slice(i+1);if(seen.has(id))continue;seen.add(id);const next=t[state+'|'+type];if(next){state=next;n++}}return[state,String(n)]}",
      hint: 'A set of seen ids plus a transition table keyed by state and event type.',
    },
    {
      kind: 'order', id: 'pm-boss-3', conceptId: 'pay-reconciliation',
      prompt: 'Order the steps to resolve the double charge and prevent it recurring.',
      items: ['Confirm both charges in the provider dashboard and the ledger', 'Refund the duplicate charge using an idempotent refund request', 'Record the refund in the ledger and notify the customer', 'Reconcile the provider settlement report against the ledger and add idempotency keys to the retry path'],
      explain: 'Verify, refund safely, record and communicate, then reconcile and fix the root cause.',
    },
  ],
};
