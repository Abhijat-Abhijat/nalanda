import { create } from 'zustand';
import { dayKey, addDays } from '../engine/streak';
import { INTERVALS } from '../engine/review';
import { loadCareer, saveCareer, parseCareerImport, type CareerStatus } from './persist';
import { CareerSchema, emptyCareer, type CareerData, type ActivityKind, type RoundResult, type Application, type ProjectStatus, type DeckCard } from './schema';

const storage = (): Storage | null => { try { return window.localStorage; } catch { return null; } };
const today = () => dayKey(new Date());
const s = storage();
const loaded = s ? loadCareer(s) : { data: emptyCareer(), status: 'unavailable' as CareerStatus, raw: null };

type State = {
  data: CareerData; status: CareerStatus; backup: string | null; canSave: boolean;
  saveFailed: boolean; error: string | null;
  setPath: (id: string | null) => void;
  setGoals: (g: CareerData['goals']) => void;
  log: (kind: ActivityKind) => void;
  recordInterview: (r: RoundResult) => void;
  reviewCard: (id: string, correct: boolean) => void;
  markDaily: (day: string, part: 'code' | 'concept') => void;
  upsertApplication: (a: Application) => void;
  removeApplication: (id: string) => void;
  setResume: (r: CareerData['resume']) => void;
  setProjectStatus: (id: string, st: ProjectStatus) => void;
  importCareer: (text: string) => boolean;
  resetCareer: () => void;
};

export const useCareer = create<State>((set, get) => {
  const commit = (next: CareerData) => {
    // Refuse anything the schema would reject on the next load, or the whole store would read as corrupt.
    if (!CareerSchema.safeParse(next).success) {
      set({ error: 'That change could not be saved because a value is out of range.' });
      return;
    }
    set({ data: next, error: null });
    const st = storage();
    if (get().canSave) set({ saveFailed: !(st && saveCareer(st, next)) });
  };
  const upd = (f: (d: CareerData) => CareerData) => commit(f(get().data));
  return {
    data: loaded.data, status: loaded.status, backup: loaded.raw, saveFailed: false, error: null,
    // Corrupt data stays on disk until the learner imports or resets.
    canSave: loaded.status === 'ok' || loaded.status === 'empty',
    setPath: (id) => upd((d) => ({ ...d, pathId: id })),
    setGoals: (g) => upd((d) => ({ ...d, goals: g })),
    log: (kind) => upd((d) => ({ ...d, activity: [...d.activity, { day: today(), kind }].slice(-5000) })),
    recordInterview: (r) => upd((d) => ({ ...d, interviews: [...d.interviews, r].slice(-200) })),
    reviewCard: (id, correct) => upd((d) => {
      const cur = d.deck.find((c) => c.id === id);
      const box = (correct ? Math.min(4, (cur?.box ?? 1) + 1) : 1) as DeckCard['box'];
      const card: DeckCard = { id, box, due: addDays(today(), INTERVALS[box - 1]) };
      return { ...d, deck: cur ? d.deck.map((c) => (c.id === id ? card : c)) : [...d.deck, card] };
    }),
    markDaily: (day, part) => upd((d) => {
      const prev = d.dailyDone[day] ?? { code: false, concept: false };
      return { ...d, dailyDone: { ...d.dailyDone, [day]: { ...prev, [part]: true } } };
    }),
    upsertApplication: (a) => upd((d) => ({
      ...d,
      applications: d.applications.some((x) => x.id === a.id) ? d.applications.map((x) => (x.id === a.id ? a : x)) : [...d.applications, a],
    })),
    removeApplication: (id) => upd((d) => ({ ...d, applications: d.applications.filter((x) => x.id !== id) })),
    setResume: (r) => upd((d) => ({ ...d, resume: r })),
    setProjectStatus: (id, st) => upd((d) => ({ ...d, projects: { ...d.projects, [id]: st } })),
    importCareer: (text) => {
      const p = parseCareerImport(text);
      if (!p) return false;
      set({ canSave: true, status: 'ok', backup: null });
      commit(p);
      return true;
    },
    resetCareer: () => { set({ canSave: true, status: 'ok', backup: null }); commit(emptyCareer()); },
  };
});
