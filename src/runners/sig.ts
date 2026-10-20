export type Prim = 'int' | 'long' | 'double' | 'bool' | 'string';
export type SigType = { k: 'prim'; name: Prim } | { k: 'arr'; of: SigType } | { k: 'opt'; of: SigType } | { k: 'map'; of: SigType } | { k: 'any' };
export type Sig = { params: { type: SigType; name: string }[]; ret: SigType };

const PRIMS: Prim[] = ['int', 'long', 'double', 'bool', 'string'];

function parseType(src: string, whole: string): SigType {
  let s = src.trim();
  let dims = 0;
  while (s.endsWith('[]')) { dims++; s = s.slice(0, -2).trim(); }
  let t: SigType;
  if (s === 'any') t = { k: 'any' };
  else if (s.startsWith('map<') && s.endsWith('>')) t = { k: 'map', of: parseType(s.slice(4, -1), whole) };
  else if (s.endsWith('?') && PRIMS.includes(s.slice(0, -1) as Prim)) t = { k: 'opt', of: { k: 'prim', name: s.slice(0, -1) as Prim } };
  else if (PRIMS.includes(s as Prim)) t = { k: 'prim', name: s as Prim };
  else throw new Error(`bad signature: ${whole}`);
  for (let i = 0; i < dims; i++) t = { k: 'arr', of: t };
  return t;
}

export function parseSig(s: string): Sig {
  const m = /^\s*\((.*)\)\s*->\s*(.+?)\s*$/.exec(s);
  if (!m) throw new Error(`bad signature: ${s}`);
  const parts: string[] = [];
  let depth = 0, cur = '';
  for (const ch of m[1]) {
    if (ch === '<') depth++;
    if (ch === '>') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  const params = parts.map((p) => {
    const pm = /^\s*(.+?)\s+([A-Za-z_]\w*)\s*$/.exec(p);
    if (!pm) throw new Error(`bad signature: ${s}`);
    return { type: parseType(pm[1], s), name: pm[2] };
  });
  return { params, ret: parseType(m[2], s) };
}

const JAVA_PRIM: Record<Prim, [string, string]> = { int: ['int', 'Integer'], long: ['long', 'Long'], double: ['double', 'Double'], bool: ['boolean', 'Boolean'], string: ['String', 'String'] };

export function javaType(t: SigType, boxed = false): string {
  switch (t.k) {
    case 'prim': return JAVA_PRIM[t.name][boxed ? 1 : 0];
    case 'opt': return javaType(t.of, true);
    case 'arr': return `${javaType(t.of)}[]`;
    case 'map': return `Map<String, ${javaType(t.of, true)}>`;
    case 'any': return 'Object';
  }
}

const CPP_PRIM: Record<Prim, string> = { int: 'int', long: 'long long', double: 'double', bool: 'bool', string: 'string' };

export function cppType(t: SigType): string {
  switch (t.k) {
    case 'prim': return CPP_PRIM[t.name];
    case 'opt': return `optional<${cppType(t.of)}>`;
    case 'arr': return `vector<${cppType(t.of)}>`;
    case 'map': return `map<string, ${cppType(t.of)}>`;
    case 'any': return 'Json';
  }
}

export const cppParamType = (t: SigType) => (t.k === 'prim' && t.name !== 'string' ? cppType(t) : `${cppType(t)}&`);

export function javaStarter(fn: string, sig: Sig): string {
  const ps = sig.params.map((p) => `${javaType(p.type)} ${p.name}`).join(', ');
  return `class Solution {\n    public ${javaType(sig.ret)} ${fn}(${ps}) {\n        // your code\n    }\n}\n`;
}

export function cppStarter(fn: string, sig: Sig): string {
  const ps = sig.params.map((p) => `${cppParamType(p.type)} ${p.name}`).join(', ');
  return `class Solution {\npublic:\n    ${cppType(sig.ret)} ${fn}(${ps}) {\n        // your code\n    }\n};\n`;
}

export function jsParamNames(fn: string, jsStarter: string): string[] {
  const m = new RegExp(`function\\s+${fn}\\s*\\(([^)]*)\\)`).exec(jsStarter);
  return (m?.[1] ?? '').split(',').map((p) => p.trim().replace(/\s*=.*$/, '')).filter(Boolean);
}
