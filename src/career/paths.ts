import type { Progress } from '../engine/types';
import type { CareerData } from './schema';
import { chapterKey } from '../unlock';

export const TEMPLATE_IDS =['coding-45', 'phone-screen', 'onsite-senior', 'design-60', 'behavioural-30'] as const;
export const DECK_ROLES = ['backend', 'frontend', 'system-design', 'behavioural', 'ai', 'devops'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];
export type DeckRole = (typeof DECK_ROLES)[number];

export type PathStep =
  | { kind: 'chapter'; world: string; chapter: string }
  | { kind: 'world'; world: string }
  | { kind: 'project'; project: string }
  | { kind: 'interview'; template: TemplateId; times: number }
  | { kind: 'deck'; role: DeckRole };
export type CareerPath = {
  id: string; title: string; role: string; level: 'Mid' | 'Senior' | 'Staff'; summary: string;
  stages: { title: string; steps: PathStep[] }[];
};

const ch = (world: string, ...ids: string[]): PathStep[] => ids.map((chapter) => ({ kind: 'chapter', world, chapter }));
const coding = ch('algorithms', 'al-arrays', 'al-two-pointers', 'al-sliding-window', 'al-stack', 'al-binary-search', 'al-linked-list', 'al-trees', 'al-heap', 'al-graphs', 'al-dp-1d', 'al-intervals');
const design = ch('system-design', 'sd-approach', 'sd-blocks', 'sd-storage', 'sd-distributed', 'sd-async', 'sd-case-social', 'sd-case-search', 'sd-case-payments');
const behaviour: PathStep[] = [...ch('career', 'car-communication', 'car-teamwork', 'car-coding', 'car-beyond'), { kind: 'deck', role: 'behavioural' }];
const project = (id: string): PathStep => ({ kind: 'project', project: id });
const rounds = (template: TemplateId, times: number): PathStep => ({ kind: 'interview', template, times });
const deck = (role: DeckRole): PathStep => ({ kind: 'deck', role });

export const PATHS: CareerPath[] = [
  {
    id: 'backend-senior', title: 'Backend engineer, senior level', role: 'Backend engineer', level: 'Senior',
    summary: 'APIs, data, reliability, and distributed systems at the depth senior backend interviews expect.',
    stages: [
      { title: 'Core backend', steps: [...ch('backend', 'be-fundamentals', 'be-api-design', 'be-data-access', 'be-auth', 'be-caching', 'be-messaging', 'be-reliability', 'be-testing'), ...ch('databases', 'db-internals', 'db-distributed', 'db-mysql')] },
      { title: 'Production depth', steps: [...ch('backend', 'be-production', 'be-security'), ...ch('monitoring', 'ms-slos', 'ms-incidents'), project('rate-limiter'), project('job-scheduler')] },
      { title: 'Coding interviews', steps: [...coding, rounds('coding-45', 3)] },
      { title: 'Design and behavioural', steps: [...design, ...behaviour, deck('backend'), deck('system-design')] },
      { title: 'Interview ready', steps: [rounds('onsite-senior', 2), rounds('design-60', 2)] },
    ],
  },
  {
    id: 'frontend-senior', title: 'Frontend engineer, senior level', role: 'Frontend engineer', level: 'Senior',
    summary: 'React, performance, accessibility, and frontend architecture for senior frontend loops.',
    stages: [
      { title: 'Core frontend', steps: [...ch('javascript', 'js-functions', 'js-async', 'js-dom', 'ts-basics', 'ts-advanced'), ...ch('frontend', 'fe-react-basics', 'fe-react-hooks', 'fe-react-patterns', 'fe-state-data')] },
      { title: 'Senior depth', steps: [...ch('frontend', 'fe-perf', 'fe-a11y', 'fe-security', 'fe-architecture', 'fe-nextjs', 'fe-tailwind'), project('web-perf'), project('collab-editor')] },
      { title: 'Coding interviews', steps: [...ch('javascript', 'js-interview'), ...ch('frontend', 'fe-interview'), ...coding.slice(0, 7), rounds('coding-45', 3)] },
      { title: 'Design and behavioural', steps: [...design.slice(0, 4), ...behaviour, deck('frontend')] },
      { title: 'Interview ready', steps: [rounds('onsite-senior', 2)] },
    ],
  },
  {
    id: 'fullstack-mid', title: 'Full-stack engineer, mid level', role: 'Full-stack engineer', level: 'Mid',
    summary: 'A balanced route through web, backend, databases, and core interview skills.',
    stages: [
      { title: 'Foundations', steps: [...ch('http-web', 'web-arrives', 'talking-properly', 'apis'), ...ch('sql', 'asking-questions', 'combining-tables', 'designing-tables'), ...ch('git-shell', 'git', 'branching', 'collaboration')] },
      { title: 'Build', steps: [...ch('frontend', 'fe-react-basics', 'fe-react-hooks'), ...ch('backend', 'be-fundamentals', 'be-api-design', 'be-auth', 'be-testing'), project('issue-tracker')] },
      { title: 'Coding interviews', steps: [...coding.slice(0, 8), rounds('phone-screen', 3)] },
      { title: 'Interview ready', steps: [...ch('system-design', 'sd-approach', 'sd-blocks'), ...behaviour, rounds('coding-45', 2)] },
    ],
  },
  {
    id: 'sre-devops', title: 'SRE or DevOps engineer', role: 'Site reliability engineer', level: 'Senior',
    summary: 'Linux, networking, Kubernetes, CI/CD, observability, and incident response.',
    stages: [
      { title: 'Platform foundations', steps: ch('devops', 'do-linux', 'do-networking', 'do-containers', 'do-k8s-basics', 'do-k8s-advanced', 'do-cicd', 'do-pipelines', 'do-iac') },
      { title: 'Reliability', steps: [...ch('monitoring', 'ms-foundations', 'ms-prometheus', 'ms-logs-traces', 'ms-slos', 'ms-incidents', 'ms-capacity'), ...ch('cloud', 'cl-reliability', 'cl-security'), project('sre-toolkit'), project('multi-region')] },
      { title: 'Interview skills', steps: [...coding.slice(0, 6), ...design.slice(0, 5), deck('devops'), rounds('phone-screen', 2)] },
      { title: 'Interview ready', steps: [...behaviour, rounds('design-60', 2)] },
    ],
  },
  {
    id: 'ai-engineer', title: 'AI engineer', role: 'AI engineer', level: 'Senior',
    summary: 'LLM applications, RAG, agents, evaluation, and production AI systems.',
    stages: [
      { title: 'Foundations', steps: ch('ai-engineer', 'what-is-a-model', 'transformers', 'prompting', 'advanced-rag', 'agents', 'llm-apps') },
      { title: 'Production AI', steps: [...ch('ai-advanced', 'aa-context', 'aa-tools', 'aa-evals', 'aa-security', 'aa-production', 'aa-llmops'), ...ch('ai-engineer', 'ai-system-design', 'mlops'), project('rag-platform'), project('llm-gateway')] },
      { title: 'Interview skills', steps: [...coding.slice(0, 7), ...design.slice(0, 4), deck('ai'), rounds('coding-45', 2)] },
      { title: 'Interview ready', steps: [...behaviour, rounds('design-60', 2)] },
    ],
  },
  {
    id: 'staff-generalist', title: 'Staff engineer at a large tech company', role: 'Staff software engineer', level: 'Staff',
    summary: 'For experienced engineers (around ten years or more) targeting staff roles: deep design, cross-team influence, and evidence.',
    stages: [
      { title: 'Design depth', steps: [...design, ...ch('system-design', 'sd-case-storage', 'sd-case-geo'), ...ch('databases', 'db-internals', 'db-distributed'), ...ch('cs-fundamentals', 'cs-concurrency', 'cs-os')] },
      { title: 'Engineering leadership', steps: [...ch('engineering', 'eng-design', 'eng-review', 'eng-codebases', 'eng-agile'), ...ch('career', 'car-communication', 'car-teamwork', 'car-beyond')] },
      { title: 'Evidence', steps: [project('raft-kv'), project('zero-trust-authz'), project('open-source')] },
      { title: 'Coding stays sharp', steps: [...coding, rounds('coding-45', 3)] },
      { title: 'Interview ready', steps: [deck('system-design'), deck('behavioural'), rounds('design-60', 3), rounds('onsite-senior', 2)] },
    ],
  },
];

export type PathContext = { progress: Progress; career: CareerData; deckCardsByRole: Record<string, string[]> };

export function stepDone(s: PathStep, ctx: PathContext): boolean {
  switch (s.kind) {
    case 'chapter': return ctx.progress.examsPassed[chapterKey(s.world, s.chapter)] !== undefined;
    case 'world': return !!ctx.progress.bossesPassed[s.world];
    case 'project': return ctx.career.projects[s.project] === 'shipped';
    case 'interview': return ctx.career.interviews.filter((r) => r.template === s.template && r.score >= 70).length >= s.times;
    case 'deck': {
      const ids = ctx.deckCardsByRole[s.role] ?? [];
      const box = new Map(ctx.career.deck.map((c) => [c.id, c.box]));
      return ids.length > 0 && ids.every((id) => (box.get(id) ?? 0) >= 3);
    }
  }
}

export function pathProgress(path: CareerPath, ctx: PathContext) {
  let done = 0, total = 0;
  let next: { stage: number; step: PathStep } | null = null;
  const stages = path.stages.map((st, i) => {
    let d = 0;
    for (const s of st.steps) {
      if (stepDone(s, ctx)) d++;
      else next ??= { stage: i, step: s };
    }
    done += d;
    total += st.steps.length;
    return { done: d, total: st.steps.length };
  });
  // The cast undoes TypeScript narrowing `next` to null: it is only assigned inside the map callback.
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, next: next as { stage: number; step: PathStep } | null, stages };
}
