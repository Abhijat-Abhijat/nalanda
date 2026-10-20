import type { Check, TerminalEx } from '../../schema';
import { makeState, run, type FsState } from './shell';
import { isClean, type GitRepo } from './git';

export function buildState(ex: TerminalEx): FsState {
  let state = makeState(ex.initial);
  for (const cmd of ex.initial.setup ?? []) state = run(state, cmd).state;
  return state;
}

export function replay(ex: TerminalEx, commands: string[]) {
  let state = buildState(ex);
  const outputs: string[] = [];
  for (const c of commands) {
    const r = run(state, c);
    state = r.state;
    outputs.push(r.out || r.err);
  }
  return { state, outputs };
}

function holds(c: Check, s: FsState, outputs: string[]): boolean {
  const repo = s.git as GitRepo | null;
  switch (c.type) {
    case 'cwd': return s.cwd === c.equals;
    case 'file-equals': return s.files[c.path] === c.equals;
    case 'file-contains': return (s.files[c.path] ?? '').includes(c.contains);
    case 'exists': return c.path in s.files || s.dirs.includes(c.path);
    case 'not-exists': return !(c.path in s.files) && !s.dirs.includes(c.path);
    case 'out-contains': return outputs.some((o) => o.includes(c.text));
    case 'git-init': return repo !== null;
    case 'git-branch': return repo?.head === c.name;
    case 'git-commits': return repo !== null && Object.keys(repo.commits).length >= c.min;
    case 'git-clean': return repo !== null && isClean(s);
    case 'git-log-contains': return repo !== null && Object.values(repo.commits).some((k) => k.message.includes(c.text));
    case 'git-head-parents': {
      const tip = repo?.branches[repo.head];
      return !!repo && !!tip && repo.commits[tip].parents.length === c.count;
    }
  }
}

export function evaluateChecks(checks: Check[], state: FsState, outputs: string[]) {
  const failed = checks.filter((c) => !holds(c, state, outputs));
  return { passed: failed.length === 0, failed };
}

export function checkTerminal(ex: TerminalEx, commands: string[]) {
  const { state, outputs } = replay(ex, commands);
  return evaluateChecks(ex.checks, state, outputs);
}

export function describeCheck(c: Check): string {
  switch (c.type) {
    case 'cwd': return `End in the folder ${c.equals}.`;
    case 'file-equals': return `Make ${c.path} contain exactly "${c.equals}".`;
    case 'file-contains': return `Make ${c.path} contain "${c.contains}".`;
    case 'exists': return `Make sure ${c.path} exists.`;
    case 'not-exists': return `Make sure ${c.path} does not exist.`;
    case 'out-contains': return `Run a command whose output shows "${c.text}".`;
    case 'git-init': return 'Create a git repository.';
    case 'git-branch': return `Be on the branch ${c.name}.`;
    case 'git-commits': return `Make at least ${c.min} ${c.min === 1 ? 'commit' : 'commits'}.`;
    case 'git-clean': return 'Leave no uncommitted changes.';
    case 'git-log-contains': return `Have a commit message that contains "${c.text}".`;
    case 'git-head-parents': return c.count === 2 ? 'Finish with a merge commit.' : `Make the latest commit have ${c.count} parents.`;
  }
}
