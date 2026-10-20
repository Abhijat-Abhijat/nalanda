// localStorage wrapper that never throws (private mode, blocked storage, quota).
export const codeStore = {
  get(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* storage unavailable: keep in memory only */ } },
  remove(key: string) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};
