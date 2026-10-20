import { useMemo, useRef } from 'react';
import { keymap, Prec } from '@uiw/react-codemirror';

export const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

// Ctrl/Cmd+Enter inside one editor. Highest precedence, because CodeMirror's default
// keymap binds Mod-Enter to "insert blank line". The ref keeps the extension stable
// across renders while always calling the latest handler.
export function useRunKey(fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  return useMemo(() => Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { ref.current(); return true; } }])), []);
}
