import type { Progress } from '../engine/types';
import { chapterKey } from '../unlock';

export type Skill = { id: string; label: string; patterns: string[]; chapters: { world: string; chapter: string }[] };
export const MAX_JD = 50000;

// Each row: id, label, patterns (lowercase), chapters as "world/chapter".
const rows: [string, string, string[], string[]][] = [
  ['java', 'Java', ['java', 'spring boot'], ['java/jv-language', 'java/sb-core']],
  ['python', 'Python', ['python', 'django', 'fastapi'], ['python/py-basics', 'backend/be-django']],
  ['javascript', 'JavaScript and Node.js', ['javascript', 'node.js', 'nodejs'], ['javascript/js-basics', 'backend/be-node']],
  ['typescript', 'TypeScript', ['typescript'], ['javascript/ts-basics']],
  ['react', 'React', ['react.js', 'reactjs', 'react apps', 'react native', 'react hooks', 'react developer', 'react engineer', 'react and', 'react,', 'with react', 'in react', 'using react'],['frontend/fe-react-basics', 'frontend/fe-react-hooks']],
  ['go', 'Go', ['golang', 'go developer', 'go engineer', 'in go,', 'go and'], ['backend/be-fundamentals']],
  ['cpp', 'C++', ['c++', 'cpp'], ['cpp/cx-essentials', 'cpp/cx-memory']],
  ['sql', 'SQL and relational databases', ['sql', 'postgresql', 'postgres', 'mysql'], ['sql/asking-questions', 'databases/db-mysql']],
  ['nosql', 'NoSQL databases', ['mongodb', 'dynamodb', 'cassandra', 'nosql'], ['databases/db-documents', 'databases/db-key-value']],
  ['caching', 'Caching and Redis', ['redis', 'caching', 'memcached'], ['backend/be-caching']],
  ['kafka', 'Kafka and messaging', ['kafka', 'event streaming', 'message queue', 'rabbitmq'], ['backend/be-messaging']],
  ['distributed', 'Distributed systems', ['distributed systems', 'scalability', 'high availability'], ['system-design/sd-distributed', 'databases/db-distributed']],
  ['system-design', 'System design', ['system design', 'design scalable', 'software architecture', 'system architecture', 'distributed architecture'], ['system-design/sd-approach', 'system-design/sd-blocks']],
  ['api', 'API design', ['rest api', 'rest apis', 'restful', 'api design', 'graphql', 'grpc'], ['backend/be-api-design', 'backend/be-beyond-rest']],
  ['microservices', 'Microservices', ['microservices', 'service-oriented'], ['backend/be-architecture']],
  ['kubernetes', 'Kubernetes', ['kubernetes', 'k8s'], ['devops/do-k8s-basics', 'devops/do-k8s-advanced']],
  ['docker', 'Containers', ['docker', 'containers'], ['devops/do-containers']],
  ['aws', 'AWS', ['aws', 'amazon web services'], ['cloud/cl-aws']],
  ['gcp', 'Google Cloud', ['gcp', 'google cloud'], ['cloud/cl-gcp']],
  ['azure', 'Azure', ['azure'], ['cloud/cl-azure']],
  ['terraform', 'Infrastructure as code', ['terraform', 'infrastructure as code', 'pulumi'], ['devops/do-iac']],
  ['cicd', 'CI/CD', ['ci/cd', 'continuous integration', 'github actions', 'gitlab ci', 'jenkins'], ['devops/do-pipelines', 'devops/do-cicd']],
  ['observability', 'Observability', ['observability', 'monitoring', 'prometheus', 'grafana', 'splunk', 'datadog'], ['monitoring/ms-foundations', 'monitoring/ms-logs-traces']],
  ['sre', 'Reliability and on-call', ['sre', 'site reliability', 'slo', 'slos', 'on-call', 'incident response', 'incident management'], ['monitoring/ms-slos', 'monitoring/ms-incidents']],
  ['security', 'Application security', ['application security', 'web security', 'secure coding', 'security engineering', 'owasp', 'authentication', 'oauth'], ['security/sec-web', 'security/sec-auth']],
  ['testing', 'Testing', ['unit testing', 'tdd', 'test automation', 'integration tests'], ['backend/be-testing', 'javascript/js-testing']],
  ['algorithms', 'Algorithms and data structures', ['algorithms', 'data structures', 'problem solving'], ['algorithms/al-arrays', 'algorithms/al-graphs']],
  ['concurrency', 'Concurrency', ['concurrency', 'multithreading', 'multi-threaded'], ['cs-fundamentals/cs-concurrency', 'java/jv-concurrency']],
  ['linux', 'Linux and shell', ['linux', 'unix', 'bash', 'shell scripting'], ['devops/do-linux', 'git-shell/shell']],
  ['git', 'Git', ['git', 'version control'], ['git-shell/git']],
  ['llm', 'LLM applications', ['llm', 'llms', 'large language model', 'generative ai', 'genai'], ['ai-engineer/prompting', 'ai-engineer/llm-apps']],
  ['rag', 'Retrieval-augmented generation', ['rag', 'retrieval augmented', 'vector database', 'embeddings'], ['ai-engineer/advanced-rag']],
  ['ml', 'Machine learning', ['machine learning', 'deep learning', 'pytorch', 'tensorflow'], ['ai-engineer/classic-ml', 'ai-engineer/deep-learning']],
  ['agents', 'AI agents', ['ai agents', 'agentic', 'tool use'], ['ai-engineer/agents', 'ai-advanced/aa-tools']],
  ['frontend-perf', 'Web performance', ['web performance', 'core web vitals'], ['frontend/fe-perf']],
  ['accessibility', 'Accessibility', ['accessibility', 'a11y', 'wcag'], ['frontend/fe-a11y']],
  ['css', 'CSS', ['css', 'tailwind', 'sass'], ['frontend/fe-html-css', 'frontend/fe-tailwind']],
  ['nextjs', 'Next.js', ['next.js', 'nextjs'], ['frontend/fe-nextjs']],
  ['mobile', 'Mobile with React Native', ['react native', 'mobile apps'], ['frontend/fe-react-native', 'frontend/fe-react-native-prod']],
  ['payments', 'Payments', ['payments', 'stripe', 'billing', 'fintech'], ['payments/pm-fundamentals', 'payments/pm-stripe']],
  ['agile', 'Agile delivery', ['agile', 'scrum', 'kanban'], ['engineering/eng-agile']],
  ['leadership', 'Technical leadership', ['mentoring', 'mentor', 'technical leadership', 'stakeholders'], ['career/car-teamwork', 'career/car-beyond']],
  ['communication', 'Communication', ['communication skills', 'written communication', 'design docs'], ['career/car-communication', 'engineering/eng-design']],
];

export const SKILLS: Skill[] = rows.map(([id, label, patterns, chapters]) => ({
  id, label, patterns, chapters: chapters.map((c) => { const [world, chapter] = c.split('/'); return { world, chapter }; }),
}));

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A letter, digit, + or # on either side blocks a match, so "java" misses "javascript" and "c++" stays intact.
const RX = new Map(SKILLS.map((s) => [s.id, new RegExp(`(^|[^a-z0-9+#.])(${s.patterns.map(esc).join('|')})($|[^a-z0-9+#])`)]));

export function matchJd(text: string): Skill[] {
  const t = text.slice(0, MAX_JD).toLowerCase().replace(/go-to-market/g, ' ');
  return SKILLS.filter((s) => RX.get(s.id)!.test(t));
}

export const coverage = (s: Skill, p: Progress): number =>
  s.chapters.length ? s.chapters.filter((x) => p.examsPassed[chapterKey(x.world, x.chapter)] !== undefined).length / s.chapters.length : 0;

export function studyPlan(gaps: Skill[], p: Progress) {
  const seen = new Set<string>();
  const out: { day: number; world: string; chapter: string; skill: string }[] = [];
  for (const s of gaps) for (const ch of s.chapters) {
    const k = chapterKey(ch.world, ch.chapter);
    if (out.length >= 10 || seen.has(k) || p.examsPassed[k] !== undefined) continue;
    seen.add(k);
    out.push({ day: out.length + 1, world: ch.world, chapter: ch.chapter, skill: s.label });
  }
  return out;
}
