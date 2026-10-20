import type { Boss } from '../../schema';

export const csBoss: Boss = {
  id: 'cs-boss',
  title: 'Why is production slow?',
  steps: [
    {
      kind: 'choice', id: 'cs-boss-1', conceptId: 'cs-big-o',
      prompt: 'A report endpoint compares every order with every other order to find duplicates. It was fine with 1,000 orders and times out with 100,000. What happened?',
      options: ['The O(n²) algorithm did 10,000 times more work for 100 times more data', 'The database is down', 'The network is slow', 'JavaScript is single-threaded'],
      answer: 0,
      explain: 'Quadratic growth: 100x the input means 10,000x the comparisons. A hash set makes it O(n).',
    },
    {
      kind: 'js-code', id: 'cs-boss-2', conceptId: 'cs-amortised', fnName: 'findDuplicates',
      langs: ['js', 'ts', 'py', 'java', 'cpp'], sig: "(int[] ids) -> int[]", java: { solution: "class Solution {\n    public List<Integer> findDuplicates(int[] ids) {\n        Set<Integer> seen = new HashSet<>(), reported = new HashSet<>();\n        List<Integer> out = new ArrayList<>();\n        for (int x : ids) {\n            if (!seen.add(x) && reported.add(x)) out.add(x);\n        }\n        return out;\n    }\n}\n" }, cpp: { solution: "class Solution {\npublic:\n    vector<int> findDuplicates(vector<int>& ids) {\n        unordered_set<int> seen, reported;\n        vector<int> out;\n        for (int x : ids) {\n            if (!seen.insert(x).second && reported.insert(x).second) out.push_back(x);\n        }\n        return out;\n    }\n};\n" }, py: { solution: "def findDuplicates(ids):\n    seen, reported, out = set(), set(), []\n    for x in ids:\n        if x in seen:\n            if x not in reported:\n                reported.add(x)\n                out.append(x)\n        else:\n            seen.add(x)\n    return out\n" },
      prompt: 'Fix it. Write findDuplicates(ids) returning the ids that appear more than once, in the order their second occurrence appears, each reported once. Aim for O(n).',
      starter: 'function findDuplicates(ids) {\n  // your code\n}',
      cases: [
        { args: [[5, 3, 5, 7, 3, 5]], expect: [5, 3] },
        { args: [[1, 2, 3]], expect: [] },
      ],
      solution: 'function findDuplicates(ids){const seen=new Set(),rep=new Set(),o=[];for(const x of ids){if(seen.has(x)){if(!rep.has(x)){rep.add(x);o.push(x)}}else seen.add(x)}return o}',
      hint: 'Track seen ids and already-reported ids in two sets.',
    },
    {
      kind: 'order', id: 'cs-boss-3', conceptId: 'cs-practical-complexity',
      prompt: 'Order a sound approach to a performance problem.',
      items: ['Reproduce it with realistic data and measure', 'Find where the time goes with a profiler', 'Fix the algorithmic hotspot first', 'Measure again and add a regression test'],
      explain: 'Measure, locate, fix the biggest cost, verify.',
    },
  ],
};
