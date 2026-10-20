// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { startActivityBridge } from './bridge';
import { useStore } from '../engine/store';
import { useCareer } from './store';

const result = { exerciseFirstTry: true, quizCorrect: 1, quizTotal: 1 };

describe('activity bridge', () => {
  beforeEach(() => { localStorage.clear(); useStore.getState().reset(); useCareer.getState().resetCareer(); });
  it('logs one lesson activity per newly completed lesson', () => {
    const stop = startActivityBridge();
    useStore.getState().completeLesson('sql/filtering/l1', result);
    useStore.getState().completeLesson('sql/filtering/l1', result);
    useStore.getState().completeLesson('sql/filtering/l2', result);
    useStore.getState().reset();
    expect(useCareer.getState().data.activity.filter((a) => a.kind === 'lesson')).toHaveLength(2);
    stop();
  });
  it('ignores bulk replacements such as a progress import', () => {
    const stop = startActivityBridge();
    useStore.setState((s) => ({ progress: { ...s.progress, lessonsDone: { 'a/b/c': true, 'a/b/d': true, 'a/b/e': true } } }));
    expect(useCareer.getState().data.activity).toEqual([]);
    stop();
  });
});
