import { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { EditorView } from '@codemirror/view';
import type { JsEx } from '../../schema';
import type { RunnerProps } from '../registry';
import { Md } from '../../ui/Md';
import { checkCases, ensureLang, onLangStatus, LANG_LABEL, LOAD_NOTICE, LOAD_FAIL, type PyStatus } from '../../runners';
import { codeStore } from '../../runners/codeStore';
import { preludeFor, pyStarter } from '../../runners/py/preludes';
import { parseSig, javaStarter, cppStarter } from '../../runners/sig';
import { javaHelpersFor } from '../../runners/java/helpers';
import { cppHelpersFor } from '../../runners/cpp/helpers';
import { useRunKey, MOD } from '../../ui/runKey';
import type { CaseResult, Lang } from '../../runners/types';

const LANG_KEY = 'nalanda:lang';
const editorExt = (lang: Lang) => [
  lang === 'py' ? python() : lang === 'java' ? java() : lang === 'cpp' ? cpp() : javascript({ typescript: lang === 'ts' }),
  EditorView.contentAttributes.of({ 'aria-label': `${LANG_LABEL[lang]} editor` }),
];

export default function JsRunner({ exercise, onAttempt }: RunnerProps<JsEx>) {
  const langs: Lang[] = exercise.langs ?? ['js'];
  const starterFor = (l: Lang) => {
    if (l === 'py') return pyStarter(exercise.fnName, exercise.starter);
    if (l === 'java') return javaStarter(exercise.fnName, parseSig(exercise.sig!));
    if (l === 'cpp') return cppStarter(exercise.fnName, parseSig(exercise.sig!));
    return exercise.starter;
  };
  const keyFor = (l: Lang) => `nalanda:code:${exercise.id}:${l}`;
  const [lang, setLang] = useState<Lang>(() => {
    const saved = codeStore.get(LANG_KEY) as Lang | null;
    return saved && langs.includes(saved) ? saved : langs[0];
  });
  const [code, setCode] = useState(() => codeStore.get(keyFor(lang)) ?? starterFor(lang));
  const [results, setResults] = useState<CaseResult[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<PyStatus>('idle');
  const prelude = useMemo(() => {
    if (lang === 'py') return preludeFor(exercise.starter);
    if (lang === 'java') return exercise.starter.includes('class ') ? javaHelpersFor(exercise.starter) : '';
    if (lang === 'cpp') return '// Standard headers are included and using namespace std; is set.\n' + cppHelpersFor(exercise.starter);
    return '';
  }, [lang, exercise.starter]);

  useEffect(() => onLangStatus(lang, setStatus), [lang]);
  useEffect(() => { ensureLang(lang).catch(() => {}); }, [lang]);

  const clearResults = () => { setResults(null); setPassed(null); setMessage(null); };
  const switchTo = (l: Lang) => {
    setLang(l); codeStore.set(LANG_KEY, l);
    setCode(codeStore.get(keyFor(l)) ?? starterFor(l)); clearResults();
  };
  const edit = (v: string) => { setCode(v); codeStore.set(keyFor(lang), v); };
  const reset = () => { codeStore.remove(keyFor(lang)); setCode(starterFor(lang)); clearResults(); };

  const check = async () => {
    setRunning(true);
    try {
      const out = await checkCases(lang, code, exercise.fnName, exercise.cases, exercise.starter, exercise.sig);
      if (out.timedOut) {
        setResults(null); setPassed(false);
        setMessage(lang === 'js' || lang === 'ts' ? 'Your code ran too long. Check for an endless loop.' : 'Stopped after 5 s. Check for an endless loop.');
        onAttempt(false);
        return;
      }
      setResults(out.results); setPassed(out.passed); setMessage(out.error ?? null);
      onAttempt(out.passed);
    } catch (e) {
      setResults(null); setPassed(null); setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const busy = status === 'loading';
  const runKey = useRunKey(() => { if (!running && !busy) void check(); });
  return (
    <div className="js-runner">
      <Md md={exercise.prompt} />
      {langs.length > 1 && (
        <div className="lang-tabs" role="tablist" aria-label="Language">
          {langs.map((l) => (
            <button key={l} type="button" role="tab" aria-selected={l === lang} className={l === lang ? 'active' : ''} disabled={running} onClick={() => switchTo(l)}>{LANG_LABEL[l]}</button>
          ))}
        </div>
      )}
      {prelude && (
        <details className="helpers">
          <summary>Helpers provided</summary>
          <pre><code>{prelude}</code></pre>
        </details>
      )}
      {busy && <p className="muted" role="status">{LOAD_NOTICE[lang]}</p>}
      {status === 'error' && (
        <p className="feedback bad" role="alert">
          {LOAD_FAIL[lang]}{' '}
          <button type="button" onClick={() => ensureLang(lang).catch(() => {})}>Retry</button>
        </p>
      )}
      <CodeMirror value={code} height="200px" extensions={[...editorExt(lang), runKey]} onChange={edit} />
      <div className="row">
        <button type="button" className="primary" disabled={running || busy} onClick={check}>Check answer</button>
        <button type="button" onClick={() => setShowHint((v) => !v)}>{showHint ? 'Hide hint' : 'Show hint'}</button>
        <button type="button" onClick={reset}>Reset</button>
        <span className="kbd-hint"><kbd>{MOD}</kbd> + <kbd>Enter</kbd> checks</span>
      </div>
      {showHint && <p className="callout tip">{exercise.hint}</p>}
      {message && <p className="feedback bad" role="alert">{message}</p>}
      {passed && <p className="feedback good" role="status">All cases passed.</p>}
      {results && (
        <ul>
          {results.map((r, i) => (
            <li key={i}>
              Case {i + 1}: {r.ok ? 'passed' : r.error ? `error: ${r.error}` : `expected ${JSON.stringify(exercise.cases[i].expect)}, got ${JSON.stringify(r.got)}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
