import type { Boss } from '../../schema';

export const alBoss: Boss = {
  id: 'al-boss',
  title: 'The onsite interview loop',
  steps: [
    {
      kind: 'order', id: 'al-boss-1', conceptId: 'al-two-sum',
      prompt: 'Order the steps of a strong interview answer.',
      items: ['Restate the problem and ask clarifying questions', 'Work through small examples, including edge cases', 'Describe a brute-force solution and its complexity', 'Find the pattern that improves it, then code it', 'Test the code by hand and state the final complexity'],
      explain: 'Clarify, explore, baseline, optimise, verify.',
    },
    {
      kind: 'js-code', id: 'al-boss-2', conceptId: 'al-top-k-frequent', fnName: 'topWords',
      langs: ['js', 'ts', 'py', 'java', 'cpp'], sig: "(string[] words, int k) -> string[]", java: { solution: "class Solution {\n    public String[] topWords(String[] words, int k) {\n        Map<String, Integer> count = new HashMap<>();\n        for (String w : words) count.merge(w, 1, Integer::sum);\n        List<String> keys = new ArrayList<>(count.keySet());\n        keys.sort((a, b) -> !count.get(a).equals(count.get(b)) ? count.get(b) - count.get(a) : a.compareTo(b));\n        return keys.subList(0, k).toArray(new String[0]);\n    }\n}\n" }, cpp: { solution: "class Solution {\npublic:\n    vector<string> topWords(vector<string>& words, int k) {\n        map<string, int> count;\n        for (auto& w : words) count[w]++;\n        vector<pair<string, int>> items(count.begin(), count.end());\n        stable_sort(items.begin(), items.end(), [](const pair<string, int>& a, const pair<string, int>& b) { return a.second > b.second; });\n        vector<string> out;\n        for (int i = 0; i < k; i++) out.push_back(items[i].first);\n        return out;\n    }\n};\n" }, py: { solution: "from collections import Counter\n\ndef topWords(words, k):\n    counts = Counter(words)\n    return sorted(counts, key=lambda w: (-counts[w], w))[:k]\n" },
      prompt: 'A logging service asks for the k most frequent words. Write topWords(words, k) returning the k most frequent words, ordered by frequency (highest first) and alphabetically on ties.',
      starter: 'function topWords(words, k) {\n  // your code\n}',
      cases: [
        { args: [['i', 'love', 'leetcode', 'i', 'love', 'coding'], 2], expect: ['i', 'love'] },
        { args: [['the', 'day', 'is', 'sunny', 'the', 'the', 'the', 'sunny', 'is', 'is'], 4], expect: ['the', 'is', 'sunny', 'day'] },
      ],
      solution: 'function topWords(w,k){const c=new Map();for(const x of w)c.set(x,(c.get(x)||0)+1);return [...c].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)).slice(0,k).map(e=>e[0])}',
      hint: 'Count with a map, then sort by count descending and word ascending.',
    },
    {
      kind: 'choice', id: 'al-boss-3', conceptId: 'al-longest-consecutive',
      prompt: 'Your O(n log n) solution sorts first. The interviewer asks for O(n). Which idea usually unlocks linear time on unsorted data?',
      options: ['A hash set or map for O(1) lookups', 'A faster sorting algorithm', 'Recursion', 'Using more nested loops'],
      answer: 0,
      explain: 'Hashing replaces searching and sorting with constant-time lookups.',
    },
  ],
};
