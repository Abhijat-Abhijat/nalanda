import { describe, expect, it } from 'vitest';
import { Lesson } from '../../schema';
import { choice } from '../helpers';
import { deepTopic } from './h';

const sample = deepTopic({
  id: 'l1', key: 'zz-1', title: 'Sample', concept: 'zz-sample',
  story: 'A story.', analogy: 'An analogy.',
  timeline: [['2020', 'Start', 'It began.'], ['2024', 'Now', 'It grew.']],
  explain: 'How it works.', diagram: 'a -> b',
  ex1: ['js', 'one', 'console.log(1)', '1'], ex2: ['js', 'two', 'console.log(2)', '2'],
  deepDive: {
    explain: 'Internals.', example: ['js', 'prod', 'const x = 1;'],
    tradeoffs: [['Option', 'Pro'], ['A', 'fast']],
    failures: [['slow', 'no cache', 'add cache']],
  },
  production: { numbers: '5 ms p50', observe: 'latency', security: 'no secrets', checklist: ['one', 'two'], sources: ['Org, Paper (2024)'] },
  tip: 'A tip.', warn: 'A warning.',
  faq: [['Q?', 'A.']],
  ex: { prompt: 'Add.', fn: 'add', params: 'a, b', cases: [{ args: [1, 2], expect: 3 }], solution: 'function add(a,b){return a+b}', hint: 'Plus.' },
  quiz: [choice('zz-1-q1', 'zz-sample', 'Q?', ['a', 'b'], 0, 'A.'), choice('zz-1-q2', 'zz-sample', 'Q?', ['a', 'b'], 0, 'A.'), choice('zz-1-q3', 'zz-sample', 'Q?', ['a', 'b'], 0, 'A.')],
});

describe('deepTopic', () => {
  it('builds a valid lesson with mental model, deep dive, and production layers', () => {
    expect(Lesson.safeParse(sample).success).toBe(true);
    expect(sample.layers.map((l) => l.title)).toEqual(['Mental model', 'Deep dive', 'In production']);
  });

  it('includes a failure-mode table and a sources list', () => {
    const tables = sample.layers[1].blocks.filter((b) => b.t === 'table');
    expect(tables.some((b) => b.t === 'table' && b.head.join() === 'Symptom,Root cause,Fix')).toBe(true);
    const prod = JSON.stringify(sample.layers[2].blocks);
    expect(prod).toContain('**Sources**');
    expect(prod).toContain('Org, Paper (2024)');
  });
});
