import { useState } from 'react';
import type { HttpEx, HttpRequest, HttpRule } from '../../schema';
import type { RunnerProps } from '../registry';
import { Md } from '../../ui/Md';
import { checkHttp, describeRule, formatRequest, parseUrl } from './http';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const headersToText = (h: Record<string, string>) => Object.entries(h).map(([k, v]) => `${k}: ${v}`).join('\n');
const textToHeaders = (t: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const line of t.split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
};

export default function HttpRunner({ exercise, onAttempt }: RunnerProps<HttpEx>) {
  const [method, setMethod] = useState(exercise.starter.method.toUpperCase());
  const [url, setUrl] = useState(exercise.starter.url);
  const [headerText, setHeaderText] = useState(headersToText(exercise.starter.headers));
  const [body, setBody] = useState(exercise.starter.body);
  const [verdict, setVerdict] = useState<{ passed: boolean; failed: HttpRule[] } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const request: HttpRequest = { method, url, headers: textToHeaders(headerText), body };
  const check = () => {
    const res = checkHttp(exercise, request);
    setVerdict(res);
    onAttempt(res.passed);
  };

  return (
    <div className="http-runner">
      <Md md={exercise.prompt} />
      <div className="http-line">
        <label className="field">Method <select value={method} onChange={(e) => setMethod(e.target.value)}>
          {METHODS.map((m) => <option key={m}>{m}</option>)}
        </select></label>
        <label className="field grow">URL <input className="fill-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/path" /></label>
      </div>
      <label className="field">Headers, one per line as Name: value
        <textarea rows={3} className="fill-input" value={headerText} onChange={(e) => setHeaderText(e.target.value)} />
      </label>
      <label className="field">Body
        <textarea rows={3} className="fill-input" value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <p className="field-label">The request as it travels</p>
      <pre className="code" aria-label="Request preview">
        {parseUrl(url) ? formatRequest(request) : 'Type a full URL, such as https://example.com/path, to see the request here.'}
      </pre>
      <div className="row">
        <button type="button" className="primary" onClick={check}>Check answer</button>
        <button type="button" onClick={() => setShowHint((v) => !v)}>{showHint ? 'Hide hint' : 'Show hint'}</button>
      </div>
      {showHint && <p className="callout tip">{exercise.hint}</p>}
      {verdict?.passed && <p className="feedback good" role="status">Done.</p>}
      {verdict && !verdict.passed && (
        <div className="feedback bad" role="status">
          <p>Not yet. Still to do:</p>
          <ul>{verdict.failed.map((r, i) => <li key={i}>{describeRule(r)}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
