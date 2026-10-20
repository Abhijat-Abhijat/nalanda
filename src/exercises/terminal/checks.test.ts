import { describe, it, expect } from 'vitest';
import { buildState, replay, checkTerminal } from './checks';
import type { TerminalEx } from '../../schema';

const base = { kind: 'terminal' as const, id: 't1', conceptId: 'c', prompt: 'p', hint: 'h' };

describe('terminal checks', () => {
  it('builds state from initial and setup commands', () => {
    const ex: TerminalEx = { ...base, initial: { cwd: '/w', files: { '/w/a.txt': 'x' }, dirs: [], setup: ['git init', 'git add .', 'git commit -m "s"'] },
      checks: [{ type: 'git-commits', min: 1 }], solution: ['ls'] };
    expect(checkTerminal(ex, ['ls']).passed).toBe(true);
    expect(buildState(ex).git).not.toBeNull();
  });
  it('cwd, file, exists, not-exists, and out-contains checks', () => {
    const ex: TerminalEx = { ...base, initial: { cwd: '/w', files: { '/w/a.txt': 'x' }, dirs: ['/w/d'] },
      checks: [{ type: 'cwd', equals: '/w/d' }, { type: 'file-equals', path: '/w/n.txt', equals: 'hi' }, { type: 'exists', path: '/w/a.txt' }, { type: 'not-exists', path: '/w/zzz' }, { type: 'out-contains', text: 'a.txt' }],
      solution: [] };
    expect(checkTerminal(ex, ['ls', 'echo hi > n.txt', 'cd d']).passed).toBe(true);
  });
  it('reports which checks failed', () => {
    const ex: TerminalEx = { ...base, initial: { cwd: '/w', files: {}, dirs: [] }, checks: [{ type: 'cwd', equals: '/nope' }], solution: ['pwd'] };
    const r = checkTerminal(ex, ['pwd']);
    expect(r.passed).toBe(false);
    expect(r.failed).toEqual([{ type: 'cwd', equals: '/nope' }]);
  });
  it('git checks cover init, branch, log, clean, and head parents', () => {
    const ex: TerminalEx = { ...base, initial: { cwd: '/w', files: { '/w/a.txt': 'x' }, dirs: [] },
      checks: [{ type: 'git-init' }, { type: 'git-branch', name: 'main' }, { type: 'git-log-contains', text: 'first' }, { type: 'git-clean' }, { type: 'git-head-parents', count: 0 }],
      solution: ['git init', 'git add .', 'git commit -m "first"'] };
    expect(checkTerminal(ex, ex.solution).passed).toBe(true);
    expect(checkTerminal(ex, ['git init']).passed).toBe(false);
  });
  it('replay keeps outputs for every command', () => {
    const ex: TerminalEx = { ...base, initial: { cwd: '/w', files: { '/w/a.txt': 'x' }, dirs: [] }, checks: [{ type: 'exists', path: '/w/a.txt' }], solution: ['ls'] };
    expect(replay(ex, ['ls', 'pwd']).outputs).toEqual(['a.txt', '/w']);
  });
});
