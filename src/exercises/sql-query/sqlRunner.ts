import initSqlJs, { type SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import type { SqlEx } from '../../schema';
import { SHOP_SEED } from './seeds';

export type Cell = string | number | null;
export type QueryResult = { ok: true; columns: string[]; rows: Cell[][] } | { ok: false; error: string };

let sqlPromise: Promise<SqlJsStatic> | null = null;
// A failed load is not cached, so the next Run or Check tries again.
const getSql = () => (sqlPromise ??= initSqlJs(
  typeof window === 'undefined' ? undefined : { locateFile: () => wasmUrl },
).catch((e) => { sqlPromise = null; throw e; }));

const seeds = { shop: SHOP_SEED } as const;

export async function runQuery(dbId: keyof typeof seeds, sql: string): Promise<QueryResult> {
  if (sql.trim() === '') return { ok: false, error: 'Write a query first.' };
  let SQL: SqlJsStatic;
  try { SQL = await getSql(); } catch { return { ok: false, error: 'The SQL engine could not load. Check your connection and try again.' }; }
  const db = new SQL.Database();
  try {
    db.run(seeds[dbId]);
    const results = db.exec(sql);
    const last = results[results.length - 1];
    if (!last) return { ok: true, columns: [], rows: [] };
    return { ok: true, columns: last.columns, rows: last.values as Cell[][] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    db.close();
  }
}

const key = (row: Cell[]) => JSON.stringify(row);

export function compareResults(a: QueryResult, b: QueryResult, ordered: boolean): boolean {
  if (!a.ok || !b.ok) return false;
  if (a.columns.length !== b.columns.length || a.rows.length !== b.rows.length) return false;
  const ka = a.rows.map(key);
  const kb = b.rows.map(key);
  if (!ordered) { ka.sort(); kb.sort(); }
  return ka.every((k, i) => k === kb[i]);
}

export async function checkSql(ex: SqlEx, learnerSql: string) {
  const [learner, expected] = await Promise.all([runQuery(ex.dbId, learnerSql), runQuery(ex.dbId, ex.solution)]);
  if (!learner.ok) return { passed: false, learner, message: `Your query has a problem: ${learner.error}` };
  if (!expected.ok) throw new Error(`Reference solution failed for ${ex.id}: ${expected.error}`);
  if (learner.columns.length !== expected.columns.length)
    return { passed: false, learner, message: `Expected ${expected.columns.length} ${expected.columns.length === 1 ? 'column' : 'columns'} but got ${learner.columns.length}.` };
  if (learner.rows.length !== expected.rows.length)
    return { passed: false, learner, message: `Expected ${expected.rows.length} ${expected.rows.length === 1 ? 'row' : 'rows'} but got ${learner.rows.length}. Check your WHERE or JOIN.` };
  const passed = compareResults(learner, expected, ex.ordered);
  return { passed, learner, message: passed ? 'Matches the expected result.' : ex.ordered ? 'The rows are right but the order is not. Check ORDER BY.' : 'The row count matches but the values differ.' };
}
