import type { World } from '../../schema';
import { cxEssentials } from './essentials';
import { cxMemory } from './memory';
import { cxMove } from './move';
import { cxStl } from './stl';
import { cxTemplates } from './templates';
import { cxConcurrency } from './concurrency';
import { cxTooling } from './tooling';
import { cxPerformance } from './performance';
import { cxBoss } from './boss';

export const cxWorld: World = {
  id: 'cpp',
  title: 'C++',
  hue: '#3E5C9A',
  tagline: 'Modern C++ from ownership and move semantics to templates, concurrency, tooling, and performance',
  intro: [
    { t: 'text', md: "This world is for programmers who want to write modern C++ with the depth expected of a senior engineer: the type system and initialisation rules, ownership with RAII and smart pointers, move semantics and value categories, the standard library and C++20 ranges, templates and concepts, threads, atomics and the memory model, build tooling and sanitizers, and performance work grounded in how hardware behaves.\n\nEvery lesson has three layers: a mental model, a deep dive into the rules, trade-offs, and failure modes, and a production layer with numbers, what to observe, security notes, a checklist, interview questions, and primary sources.\n\nExercises are C++ first and can also be solved in JavaScript. The in-browser C++ runner compiles with Clang to WebAssembly at the C++17 level with exceptions disabled and no threads, so runnable exercise code uses C++17 and models concurrency deterministically; C++20, C++23, and C++26 features are taught in examples. Facts are checked as of October 2026: C++23 (ISO/IEC 14882:2024) is the published standard, WG21 finished technical work on C++26 in March 2026 with ISO publication still pending, GCC 16 (April 2026) defaults to C++20, and Clang 22 was released in February 2026." },
  ],
  chapters: [cxEssentials, cxMemory, cxMove, cxStl, cxTemplates, cxConcurrency, cxTooling, cxPerformance],
  boss: cxBoss,
};
