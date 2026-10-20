/// <reference types="node" />
// Node-only: compiles harness programs with the local JDK (javac --release 8) for the test suites.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { javaProgram, hitGuard, type JavaUnit } from './harness';
import { parseHarnessOutput, mapErrorLines } from '../results';
import type { Case, CaseOutcome } from '../types';

export const hasJavac = (() => { try { execFileSync('javac', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();

type Out = CaseOutcome | { compileError: string };

// Each unit compiles in its own package p<i>; RunAll prints "@@<id>" before each unit's results.
export function javaBatch(units: (Omit<JavaUnit, 'pkg'> & { id: string })[]): Map<string, Out> {
  const dir = mkdtempSync(join(tmpdir(), 'nalanda-java-'));
  const out = new Map<string, Out>();
  try {
    const files: string[] = [];
    units.forEach((u, i) => {
      const pkg = `p${i}`;
      mkdirSync(join(dir, pkg));
      const f = join(dir, pkg, 'Main.java');
      writeFileSync(f, javaProgram({ ...u, pkg }).source, 'utf8');
      files.push(f);
    });
    const runAll = join(dir, 'RunAll.java');
    writeFileSync(runAll, `public class RunAll { public static void main(String[] a) {\n${units.map((u, i) => `System.out.println("@@${u.id}"); p${i}.Main.main(a);`).join('\n')}\n} }\n`, 'utf8');
    files.push(runAll);
    try {
      execFileSync('javac', ['--release', '8', '-encoding', 'UTF-8', '-nowarn', '-d', join(dir, 'out'), ...files], { stdio: 'pipe' });
    } catch (e) {
      const msg = String((e as { stderr?: Buffer }).stderr ?? e);
      units.forEach((u) => out.set(u.id, { compileError: msg }));
      return out;
    }
    let stdout: string;
    try {
      stdout = execFileSync('java', ['-Dfile.encoding=UTF-8', '-Dsun.stdout.encoding=UTF-8', '-cp', join(dir, 'out'), 'RunAll'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch (e) {
      stdout = String((e as { stdout?: string }).stdout ?? ''); // the loop guard exits with 124
    }
    const chunks = stdout.replace(/\r\n/g, '\n').split(/^@@/m).slice(1);
    units.forEach((u, i) => {
      const chunk = (chunks[i] ?? '').replace(/^[^\n]*\n/, '');
      out.set(u.id, hitGuard(chunk) ? { passed: false, results: [], timedOut: true } : parseHarnessOutput(chunk, u.cases, 'no output'));
    });
    return out;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function javaCheck(learner: string, fnName: string, sig: string, cases: Case[], jsStarter: string): CaseOutcome {
  const r = javaBatch([{ id: 'x', learner, fnName, sig, cases, jsStarter }]).get('x')!;
  if ('compileError' in r) {
    const { offset } = javaProgram({ learner, fnName, sig, cases, jsStarter, pkg: 'p0' });
    return { passed: false, results: [], error: mapErrorLines(r.compileError, offset) };
  }
  return r;
}
