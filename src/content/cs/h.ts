import type { JsEx, Lesson, Question } from '../../schema';
import { analogy, example, faq, jsEx, layer, layers, note, table, timeline, tip, txt, warn } from '../helpers';

type Ex = [lang: string, title: string, src: string, output?: string];

export type Topic = {
  /** lesson id within the chapter, e.g. 'l1' */
  id: string;
  /** globally unique task id prefix, e.g. 'cs-cx-1' */
  key: string;
  title: string;
  concept: string;
  story: string;
  analogy: string;
  timeline?: [string, string, string][];
  explain: string;
  ex1: Ex;
  ex2: Ex;
  ex3?: Ex;
  table: [string[], ...string[][]];
  tip: string;
  warn: string;
  faq: [string, string][];
  ex: { prompt: string; fn: string; params: string; cases: JsEx['cases']; solution: string; hint: string; py?: string; sig?: string; java?: string; cpp?: string };
  quiz: Question[];
};

const block = ([lang, title, src, output]: Ex) => example(lang, title, src, output);

// A computer science topic as a full lesson: story, worked examples, a reference table, interview Q&A, and a coding exercise.
export function topic(t: Topic): Lesson {
  const [head, ...rows] = t.table;
  return {
    id: t.id,
    title: t.title,
    conceptIds: [t.concept],
    story: [txt(t.story), analogy(t.analogy), ...(t.timeline ? [timeline(...t.timeline)] : [])],
    layers: layers(
      layer('Core idea', txt(t.explain), block(t.ex1), block(t.ex2), ...(t.ex3 ? [block(t.ex3)] : [])),
      layer('Reference', table(head, ...rows), tip(t.tip), warn(t.warn)),
      layer('Interview corner', faq(...t.faq)),
    ),
    exercise: jsEx(`${t.key}-ex`, t.concept, t.ex.prompt, t.ex.fn, `function ${t.ex.fn}(${t.ex.params}) {\n  // your code\n}`, t.ex.cases, t.ex.solution, t.ex.hint, t.ex.py, { sig: t.ex.sig, java: t.ex.java, cpp: t.ex.cpp }),
    quiz: t.quiz,
  };
}

export type DeepTopic = Omit<Topic, 'table' | 'tip' | 'timeline'> & {
  timeline: [string, string, string][];
  /** ASCII diagram of the mechanism */
  diagram: string;
  deepDive: {
    explain: string;
    example: Ex;
    /** first row is the header */
    tradeoffs: [string[], ...string[][]];
    failures: [symptom: string, cause: string, fix: string][];
  };
  production: {
    /** cost, latency, and scale figures, with units */
    numbers: string;
    observe: string;
    security: string;
    checklist: string[];
    /** primary sources, each "Author or org, title (year)" */
    sources: string[];
  };
  tip: string;
};

// An extreme-depth lesson: mental model, deep dive with failure modes, and production practice with sources.
export function deepTopic(t: DeepTopic): Lesson {
  const [tHead, ...tRows] = t.deepDive.tradeoffs;
  return {
    id: t.id,
    title: t.title,
    conceptIds: [t.concept],
    story: [txt(t.story), analogy(t.analogy), timeline(...t.timeline)],
    layers: layers(
      layer('Mental model', txt(t.explain), example('text', 'how it works', t.diagram), block(t.ex1), block(t.ex2), ...(t.ex3 ? [block(t.ex3)] : [])),
      layer('Deep dive',
        txt(t.deepDive.explain),
        block(t.deepDive.example),
        table(tHead, ...tRows),
        table(['Symptom', 'Root cause', 'Fix'], ...t.deepDive.failures),
        warn(t.warn),
      ),
      layer('In production',
        txt(`**Numbers.** ${t.production.numbers}\n\n**What to observe.** ${t.production.observe}`),
        note(`**Security.** ${t.production.security}`),
        txt('**Checklist**\n\n' + t.production.checklist.map((c) => `- ${c}`).join('\n')),
        tip(t.tip),
        faq(...t.faq),
        txt('**Sources**\n\n' + t.production.sources.map((s) => `- ${s}`).join('\n')),
      ),
    ),
    exercise: jsEx(`${t.key}-ex`, t.concept, t.ex.prompt, t.ex.fn, `function ${t.ex.fn}(${t.ex.params}) {\n  // your code\n}`, t.ex.cases, t.ex.solution, t.ex.hint, t.ex.py, { sig: t.ex.sig, java: t.ex.java, cpp: t.ex.cpp }),
    quiz: t.quiz,
  };
}
