import type { Boss } from '../../schema';

export const jsBoss: Boss = {
  id: 'js-boss',
  title: 'Build a tiny shopping cart',
  steps: [
    {
      kind: 'js-code', id: 'js-boss-1', conceptId: 'js-types', fnName: 'cartTotal',
      prompt: 'Write cartTotal(items) where each item is { pricePaise, qty }. Return the total in paise. Ignore items whose qty is not a positive number.',
      starter: 'function cartTotal(items) {\n  // your code\n}',
      cases: [
        { args: [[{ pricePaise: 69900, qty: 2 }, { pricePaise: 34900, qty: 1 }]], expect: 174700 },
        { args: [[{ pricePaise: 100, qty: 0 }, { pricePaise: 100, qty: -1 }, { pricePaise: 100, qty: '2' }]], expect: 0 },
        { args: [[]], expect: 0 },
      ],
      solution: "function cartTotal(items){return items.reduce((s,i)=>typeof i.qty==='number'&&i.qty>0?s+i.pricePaise*i.qty:s,0)}",
      hint: 'Use reduce, and check typeof qty === "number" and qty > 0 before adding.',
    },
    {
      kind: 'js-code', id: 'js-boss-2', conceptId: 'js-operators', fnName: 'formatRupees',
      prompt: 'Write formatRupees(paise) returning a string like "₹1,747.00": rupee sign, Indian thousands separators, two decimals.',
      starter: 'function formatRupees(paise) {\n  // your code\n}',
      cases: [
        { args: [174700], expect: '₹1,747.00' },
        { args: [5], expect: '₹0.05' },
        { args: [12345678], expect: '₹1,23,456.78' },
      ],
      solution: "function formatRupees(p){return '₹'+(p/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}",
      hint: 'Divide by 100, then toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }). Indian grouping puts commas after lakhs.',
    },
    {
      kind: 'order', id: 'js-boss-3', conceptId: 'js-debugging',
      prompt: 'A customer reports the wrong total. Put the fix in order.',
      items: ['Reproduce the wrong total with their cart', 'Write a failing test for that cart', 'Fix the calculation', 'Run all tests and ship'],
      explain: 'Reproduce, capture in a test, fix, verify.',
    },
  ],
};
