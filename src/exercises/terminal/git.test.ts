import { describe, it, expect } from 'vitest';
import { makeState, run } from './shell';
import { isClean, headTree, type GitRepo } from './git';

const fresh = () => makeState({ cwd: '/home/learner/proj', files: { '/home/learner/proj/a.txt': 'one' }, dirs: [] });
const go = (lines: string[], s = fresh()) => lines.reduce((acc, l) => {
  const r = run(acc.state, l);
  return { state: r.state, outs: [...acc.outs, r.out], errs: [...acc.errs, r.err] };
}, { state: s, outs: [] as string[], errs: [] as string[] });
const repo = (s: ReturnType<typeof fresh>) => s.git as GitRepo;

describe('git basics', () => {
  it('rejects git commands outside a repository', () => {
    expect(go(['git status']).errs[0]).toBe('fatal: not a git repository');
  });
  it('init, add, commit, log', () => {
    const r = go(['git init', 'git add a.txt', 'git commit -m "first"', 'git log --oneline']);
    expect(r.outs[0]).toContain('Initialized empty Git repository');
    expect(r.outs[3]).toMatch(/^[0-9a-f]{7} first$/);
    expect(isClean(r.state)).toBe(true);
  });
  it('commit with nothing staged and without a message fail clearly', () => {
    const r = go(['git init', 'git commit -m "x"', 'git add a.txt', 'git commit']);
    expect(r.errs[1]).toBe('nothing to commit, working tree clean');
    expect(r.errs[3]).toBe("error: switch 'm' requires a value");
  });
  it('status reports untracked, staged, and modified files', () => {
    const r = go(['git init', 'git status', 'git add a.txt', 'git status', 'git commit -m "m"', 'echo two > a.txt', 'git status']);
    expect(r.outs[1]).toContain('Untracked files');
    expect(r.outs[3]).toContain('Changes to be committed');
    expect(r.outs[6]).toContain('Changes not staged for commit');
  });
  it('unknown subcommands error without crashing', () => {
    expect(go(['git init', 'git frobnicate']).errs[1]).toBe("git: 'frobnicate' is not a git command.");
  });
  it('add of a missing path errors', () => {
    expect(go(['git init', 'git add nope.txt']).errs[1]).toBe("fatal: pathspec 'nope.txt' did not match any files");
  });
});

describe('branches', () => {
  const base = ['git init', 'git add .', 'git commit -m "base"'];
  it('creates, lists, and switches branches', () => {
    const r = go([...base, 'git branch feature', 'git branch', 'git switch feature']);
    expect(r.outs[4]).toBe('  feature\n* main');
    expect(repo(r.state).head).toBe('feature');
  });
  it('checkout -b creates and switches, and files follow the branch', () => {
    const r = go([...base, 'git checkout -b feature', 'echo x > f.txt', 'git add f.txt', 'git commit -m "add f"', 'git checkout main', 'ls']);
    expect(r.outs[8]).toBe('a.txt');
  });
  it('refuses to switch with uncommitted changes to tracked files', () => {
    const r = go([...base, 'git branch other', 'echo changed > a.txt', 'git switch other']);
    expect(r.errs[5]).toBe('error: commit or stash your changes before switching branches.');
  });
  it('unknown and duplicate branch names are rejected', () => {
    const r = go([...base, 'git switch nope', 'git branch main']);
    expect(r.errs[3]).toBe('fatal: invalid reference: nope');
    expect(r.errs[4]).toBe("fatal: a branch named 'main' already exists");
  });
  it('creating a branch before the first commit errors', () => {
    expect(go(['git init', 'git branch x']).errs[1]).toBe("fatal: not a valid object name: 'main'");
  });
});

describe('safety', () => {
  const base = ['git init', 'git add .', 'git commit -m "base"'];
  const withF = [...base, 'git checkout -b f', 'echo x > f.txt', 'git add f.txt', 'git commit -m "f"', 'git checkout main'];
  it('refuses to merge over uncommitted changes to tracked files', () => {
    const r = go([...withF, 'echo changed > a.txt', 'git merge f']);
    expect(r.errs[r.errs.length - 1]).toBe('error: commit or stash your changes before merging.');
    expect(r.state.files['/home/learner/proj/a.txt']).toBe('changed');
  });
  it('refuses to start a merge while another is unfinished', () => {
    const conflict = [...base, 'git checkout -b f', 'echo theirs > a.txt', 'git add a.txt', 'git commit -m "t"',
      'git checkout main', 'echo ours > a.txt', 'git add a.txt', 'git commit -m "o"', 'git merge f', 'git merge f'];
    const r = go(conflict);
    expect(r.errs[r.errs.length - 1]).toBe('fatal: You have not concluded your merge. Commit your fix first.');
  });
  it('refuses to switch branches over an untracked file that would be overwritten', () => {
    const r = go([...withF, 'echo mine > f.txt', 'git checkout f']);
    expect(r.errs[r.errs.length - 1]).toBe('error: The untracked file f.txt would be overwritten by checkout.');
    expect(r.state.files['/home/learner/proj/f.txt']).toBe('mine');
  });
  it('refuses a merge that would overwrite an untracked file', () => {
    const r = go([...withF, 'echo mine > f.txt', 'git merge f']);
    expect(r.errs[r.errs.length - 1]).toBe('error: The untracked file f.txt would be overwritten by merge.');
    expect(r.state.files['/home/learner/proj/f.txt']).toBe('mine');
  });
});

describe('merge', () => {
  const base = ['git init', 'git add .', 'git commit -m "base"'];
  it('fast-forwards', () => {
    const r = go([...base, 'git checkout -b f', 'echo x > f.txt', 'git add f.txt', 'git commit -m "f"', 'git checkout main', 'git merge f', 'ls']);
    expect(r.outs[8]).toContain('Fast-forward');
    expect(r.outs[9]).toBe('a.txt\nf.txt');
  });
  it('says already up to date', () => {
    const r = go([...base, 'git branch f', 'git merge f']);
    expect(r.outs[4]).toBe('Already up to date.');
  });
  it('three-way merges without conflicts and records two parents', () => {
    const r = go([...base, 'git checkout -b f', 'echo x > f.txt', 'git add f.txt', 'git commit -m "f"', 'git checkout main', 'echo y > m.txt', 'git add m.txt', 'git commit -m "m"', 'git merge f']);
    const rep = repo(r.state);
    const head = rep.commits[rep.branches.main!];
    expect(head.parents).toHaveLength(2);
    expect(head.message).toBe("Merge branch 'f'");
    expect(headTree(rep)).toMatchObject({ 'a.txt': 'one', 'f.txt': 'x', 'm.txt': 'y' });
  });
  it('reports a conflict, then resolves it', () => {
    const r = go([
      ...base, 'git checkout -b f', 'echo theirs > a.txt', 'git add a.txt', 'git commit -m "t"',
      'git checkout main', 'echo ours > a.txt', 'git add a.txt', 'git commit -m "o"', 'git merge f',
      'git commit -m "too early"', 'echo final > a.txt', 'git add a.txt', 'git commit -m "resolved"',
    ]);
    expect(r.outs[11]).toContain('CONFLICT (content): Merge conflict in a.txt');
    expect(r.errs[12]).toBe('error: Committing is not possible because you have unmerged files.');
    const rep = repo(r.state);
    expect(rep.merging).toBeNull();
    expect(rep.commits[rep.branches.main!].parents).toHaveLength(2);
    expect(r.state.files['/home/learner/proj/a.txt']).toBe('final');
    expect(isClean(r.state)).toBe(true);
  });
  it('writes conflict markers into the file', () => {
    const r = go([...base, 'git checkout -b f', 'echo theirs > a.txt', 'git add a.txt', 'git commit -m "t"', 'git checkout main', 'echo ours > a.txt', 'git add a.txt', 'git commit -m "o"', 'git merge f']);
    expect(r.state.files['/home/learner/proj/a.txt']).toBe('<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> f');
  });
});
