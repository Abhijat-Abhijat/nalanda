import { describe, it, expect } from 'vitest';
import { clip, LANG_LABEL, LOAD_NOTICE, onLangStatus } from './index';

describe('runner registry helpers', () => {
  it('clips long output with a notice', () => {
    expect(clip('abcdef', 3)).toBe('abc\n[output truncated]');
    expect(clip('abc', 3)).toBe('abc');
  });
  it('labels languages', () => {
    expect(LANG_LABEL).toEqual({ js: 'JavaScript', ts: 'TypeScript', py: 'Python', java: 'Java', cpp: 'C++' });
  });
});

describe('language registry', () => {
  it('has the agreed loading notices', () => {
    expect(LOAD_NOTICE.java).toBe('Loading Java (about 20 MB, first time only)...');
    expect(LOAD_NOTICE.cpp).toBe('Loading C++ compiler (about 19 MB, first time only)...');
    expect(LOAD_NOTICE.py).toBe('Loading Python (about 10 MB, first time only)...');
  });
  it('reports JS as always ready', () => {
    const seen: string[] = [];
    onLangStatus('js', (s) => seen.push(s))();
    expect(seen).toEqual(['ready']);
  });
});
