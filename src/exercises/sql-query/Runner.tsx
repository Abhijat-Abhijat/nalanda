import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { EditorView } from '@codemirror/view';
import type { SqlEx } from '../../schema';
import type { RunnerProps } from '../registry';
import { Md } from '../../ui/Md';
import { checkSql, runQuery, type QueryResult } from './sqlRunner';
import { useRunKey, MOD } from '../../ui/runKey';

export default function SqlRunner({ exercise, onAttempt }: RunnerProps<SqlEx>) {
  const [code, setCode] = useState(exercise.starter);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const run = async () => { setMessage(null); setResult(await runQuery(exercise.dbId, code)); };
  const check = async () => {
    const r = await checkSql(exercise, code);
    setResult(r.learner); setMessage(r.message); onAttempt(r.passed);
  };
  const runKey = useRunKey(() => { void run(); });
  return (
    <div className="sql-runner">
      <Md md={exercise.prompt} />
      <details className="schema">
        <summary>Tables in this shop database</summary>
        <ul>
          <li><code>customers</code> id, name, city, email</li>
          <li><code>products</code> id, name, price, category</li>
          <li><code>orders</code> id, customer_id, product_id, qty, ordered_on</li>
        </ul>
      </details>
      <CodeMirror value={code} height="140px" extensions={[sql(), EditorView.contentAttributes.of({ 'aria-label': 'SQL editor' }), runKey]} onChange={setCode} />
      <div className="row">
        <button type="button" onClick={run}>Run query</button>
        <button type="button" className="primary" onClick={check}>Check answer</button>
        <button type="button" onClick={() => setShowHint((v) => !v)}>{showHint ? 'Hide hint' : 'Show hint'}</button>
        <span className="kbd-hint"><kbd>{MOD}</kbd> + <kbd>Enter</kbd> runs the query</span>
      </div>
      {showHint && <p className="callout tip">{exercise.hint}</p>}
      {message && <p role="status">{message}</p>}
      {result?.ok === false && <p className="feedback bad" role="alert">{result.error}</p>}
      {result?.ok && (
        <table>
          <thead><tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>{result.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v === null ? 'NULL' : String(v)}</td>)}</tr>)}</tbody>
        </table>
      )}
    </div>
  );
}
