import { create } from 'zustand';
import { dayKey } from './streak';
import { loadProgress, saveProgress, parseImport, type LoadStatus } from './persistence';
import { emptyProgress, applyAnswer, applyAttempt, applyCompleteLesson, applyExamPass, applyBossPass, applyReview } from './progress';
import type { Progress } from './types';

const storage = (): Storage | null => { try { return window.localStorage; } catch { return null; } };
const today = () => dayKey(new Date());

type LessonResult = { exerciseFirstTry: boolean; quizCorrect: number; quizTotal: number };
type State = {
  progress: Progress; status: LoadStatus; backup: string | null; canSave: boolean; saveFailed: boolean;
  answer: (conceptId: string, correct: boolean) => void;
  review: (conceptId: string, correct: boolean) => void;
  attempt: (exerciseId: string) => void;
  completeLesson: (key: string, r: LessonResult) => void;
  passExam: (key: string, pct: number) => void;
  passBoss: (worldId: string) => void;
  importProgress: (text: string) => boolean;
  reset: () => void;
};

const s = storage();
const loaded = s ? loadProgress(s) : { progress: emptyProgress(), status: 'unavailable' as LoadStatus, raw: null };
// Never overwrite stored data we could not read: corrupt or newer data stays untouched until the learner imports or resets.
const initialCanSave = loaded.status === 'ok' || loaded.status === 'empty';

export const useStore = create<State>((set, get) => {
  const commit = (next: Progress) => {
    set({ progress: next });
    const st = storage();
    if (get().canSave && st) {
      const saved = saveProgress(st, next);
      if (get().saveFailed === saved) set({ saveFailed: !saved });
    }
  };
  return {
    progress: loaded.progress, status: loaded.status, backup: loaded.raw, canSave: initialCanSave, saveFailed: false,
    answer: (c, ok) => commit(applyAnswer(get().progress, c, ok, today())),
    review: (c, ok) => commit(applyReview(get().progress, c, ok, today())),
    attempt: (id) => commit(applyAttempt(get().progress, id)),
    completeLesson: (key, r) => commit(applyCompleteLesson(get().progress, key, r, today())),
    passExam: (key, pct) => commit(applyExamPass(get().progress, key, pct, today())),
    passBoss: (w) => commit(applyBossPass(get().progress, w, today())),
    importProgress: (text) => {
      const p = parseImport(text);
      if (!p) return false;
      set({ canSave: true, status: 'ok' });
      commit(p);
      return true;
    },
    reset: () => { set({ canSave: true, status: 'ok', backup: null }); commit(emptyProgress()); },
  };
});
