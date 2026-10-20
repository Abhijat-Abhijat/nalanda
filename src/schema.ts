import { z } from 'zod';

export const Block = z.discriminatedUnion('t', [
  z.object({ t: z.literal('text'), md: z.string().min(1) }),
  z.object({ t: z.literal('analogy'), md: z.string().min(1) }),
  z.object({
    t: z.literal('timeline'),
    events: z.array(z.object({ year: z.string().min(1), title: z.string().min(1), md: z.string().min(1) })).min(1),
  }),
  z.object({ t: z.literal('code'), lang: z.string(), src: z.string() }),
  z.object({ t: z.literal('callout'), tone: z.enum(['tip', 'warn', 'fact']), md: z.string().min(1) }),
  z.object({ t: z.literal('syntax'), lang: z.string(), src: z.string().min(1) }),
  // SQL examples run live against the shop database, so they carry no hand-written output.
  z.object({ t: z.literal('example'), title: z.string().min(1), lang: z.string(), src: z.string().min(1), output: z.string().optional(), md: z.string().optional() }),
  z.object({ t: z.literal('table'), head: z.array(z.string()).min(1), rows: z.array(z.array(z.string())).min(1) }),
  z.object({ t: z.literal('faq'), items: z.array(z.object({ q: z.string().min(1), md: z.string().min(1) })).min(1) }),
]);
export type Block = z.infer<typeof Block>;

export const Layer = z.object({ title: z.string().min(1), blocks: z.array(Block).min(1) });
export type Layer = z.infer<typeof Layer>;

const base = { id: z.string().min(1), conceptId: z.string().min(1) };

export const ChoiceQ = z.object({
  ...base, kind: z.literal('choice'), prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2), answer: z.number().int().min(0), explain: z.string().min(1),
});
export const OrderQ = z.object({
  ...base, kind: z.literal('order'), prompt: z.string().min(1),
  items: z.array(z.string().min(1)).min(2), explain: z.string().min(1),
});
export const FillQ = z.object({
  ...base, kind: z.literal('fill'), prompt: z.string().min(1),
  answers: z.array(z.string().min(1)).min(1), explain: z.string().min(1),
});
export const Question = z.discriminatedUnion('kind', [ChoiceQ, OrderQ, FillQ]);
export type ChoiceQ = z.infer<typeof ChoiceQ>;
export type OrderQ = z.infer<typeof OrderQ>;
export type FillQ = z.infer<typeof FillQ>;
export type Question = z.infer<typeof Question>;

export const SqlEx = z.object({
  ...base, kind: z.literal('sql-query'), prompt: z.string().min(1), dbId: z.enum(['shop']),
  starter: z.string(), ordered: z.boolean(), solution: z.string().min(1), hint: z.string().min(1),
});
export type SqlEx = z.infer<typeof SqlEx>;

export const Check = z.discriminatedUnion('type', [
  z.object({ type: z.literal('cwd'), equals: z.string() }),
  z.object({ type: z.literal('file-equals'), path: z.string(), equals: z.string() }),
  z.object({ type: z.literal('file-contains'), path: z.string(), contains: z.string() }),
  z.object({ type: z.literal('exists'), path: z.string() }),
  z.object({ type: z.literal('not-exists'), path: z.string() }),
  z.object({ type: z.literal('out-contains'), text: z.string() }),
  z.object({ type: z.literal('git-init') }),
  z.object({ type: z.literal('git-branch'), name: z.string() }),
  z.object({ type: z.literal('git-commits'), min: z.number().int() }),
  z.object({ type: z.literal('git-clean') }),
  z.object({ type: z.literal('git-log-contains'), text: z.string() }),
  z.object({ type: z.literal('git-head-parents'), count: z.number().int() }),
]);
export type Check = z.infer<typeof Check>;

export const TerminalEx = z.object({
  ...base, kind: z.literal('terminal'), prompt: z.string().min(1),
  initial: z.object({
    cwd: z.string(), files: z.record(z.string(), z.string()), dirs: z.array(z.string()),
    setup: z.array(z.string()).optional(),
  }),
  checks: z.array(Check).min(1), solution: z.array(z.string()), hint: z.string().min(1),
});
export type TerminalEx = z.infer<typeof TerminalEx>;

export const HttpRequest = z.object({
  method: z.string(), url: z.string(), headers: z.record(z.string(), z.string()), body: z.string(),
});
export type HttpRequest = z.infer<typeof HttpRequest>;
export const HttpRule = z.discriminatedUnion('type', [
  z.object({ type: z.literal('method'), equals: z.string() }),
  z.object({ type: z.literal('host'), equals: z.string() }),
  z.object({ type: z.literal('path'), equals: z.string() }),
  z.object({ type: z.literal('query'), key: z.string(), equals: z.string() }),
  z.object({ type: z.literal('header'), name: z.string(), equals: z.string().optional() }),
  z.object({ type: z.literal('json'), key: z.string(), equals: z.unknown() }),
]);
export type HttpRule = z.infer<typeof HttpRule>;
export const HttpEx = z.object({
  ...base, kind: z.literal('http-builder'), prompt: z.string().min(1),
  starter: HttpRequest, rules: z.array(HttpRule).min(1), solution: HttpRequest, hint: z.string().min(1),
});
export type HttpEx = z.infer<typeof HttpEx>;

export const JsEx = z.object({
  ...base, kind: z.literal('js-code'), prompt: z.string().min(1), starter: z.string(), fnName: z.string(),
  cases: z.array(z.object({ args: z.array(z.unknown()), expect: z.unknown() })).min(1),
  solution: z.string().min(1), hint: z.string().min(1),
  langs: z.array(z.enum(['js', 'ts', 'py', 'java', 'cpp'])).optional(),
  sig: z.string().optional(),
  java: z.object({ solution: z.string().min(1) }).optional(),
  cpp: z.object({ solution: z.string().min(1) }).optional(),
  py: z.object({ solution: z.string().min(1) }).optional(),
});
export type JsEx = z.infer<typeof JsEx>;

export const LlmEx = z.union([
  z.object({ ...base, kind: z.literal('llm-lab'), lab: z.literal('tokenizer'), prompt: z.string().min(1),
    targetCount: z.number().int().min(1), solution: z.string().min(1), hint: z.string().min(1) }),
  z.object({ ...base, kind: z.literal('llm-lab'), lab: z.literal('embeddings'), prompt: z.string().min(1),
    anchor: z.string(), options: z.array(z.string()).min(2), hint: z.string().min(1) }),
  z.object({ ...base, kind: z.literal('llm-lab'), lab: z.literal('retrieval'), prompt: z.string().min(1),
    query: z.string(), chunks: z.array(z.object({ id: z.string(), text: z.string() })).min(2),
    k: z.number().int().min(1), hint: z.string().min(1) }),
]);
export type LlmEx = z.infer<typeof LlmEx>;

export const Exercise = z.union([SqlEx, TerminalEx, HttpEx, JsEx, LlmEx]);
export type Exercise = z.infer<typeof Exercise>;
export const Task = z.union([Exercise, Question]);
export type Task = z.infer<typeof Task>;

export const Lesson = z.object({
  id: z.string().min(1), title: z.string().min(1), conceptIds: z.array(z.string().min(1)).min(1),
  story: z.array(Block).min(1), layers: z.tuple([Layer, Layer, Layer]),
  exercise: Task, quiz: z.array(Question).min(3).max(5),
});
export type Lesson = z.infer<typeof Lesson>;

export const Chapter = z.object({
  id: z.string().min(1), title: z.string().min(1), summary: z.string().min(1),
  lessons: z.array(Lesson).min(1), exam: z.array(Question).min(8).max(20),
});
export type Chapter = z.infer<typeof Chapter>;

export const Boss = z.object({ id: z.string().min(1), title: z.string().min(1), steps: z.array(Task).min(1) });
export type Boss = z.infer<typeof Boss>;

export const WorldSchema = z.object({
  id: z.string().min(1), title: z.string().min(1), hue: z.string(), tagline: z.string().min(1),
  intro: z.array(Block).min(1), chapters: z.array(Chapter).min(1), boss: Boss,
});
export type World = z.infer<typeof WorldSchema>;
