import type { Boss } from '../../schema';

export const jvBoss: Boss = {
  id: 'jv-boss',
  title: 'The slow order service',
  steps: [
    {
      kind: 'choice', id: 'jv-boss-1', conceptId: 'jv-n-plus-one',
      prompt: 'The order history endpoint takes 4 seconds for customers with many orders. SQL logs show one query for the orders, then one query per order to load its line items. What is the problem and the usual fix?',
      options: ['An N+1 query from lazy loading; fetch line items with a join fetch or entity graph, or batch fetching', 'The connection pool is too small; double it', 'Java is slow; rewrite the service in Go', 'The JSON serializer is slow; switch libraries'],
      answer: 0,
      explain: 'One query per parent row is the N+1 pattern. Fetch the association in the same query (JOIN FETCH or an entity graph) or enable batch fetching so N queries become one or a few.',
    },
    {
      kind: 'js-code', id: 'jv-boss-2', conceptId: 'jv-equals-hashcode', fnName: 'orderCacheKey',
      langs: ['js', 'ts', 'java'], sig: '(string customerId, string[] skus) -> string',
      java: { solution: `class Solution {
    public String orderCacheKey(String customerId, String[] skus) {
        String[] sorted = skus.clone();
        Arrays.sort(sorted);
        return customerId + "|" + String.join(",", sorted);
    }
}
` },
      prompt: 'The service caches price quotes, but customers sometimes see another customer\'s negotiated prices, and identical baskets in a different order miss the cache. Write orderCacheKey(customerId, skus) returning a key that includes the customer and does not depend on SKU order: customerId, then "|", then the SKUs sorted and joined with ",".',
      starter: 'function orderCacheKey(customerId, skus) {\n  // your code\n}',
      cases: [
        { args: ['c42', ['B', 'A', 'C']], expect: 'c42|A,B,C' },
        { args: ['c42', ['A', 'C', 'B']], expect: 'c42|A,B,C' },
        { args: ['c7', []], expect: 'c7|' },
      ],
      solution: "function orderCacheKey(c,s){return c+'|'+[...s].sort().join(',')}",
      hint: 'Copy, sort, join, and prefix the customer.',
    },
    {
      kind: 'order', id: 'jv-boss-3', conceptId: 'jv-gc-tuning',
      prompt: 'After the fixes, p99 latency still spikes every few minutes and GC logs show long pauses. Order a disciplined GC tuning process.',
      items: ['Enable GC logging and record a baseline under realistic load', 'Find the cause in the logs: allocation rate, promotion, or heap too small', 'Reduce allocation in hot paths or size the heap and pause goal', 'Change one setting at a time and compare against the baseline'],
      explain: 'Measure first, find the cause, fix allocation or sizing, and change one variable at a time.',
    },
  ],
};
