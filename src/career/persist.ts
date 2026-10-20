import { CAREER_KEY, CareerSchema, emptyCareer, type CareerData } from './schema';

export type CareerStatus = 'ok' | 'empty' | 'corrupt' | 'unavailable';

export function loadCareer(storage: Pick<Storage, 'getItem'>): { data: CareerData; status: CareerStatus; raw: string | null } {
  let raw: string | null;
  try { raw = storage.getItem(CAREER_KEY); } catch { return { data: emptyCareer(), status: 'unavailable', raw: null }; }
  if (raw === null) return { data: emptyCareer(), status: 'empty', raw: null };
  const parsed = parseCareerImport(raw);
  return parsed ? { data: parsed, status: 'ok', raw } : { data: emptyCareer(), status: 'corrupt', raw };
}

export function saveCareer(storage: Pick<Storage, 'setItem'>, d: CareerData): boolean {
  try { storage.setItem(CAREER_KEY, JSON.stringify(d)); return true; } catch { return false; }
}

export const exportCareer = (d: CareerData): string => JSON.stringify(d, null, 2);

export function parseCareerImport(text: string): CareerData | null {
  try {
    const r = CareerSchema.safeParse(JSON.parse(text));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}
