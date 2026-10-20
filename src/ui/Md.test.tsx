import { describe, it, expect } from 'vitest';
import { mdToHtml } from './Md';

describe('mdToHtml', () => {
  it('escapes html before formatting', () => {
    expect(mdToHtml('<script>alert(1)</script>')).not.toContain('<script>');
    expect(mdToHtml('a < b')).toContain('&lt;');
  });
  it('formats bold, italic, and code', () => {
    const html = mdToHtml('**bold** and *soft* and `x < y`');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>soft</em>');
    expect(html).toContain('<code>x &lt; y</code>');
  });
  it('does not treat a lone asterisk or one inside code as italics', () => {
    expect(mdToHtml('What does * mean in SELECT * FROM x?')).not.toContain('<em>');
    const html = mdToHtml('Use `COUNT(*)` and `SELECT * FROM t` then *soft*');
    expect(html).toContain('<code>COUNT(*)</code>');
    expect(html).toContain('<code>SELECT * FROM t</code>');
    expect(html).toContain('<em>soft</em>');
  });
  it('makes paragraphs and lists', () => {
    expect(mdToHtml('one\n\ntwo')).toBe('<p>one</p><p>two</p>');
    expect(mdToHtml('- a\n- b')).toBe('<ul><li>a</li><li>b</li></ul>');
  });
  it('makes numbered lists and subheadings', () => {
    expect(mdToHtml('1. a\n2. b')).toBe('<ol><li>a</li><li>b</li></ol>');
    expect(mdToHtml('### Notes\n\ntext')).toBe('<h3>Notes</h3><p>text</p>');
  });
});
