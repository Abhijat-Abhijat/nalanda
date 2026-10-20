import type { JsEx, Lesson, Question } from '../../schema';
import { analogy, example, faq, jsEx, layer, layers, table, tip, txt, warn } from '../helpers';

type Ex = [string, string, string?];
export const js = (title: string, src: string, output?: string) => example('js', title, src, output);
export const py = (title: string, src: string, output?: string) => example('python', title, src, output);

// Shared helper code shown in the starter and prepended to the reference solution.
export const LIST = `class ListNode { constructor(val, next = null) { this.val = val; this.next = next; } }
const fromArray = (a) => { let head = null; for (let i = a.length - 1; i >= 0; i--) head = new ListNode(a[i], head); return head; };
const toArray = (head) => { const out = []; while (head) { out.push(head.val); head = head.next; } return out; };`;

export const TREE = `class TreeNode { constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; } }
// Level-order array (null for gaps) to tree, e.g. [3,9,20,null,null,15,7].
const buildTree = (a) => {
  if (!a.length || a[0] === null) return null;
  const root = new TreeNode(a[0]); const q = [root]; let i = 1;
  while (q.length && i < a.length) {
    const n = q.shift();
    if (i < a.length && a[i] !== null) { n.left = new TreeNode(a[i]); q.push(n.left); } i++;
    if (i < a.length && a[i] !== null) { n.right = new TreeNode(a[i]); q.push(n.right); } i++;
  }
  return root;
};
const treeToArray = (root) => {
  const out = []; const q = [root];
  while (q.length) { const n = q.shift(); if (n) { out.push(n.val); q.push(n.left, n.right); } else out.push(null); }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
};`;

export const HEAP = `// Binary heap; cmp(a, b) < 0 means a comes out first. Default: min-heap of numbers.
class Heap {
  constructor(cmp = (a, b) => a - b) { this.a = []; this.cmp = cmp; }
  size() { return this.a.length; }
  peek() { return this.a[0]; }
  push(x) { const a = this.a; a.push(x); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (this.cmp(a[i], a[p]) >= 0) break; [a[i], a[p]] = [a[p], a[i]]; i = p; } }
  pop() { const a = this.a; const top = a[0]; const last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && this.cmp(a[l], a[m]) < 0) m = l; if (r < a.length && this.cmp(a[r], a[m]) < 0) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } } return top; }
}`;

export type Problem = {
  /** lesson id within the chapter, e.g. 'l1' */
  id: string;
  /** globally unique task id prefix, e.g. 'nc-ah-1' */
  key: string;
  title: string;
  concept: string;
  level: 'Easy' | 'Medium' | 'Hard';
  story: string;
  analogy: string;
  approach: string;
  brute: Ex;
  best: Ex;
  extra?: Ex;
  cx: [string, string, string][];
  tip: string;
  warn: string;
  faq: [string, string][];
  ex: { prompt: string; fn: string; params: string; cases: JsEx['cases']; solution: string; hint: string; helpers?: string; py?: string; sig?: string; java?: string; cpp?: string };
  quiz: Question[];
};

// One NeetCode-style problem as a full lesson: story, two worked approaches, complexity, interview Q&A, and the coding exercise.
export function problem(p: Problem): Lesson {
  const pre = p.ex.helpers ? `${p.ex.helpers}\n\n` : '';
  return {
    id: p.id,
    title: p.title,
    conceptIds: [p.concept],
    story: [txt(`**${p.level}.** ${p.story}`), analogy(p.analogy)],
    layers: layers(
      layer('Approach', txt(p.approach), js(...p.brute), js(...p.best), ...(p.extra ? [js(...p.extra)] : [])),
      layer('Complexity and pitfalls', table(['Approach', 'Time', 'Space'], ...p.cx), tip(p.tip), warn(p.warn)),
      layer('Interview corner', faq(...p.faq)),
    ),
    exercise: jsEx(`${p.key}-ex`, p.concept, p.ex.prompt, p.ex.fn, `${pre}function ${p.ex.fn}(${p.ex.params}) {\n  // your code\n}`, p.ex.cases, pre + p.ex.solution, p.ex.hint, p.ex.py, { sig: p.ex.sig, java: p.ex.java, cpp: p.ex.cpp }),
    quiz: p.quiz,
  };
}
