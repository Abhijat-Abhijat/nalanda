import type { Boss } from '../../schema';

export const dbBoss: Boss = {
  id: 'db-boss',
  title: 'Design the data layer for a ride-hailing app',
  steps: [
    {
      kind: 'js-code', id: 'db-boss-1', conceptId: 'db-consistent-hashing', fnName: 'ringOwner',
      prompt: 'Trips are sharded across database nodes with consistent hashing. Write ringOwner(ring, keyHash) where ring is an array of { node, pos } (positions 0 to 359, any order) and keyHash is 0 to 359. Return the node of the first position at or after keyHash going clockwise, wrapping to the smallest position if none is found.',
      starter: 'function ringOwner(ring, keyHash) {\n  // your code\n}',
      cases: [
        { args: [[{ node: 'A', pos: 90 }, { node: 'B', pos: 200 }, { node: 'C', pos: 310 }], 100], expect: 'B' },
        { args: [[{ node: 'A', pos: 90 }, { node: 'B', pos: 200 }, { node: 'C', pos: 310 }], 330], expect: 'A' },
        { args: [[{ node: 'C', pos: 310 }, { node: 'A', pos: 90 }], 90], expect: 'A' },
      ],
      solution: 'function ringOwner(r,h){const s=[...r].sort((a,b)=>a.pos-b.pos);const f=s.find(x=>x.pos>=h);return (f||s[0]).node}',
      hint: 'Sort by position, find the first at or after the hash, otherwise wrap to the first.',
    },
    {
      kind: 'choice', id: 'db-boss-2', conceptId: 'db-choosing',
      prompt: 'Riders need "drivers within 2 km, right now", updated every few seconds by 100,000 drivers. Which store fits the live driver positions best?',
      options: ['An in-memory store with geospatial indexes (Redis GEO) with short TTLs', 'A data warehouse refreshed nightly', 'A graph database', 'A full-text search engine over trip receipts'],
      answer: 0,
      explain: 'Hot, short-lived, write-heavy location data with radius queries suits an in-memory geospatial index; trips and payments stay in a durable transactional database.',
    },
    {
      kind: 'order', id: 'db-boss-3', conceptId: 'db-pitr',
      prompt: 'A bad migration deleted trip rows at 14:02. Order the point-in-time recovery.',
      items: ['Stop the faulty job and note the exact time of the damage', 'Restore the latest base backup to a new instance', 'Replay the write-ahead log up to 14:01:59', 'Verify the data, then copy the lost rows back or switch traffic over'],
      explain: 'Restore beside production, replay to just before the damage, verify, then repair.',
    },
  ],
};
