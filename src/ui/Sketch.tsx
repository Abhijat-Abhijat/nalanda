import type { ReactNode } from 'react';

// Hand-drawn style line art in the spirit of a sketchbook: single-weight strokes, slightly uneven curves.
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function Frame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <svg className={`sketch ${className}`.trim()} viewBox="0 0 96 96" aria-hidden="true" focusable="false">{children}</svg>;
}

export function WorldIcon({ id, className }: { id: string; className?: string }) {
  switch (id) {
    case 'ai-engineer':
      return (
        <Frame className={className}>
          <g {...S}>
            <circle cx="20" cy="30" r="7" /><circle cx="21" cy="67" r="7.5" />
            <circle cx="49" cy="19" r="7" /><circle cx="48" cy="48" r="8.5" /><circle cx="49" cy="78" r="7" />
            <circle cx="79" cy="47" r="9.5" />
            <path d="M27 28 C 33 24, 37 22, 42 20 M27 33 C 33 38, 37 42, 40 45 M28 64 C 33 58, 37 54, 41 51 M28 69 C 34 72, 38 75, 42 77" />
            <path d="M56 21 C 62 28, 66 34, 71 40 M57 48 C 61 48, 65 47, 69 47 M56 76 C 62 68, 66 61, 72 54" />
            <path d="M84 30 l2 -6 M88 34 l6 -2 M80 28 l-1 -5" />
          </g>
        </Frame>
      );
    case 'git-shell':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M27 20 C 26 40, 29 60, 27 76" />
            <path d="M28 52 C 44 50, 64 46, 66 28" />
            <circle cx="27" cy="14" r="6" /><circle cx="27" cy="82" r="6" /><circle cx="66" cy="22" r="6" /><circle cx="28" cy="52" r="4.5" />
            <path d="M52 66 l9 6 l-9 6 M66 79 c 5 0, 9 0, 13 -1" />
          </g>
        </Frame>
      );
    case 'sql':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M22 22 C 22 14, 74 13, 74 22 C 74 30, 22 31, 22 22 Z" />
            <path d="M22 22 C 21 40, 23 58, 22 74 C 23 84, 73 84, 74 74 C 73 58, 75 40, 74 22" />
            <path d="M22 40 C 24 48, 72 48, 74 40 M22 57 C 24 65, 72 65, 74 57" />
            <path d="M79 14 l4 -4 M83 20 h5" />
          </g>
        </Frame>
      );
    case 'http-web':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M43 22 C 60 21, 72 34, 71 50 C 70 66, 58 78, 43 78 C 27 78, 15 66, 16 49 C 16 33, 28 23, 43 22 Z" />
            <path d="M43 23 C 34 34, 33 64, 43 77 M43 23 C 52 34, 53 64, 43 77" />
            <path d="M18 42 C 34 40, 54 40, 69 42 M18 58 C 34 60, 54 60, 69 58" />
            <path d="M68 14 C 77 15, 83 21, 84 30 M79 26 l5 5 l5 -6" />
          </g>
        </Frame>
      );
    case 'javascript':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M34 18 C 24 18, 26 30, 25 40 C 24 46, 20 48, 15 48 C 20 48, 24 50, 25 56 C 26 66, 24 78, 34 78" />
            <path d="M62 18 C 72 18, 70 30, 71 40 C 72 46, 76 48, 81 48 C 76 48, 72 50, 71 56 C 70 66, 72 78, 62 78" />
            <path d="M42 56 C 44 60, 48 60, 50 56 M50 36 v20" />
            <path d="M80 16 l4 -4 M84 22 h5" />
          </g>
        </Frame>
      );
    case 'python':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M48 14 C 30 14, 28 22, 28 30 L 28 40 L 50 40 M28 40 C 18 40, 14 48, 15 58 C 16 68, 22 72, 30 72 L 36 72 L 36 60 C 36 54, 40 50, 46 50 L 60 50 C 66 50, 68 46, 68 40 L 68 28 C 68 18, 60 14, 48 14 Z" />
            <path d="M48 82 C 66 82, 68 74, 68 66 L 68 56 L 46 56 M68 56 C 78 56, 82 48, 81 38 C 80 28, 74 24, 66 24" />
            <circle cx="38" cy="24" r="2.5" /><circle cx="58" cy="72" r="2.5" />
          </g>
        </Frame>
      );
    case 'frontend':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M14 20 C 36 19, 60 19, 82 20 C 83 38, 83 58, 82 76 C 60 77, 36 77, 14 76 C 13 58, 13 38, 14 20 Z" />
            <path d="M14 32 C 38 31, 60 31, 82 32" />
            <circle cx="21" cy="26" r="1.8" /><circle cx="28" cy="26" r="1.8" />
            <path d="M24 44 h22 v22 h-22 z M54 44 h20 M54 52 h16 M54 60 h18" />
          </g>
        </Frame>
      );
    case 'backend':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M18 18 C 40 17, 58 17, 78 18 C 79 26, 79 32, 78 38 C 58 39, 40 39, 18 38 C 17 32, 17 26, 18 18 Z" />
            <path d="M18 46 C 40 45, 58 45, 78 46 C 79 54, 79 60, 78 66 C 58 67, 40 67, 18 66 C 17 60, 17 54, 18 46 Z" />
            <circle cx="28" cy="28" r="2" /><circle cx="28" cy="56" r="2" />
            <path d="M54 28 h16 M54 56 h16 M48 66 C 48 72, 48 76, 48 80 M36 82 h24" />
          </g>
        </Frame>
      );
    case 'databases':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M22 24 C 22 16, 74 16, 74 24 C 74 32, 22 32, 22 24 Z" />
            <path d="M22 24 C 22 40, 22 56, 22 72 C 22 80, 74 80, 74 72 C 74 56, 74 40, 74 24" />
            <path d="M22 40 C 22 48, 74 48, 74 40 M22 56 C 22 64, 74 64, 74 56" />
            <path d="M82 20 l5 -5 M84 30 h6" />
          </g>
        </Frame>
      );
    case 'devops':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M48 48 C 40 34, 22 34, 22 48 C 22 62, 40 62, 48 48 C 56 34, 74 34, 74 48 C 74 62, 56 62, 48 48 Z" />
            <path d="M66 36 l6 -2 l-2 6 M30 60 l-6 2 l2 -6" />
            <path d="M82 22 l4 -4 M84 30 h5" />
          </g>
        </Frame>
      );
    case 'algorithms':
      return (
        <Frame className={className}>
          <g {...S}>
            <circle cx="48" cy="20" r="7" /><circle cx="28" cy="50" r="7" /><circle cx="68" cy="50" r="7" />
            <circle cx="18" cy="78" r="6" /><circle cx="40" cy="78" r="6" /><circle cx="78" cy="78" r="6" />
            <path d="M43 25 L32 44 M53 25 L64 44 M24 56 L20 72 M32 56 L38 72 M71 56 L76 72" />
          </g>
        </Frame>
      );
    case 'cs-fundamentals':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M26 26 C 40 25, 56 25, 70 26 C 71 40, 71 56, 70 70 C 56 71, 40 71, 26 70 C 25 56, 25 40, 26 26 Z" />
            <path d="M36 36 h24 v24 h-24 z" />
            <path d="M34 18 v8 M48 18 v8 M62 18 v8 M34 70 v8 M48 70 v8 M62 70 v8 M18 34 h8 M18 48 h8 M18 62 h8 M70 34 h8 M70 48 h8 M70 62 h8" />
          </g>
        </Frame>
      );
    case 'cloud':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M28 66 C 16 66, 14 50, 26 47 C 25 34, 40 28, 48 37 C 54 26, 72 30, 70 44 C 82 45, 82 66, 70 66 Z" />
            <path d="M36 74 v8 M48 74 v8 M60 74 v8" />
          </g>
        </Frame>
      );
    case 'monitoring':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M18 70 L34 52 L46 60 L62 34 L78 44" />
            <path d="M18 78 h62 M18 22 v56" />
            <circle cx="62" cy="34" r="4" />
          </g>
        </Frame>
      );
    case 'system-design':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M16 20 h22 v16 h-22 z M58 20 h22 v16 h-22 z M37 62 h22 v16 h-22 z" />
            <path d="M27 36 L46 62 M69 36 L50 62 M38 28 h20" />
          </g>
        </Frame>
      );
    case 'security':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M48 16 L74 26 C 74 50, 66 68, 48 80 C 30 68, 22 50, 22 26 Z" />
            <path d="M38 48 L46 56 L60 40" />
          </g>
        </Frame>
      );
    case 'engineering':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M30 26 L16 48 L30 70 M66 26 L80 48 L66 70" />
            <path d="M54 22 L42 74" />
          </g>
        </Frame>
      );
    case 'ai-advanced':
      return (
        <Frame className={className}>
          <g {...S}>
            <circle cx="48" cy="48" r="9" />
            <circle cx="22" cy="26" r="5" /><circle cx="74" cy="26" r="5" /><circle cx="22" cy="72" r="5" /><circle cx="74" cy="72" r="5" />
            <path d="M26 30 L41 42 M70 30 L55 42 M26 68 L41 54 M70 68 L55 54" />
          </g>
        </Frame>
      );
    case 'java':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M28 44 H64 V62 C64 72 56 78 46 78 C36 78 28 72 28 62 Z" />
            <path d="M64 50 H70 C76 50 76 60 70 60 H64" />
            <path d="M38 36 C34 30 42 26 38 18 M50 36 C46 30 54 26 50 18" />
          </g>
        </Frame>
      );
    case 'payments':
      return (
        <Frame className={className}>
          <g {...S}>
            <rect x="16" y="28" width="64" height="40" rx="6" />
            <path d="M16 40 H80" />
            <path d="M26 56 H42" />
          </g>
        </Frame>
      );
    case 'cpp':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M40 26 C26 26 18 36 18 48 C18 60 26 70 40 70" />
            <path d="M50 48 H62 M56 42 V54" />
            <path d="M68 48 H80 M74 42 V54" />
          </g>
        </Frame>
      );
    case 'career':
      return (
        <Frame className={className}>
          <g {...S}>
            <path d="M18 24 h40 v24 h-22 l-10 10 v-10 h-8 z" />
            <path d="M64 40 h14 v24 h-6 v9 l-9 -9 h-17 v-10" />
          </g>
        </Frame>
      );
    default:
      return <Frame className={className}><g {...S}><path d="M22 22 h52 v52 h-52 z" /></g></Frame>;
  }
}

export function PaperPlane({ className = '' }: { className?: string }) {
  return (
    <svg className={`sketch ${className}`.trim()} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <g {...S} strokeWidth={1.5}>
        <path d="M6 70 L112 8 L74 112 L58 74 Z" />
        <path d="M58 74 L112 8 M10 70 L56 72" />
        <path d="M60 76 L66 100" />
      </g>
    </svg>
  );
}

export function Scribble({ className = '' }: { className?: string }) {
  return (
    <svg className={`scribble ${className}`.trim()} viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M3 10 C 30 4, 60 13, 95 8 S 160 4, 197 9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 13 C 60 9, 120 12, 170 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function BrushEdge({ className = '', fill = 'var(--bg)' }: { className?: string; fill?: string }) {
  return (
    <svg className={`brush ${className}`.trim()} viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 58 C 120 44, 260 70, 420 52 C 560 36, 720 64, 900 46 C 1060 30, 1220 58, 1440 38 L 1440 90 L 0 90 Z" fill={fill} />
      <path d="M180 60 C 260 57, 330 61, 400 58 M980 47 C 1040 45, 1100 47, 1150 45" stroke={fill} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function CheckMark() {
  return <svg className="mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" {...S} strokeWidth={2.4} /></svg>;
}

export function CrossMark() {
  return <svg className="mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 7l10 10M17 7L7 17" {...S} strokeWidth={2.4} /></svg>;
}
