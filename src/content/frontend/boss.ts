import type { Boss } from '../../schema';

export const feBoss: Boss = {
  id: 'fe-boss',
  title: 'Ship a fast, accessible product page',
  steps: [
    {
      kind: 'js-code', id: 'fe-boss-1', conceptId: 'fe-state', fnName: 'cartReducer',
      prompt: 'Cart state reducer: write cartReducer(state, action) where state is { items: [{ sku, qty }] } and action is { type: "add", sku } or { type: "remove", sku }. "add" increments qty (or adds { sku, qty: 1 }); "remove" decrements and drops items that reach 0. Return a new object; do not mutate.',
      starter: 'function cartReducer(state, action) {\n  // your code\n}',
      cases: [
        { args: [{ items: [] }, { type: 'add', sku: 'A' }], expect: { items: [{ sku: 'A', qty: 1 }] } },
        { args: [{ items: [{ sku: 'A', qty: 1 }] }, { type: 'add', sku: 'A' }], expect: { items: [{ sku: 'A', qty: 2 }] } },
        { args: [{ items: [{ sku: 'A', qty: 1 }, { sku: 'B', qty: 2 }] }, { type: 'remove', sku: 'A' }], expect: { items: [{ sku: 'B', qty: 2 }] } },
      ],
      solution: "function cartReducer(s,a){if(a.type==='add'){const f=s.items.find(i=>i.sku===a.sku);return {...s,items:f?s.items.map(i=>i.sku===a.sku?{...i,qty:i.qty+1}:i):[...s.items,{sku:a.sku,qty:1}]}}if(a.type==='remove'){return {...s,items:s.items.map(i=>i.sku===a.sku?{...i,qty:i.qty-1}:i).filter(i=>i.qty>0)}}return s}",
      hint: 'For add: map the matching item to qty + 1, or append a new item. For remove: map to qty - 1, then filter qty > 0.',
    },
    {
      kind: 'choice', id: 'fe-boss-2', conceptId: 'fe-a11y-semantics',
      prompt: 'The "Add to cart" control is a <div onClick>. What is the best fix?',
      options: ['Use a <button> element', 'Add cursor: pointer', 'Add a title attribute', 'Wrap it in a <span>'],
      answer: 0,
      explain: 'A real button is focusable, works with Enter and Space, and is announced as a button.',
    },
    {
      kind: 'order', id: 'fe-boss-3', conceptId: 'fe-cwv',
      prompt: 'The hero image makes LCP slow. Order the fixes from most to least impactful for a first pass.',
      items: ['Serve a correctly sized modern format (AVIF/WebP)', 'Preload it and give it fetchpriority="high"', 'Set width and height to avoid layout shift', 'Lazy-load only the images below the fold'],
      explain: 'Smaller bytes first, then earlier discovery, then stability, then defer the rest.',
    },
  ],
};
