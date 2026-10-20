import type { World } from '../../schema';
import { csComplexity } from './complexity';
import { csDataStructures } from './data-structures';
import { csSorting } from './sorting';
import { csRecursion } from './recursion';
import { csNumbers } from './numbers';
import { csArchitecture } from './architecture';
import { csOS } from './os';
import { csConcurrency } from './concurrency';
import { csTheory } from './theory';
import { csBoss } from './boss';

export const csWorld: World = {
  id: 'cs-fundamentals',
  title: 'CS Fundamentals',
  hue: '#2E8B8B',
  tagline: 'How computers and algorithms really work underneath',
  intro: [
    { t: 'text', md: "The ideas every software engineer leans on, whether they notice or not: analysing algorithms with Big-O, the core data structures and sorting algorithms, recursion and divide and conquer, how numbers and text are represented in binary, how CPUs, caches, and memory work, what an operating system does, how concurrency goes right and wrong, and the theory of computation behind compilers and regular expressions.\n\nEach lesson pairs the concept with worked examples, a reference table, interview questions, and a small coding exercise. Pair it with the Algorithms world for the problem-solving practice." },
  ],
  chapters: [csComplexity, csDataStructures, csSorting, csRecursion, csNumbers, csArchitecture, csOS, csConcurrency, csTheory],
  boss: csBoss,
};
