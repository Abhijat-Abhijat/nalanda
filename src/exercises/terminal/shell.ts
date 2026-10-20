export type FsState = { cwd: string; files: Record<string, string>; dirs: string[]; git: unknown | null };
export type RunResult = { state: FsState; out: string; err: string };
type CmdResult = { state: FsState; out: string; err: string };
type Cmd = (state: FsState, args: string[], stdin: string | null) => CmdResult;

const normalize = (p: string): string => {
  const parts: string[] = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') { parts.pop(); continue; }
    parts.push(seg);
  }
  return '/' + parts.join('/');
};

export const resolvePath = (cwd: string, p: string): string => normalize(p.startsWith('/') ? p : `${cwd}/${p}`);

const dirname = (p: string): string => p.slice(0, p.lastIndexOf('/')) || '/';
const basename = (p: string): string => p.slice(p.lastIndexOf('/') + 1);
const ancestors = (p: string): string[] => {
  const out = ['/'];
  const parts = p.split('/').filter(Boolean);
  for (let i = 1; i < parts.length; i++) out.push('/' + parts.slice(0, i).join('/'));
  return out;
};

export function makeState(initial: { cwd: string; files: Record<string, string>; dirs: string[] }): FsState {
  const dirs = new Set<string>(['/']);
  const addDir = (d: string) => { ancestors(d).forEach((a) => dirs.add(a)); dirs.add(normalize(d)); };
  addDir(initial.cwd);
  initial.dirs.forEach(addDir);
  Object.keys(initial.files).forEach((f) => ancestors(f).forEach((a) => dirs.add(a)));
  return { cwd: normalize(initial.cwd), files: { ...initial.files }, dirs: [...dirs].sort(), git: null };
}

export function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let cur = '';
  let has = false;
  let quote: string | null = null;
  const push = () => { if (has) { tokens.push(cur); cur = ''; has = false; } };
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) { if (ch === quote) quote = null; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { quote = ch; has = true; continue; }
    if (/\s/.test(ch)) { push(); continue; }
    if (ch === '|') { push(); tokens.push('|'); continue; }
    if (ch === '>') { push(); if (line[i + 1] === '>') { tokens.push('>>'); i++; } else tokens.push('>'); continue; }
    cur += ch;
    has = true;
  }
  if (quote) throw new Error('syntax error: unmatched quote');
  push();
  return tokens;
}

const linesOf = (s: string): string[] => (s === '' ? [] : s.replace(/\n$/, '').split('\n'));
const strip = (s: string): string => s.replace(/\n$/, '');
const ok = (state: FsState, out = ''): CmdResult => ({ state, out, err: '' });
const fail = (state: FsState, err: string): CmdResult => ({ state, out: '', err });

const isDir = (s: FsState, p: string) => s.dirs.includes(p);
const isFile = (s: FsState, p: string) => p in s.files;
const children = (s: FsState, dir: string) => {
  const out: string[] = [];
  for (const d of s.dirs) if (d !== '/' && dirname(d) === dir) out.push(basename(d) + '/');
  for (const f of Object.keys(s.files)) if (dirname(f) === dir) out.push(basename(f));
  return out.sort((a, b) => a.replace(/\/$/, '').localeCompare(b.replace(/\/$/, '')));
};

function readInput(s: FsState, args: string[], stdin: string | null, name: string): { text: string } | { err: string } {
  const file = args.find((a) => !a.startsWith('-'));
  if (file === undefined) return { text: stdin ?? '' };
  const p = resolvePath(s.cwd, file);
  if (isDir(s, p)) return { err: `${name}: ${file}: Is a directory` };
  if (!isFile(s, p)) return { err: `${name}: ${file}: No such file or directory` };
  return { text: s.files[p] };
}

function removeTree(s: FsState, root: string): FsState {
  const files = { ...s.files };
  for (const f of Object.keys(files)) if (f.startsWith(root + '/')) delete files[f];
  const dirs = s.dirs.filter((d) => d !== root && !d.startsWith(root + '/'));
  return { ...s, files, dirs, cwd: s.cwd === root || s.cwd.startsWith(root + '/') ? '/' : s.cwd };
}

const commands: Record<string, Cmd> = {
  pwd: (s) => ok(s, s.cwd),
  ls: (s, args) => {
    const target = args.find((a) => !a.startsWith('-'));
    const p = target === undefined ? s.cwd : resolvePath(s.cwd, target);
    if (isFile(s, p)) return ok(s, basename(p));
    if (!isDir(s, p)) return fail(s, `ls: cannot access '${target}': No such file or directory`);
    return ok(s, children(s, p).join('\n'));
  },
  cd: (s, args) => {
    const target = args[0];
    const p = target === undefined ? (isDir(s, '/home/learner') ? '/home/learner' : '/') : resolvePath(s.cwd, target);
    if (!isDir(s, p)) return fail(s, `cd: no such directory: ${target}`);
    return ok({ ...s, cwd: p });
  },
  mkdir: (s, args) => {
    const parents = args.includes('-p');
    let state = s;
    for (const name of args.filter((a) => !a.startsWith('-'))) {
      const p = resolvePath(state.cwd, name);
      if (isDir(state, p) || isFile(state, p)) {
        if (parents) continue;
        return fail(s, `mkdir: cannot create directory '${name}': File exists`);
      }
      if (!parents && !isDir(state, dirname(p))) return fail(s, `mkdir: cannot create directory '${name}': No such file or directory`);
      state = { ...state, dirs: [...new Set([...state.dirs, ...ancestors(p), p])].sort() };
    }
    return ok(state);
  },
  touch: (s, args) => {
    let state = s;
    for (const name of args) {
      const p = resolvePath(state.cwd, name);
      if (isDir(state, p) || isFile(state, p)) continue;
      if (!isDir(state, dirname(p))) return fail(s, `touch: cannot touch '${name}': No such file or directory`);
      state = { ...state, files: { ...state.files, [p]: '' } };
    }
    return ok(state);
  },
  echo: (s, args) => ok(s, args.join(' ')),
  cat: (s, args, stdin) => {
    const names = args.filter((a) => !a.startsWith('-'));
    if (names.length === 0) return ok(s, strip(stdin ?? ''));
    const parts: string[] = [];
    for (const n of names) {
      const r = readInput(s, [n], null, 'cat');
      if ('err' in r) return fail(s, r.err);
      parts.push(strip(r.text));
    }
    return ok(s, parts.join('\n'));
  },
  rm: (s, args) => {
    const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
    let state = s;
    for (const name of args.filter((a) => !a.startsWith('-'))) {
      const p = resolvePath(state.cwd, name);
      if (isFile(state, p)) {
        const files = { ...state.files };
        delete files[p];
        state = { ...state, files };
      } else if (isDir(state, p)) {
        if (!recursive) return fail(s, `rm: cannot remove '${name}': Is a directory`);
        if (p === '/') state = { ...state, files: {}, dirs: ['/'], cwd: '/' };
        else state = removeTree(state, p);
      } else return fail(s, `rm: cannot remove '${name}': No such file or directory`);
    }
    return ok(state);
  },
  cp: (s, args) => transfer(s, args, false),
  mv: (s, args) => transfer(s, args, true),
  head: (s, args, stdin) => {
    const i = args.indexOf('-n');
    const n = i >= 0 ? Number(args[i + 1]) : 10;
    const rest = i >= 0 ? args.filter((_, k) => k !== i && k !== i + 1) : args;
    const r = readInput(s, rest, stdin, 'head');
    if ('err' in r) return fail(s, r.err);
    return ok(s, linesOf(r.text).slice(0, Number.isFinite(n) ? n : 10).join('\n'));
  },
  wc: (s, args, stdin) => {
    const r = readInput(s, args, stdin, 'wc');
    if ('err' in r) return fail(s, r.err);
    return ok(s, String(linesOf(r.text).length));
  },
  grep: (s, args, stdin) => {
    const insensitive = args.includes('-i');
    const rest = args.filter((a) => a !== '-i');
    const [pattern, ...others] = rest;
    if (pattern === undefined) return fail(s, 'grep: missing pattern');
    const r = readInput(s, others, stdin, 'grep');
    if ('err' in r) return fail(s, r.err);
    const needle = insensitive ? pattern.toLowerCase() : pattern;
    return ok(s, linesOf(r.text).filter((l) => (insensitive ? l.toLowerCase() : l).includes(needle)).join('\n'));
  },
  sort: (s, args, stdin) => {
    const r = readInput(s, args, stdin, 'sort');
    if ('err' in r) return fail(s, r.err);
    return ok(s, linesOf(r.text).sort().join('\n'));
  },
  uniq: (s, args, stdin) => {
    const r = readInput(s, args, stdin, 'uniq');
    if ('err' in r) return fail(s, r.err);
    return ok(s, linesOf(r.text).filter((l, i, a) => i === 0 || l !== a[i - 1]).join('\n'));
  },
};

function transfer(s: FsState, args: string[], move: boolean): CmdResult {
  const name = move ? 'mv' : 'cp';
  const [src, dst] = args;
  if (src === undefined || dst === undefined) return fail(s, `${name}: missing file operand`);
  const from = resolvePath(s.cwd, src);
  if (!isFile(s, from)) return fail(s, `${name}: cannot stat '${src}': No such file or directory`);
  let to = resolvePath(s.cwd, dst);
  if (isDir(s, to)) to = `${to === '/' ? '' : to}/${basename(from)}`;
  if (!isDir(s, dirname(to))) return fail(s, `${name}: cannot create '${dst}': No such file or directory`);
  const files = { ...s.files, [to]: s.files[from] };
  if (move && to !== from) delete files[from];
  return ok({ ...s, files });
}

type GitHook = (state: FsState, args: string[]) => RunResult;
let gitHook: GitHook = (state) => ({ state, out: '', err: 'git: not available in this exercise' });
export const setGitHook = (fn: GitHook): void => { gitHook = fn; };

export function run(state: FsState, line: string): RunResult {
  let tokens: string[];
  try { tokens = tokenize(line); } catch (e) { return { state, out: '', err: e instanceof Error ? e.message : 'syntax error' }; }
  if (tokens.length === 0) return { state, out: '', err: '' };

  const segments: string[][] = [[]];
  for (const t of tokens) { if (t === '|') segments.push([]); else segments[segments.length - 1].push(t); }
  if (segments.some((seg) => seg.length === 0)) return { state, out: '', err: 'syntax error: empty command in pipeline' };

  let redirect: { mode: '>' | '>>'; path: string } | null = null;
  const last = segments[segments.length - 1];
  const ri = last.findIndex((t) => t === '>' || t === '>>');
  if (ri >= 0) {
    const path = last[ri + 1];
    if (path === undefined) return { state, out: '', err: 'syntax error: missing redirect target' };
    redirect = { mode: last[ri] as '>' | '>>', path };
    segments[segments.length - 1] = last.slice(0, ri);
    if (segments[segments.length - 1].length === 0) return { state, out: '', err: 'syntax error: empty command before redirect' };
  }

  let current = state;
  let stdin: string | null = null;
  for (const seg of segments) {
    const [name, ...args] = seg;
    let result: CmdResult;
    if (name === 'git') result = gitHook(current, args);
    else if (Object.hasOwn(commands, name)) result = commands[name](current, args, stdin);
    else result = fail(current, `${name}: command not found`);
    if (result.err) return { state, out: '', err: result.err };
    current = result.state;
    stdin = result.out;
  }

  const out = stdin ?? '';
  if (!redirect) return { state: current, out, err: '' };
  const target = resolvePath(current.cwd, redirect.path);
  if (isDir(current, target)) return { state, out: '', err: `${redirect.path}: Is a directory` };
  if (!isDir(current, dirname(target))) return { state, out: '', err: `${redirect.path}: No such file or directory` };
  const existing = current.files[target];
  const content = redirect.mode === '>>' && existing
    ? (existing.endsWith('\n') ? existing : existing + '\n') + out
    : out;
  return { state: { ...current, files: { ...current.files, [target]: content } }, out: '', err: '' };
}
