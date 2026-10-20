/// <reference lib="webworker" />
import { CLANG_URL, WASI_SHIM_URL } from '../versions';
import { compileCpp, runWasm, type WasiShim } from './build';

type Msg = { id: number; type: 'init' } | { id: number; type: 'compile'; source: string } | { id: number; type: 'run'; wasm: Uint8Array; stdin: string };
type Mods = [{ runClang: never }, WasiShim];

let mods: Promise<Mods> | null = null;
const load = () => (mods ??= Promise.all([import(/* @vite-ignore */ CLANG_URL), import(/* @vite-ignore */ WASI_SHIM_URL)]) as Promise<Mods>);

self.onmessage = async (e: MessageEvent<Msg>) => {
  const m = e.data;
  try {
    const [clang, shim] = await load();
    if (m.type === 'init') {
      // Compiling a tiny program downloads and warms the compiler.
      const warm = await compileCpp(clang.runClang, 'int main() { return 0; }');
      return self.postMessage(warm.ok ? { id: m.id, ok: true } : { id: m.id, ok: false, error: warm.error });
    }
    if (m.type === 'compile') return self.postMessage({ id: m.id, ok: true, result: await compileCpp(clang.runClang, m.source) });
    self.postMessage({ id: m.id, ok: true, result: await runWasm(shim, m.wasm, m.stdin) });
  } catch (error) {
    if (m.type === 'init') mods = null;
    self.postMessage({ id: m.id, ok: false, error: String(error) });
  }
};
