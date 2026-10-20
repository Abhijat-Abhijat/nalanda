// CheerpJ runs Java on the page's main thread, so an endless loop would freeze (or crash) the tab and no
// timer could stop it. Instead every while/for condition in learner code calls NalandaGuard.t(), which ends
// the program after about 4 s. Rewrites stay on the same lines so compiler line numbers still match.
export const GUARD_MARKER = '#NALANDA_TIMEOUT#';

export const GUARD_CLASS = `final class NalandaGuard {
  static long end; static int n;
  static boolean t() {
    if ((++n & 1023) == 0) {
      long now = System.currentTimeMillis();
      if (end == 0) end = now + 4000;
      else if (now > end) { System.out.println("${GUARD_MARKER}"); System.out.flush(); System.exit(124); }
    }
    return true;
  }
}`;

// Index just past the literal or comment starting at i, or -1 when none starts there.
function skip(src: string, i: number): number {
  const c = src[i];
  if (c === '/' && src[i + 1] === '/') { const j = src.indexOf('\n', i); return j < 0 ? src.length : j; }
  if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); return j < 0 ? src.length : j + 2; }
  if (c === '"' || c === "'") {
    let j = i + 1;
    while (j < src.length && src[j] !== c) j += src[j] === '\\' ? 2 : 1;
    return j + 1;
  }
  return -1;
}

function closeParen(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const s = skip(src, i);
    if (s >= 0) { i = s - 1; continue; }
    if (src[i] === '(') depth++;
    else if (src[i] === ')' && --depth === 0) return i;
  }
  return -1;
}

function splitSemis(s: string): string[] {
  const parts: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    const k = skip(s, i);
    if (k >= 0) { i = k - 1; continue; }
    if ('([{'.includes(s[i])) depth++;
    else if (')]}'.includes(s[i])) depth--;
    else if (s[i] === ';' && depth === 0) { parts.push(s.slice(start, i)); start = i + 1; }
  }
  parts.push(s.slice(start));
  return parts;
}

export function guardLoops(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const s = skip(src, i);
    if (s >= 0) { out += src.slice(i, s); i = s; continue; }
    const word = !/[\w$]/.test(src[i - 1] ?? '');
    const d = word && /^do\s*\{/.exec(src.slice(i, i + 12));
    if (d) { out += d[0] + 'NalandaGuard.t(); '; i += d[0].length; continue; }
    const m = word && /^(while|for)\s*\(/.exec(src.slice(i, i + 12));
    if (m) {
      const open = i + m[0].length - 1;
      const close = closeParen(src, open);
      if (close > 0) {
        const inner = src.slice(open + 1, close);
        const parts = m[1] === 'for' ? splitSemis(inner) : [inner];
        const test = m[1] === 'for' ? parts[1] : inner;
        // A constant-true condition must stay as written, or Java flow analysis rejects code after an endless loop,
        // so the guard wraps the body instead: works for block and single-statement bodies alike.
        const bare = (test ?? '').replace(/\s/g, '').replace(/^\(+|\)+$/g, '');
        if (test !== undefined && (bare === '' || bare === 'true') && (m[1] === 'while' || parts.length === 3)) {
          // "} while (true);" ends a do-while whose body is already guarded.
          const doTail = m[1] === 'while' && /\}\s*$/.test(out) && /^\s*;/.test(src.slice(close + 1));
          out += src.slice(i, close + 1) + (doTail ? '' : ' if (NalandaGuard.t())');
          i = close + 1;
          continue;
        }
        // The guard goes second so definite assignment inside the condition still holds.
        let cond = inner;
        if (m[1] === 'while') cond = `(${inner}) && NalandaGuard.t()`;
        else if (parts.length === 3) cond = `${parts[0]};(${parts[1]}) && NalandaGuard.t();${parts[2]}`;
        out += src.slice(i, open + 1) + cond + ')';
        i = close + 1;
        continue;
      }
    }
    out += src[i];
    i++;
  }
  return out;
}
