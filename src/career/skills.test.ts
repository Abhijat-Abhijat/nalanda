import { describe, it, expect } from 'vitest';
import { SKILLS, matchJd, coverage, studyPlan, MAX_JD } from './skills';
import { catalog } from '../content/catalog';
import { emptyProgress } from '../engine/progress';

const JD = `Senior Software Engineer (Backend)
You will design scalable distributed systems in Java and Spring Boot, run services on AWS and Kubernetes,
own SLOs and on-call, mentor engineers, and write design docs. Experience with Kafka and PostgreSQL is a plus.`;

describe('skills matcher', () => {
  it('only references real chapters', () => {
    const real = new Set(catalog.flatMap((w) => w.chapters.map((c) => `${w.id}/${c.id}`)));
    expect(SKILLS.length).toBeGreaterThanOrEqual(40);
    for (const s of SKILLS) for (const c of s.chapters) expect([s.id, `${c.world}/${c.chapter}`, real.has(`${c.world}/${c.chapter}`)]).toEqual([s.id, `${c.world}/${c.chapter}`, true]);
  });
  it('detects skills in a realistic job description', () => {
    expect(matchJd(JD).map((s) => s.id)).toEqual(expect.arrayContaining(['java', 'distributed', 'system-design', 'aws', 'kubernetes', 'sre', 'leadership', 'communication', 'kafka', 'sql']));
  });
  it('does not match inside other words', () => {
    const ids = matchJd('We use Javadoc and Reactive streams; join our go-to-market team; knowledge of JavaScript helps.').map((s) => s.id);
    expect(ids).not.toContain('java');
    expect(ids).not.toContain('react');
    expect(ids).not.toContain('go');
    expect(ids).toContain('javascript');
  });
  it('ignores common English phrases that look like skills', () => {
    const ids = matchJd('React quickly to customer feedback, work with the rest of the team in go-live mode, social security benefits included.').map((s) => s.id);
    expect(ids).toEqual([]);
    expect(matchJd('Own the solution architecture and keep the platform incident-free.').map((s) => s.id)).toEqual([]);
    expect(matchJd('Build React apps and REST APIs; strong application security skills').map((s) => s.id)).toEqual(expect.arrayContaining(['react', 'api', 'security']));
  });
  it('handles symbols and very long inputs', () => {
    expect(matchJd('Strong C++ background, Node.js services').map((s) => s.id)).toEqual(expect.arrayContaining(['cpp', 'javascript']));
    const t0 = performance.now();
    matchJd('kafka '.repeat(20000));
    expect(performance.now() - t0).toBeLessThan(500);
    expect(MAX_JD).toBe(50000);
  });
  it('builds a two-week plan from unpassed chapters', () => {
    const gaps = matchJd(JD);
    const progress = { ...emptyProgress(), examsPassed: { 'java/jv-language': 85 } };
    const plan = studyPlan(gaps, progress);
    expect(plan.map((p) => p.day)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(plan.some((p) => p.world === 'java' && p.chapter === 'jv-language')).toBe(false);
    expect(new Set(plan.map((p) => `${p.world}/${p.chapter}`)).size).toBe(10);
    expect(coverage(SKILLS.find((s) => s.id === 'java')!, progress)).toBe(0.5);
  });
});
