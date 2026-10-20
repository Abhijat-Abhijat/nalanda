import { describe, it, expect } from 'vitest';
import { guardLoops } from './guard';

describe('guardLoops', () => {
  it('guards while, do-while, and classic for conditions', () => {
    expect(guardLoops('while (x < 3) {}')).toBe('while ((x < 3) && NalandaGuard.t()) {}');
    expect(guardLoops('do { x++; } while(x < 3);')).toBe('do {NalandaGuard.t();  x++; } while((x < 3) && NalandaGuard.t());');
    expect(guardLoops('for (int i = 0; i < n; i++) {}')).toBe('for (int i = 0;( i < n) && NalandaGuard.t(); i++) {}');
  });
  it('guards constant-true loops inside the body so flow analysis still sees them as endless', () => {
    expect(guardLoops('for (;;) {}')).toBe('for (;;) if (NalandaGuard.t()) {}');
    expect(guardLoops('while (true) { x++; }')).toBe('while (true) if (NalandaGuard.t()) { x++; }');
    expect(guardLoops('while (true) x++;')).toBe('while (true) if (NalandaGuard.t()) x++;');
    expect(guardLoops('while ((true)) { return; }')).toBe('while ((true)) if (NalandaGuard.t()) { return; }');
    expect(guardLoops('do { x++; } while (true);')).toBe('do {NalandaGuard.t();  x++; } while (true);');
  });
  it('leaves for-each loops, strings, comments, and identifiers alone', () => {
    expect(guardLoops('for (int v : xs) {}')).toBe('for (int v : xs) {}');
    expect(guardLoops('String s = "while (x)"; // for (;;)\n/* while (y) */ awhile(1);')).toBe('String s = "while (x)"; // for (;;)\n/* while (y) */ awhile(1);');
  });
  it('keeps line numbers', () => {
    const src = 'while (a &&\n  b) {}\nfor (int i = 0;\n i < 2; i++) {}';
    expect(guardLoops(src).split('\n').length).toBe(src.split('\n').length);
  });
});
