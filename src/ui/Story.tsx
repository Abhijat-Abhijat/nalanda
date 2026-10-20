import { lazy, Suspense } from 'react';
import type { Block } from '../schema';
import { Md } from './Md';

// Loaded on demand so pages without SQL examples never pull in the SQL engine.
const TryIt = lazy(() => import('./TryIt').then((m) => ({ default: m.TryIt })));

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'text': return <Md key={i} md={b.md} />;
          case 'analogy': return <aside key={i} className="analogy"><span className="analogy-label">In everyday terms</span><Md md={b.md} /></aside>;
          case 'callout': return <aside key={i} className={`callout ${b.tone}`}><span className="callout-label">{b.tone === 'warn' ? 'Watch out' : b.tone === 'tip' ? 'Tip' : 'Note'}</span><Md md={b.md} /></aside>;
          case 'code': return <pre key={i} className="code"><code>{b.src}</code></pre>;
          case 'syntax':
            return (
              <figure key={i} className="box syntax">
                <figcaption>Syntax</figcaption>
                <pre className="code"><code>{b.src}</code></pre>
              </figure>
            );
          case 'example':
            return (
              <figure key={i} className="box example">
                <figcaption>Example: {b.title}</figcaption>
                <pre className="code"><code>{b.src}</code></pre>
                {b.output !== undefined && <><p className="out-label">Output</p><pre className="code output"><code>{b.output}</code></pre></>}
                {b.md && <Md md={b.md} />}
                {b.lang === 'sql' && <Suspense fallback={null}><TryIt src={b.src} /></Suspense>}
              </figure>
            );
          case 'table':
            return (
              <table key={i} className="ref-table">
                <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>{b.rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}><Md md={c} /></td>)}</tr>)}</tbody>
              </table>
            );
          case 'faq':
            return (
              <div key={i} className="faq">
                {b.items.map((f) => <details key={f.q}><summary>{f.q}</summary><Md md={f.md} /></details>)}
              </div>
            );
          case 'timeline':
            return (
              <ol key={i} className="timeline">
                {b.events.map((e) => (
                  <li key={e.year + e.title}><strong>{e.year}</strong> <span>{e.title}</span><Md md={e.md} /></li>
                ))}
              </ol>
            );
        }
      })}
    </>
  );
}
