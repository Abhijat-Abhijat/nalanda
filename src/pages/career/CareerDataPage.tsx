import { useState, type ChangeEvent } from 'react';
import { useCareer } from '../../career/store';
import { exportCareer } from '../../career/persist';
import { downloadText } from './download';

export default function CareerDataPage() {
  const { data, importCareer, resetCareer } = useCareer();
  const [msg, setMsg] = useState<string | null>(null);
  const download = () => downloadText('nalanda-career.json', exportCareer(data), 'application/json');
  const onImport = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setMsg(importCareer(String(r.result)) ? 'Imported.' : 'That file is not a valid Nalanda career backup.');
    r.readAsText(f);
    e.target.value = '';
  };
  return (
    <article className="narrow">
      <h1>Career data</h1>
      <p>Your goals, applications, resume, interview history, and deck progress. Export a backup before resetting.</p>
      <button className="btn primary" onClick={download}>Export career data</button>{' '}
      <label className="btn">Import career data<input type="file" accept="application/json" onChange={onImport} aria-label="Import career data" hidden /></label>{' '}
      <button className="btn" onClick={() => { if (window.confirm('Reset all career data? This cannot be undone.')) { resetCareer(); setMsg('Career data reset.'); } }}>Reset</button>
      {msg ? <p role="status">{msg}</p> : null}
    </article>
  );
}
