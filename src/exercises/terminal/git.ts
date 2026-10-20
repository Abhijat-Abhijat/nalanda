import { resolvePath, setGitHook, type FsState, type RunResult } from './shell';

export type Commit = { id: string; parents: string[]; message: string; tree: Record<string, string>; n: number };
export type GitRepo = {
  root: string;
  commits: Record<string, Commit>;
  branches: Record<string, string | null>;
  head: string;
  index: Record<string, string>;
  merging: { other: string; conflicts: string[] } | null;
  counter: number;
};
type Tree = Record<string, string>;

function hash7(n: number, message: string): string {
  let h = 0x811c9dc5;
  const s = `${n}:${message}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0').slice(0, 7);
}

const same = (a: Tree, b: Tree): boolean => {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
};

export function headTree(repo: GitRepo): Tree {
  const tip = repo.branches[repo.head];
  return tip ? repo.commits[tip].tree : {};
}

const prefixOf = (repo: GitRepo) => (repo.root === '/' ? '/' : repo.root + '/');

export function workingTree(state: FsState, repo: GitRepo): Tree {
  const out: Tree = {};
  const prefix = prefixOf(repo);
  for (const [p, c] of Object.entries(state.files)) if (p.startsWith(prefix)) out[p.slice(prefix.length)] = c;
  return out;
}

export function isClean(state: FsState): boolean {
  const repo = state.git as GitRepo | null;
  if (!repo) return false;
  const wt = workingTree(state, repo);
  return same(wt, repo.index) && same(repo.index, headTree(repo)) && repo.merging === null;
}

const abs = (repo: GitRepo, rel: string) => prefixOf(repo) + rel;
const dirsFor = (path: string): string[] => {
  const parts = path.split('/').filter(Boolean);
  const out: string[] = [];
  for (let i = 1; i < parts.length; i++) out.push('/' + parts.slice(0, i).join('/'));
  return out;
};

function writeTree(state: FsState, repo: GitRepo, oldTree: Tree, newTree: Tree): Pick<FsState, 'files' | 'dirs'> {
  const files = { ...state.files };
  for (const p of Object.keys(oldTree)) delete files[abs(repo, p)];
  const dirs = new Set(state.dirs);
  for (const [p, c] of Object.entries(newTree)) {
    files[abs(repo, p)] = c;
    dirsFor(abs(repo, p)).forEach((d) => dirs.add(d));
  }
  return { files, dirs: [...dirs].sort() };
}

const ancestorsOf = (repo: GitRepo, tip: string | null): Set<string> => {
  const seen = new Set<string>();
  const stack = tip ? [tip] : [];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...repo.commits[id].parents);
  }
  return seen;
};

const trackedDirty = (state: FsState, repo: GitRepo): boolean => {
  const head = headTree(repo);
  if (!same(repo.index, head)) return true;
  const wt = workingTree(state, repo);
  return Object.entries(head).some(([p, c]) => wt[p] !== c);
};

// An untracked file with different content that a switch or merge would overwrite must stop the operation.
const untrackedCollision = (state: FsState, repo: GitRepo, newTree: Tree, action: string): string | null => {
  const wt = workingTree(state, repo);
  for (const [p, c] of Object.entries(newTree)) {
    if (p in wt && !(p in repo.index) && wt[p] !== c) return `error: The untracked file ${p} would be overwritten by ${action}.`;
  }
  return null;
};

const done = (state: FsState, repo: GitRepo, out = '', extra: Partial<FsState> = {}): RunResult =>
  ({ state: { ...state, ...extra, git: repo }, out, err: '' });
const error = (state: FsState, err: string): RunResult => ({ state, out: '', err });

export function gitRun(state: FsState, args: string[]): RunResult {
  const [sub, ...rest] = args;
  if (sub === undefined) return error(state, 'usage: git <command> [<args>]');
  if (sub === 'init') {
    if (state.git) return { state, out: 'Reinitialized existing Git repository', err: '' };
    const repo: GitRepo = { root: state.cwd, commits: {}, branches: { main: null }, head: 'main', index: {}, merging: null, counter: 0 };
    return done(state, repo, `Initialized empty Git repository in ${state.cwd}/.git/`);
  }
  const repo = state.git as GitRepo | null;
  if (!repo) return error(state, 'fatal: not a git repository');
  const flags = rest.filter((a) => a.startsWith('-'));
  const names = rest.filter((a) => !a.startsWith('-'));

  switch (sub) {
    case 'add': {
      if (names.length === 0) return error(state, 'Nothing specified, nothing added.');
      const wt = workingTree(state, repo);
      const prefix = prefixOf(repo);
      const index = { ...repo.index };
      const staged: string[] = [];
      for (const arg of names) {
        const p = resolvePath(state.cwd, arg);
        const rel = p === repo.root ? '' : p.slice(prefix.length);
        if (p === repo.root || state.dirs.includes(p)) {
          const under = (k: string) => rel === '' || k.startsWith(rel + '/');
          for (const k of Object.keys(wt)) if (under(k)) { index[k] = wt[k]; staged.push(k); }
          for (const k of Object.keys(index)) if (under(k) && !(k in wt)) { delete index[k]; staged.push(k); }
        } else if (rel in wt) { index[rel] = wt[rel]; staged.push(rel); }
        else if (rel in index) { delete index[rel]; staged.push(rel); }
        else return error(state, `fatal: pathspec '${arg}' did not match any files`);
      }
      const merging = repo.merging ? { ...repo.merging, conflicts: repo.merging.conflicts.filter((c) => !staged.includes(c)) } : null;
      return done(state, { ...repo, index, merging });
    }

    case 'commit': {
      const mi = rest.indexOf('-m');
      if (mi < 0 || rest[mi + 1] === undefined) return error(state, "error: switch 'm' requires a value");
      const message = rest[mi + 1];
      if (repo.merging && repo.merging.conflicts.length > 0) return error(state, 'error: Committing is not possible because you have unmerged files.');
      if (!repo.merging && same(repo.index, headTree(repo))) return error(state, 'nothing to commit, working tree clean');
      const n = repo.counter + 1;
      const id = hash7(n, message);
      const tip = repo.branches[repo.head];
      const parents = tip ? [tip] : [];
      if (repo.merging) {
        const other = repo.branches[repo.merging.other];
        if (other) parents.push(other);
      }
      const commit: Commit = { id, parents, message, tree: { ...repo.index }, n };
      return done(state, {
        ...repo, commits: { ...repo.commits, [id]: commit }, branches: { ...repo.branches, [repo.head]: id }, merging: null, counter: n,
      }, `[${repo.head} ${id}] ${message}`);
    }

    case 'log': {
      const tip = repo.branches[repo.head];
      if (!tip) return error(state, `fatal: your current branch '${repo.head}' does not have any commits yet`);
      const lines = [...ancestorsOf(repo, tip)].map((id) => repo.commits[id]).sort((a, b) => b.n - a.n).map((c) => `${c.id} ${c.message}`);
      return done(state, repo, lines.join('\n'));
    }

    case 'branch': {
      const name = names[0];
      if (name === undefined) {
        const list = Object.keys(repo.branches).sort().map((b) => (b === repo.head ? '* ' : '  ') + b);
        return done(state, repo, list.join('\n'));
      }
      if (name in repo.branches) return error(state, `fatal: a branch named '${name}' already exists`);
      const tip = repo.branches[repo.head];
      if (!tip) return error(state, `fatal: not a valid object name: '${repo.head}'`);
      return done(state, { ...repo, branches: { ...repo.branches, [name]: tip } });
    }

    case 'checkout':
    case 'switch': {
      const create = flags.includes('-b') || flags.includes('-c');
      const name = names[0];
      if (name === undefined) return error(state, 'fatal: missing branch name');
      if (create) {
        if (name in repo.branches) return error(state, `fatal: a branch named '${name}' already exists`);
        const tip = repo.branches[repo.head];
        if (!tip) return error(state, `fatal: not a valid object name: '${repo.head}'`);
        return done(state, { ...repo, branches: { ...repo.branches, [name]: tip }, head: name }, `Switched to a new branch '${name}'`);
      }
      if (!(name in repo.branches)) return error(state, `fatal: invalid reference: ${name}`);
      if (name === repo.head) return done(state, repo, `Already on '${name}'`);
      if (trackedDirty(state, repo)) return error(state, 'error: commit or stash your changes before switching branches.');
      const target = repo.branches[name];
      const newTree = target ? repo.commits[target].tree : {};
      const clash = untrackedCollision(state, repo, newTree, 'checkout');
      if (clash) return error(state, clash);
      const next: GitRepo = { ...repo, head: name, index: { ...newTree } };
      return done(state, next, `Switched to branch '${name}'`, writeTree(state, repo, headTree(repo), newTree));
    }

    case 'merge': {
      const name = names[0];
      if (name === undefined) return error(state, 'fatal: no branch specified');
      if (!(name in repo.branches)) return error(state, `merge: ${name} - not something we can merge`);
      if (repo.merging) return error(state, 'fatal: You have not concluded your merge. Commit your fix first.');
      const other = repo.branches[name];
      const tip = repo.branches[repo.head];
      if (!other) return done(state, repo, 'Already up to date.');
      const mine = ancestorsOf(repo, tip);
      if (mine.has(other)) return done(state, repo, 'Already up to date.');
      if (trackedDirty(state, repo)) return error(state, 'error: commit or stash your changes before merging.');
      const theirs = ancestorsOf(repo, other);
      const oursTree = headTree(repo);
      const theirTree = repo.commits[other].tree;
      if (!tip || theirs.has(tip)) {
        const ffClash = untrackedCollision(state, repo, theirTree, 'merge');
        if (ffClash) return error(state, ffClash);
        const next: GitRepo = { ...repo, branches: { ...repo.branches, [repo.head]: other }, index: { ...theirTree } };
        return done(state, next, `Updating ${tip ?? 'nothing'}..${other}\nFast-forward`, writeTree(state, repo, oursTree, theirTree));
      }
      const common = [...mine].filter((id) => theirs.has(id)).map((id) => repo.commits[id]).sort((a, b) => b.n - a.n)[0];
      const baseTree = common ? common.tree : {};
      const merged: Tree = {};
      const indexTree: Tree = {};
      const conflicts: string[] = [];
      for (const p of new Set([...Object.keys(baseTree), ...Object.keys(oursTree), ...Object.keys(theirTree)])) {
        const b = baseTree[p], o = oursTree[p], t = theirTree[p];
        let value: string | undefined;
        if (o === t) value = o;
        else if (o === b) value = t;
        else if (t === b) value = o;
        else {
          conflicts.push(p);
          merged[p] = `<<<<<<< HEAD\n${o ?? ''}\n=======\n${t ?? ''}\n>>>>>>> ${name}`;
          if (o !== undefined) indexTree[p] = o;
          continue;
        }
        if (value !== undefined) { merged[p] = value; indexTree[p] = value; }
      }
      const mergeClash = untrackedCollision(state, repo, merged, 'merge');
      if (mergeClash) return error(state, mergeClash);
      if (conflicts.length > 0) {
        const lines = conflicts.sort().map((p) => `CONFLICT (content): Merge conflict in ${p}`);
        lines.push('Automatic merge failed; fix conflicts and then commit the result.');
        return done(state, { ...repo, index: indexTree, merging: { other: name, conflicts } }, lines.join('\n'), writeTree(state, repo, oursTree, merged));
      }
      const n = repo.counter + 1;
      const message = `Merge branch '${name}'`;
      const id = hash7(n, message);
      const commit: Commit = { id, parents: [tip, other], message, tree: { ...merged }, n };
      const next: GitRepo = { ...repo, commits: { ...repo.commits, [id]: commit }, branches: { ...repo.branches, [repo.head]: id }, index: { ...merged }, counter: n };
      return done(state, next, "Merge made by the 'ort' strategy.", writeTree(state, repo, oursTree, merged));
    }

    case 'status': {
      const wt = workingTree(state, repo);
      const head = headTree(repo);
      const staged: string[] = [];
      for (const p of Object.keys(repo.index)) {
        if (!(p in head)) staged.push(`  new file: ${p}`);
        else if (head[p] !== repo.index[p]) staged.push(`  modified: ${p}`);
      }
      for (const p of Object.keys(head)) if (!(p in repo.index)) staged.push(`  deleted: ${p}`);
      const unstaged: string[] = [];
      for (const p of Object.keys(repo.index)) {
        if (!(p in wt)) unstaged.push(`  deleted: ${p}`);
        else if (wt[p] !== repo.index[p]) unstaged.push(`  modified: ${p}`);
      }
      const untracked = Object.keys(wt).filter((p) => !(p in repo.index)).map((p) => `  ${p}`);
      const out = [`On branch ${repo.head}`];
      if (repo.merging) out.push('', 'You have unmerged paths.');
      if (staged.length) out.push('', 'Changes to be committed:', ...staged);
      if (unstaged.length) out.push('', 'Changes not staged for commit:', ...unstaged);
      if (untracked.length) out.push('', 'Untracked files:', ...untracked);
      if (!staged.length && !unstaged.length && !untracked.length && !repo.merging) out.push('', 'nothing to commit, working tree clean');
      return done(state, repo, out.join('\n'));
    }

    default:
      return error(state, `git: '${sub}' is not a git command.`);
  }
}

setGitHook(gitRun);
