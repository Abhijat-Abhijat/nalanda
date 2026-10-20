import { example, jsEx } from '../helpers';
import type { JsEx } from '../../schema';

const ex = (lang: string) => (title: string, src: string, output?: string, md?: string) => example(lang, title, src, output, md);
export const js = ex('js');
export const ts = ex('ts');
export const py = ex('python');
export const go = ex('go');
export const sh = ex('bash');
export const yaml = ex('yaml');
export const json = ex('json');
export const hcl = ex('hcl');
export const docker = ex('dockerfile');
export const ini = ex('ini');
export const text = ex('text');

// A function exercise with the usual starter: `function name(params) { // your code }`.
export const fx = (id: string, conceptId: string, prompt: string, fnName: string, params: string, cases: JsEx['cases'], solution: string, hint: string) =>
  jsEx(id, conceptId, prompt, fnName, `function ${fnName}(${params}) {\n  // your code\n}`, cases, solution, hint);
