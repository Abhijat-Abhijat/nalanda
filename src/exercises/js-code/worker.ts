import { runCases } from './runCases';

self.onmessage = (e: MessageEvent<{ code: string; fnName: string; cases: { args: unknown[]; expect: unknown }[] }>) => {
  const { code, fnName, cases } = e.data;
  (self as unknown as Worker).postMessage(runCases(code, fnName, cases));
};
