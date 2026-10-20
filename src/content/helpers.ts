import type { Block, ChoiceQ, FillQ, HttpEx, Layer, OrderQ, SqlEx, TerminalEx, JsEx } from '../schema';

// Small builders so chapter files read like tutorial pages instead of object literals.
export const txt = (md: string): Block => ({ t: 'text', md });
export const analogy = (md: string): Block => ({ t: 'analogy', md });
export const tip = (md: string): Block => ({ t: 'callout', tone: 'tip', md });
export const warn = (md: string): Block => ({ t: 'callout', tone: 'warn', md });
export const note = (md: string): Block => ({ t: 'callout', tone: 'fact', md });
export const code = (lang: string, src: string): Block => ({ t: 'code', lang, src });
export const syntax = (lang: string, src: string): Block => ({ t: 'syntax', lang, src });
export const example = (lang: string, title: string, src: string, output?: string, md?: string): Block =>
  ({ t: 'example', title, lang, src, ...(output !== undefined ? { output } : {}), ...(md ? { md } : {}) });
export const table = (head: string[], ...rows: string[][]): Block => ({ t: 'table', head, rows });
export const faq = (...items: [string, string][]): Block => ({ t: 'faq', items: items.map(([q, md]) => ({ q, md })) });
export const timeline = (...events: [string, string, string][]): Block =>
  ({ t: 'timeline', events: events.map(([year, title, md]) => ({ year, title, md })) });
export const layers = (a: Layer, b: Layer, c: Layer): [Layer, Layer, Layer] => [a, b, c];
export const layer = (title: string, ...blocks: Block[]): Layer => ({ title, blocks });

export const choice = (id: string, conceptId: string, prompt: string, options: string[], answer: number, explain: string): ChoiceQ =>
  ({ kind: 'choice', id, conceptId, prompt, options, answer, explain });
export const fill = (id: string, conceptId: string, prompt: string, answers: string[], explain: string): FillQ =>
  ({ kind: 'fill', id, conceptId, prompt, answers, explain });
export const order = (id: string, conceptId: string, prompt: string, items: string[], explain: string): OrderQ =>
  ({ kind: 'order', id, conceptId, prompt, items, explain });
export const sqlEx = (id: string, conceptId: string, prompt: string, solution: string, hint: string, ordered = false): SqlEx =>
  ({ kind: 'sql-query', id, conceptId, prompt, dbId: 'shop', starter: '', ordered, solution, hint });
export const termEx = (id: string, conceptId: string, prompt: string, initial: TerminalEx['initial'], checks: TerminalEx['checks'], solution: string[], hint: string): TerminalEx =>
  ({ kind: 'terminal', id, conceptId, prompt, initial, checks, solution, hint });
export const httpEx = (id: string, conceptId: string, prompt: string, starter: HttpEx['starter'], rules: HttpEx['rules'], solution: HttpEx['solution'], hint: string): HttpEx =>
  ({ kind: 'http-builder', id, conceptId, prompt, starter, rules, solution, hint });
export const jsEx = (id: string, conceptId: string, prompt: string, fnName: string, starter: string, cases: JsEx['cases'], solution: string, hint: string, py?: string, extra: { sig?: string; java?: string; cpp?: string } = {}): JsEx => {
  const langs = ['js', 'ts', ...(py ? ['py'] : []), ...(extra.java ? ['java'] : []), ...(extra.cpp ? ['cpp'] : [])] as NonNullable<JsEx['langs']>;
  return {
    kind: 'js-code', id, conceptId, prompt, fnName, starter, cases, solution, hint,
    ...(langs.length > 2 ? { langs } : {}),
    ...(py ? { py: { solution: py } } : {}),
    ...(extra.sig ? { sig: extra.sig } : {}),
    ...(extra.java ? { java: { solution: extra.java } } : {}),
    ...(extra.cpp ? { cpp: { solution: extra.cpp } } : {}),
  };
};
