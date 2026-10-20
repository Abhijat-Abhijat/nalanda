import { example, jsEx } from '../helpers';
import type { JsEx } from '../../schema';

const ex = (lang: string) => (title: string, src: string, output?: string, md?: string) => example(lang, title, src, output, md);
export const js = ex('js');
export const ts = ex('ts');
export const py = ex('python');
export const go = ex('go');
export const sql = ex('sql');
export const sh = ex('bash');
export const yaml = ex('yaml');
export const json = ex('json');
export const mongo = ex('mongosh');
export const cypher = ex('cypher');
export const cql = ex('cql');
export const redis = ex('redis');

// A function exercise with the usual starter: `function name(params) { // your code }`.
export const fx = (id: string, conceptId: string, prompt: string, fnName: string, params: string, cases: JsEx['cases'], solution: string, hint: string) =>
  jsEx(id, conceptId, prompt, fnName, `function ${fnName}(${params}) {\n  // your code\n}`, cases, solution, hint);
