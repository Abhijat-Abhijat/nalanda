import { describe, it, expect } from 'vitest';
import { makeState, run, tokenize, resolvePath } from './shell';

const start = () => makeState({
  cwd: '/home/learner',
  files: { '/home/learner/notes.txt': 'hello\nworld\n', '/home/learner/fruits.txt': 'pear\napple\npear\nfig\n' },
  dirs: ['/home/learner/docs'],
});
const exec = (lines: string[]) => lines.reduce((acc, l) => {
  const r = run(acc.state, l);
  return { state: r.state, outs: [...acc.outs, r.out], errs: [...acc.errs, r.err] };
}, { state: start(), outs: [] as string[], errs: [] as string[] });

describe('paths and tokens', () => {
  it('resolves relative paths and never goes above root', () => {
    expect(resolvePath('/home/learner', 'docs')).toBe('/home/learner/docs');
    expect(resolvePath('/home/learner', '../..')).toBe('/');
    expect(resolvePath('/', '../../..')).toBe('/');
    expect(resolvePath('/a/b', '/x/./y/../z')).toBe('/x/z');
  });
  it('tokenizes quotes and operators', () => {
    expect(tokenize(`echo "a b" | sort > out.txt`)).toEqual(['echo', 'a b', '|', 'sort', '>', 'out.txt']);
    expect(tokenize("echo 'x  y'")).toEqual(['echo', 'x  y']);
  });
});

describe('commands', () => {
  it('pwd, ls, cd', () => {
    const r = exec(['pwd', 'ls', 'cd docs', 'pwd', 'cd ..', 'pwd']);
    expect(r.outs[0]).toBe('/home/learner');
    expect(r.outs[1]).toBe('docs/\nfruits.txt\nnotes.txt');
    expect(r.outs[3]).toBe('/home/learner/docs');
    expect(r.outs[5]).toBe('/home/learner');
  });
  it('cd outside the virtual root stays at root', () => {
    const r = exec(['cd ../../../../..', 'pwd']);
    expect(r.outs[1]).toBe('/');
  });
  it('mkdir, touch, echo with redirects, cat', () => {
    const r = exec(['mkdir work', 'touch work/a.txt', 'echo hi > work/b.txt', 'echo more >> work/b.txt', 'cat work/b.txt']);
    expect(r.outs[4]).toBe('hi\nmore');
    expect(r.state.files['/home/learner/work/a.txt']).toBe('');
  });
  it('pipes sort and uniq into a file', () => {
    const r = exec(['cat fruits.txt | sort | uniq > unique.txt', 'cat unique.txt']);
    expect(r.outs[1]).toBe('apple\nfig\npear');
  });
  it('head, wc, grep read stdin or files', () => {
    const r = exec(['head -n 1 fruits.txt', 'cat fruits.txt | wc -l', 'grep -i PEAR fruits.txt', 'cat notes.txt | grep wor']);
    expect(r.outs[0]).toBe('pear');
    expect(r.outs[1]).toBe('4');
    expect(r.outs[2]).toBe('pear\npear');
    expect(r.outs[3]).toBe('world');
  });
  it('rm needs -r for directories and cp/mv move files', () => {
    const r = exec(['rm docs', 'rm -r docs', 'cp notes.txt copy.txt', 'mv copy.txt moved.txt', 'ls']);
    expect(r.errs[0]).toContain('Is a directory');
    expect(r.errs[1]).toBe('');
    expect(r.outs[4]).toBe('fruits.txt\nmoved.txt\nnotes.txt');
  });
});

describe('errors never crash', () => {
  it('handles empty, unknown, and bad paths', () => {
    expect(run(start(), '').err).toBe('');
    expect(run(start(), 'frobnicate').err).toBe('frobnicate: command not found');
    expect(run(start(), 'cd nowhere').err).toBe('cd: no such directory: nowhere');
    expect(run(start(), 'cat nope.txt').err).toBe('cat: nope.txt: No such file or directory');
  });
  it('rm -r / only empties the virtual filesystem and keeps the root', () => {
    const r = run(start(), 'rm -r /');
    expect(r.state.dirs).toContain('/');
    expect(r.state.cwd).toBe('/');
  });
  it('an error in a pipeline stops it and leaves state unchanged', () => {
    const r = run(start(), 'cat nope.txt | sort > out.txt');
    expect(r.err).toContain('No such file');
    expect(r.state.files['/home/learner/out.txt']).toBeUndefined();
  });
  it('treats inherited object property names as unknown commands', () => {
    for (const name of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
      const r = run(start(), name);
      expect(r.err).toBe(`${name}: command not found`);
      expect(r.state.cwd).toBe('/home/learner');
    }
  });
  it('unmatched quotes return an error instead of throwing', () => {
    expect(run(start(), 'echo "oops').err).toBe('syntax error: unmatched quote');
  });
});
