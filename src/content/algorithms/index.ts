import type { World } from '../../schema';
import { alArrays } from './arrays';
import { alTwoPointers } from './two-pointers';
import { alSlidingWindow } from './sliding-window';
import { alStack } from './stack';
import { alBinarySearch } from './binary-search';
import { alLinkedList } from './linked-list';
import { alTrees } from './trees';
import { alHeap } from './heap';
import { alBacktracking } from './backtracking';
import { alTries } from './tries';
import { alGraphs } from './graphs';
import { alAdvGraphs } from './adv-graphs';
import { alDp1 } from './dp1';
import { alDp2 } from './dp2';
import { alGreedy } from './greedy';
import { alIntervals } from './intervals';
import { alMath } from './math';
import { alBits } from './bits';
import { alBoss } from './boss';

export const alWorld: World = {
  id: 'algorithms',
  title: 'Algorithms',
  hue: '#7B5EA7',
  tagline: 'The 150 classic interview problems, pattern by pattern',
  intro: [
    { t: 'text', md: "This world works through the 150 problems of the widely used NeetCode 150 list, grouped by the pattern that cracks them: hashing, two pointers, sliding windows, stacks, binary search, linked lists, trees, heaps, backtracking, tries, graphs, dynamic programming, greedy choices, intervals, maths, and bit manipulation.\n\nEvery lesson explains the idea in plain words, compares a brute-force and an optimal solution with their time and space costs, and ends with you writing the solution yourself against test cases. Problem statements here are written in our own words; titles match the well-known problem names so you can cross-reference them." },
  ],
  chapters: [alArrays, alTwoPointers, alSlidingWindow, alStack, alBinarySearch, alLinkedList, alTrees, alHeap, alBacktracking, alTries, alGraphs, alAdvGraphs, alDp1, alDp2, alGreedy, alIntervals, alMath, alBits],
  boss: alBoss,
};
