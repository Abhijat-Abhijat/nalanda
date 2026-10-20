import { useState } from 'react';
import { runQuery, type QueryResult } from '../exercises/sql-query/sqlRunner';

// W3Schools-style "Try it yourself": the example opens in an editable box and runs against the shop database.
export function TryIt({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(src);
  const [result, setResult] = useState<QueryResult | null>(null);
  const run = async () => setResult(await runQuery('shop', code));
  if (!open) return <button type="button" className="try-btn" onClick={() => { setOpen(true); void run(); }}>Try it yourself</button>;
  return (
    <div className="try">
      <textarea className="fill-input" aria-label="Example query" rows={Math.max(3, code.split('\n').length + 1)} value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
      <div className="row">
        <button type="button" className="primary" onClick={run}>Run</button>
        <button type="button" onClick={() => { setCode(src); setResult(null); }}>Reset</button>
      </div>
      {result?.ok === false && <p className="feedback bad" role="alert">{result.error}</p>}
      {result?.ok && (result.columns.length === 0 ? <p className="muted" role="status">Done. The statement returned no rows.</p> : (
        <div role="status">
          <p className="muted">{result.rows.length} {result.rows.length === 1 ? 'row' : 'rows'}</p>
          <table>
            <thead><tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{result.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v === null ? 'NULL' : String(v)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
