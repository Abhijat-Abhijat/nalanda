import type { Layer } from '../schema';
import { Blocks } from './Story';

// The three layers read like one tutorial page, so all start open; each can still be folded away.
export function Layers({ layers }: { layers: [Layer, Layer, Layer] }) {
  return (
    <section aria-label="Look closer" className="layers">
      <h2>Look closer</h2>
      {layers.map((l, i) => (
        <details key={l.title} className="layer" open>
          <summary><span className="layer-n" aria-hidden="true">{i + 1}</span>{l.title}</summary>
          <div className="layer-body"><Blocks blocks={l.blocks} /></div>
        </details>
      ))}
    </section>
  );
}
