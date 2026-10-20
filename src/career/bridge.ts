import { useStore } from '../engine/store';
import { useCareer } from './store';

// Lessons are completed in the main progress store; mirror them into career activity for weekly goals.
export function startActivityBridge(): () => void {
  let known = new Set(Object.keys(useStore.getState().progress.lessonsDone));
  return useStore.subscribe((s) => {
    const keys = Object.keys(s.progress.lessonsDone);
    const added = keys.filter((k) => !known.has(k)).length;
    // Lessons finish one at a time; a bigger jump is an import or reset, not study done today.
    if (added === 1) useCareer.getState().log('lesson');
    known = new Set(keys);
  });
}
