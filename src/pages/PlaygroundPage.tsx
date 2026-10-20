import { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { EditorView } from '@codemirror/view';
import { runProgram, ensureLang, onLangStatus, LANG_LABEL, LOAD_NOTICE, LOAD_FAIL, type PyStatus } from '../runners';
import { codeStore } from '../runners/codeStore';
import { runQuery, type QueryResult } from '../exercises/sql-query/sqlRunner';
import type { Lang, RunResult } from '../runners/types';
import { MOD } from '../ui/runKey';

type PlayLang = Lang | 'sql';
const LABEL: Record<PlayLang, string> = { ...LANG_LABEL, sql: 'SQL' };
const SAMPLE: Record<PlayLang, string> = {
  js: "// input() returns the next line of the input box, or null when there is none\nconst name = input() ?? 'world';\nconsole.log(`Hello, ${name}!`);\nconsole.log([3, 1, 2].sort((a, b) => a - b));",
  ts: "function greet(name: string): string {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet(input() ?? 'world'));",
  py: "import sys\n\nname = sys.stdin.readline().strip() or 'world'\nprint(f'Hello, {name}!')\nprint(sorted([3, 1, 2]))",
  java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<Integer> v = new ArrayList<>(Arrays.asList(3, 1, 2));\n        Collections.sort(v);\n        System.out.println("Hello, world! " + v);\n    }\n}\n',
  cpp: '#include <algorithm>\n#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint main() {\n    string name;\n    if (!getline(cin, name) || name.empty()) name = "world";\n    vector<int> v = {3, 1, 2};\n    sort(v.begin(), v.end());\n    cout << "Hello, " << name << "! " << v[0] << v[1] << v[2] << endl;\n}\n',
  sql: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 5;',
};
const isPlayLang = (v: string | null): v is PlayLang => v !== null && v in LABEL;

export default function PlaygroundPage() {
  const [lang, setLang] = useState<PlayLang>(() => {
    const saved = codeStore.get('nalanda:play:lang');
    return isPlayLang(saved) ? saved : 'py';
  });
  const [code, setCode] = useState(() => codeStore.get(`nalanda:play:${lang}`) ?? SAMPLE[lang]);
  const [stdin, setStdin] = useState('');
  const [out, setOut] = useState<RunResult | null>(null);
  const [table, setTable] = useState<QueryResult | null>(null);
  const [schema, setSchema] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<PyStatus>('idle');
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [full]);

  useEffect(() => {
    if (lang !== 'sql') return onLangStatus(lang, setStatus);
    setStatus('ready');
  }, [lang]);
  useEffect(() => {
    if (lang !== 'sql') ensureLang(lang).catch(() => {});
    if (lang === 'sql' && !schema) runQuery('shop', "SELECT name, sql FROM sqlite_master WHERE type = 'table' ORDER BY name").then(setSchema).catch(() => {});
  }, [lang, schema]);

  const pick = (l: PlayLang) => {
    setLang(l); codeStore.set('nalanda:play:lang', l);
    setCode(codeStore.get(`nalanda:play:${l}`) ?? SAMPLE[l]); setOut(null); setTable(null);
  };
  const edit = (v: string) => { setCode(v); codeStore.set(`nalanda:play:${lang}`, v); };
  const run = async () => {
    setRunning(true);
    try {
      if (lang === 'sql') setTable(await runQuery('shop', code));
      else setOut(await runProgram(lang, code, stdin));
    } catch (e) {
      setOut({ stdout: '', stderr: e instanceof Error ? e.message : String(e), ms: 0 });
    } finally { setRunning(false); }
  };

  const busy = status === 'loading';
  const ext = [
    lang === 'py' ? python() : lang === 'sql' ? sql() : lang === 'java' ? java() : lang === 'cpp' ? cpp() : javascript({ typescript: lang === 'ts' }),
    EditorView.contentAttributes.of({ 'aria-label': `${LABEL[lang]} editor` }),
  ];

  // Window-level capture so shortcuts win over CodeMirror's own Mod-Enter (insert blank line) and work from any field.
  const runKey = useRef(() => {});
  runKey.current = () => { if (!running && !busy) void run(); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); runKey.current(); }
      else if (e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); e.stopPropagation(); setFull((f) => !f); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const hasOutput = out !== null || table !== null;
  const state = running ? 'Running' : busy ? 'Loading' : status === 'error' ? 'Unavailable' : 'Ready';

  return (
    <section className="playground">
      <header className="play-head">
        <h1>Playground</h1>
        <p className="muted">Write code in any language and run it in your browser. Nothing leaves your machine.</p>
      </header>
      <div className={full ? 'workbench full' : 'workbench'} role={full ? 'dialog' : undefined} aria-modal={full || undefined} aria-label={full ? 'Playground, full screen' : undefined}>
        <div className="wb-bar">
          <div className="lang-tabs" role="tablist" aria-label="Language">
            {(Object.keys(LABEL) as PlayLang[]).map((l) => (
              <button key={l} type="button" role="tab" aria-selected={l === lang} className={l === lang ? 'active' : ''} disabled={running} onClick={() => pick(l)}>{LABEL[l]}</button>
            ))}
          </div>
          <div className="wb-actions">
            <span className={`wb-state ${state.toLowerCase()}`}><span className="wb-dot" aria-hidden="true" />{state}</span>
            <button type="button" className="wb-full" aria-pressed={full} title={full ? `Exit full screen (Esc or ${MOD}+Shift+F)` : `Full screen (${MOD}+Shift+F)`} onClick={() => setFull((f) => !f)}>
              <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                {full ? <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" /> : <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />}
              </svg>
              <span className="sr-only">{full ? 'Exit full screen' : 'Full screen'}</span>
            </button>
            <button type="button" className="primary wb-run" aria-busy={running} disabled={running || busy} onClick={run}>
              Run<kbd aria-hidden="true">{MOD} ↵</kbd>
            </button>
          </div>
        </div>
        <div className="play-grid">
          <div className="wb-editor">
            <CodeMirror value={code} height={full ? '100%' : 'clamp(320px, 58vh, 560px)'} extensions={ext} onChange={edit} />
            {lang === 'java' && <p className="wb-note">Input is not supported for Java yet.</p>}
            {lang !== 'sql' && lang !== 'java' && (
              <label className="stdin"><span>Input <span className="muted">stdin</span></span>
                <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3} placeholder="Each line is one read, for example one input() call" spellCheck={false} />
              </label>
            )}
          </div>
          <div className="play-output wb-out" aria-live="polite">
            <div className="wb-out-head">
              <span>{lang === 'sql' ? 'Result' : 'Output'}</span>
              {out && !out.timedOut && <span className="wb-ms">{out.ms} ms</span>}
              {hasOutput && <button type="button" className="wb-clear" onClick={() => { setOut(null); setTable(null); }}>Clear output</button>}
            </div>
            <div className="wb-out-body">
              {busy && lang !== 'sql' && <p className="muted" role="status">{LOAD_NOTICE[lang]}</p>}
              {status === 'error' && lang !== 'sql' && (
                <p className="feedback bad" role="alert">{LOAD_FAIL[lang]}{' '}
                  <button type="button" onClick={() => ensureLang(lang).catch(() => {})}>Retry</button></p>
              )}
              {!hasOutput && !busy && status !== 'error' && (
                <p className="wb-empty">{lang === 'sql' ? 'Query results appear here as a table.' : 'Program output appears here.'}<br />
                  Press Run or <kbd>{MOD}</kbd> + <kbd>Enter</kbd>.<br />
                  <kbd>{MOD}</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> toggles full screen.</p>
              )}
              {out && (out.timedOut
                ? <p className="feedback bad" role="alert">Stopped after 5 s. Check for an endless loop.</p>
                : <>
                    <pre className="stdout">{out.stdout || ' '}</pre>
                    {out.stderr && <pre className="stderr">{out.stderr}</pre>}
                  </>)}
              {table && (table.ok
                ? <div className="table-wrap"><table><thead><tr>{table.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className={v === null ? 'null' : undefined}>{v === null ? 'NULL' : String(v)}</td>)}</tr>)}</tbody></table>
                    <p className="wb-note">{table.rows.length} {table.rows.length === 1 ? 'row' : 'rows'}</p></div>
                : <pre className="stderr">{table.error}</pre>)}
            </div>
            {lang === 'sql' && schema?.ok && (
              <details className="helpers"><summary>Tables in the shop database</summary>
                <pre><code>{schema.rows.map((r) => String(r[1])).join('\n\n')}</code></pre></details>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
