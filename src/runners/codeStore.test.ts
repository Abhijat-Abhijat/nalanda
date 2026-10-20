// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { codeStore } from './codeStore';

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe('codeStore', () => {
  it('codeStore keeps per-language code', () => {
    codeStore.set('nalanda:code:x:js', 'js code');
    codeStore.set('nalanda:code:x:py', 'py code');
    expect(codeStore.get('nalanda:code:x:js')).toBe('js code');
    expect(codeStore.get('nalanda:code:x:py')).toBe('py code');
    codeStore.remove('nalanda:code:x:py');
    expect(codeStore.get('nalanda:code:x:py')).toBeNull();
  });
  it('codeStore survives throwing storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(codeStore.get('k')).toBeNull();
    expect(() => codeStore.set('k', 'v')).not.toThrow();
  });
});
