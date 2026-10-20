import { example, jsEx } from '../helpers';
import type { JsEx } from '../../schema';

const ex = (lang: string) => (title: string, src: string, output?: string, md?: string) => example(lang, title, src, output, md);
export const html = ex('html');
export const css = ex('css');
export const js = ex('js');
export const jsx = ex('jsx');
export const tsx = ex('tsx');
export const vue = ex('vue');
export const sh = ex('bash');

// A function exercise with the usual starter: `function name(params) { // your code }`.
export const fx = (id: string, conceptId: string, prompt: string, fnName: string, params: string, cases: JsEx['cases'], solution: string, hint: string) =>
  jsEx(id, conceptId, prompt, fnName, `function ${fnName}(${params}) {\n  // your code\n}`, cases, solution, hint);
