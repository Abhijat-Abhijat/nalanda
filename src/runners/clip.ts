export const clip = (s: string, limit = 100_000) => (s.length > limit ? `${s.slice(0, limit)}\n[output truncated]` : s);
