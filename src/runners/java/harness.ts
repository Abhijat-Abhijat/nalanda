import { JAVA_PRELUDE } from './prelude';
import { guardLoops, GUARD_CLASS, GUARD_MARKER } from './guard';
import { javaHelpersFor } from './helpers';
import { parseSig, javaType, type SigType } from '../sig';
import type { Case } from '../types';

export type JavaUnit = { learner: string; fnName: string; sig: string; cases: Case[]; jsStarter: string; pkg?: string };
const lineCount = (s: string) => s.split('\n').length;

// Import lines must come before any class, so put them first, ahead of the prelude's classes, leaving blank lines behind.
export function hoistImports(code: string): { body: string; imports: string[] } {
  const imports: string[] = [];
  const body = code.split('\n').map((l) => (/^\s*import\s+(static\s+)?[\w.]+(\.\*)?\s*;\s*$/.test(l) ? (imports.push(l.trim()), '') : l)).join('\n');
  return { body, imports };
}

// Solution inherits the static helper methods, so learners call fromArray(...) unqualified.
const extendHelpers = (code: string) => code.replace(/\b(?:public\s+)?class\s+Solution\s*\{/, 'class Solution extends Helpers {');

const PRIM_CONV = { int: 'J.i', long: 'J.l', double: 'J.d', bool: 'J.b', string: 'J.s' } as const;
const OPT_CONV = { int: 'J.oi', long: 'J.ol', double: 'J.od', bool: 'J.ob', string: 'J.os' } as const;
const ARR_CONV = { int: 'J.ia', long: 'J.la', double: 'J.da', bool: 'J.ba' } as const;

function conv(t: SigType, x: string, depth = 0): string {
  const e = `e${depth}`;
  switch (t.k) {
    case 'prim': return `${PRIM_CONV[t.name]}(${x})`;
    case 'opt': return `${OPT_CONV[(t.of as { k: 'prim'; name: keyof typeof OPT_CONV }).name]}(${x})`;
    case 'any': return x;
    case 'map': return `J.map(${x}, ${e} -> ${conv(t.of, e, depth + 1)})`;
    case 'arr':
      if (t.of.k === 'prim' && t.of.name !== 'string') return `${ARR_CONV[t.of.name]}(${x})`;
      return `J.list(${x}).stream().map(${e} -> ${conv(t.of, e, depth + 1)}).toArray(${javaType(t.of)}[]::new)`;
  }
}

const javaString = (s: string) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

export function javaProgram(u: JavaUnit): { source: string; offset: number } {
  const sig = parseSig(u.sig);
  const { body, imports } = hoistImports(u.learner);
  const head = (u.pkg ? `package ${u.pkg};\n` : '') + imports.join('\n') + '\n' + JAVA_PRELUDE + GUARD_CLASS + '\n' + javaHelpersFor(u.jsStarter) + '\n';
  const offset = lineCount(head) - 1;
  const args = sig.params.map((p, i) => conv(p.type, `a.get(${i})`)).join(', ');
  const main = `
public class Main {
  static void runCase(String argsText) {
    try {
      List<Object> a = J.list(Json.parse(argsText));
      Object r = new Solution().${u.fnName}(${args});
      System.out.println("\\n{\\"ok\\":true,\\"got\\":" + Json.write(r) + "}");
    } catch (Throwable t) {
      System.out.println("\\n{\\"ok\\":false,\\"error\\":" + Json.write(t.getClass().getSimpleName() + (t.getMessage() == null ? "" : ": " + t.getMessage())) + "}");
    }
  }
  public static void main(String[] args) {
${u.cases.map((c) => `    runCase(${javaString(JSON.stringify(c.args))});`).join('\n')}
  }
}
`;
  return { source: head + extendHelpers(guardLoops(body)) + '\n' + main, offset };
}

// A free-form playground program: loops guarded, guard class appended so line numbers are unchanged.
export const javaPlaygroundSource = (code: string) => guardLoops(code) + '\n' + GUARD_CLASS + '\n';
export const hitGuard = (stdout: string) => stdout.includes(GUARD_MARKER);
export const withoutGuard = (stdout: string) => stdout.split('\n').filter((l) => l.trim() !== GUARD_MARKER).join('\n');
