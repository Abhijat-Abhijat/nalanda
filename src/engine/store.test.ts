// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { useStore } from './store';

afterEach(() => vi.restoreAllMocks());

describe('store saving', () => {
  it('flags a failed save instead of losing progress silently, and clears the flag when saving works again', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    useStore.getState().answer('c1', true);
    expect(useStore.getState().saveFailed).toBe(true);
    spy.mockRestore();
    useStore.getState().answer('c1', true);
    expect(useStore.getState().saveFailed).toBe(false);
  });
});
