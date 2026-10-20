import { describe, it, expect } from 'vitest';
import { findQuestionsByConcept, conceptTitle, lessonPathForConcept } from './lookup';
import type { World } from '../schema';

const q = (id: string, conceptId: string) => ({ kind: 'choice' as const, id, conceptId, prompt: 'p', options: ['a', 'b'], answer: 0, explain: 'e' });
const world = {
  id: 'w', chapters: [{ id: 'c', lessons: [{ id: 'l', title: 'Lesson one', conceptIds: ['k1'], exercise: q('ex', 'k1'), quiz: [q('q1', 'k1')] }], exam: [q('e1', 'k1'), q('e2', 'k2')] }],
} as unknown as World;

describe('lookup', () => {
  it('finds quiz, exam, and quiz-kind exercise questions by concept', () => {
    expect(findQuestionsByConcept([world], ['k1']).map((x) => x.id).sort()).toEqual(['e1', 'ex', 'q1']);
  });
  it('returns an empty list for unknown concepts', () => {
    expect(findQuestionsByConcept([world], ['nope'])).toEqual([]);
  });
  it('titles a concept by its lesson, falling back to the id', () => {
    expect(conceptTitle([world], 'k1')).toBe('Lesson one');
    expect(conceptTitle([world], 'zzz')).toBe('zzz');
  });
  it('builds the lesson path for a concept, or the home path', () => {
    expect(lessonPathForConcept([world], 'k1')).toBe('/w/w/c/l');
    expect(lessonPathForConcept([world], 'zzz')).toBe('/');
  });
});
