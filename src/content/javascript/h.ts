import { example, jsEx } from '../helpers';
import type { JsEx } from '../../schema';

export const js = (title: string, src: string, output?: string, md?: string) => example('js', title, src, output, md);
export const ts = (title: string, src: string, output?: string, md?: string) => example('ts', title, src, output, md);
export const html = (title: string, src: string, output?: string, md?: string) => example('html', title, src, output, md);
export const sh = (title: string, src: string, output?: string, md?: string) => example('bash', title, src, output, md);

// A function exercise with the usual starter: `function name(params) { // your code }`.
export const fx = (id: string, conceptId: string, prompt: string, fnName: string, params: string, cases: JsEx['cases'], solution: string, hint: string) =>
  jsEx(id, conceptId, prompt, fnName, `function ${fnName}(${params}) {\n  // your code\n}`, cases, solution, hint);
