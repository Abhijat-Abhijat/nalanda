import { describe, it, expect, vi } from 'vitest';

const init = vi.fn(() => Promise.reject(new Error('network down')));
vi.mock('sql.js', () => ({ default: init }));

describe('sql engine load failure', () => {
  it('returns a clear message and tries again on the next run instead of caching the failure', async () => {
    const { runQuery } = await import('./sqlRunner');
    const first = await runQuery('shop', 'SELECT 1');
    expect(first.ok).toBe(false);
    if (!first.ok) expect(first.error).toMatch(/could not load/i);
    await runQuery('shop', 'SELECT 1');
    expect(init).toHaveBeenCalledTimes(2);
  });
});
