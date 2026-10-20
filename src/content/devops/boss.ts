import type { Boss } from '../../schema';

export const doBoss: Boss = {
  id: 'do-boss',
  title: 'Ship the Friday hotfix without breaking production',
  steps: [
    {
      kind: 'js-code', id: 'do-boss-1', conceptId: 'do-progressive-delivery', fnName: 'canaryVerdict',
      prompt: 'Automate the canary analysis. Write canaryVerdict(baseline, canary) where each is { requests, errors, p95 }. Return "rollback" if the canary error rate is more than double the baseline error rate plus 0.001, or if the canary p95 is more than 1.2 times the baseline p95; otherwise "promote".',
      starter: 'function canaryVerdict(baseline, canary) {\n  // your code\n}',
      cases: [
        { args: [{ requests: 10000, errors: 20, p95: 300 }, { requests: 500, errors: 1, p95: 310 }], expect: 'promote' },
        { args: [{ requests: 10000, errors: 20, p95: 300 }, { requests: 500, errors: 5, p95: 290 }], expect: 'rollback' },
        { args: [{ requests: 10000, errors: 20, p95: 300 }, { requests: 500, errors: 0, p95: 400 }], expect: 'rollback' },
      ],
      solution: "function canaryVerdict(b,c){const be=b.errors/b.requests,ce=c.errors/c.requests;if(ce>2*be+0.001||c.p95>1.2*b.p95)return 'rollback';return 'promote'}",
      hint: 'Compare error rates (errors / requests) and p95 latency against the thresholds.',
    },
    {
      kind: 'choice', id: 'do-boss-2', conceptId: 'do-terraform-state',
      prompt: 'Two engineers run terraform apply on the same environment at the same time from their laptops. What prevents them corrupting each other\'s changes?',
      options: ['A remote state backend with state locking, and applies run only from CI', 'Committing terraform.tfstate to Git', 'Running terraform fmt first', 'Using more modules'],
      answer: 0,
      explain: 'Remote state with locking serialises applies; running them from one pipeline removes laptop drift.',
    },
    {
      kind: 'order', id: 'do-boss-3', conceptId: 'do-pipeline-design',
      prompt: 'Order the hotfix pipeline.',
      items: ['Branch from the release tag and add a failing test that reproduces the bug', 'Fix, then run lint, unit, and integration tests in CI', 'Build one immutable image and deploy it to staging, then canary in production', 'Promote after canary analysis passes and merge the fix back to main'],
      explain: 'Reproduce, verify, build once, release gradually, and keep main in sync.',
    },
  ],
};
