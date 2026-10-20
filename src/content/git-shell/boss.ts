import type { Boss } from '../../schema';

const proj = '/home/learner/proj';

export const gitShellBoss: Boss = {
  id: 'git-boss',
  title: 'Repair the repository',
  steps: [
    {
      kind: 'terminal', id: 'git-boss-0', conceptId: 'pipes',
      prompt: 'The server log is noisy. Save every line that contains ERROR (exact case), sorted and with duplicates removed, into errors.txt.',
      initial: { cwd: proj, files: { [`${proj}/server.log`]: 'INFO boot\nERROR db timeout\nINFO request\nERROR disk full\nERROR db timeout' }, dirs: [] },
      checks: [{ type: 'file-equals', path: `${proj}/errors.txt`, equals: 'ERROR db timeout\nERROR disk full' }],
      solution: ['grep ERROR server.log | sort | uniq > errors.txt'],
      hint: 'grep, then sort, then uniq, then redirect with >.',
    },
    {
      kind: 'terminal', id: 'git-boss-1', conceptId: 'git-branch',
      prompt: 'Create a branch called fix, change app.txt to v2 and commit it with the message v2, then go back to main.',
      initial: { cwd: proj, files: { [`${proj}/app.txt`]: 'v1' }, dirs: [], setup: ['git init', 'git add .', 'git commit -m "v1"'] },
      checks: [{ type: 'git-branch', name: 'main' }, { type: 'git-log-contains', text: 'v2' }, { type: 'git-clean' }],
      solution: ['git checkout -b fix', 'echo v2 > app.txt', 'git add app.txt', 'git commit -m "v2"', 'git checkout main'],
      hint: 'Branch with git checkout -b fix, change and commit the file, then git checkout main.',
    },
    {
      kind: 'terminal', id: 'git-boss-2', conceptId: 'git-merge',
      prompt: 'A merge stopped on a conflict in app.txt. Resolve it so the file says final, then finish the merge.',
      initial: {
        cwd: proj, files: { [`${proj}/app.txt`]: 'v1' }, dirs: [],
        setup: ['git init', 'git add .', 'git commit -m "base"', 'git checkout -b f', 'echo theirs > app.txt', 'git add app.txt', 'git commit -m "theirs"', 'git checkout main', 'echo ours > app.txt', 'git add app.txt', 'git commit -m "ours"', 'git merge f'],
      },
      checks: [{ type: 'file-equals', path: `${proj}/app.txt`, equals: 'final' }, { type: 'git-clean' }, { type: 'git-head-parents', count: 2 }],
      solution: ['echo final > app.txt', 'git add app.txt', 'git commit -m "resolved"'],
      hint: 'Overwrite app.txt with the text you want, stage it with git add, then commit.',
    },
  ],
};
