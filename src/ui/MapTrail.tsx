import { Link } from 'react-router-dom';

export type TrailNode = { id: string; label: string; to: string; state: 'locked' | 'open' | 'done'; kind: 'lesson' | 'exam' | 'boss' };

const KIND_LABEL = { lesson: 'Lesson', exam: 'Chapter exam', boss: 'World boss' } as const;
const STATE_LABEL = { locked: 'Locked', open: 'Ready', done: 'Done' } as const;

function Icon({ state, kind }: { state: TrailNode['state']; kind: TrailNode['kind'] }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, focusable: false };
  if (state === 'locked') return <svg {...common}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
  if (state === 'done') return <svg {...common}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
  if (kind === 'boss') return <svg {...common}><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6" /></svg>;
  if (kind === 'exam') return <svg {...common}><path d="M7 4h10v16H7z" /><path d="M10 9h4M10 13h4" /></svg>;
  return <svg {...common}><path d="M8 5l11 7-11 7z" /></svg>;
}

export function MapTrail({ nodes, hue }: { nodes: TrailNode[]; hue: string }) {
  return (
    <ol className="path" style={{ ['--hue' as string]: hue }}>
      {nodes.map((n) => {
        const body = (
          <>
            <span className="step-icon"><Icon state={n.state} kind={n.kind} /></span>
            <span className="step-text">
              <span className="step-title">{n.label}</span>
              <span className="step-meta">{KIND_LABEL[n.kind]} &middot; {STATE_LABEL[n.state]}</span>
            </span>
          </>
        );
        return (
          <li key={n.id} className={`step ${n.state} ${n.kind}`}>
            {n.state === 'locked'
              ? <div className="step-card" aria-disabled="true">{body}<span className="sr-only"> (locked)</span></div>
              : <Link className="step-card" to={n.to}>{body}{n.state === 'done' ? <span className="sr-only"> (done)</span> : null}</Link>}
          </li>
        );
      })}
    </ol>
  );
}
