const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Code spans are pulled out first so a `*` inside code is never read as emphasis,
// and emphasis needs a non-space right after the opening `*` and right before the closing one.
const inline = (s: string) => {
  const codes: string[] = [];
  const withSlots = esc(s).replace(/`([^`]+)`/g, (_, c: string) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  return withSlots
    .replace(/\*\*(\S[^*]*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w*])\*(?=\S)([^*]*?\S)\*(?![\w*])/g, '$1<em>$2</em>')
    .replace(/\u0000(\d+)\u0000/g, (_, i: string) => `<code>${codes[Number(i)]}</code>`);
};

export function mdToHtml(md: string): string {
  return md.trim().split(/\n{2,}/).map((block) => {
    const lines = block.split('\n');
    if (lines.every((l) => l.startsWith('- '))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
    if (lines.every((l) => /^\d+\. /.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
    if (lines.length === 1 && lines[0].startsWith('### ')) return `<h3>${inline(lines[0].slice(4))}</h3>`;
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('');
}

export function Md({ md }: { md: string }) {
  return <div className="prose" dangerouslySetInnerHTML={{ __html: mdToHtml(md) }} />;
}
