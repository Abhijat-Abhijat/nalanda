import { describe, it, expect } from 'vitest';
import { loadProgress, saveProgress, exportJson, parseImport, STORAGE_KEY } from './persistence';
import { emptyProgress } from './progress';

const mem = (initial?: string) => {
  let v = initial ?? null;
  return {
    getItem: (k: string) => (k === STORAGE_KEY ? v : null),
    setItem: (_k: string, val: string) => { v = val; },
    get value() { return v; },
  };
};

describe('persistence', () => {
  it('returns empty progress when nothing is stored', () => {
    const r = loadProgress(mem());
    expect(r.status).toBe('empty');
    expect(r.progress).toEqual(emptyProgress());
  });
  it('round-trips progress', () => {
    const s = mem();
    const p = { ...emptyProgress(), xp: 120 };
    expect(saveProgress(s, p)).toBe(true);
    const r = loadProgress(s);
    expect(r.status).toBe('ok');
    expect(r.progress.xp).toBe(120);
  });
  it('flags corrupt json and keeps the raw text for backup', () => {
    const r = loadProgress(mem('{not json'));
    expect(r.status).toBe('corrupt');
    expect(r.raw).toBe('{not json');
    expect(r.progress).toEqual(emptyProgress());
  });
  it('flags data that fails validation as corrupt', () => {
    expect(loadProgress(mem(JSON.stringify({ version: 1, xp: 'lots' }))).status).toBe('corrupt');
  });
  it('flags a newer version without discarding it', () => {
    const raw = JSON.stringify({ version: 2, xp: 5 });
    const r = loadProgress(mem(raw));
    expect(r.status).toBe('newer');
    expect(r.raw).toBe(raw);
  });
  it('reports unavailable storage when getItem throws', () => {
    const r = loadProgress({ getItem: () => { throw new Error('denied'); } });
    expect(r.status).toBe('unavailable');
  });
  it('saveProgress returns false instead of throwing', () => {
    expect(saveProgress({ setItem: () => { throw new Error('quota'); } }, emptyProgress())).toBe(false);
  });
  it('export and import round-trip, and bad imports return null', () => {
    const p = { ...emptyProgress(), xp: 77 };
    expect(parseImport(exportJson(p))?.xp).toBe(77);
    expect(parseImport('nope')).toBeNull();
    expect(parseImport('{"version":1}')).toBeNull();
  });
});
