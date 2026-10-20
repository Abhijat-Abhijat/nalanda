import { CPP_FLAGS } from '../versions';

type RunClang = (args: string[], files: Record<string, string>, opts?: { stdout?: (b: Uint8Array | null) => void; stderr?: (b: Uint8Array | null) => void }) => Promise<Record<string, unknown>>;
export type WasiShim = {
  WASI: new (args: string[], env: string[], fds: unknown[]) => { wasiImport: WebAssembly.ModuleImports; start(i: unknown): number };
  File: new (d: Uint8Array) => unknown;
  OpenFile: new (f: unknown) => unknown;
  ConsoleStdout: new (write: (b: Uint8Array) => void) => unknown;
};

// Shared by the browser worker and the Node test runner.
export async function compileCpp(runClang: RunClang, source: string): Promise<{ ok: true; wasm: Uint8Array } | { ok: false; error: string }> {
  const dec = new TextDecoder();
  let err = '';
  const sink = (b: Uint8Array | null) => { if (b) err += dec.decode(b, { stream: true }); };
  try {
    const out = await runClang(['clang++', ...CPP_FLAGS, 'main.cpp', '-o', 'main.wasm'], { 'main.cpp': source }, { stdout: sink, stderr: sink });
    return { ok: true, wasm: out['main.wasm'] as Uint8Array };
  } catch {
    return { ok: false, error: err.trim() || 'Compilation failed.' };
  }
}

export async function runWasm(shim: WasiShim, wasm: Uint8Array, stdin: string): Promise<{ exit: number; stdout: string; stderr: string }> {
  // Raw (not line-buffered) sinks, so output without a final newline is kept.
  const outDec = new TextDecoder(), errDec = new TextDecoder();
  let out = '', err = '';
  const wasi = new shim.WASI([], [], [
    new shim.OpenFile(new shim.File(new TextEncoder().encode(stdin))),
    new shim.ConsoleStdout((b) => { out += outDec.decode(b, { stream: true }); }),
    new shim.ConsoleStdout((b) => { err += errDec.decode(b, { stream: true }); }),
  ]);
  const { instance } = await WebAssembly.instantiate(wasm as BufferSource, { wasi_snapshot_preview1: wasi.wasiImport });
  let exit: number;
  try { exit = wasi.start(instance); } catch (e) { err += (err && !err.endsWith('\n') ? '\n' : '') + String(e); exit = -1; }
  const trim = (s: string) => s.replace(/\n$/, '');
  return { exit, stdout: trim(out), stderr: trim(err) };
}
