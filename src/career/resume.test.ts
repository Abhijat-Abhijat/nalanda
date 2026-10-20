import { describe, it, expect } from 'vitest';
import { lintBullet, resumeMarkdown } from './resume';

describe('resume linter', () => {
  it('accepts a strong, measured bullet', () => {
    expect(lintBullet('Cut checkout p99 latency from 1.8 s to 420 ms by moving pricing to a cached read model, lifting conversion 3.1%.')).toEqual([]);
  });
  it('flags placeholders, missing numbers, weak starts, length, and first person', () => {
    expect(lintBullet('Built a cache serving [N] ops/s for the platform team')).toContain('placeholder');
    expect(lintBullet('Responsible for the payments service and its on-call rotation')).toEqual(expect.arrayContaining(['weak-start', 'no-number']));
    expect(lintBullet('Did stuff 1')).toContain('too-short');
    expect(lintBullet('x'.repeat(230) + ' 5')).toContain('too-long');
    expect(lintBullet('I improved deploy frequency from weekly to 20 times a day for my team')).toContain('first-person');
  });
  it('does not flag words that contain I, me, or my', () => {
    expect(lintBullet('Improved memory usage in mypy-checked services by 40% across 12 repositories')).not.toContain('first-person');
  });
  it('renders Markdown with only non-empty bullets', () => {
    const md = resumeMarkdown({ name: 'Asha Rao', headline: 'Senior backend engineer', summary: '11 years building APIs.', bullets: [{ id: '1', text: 'Shipped X with 30% gain', projectId: null }, { id: '2', text: '  ', projectId: null }], skills: ['Go', 'Kafka'] });
    expect(md).toBe('# Asha Rao\n\nSenior backend engineer\n\n11 years building APIs.\n\n## Highlights\n\n- Shipped X with 30% gain\n\n## Skills\n\nGo, Kafka\n');
  });
});
