import { CPP_PRELUDE } from './prelude';
import { cppHelpersFor } from './helpers';
import { parseSig, cppType } from '../sig';
import type { Case } from '../types';

export type CppUnit = { id: string; learner: string; fnName: string; sig: string; cases: Case[]; jsStarter: string };
const lineCount = (s: string) => s.split('\n').length;

// Move #include and "using namespace std;" lines to the top, leaving blank lines so line numbers stay put.
export function hoistIncludes(code: string): { body: string; hoisted: string[] } {
  const hoisted: string[] = [];
  const body = code.split('\n').map((l) => (/^\s*(#include\b|using\s+namespace\s+std\s*;)/.test(l) ? (hoisted.push(l.trim()), '') : l)).join('\n');
  return { body, hoisted };
}

// Each unit lives in namespace U<i>; with markers on (the default for several units) each prints "@@<id>" before its results.
export function cppProgram(units: CppUnit[], markers = units.length > 1): { source: string; offsets: number[] } {
  const includes = new Set<string>();
  const bodies = units.map((u) => {
    const h = hoistIncludes(u.learner);
    h.hoisted.filter((x) => x.startsWith('#')).forEach((x) => includes.add(x));
    return h.body;
  });
  let text = CPP_PRELUDE + [...includes].join('\n') + '\n';
  const offsets: number[] = [];
  units.forEach((u, idx) => {
    const sig = parseSig(u.sig);
    const head = `namespace U${idx} {\n${cppHelpersFor(u.jsStarter)}\n`;
    offsets.push(lineCount(text + head) - 1);
    const conv = sig.params.map((p, i) => `  auto a${i} = Conv<${cppType(p.type)}>::from(args[${i}]);`).join('\n');
    const call = sig.params.map((_p, i) => `a${i}`).join(', ');
    const runCase = `static void runCase(const string& argsText) {\n  JsonParser p(argsText); Json args = p.parse();\n${conv}\n  Solution s;\n  auto r = s.${u.fnName}(${call});\n  cout << "\\n{\\"ok\\":true,\\"got\\":" << toJsonText(Conv<${cppType(sig.ret)}>::to(r)) << "}" << endl;\n}\n`;
    const runAll = `static void runAll() {\n${u.cases.map((c) => `  runCase(R"NALANDA(${JSON.stringify(c.args)})NALANDA");`).join('\n')}\n}\n`;
    text += head + bodies[idx] + '\n' + runCase + runAll + '}\n';
  });
  text += 'int main() {\n' + units.map((u, idx) => (markers ? `  cout << "\\n@@${u.id}" << endl;\n` : '') + `  U${idx}::runAll();`).join('\n') + '\n  return 0;\n}\n';
  return { source: text, offsets };
}
