import { useState, type FormEvent } from 'react';
import type { Check, TerminalEx } from '../../schema';
import type { RunnerProps } from '../registry';
import { Md } from '../../ui/Md';
import { run, type FsState } from './shell';
import { buildState, describeCheck, evaluateChecks } from './checks';

type Line = { command: string; out: string; err: string };

export default function TerminalRunner({ exercise, onAttempt }: RunnerProps<TerminalEx>) {
  const [state, setState] = useState<FsState>(() => buildState(exercise));
  const [transcript, setTranscript] = useState<Line[]>([]);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [line, setLine] = useState('');
  const [verdict, setVerdict] = useState<{ passed: boolean; failed: Check[] } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (line.trim() === '') return;
    const r = run(state, line);
    setState(r.state);
    setTranscript((t) => [...t, { command: line, out: r.out, err: r.err }]);
    setOutputs((o) => [...o, r.out || r.err]);
    setLine('');
  };
  const check = () => {
    const res = evaluateChecks(exercise.checks, state, outputs);
    setVerdict(res);
    onAttempt(res.passed);
  };
  const reset = () => { setState(buildState(exercise)); setTranscript([]); setOutputs([]); setVerdict(null); };

  return (
    <div className="terminal">
      <Md md={exercise.prompt} />
      <div className="term">
        <pre className="term-log" aria-live="polite" aria-label="Terminal output">
          {transcript.length === 0 && <span className="term-hello">Practice terminal. Type a command and press Enter.{'\n'}</span>}
          {transcript.map((l, i) => (
            <span key={i}>{'$ ' + l.command}{'\n'}{l.out ? l.out + '\n' : ''}{l.err ? <span className="term-err">{l.err + '\n'}</span> : ''}</span>
          ))}
        </pre>
        <form onSubmit={submit} className="term-line">
          <label htmlFor="term-input" className="sr-only">Command</label>
          <span className="term-prompt" aria-hidden="true">{state.cwd} $</span>
          <input id="term-input" autoComplete="off" spellCheck={false} value={line} onChange={(e) => setLine(e.target.value)} />
          <button type="submit">Run command</button>
        </form>
      </div>
      <div className="row">
        <button type="button" className="primary" onClick={check}>Check answer</button>
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" onClick={() => setShowHint((v) => !v)}>{showHint ? 'Hide hint' : 'Show hint'}</button>
      </div>
      {showHint && <p className="callout tip">{exercise.hint}</p>}
      {verdict?.passed && <p className="feedback good" role="status">Done.</p>}
      {verdict && !verdict.passed && (
        <div className="feedback bad" role="status">
          <p>Not yet. Still to do:</p>
          <ul>{verdict.failed.map((c, i) => <li key={i}>{describeCheck(c)}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
