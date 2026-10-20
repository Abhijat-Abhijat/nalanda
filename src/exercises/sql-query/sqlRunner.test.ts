import { describe, it, expect } from 'vitest';
import { runQuery, compareResults, checkSql } from './sqlRunner';
import type { SqlEx } from '../../schema';

const ex: SqlEx = {
  kind: 'sql-query', id: 's1', conceptId: 'select-where', prompt: 'Pune customers', dbId: 'shop',
  starter: '', ordered: false, hint: 'Use WHERE',
  solution: "SELECT name, city FROM customers WHERE city = 'Pune'",
};

describe('runQuery', () => {
  it('returns columns and rows', async () => {
    const r = await runQuery('shop', 'SELECT name FROM customers ORDER BY id LIMIT 2');
    expect(r).toEqual({ ok: true, columns: ['name'], rows: [['Asha'], ['Bilal']] });
  });
  it('reports a syntax error as a message, not an exception', async () => {
    const r = await runQuery('shop', 'SELEC * FROM customers');
    expect(r.ok).toBe(false);
  });
  it('rejects an empty query with guidance', async () => {
    expect(await runQuery('shop', '   ')).toEqual({ ok: false, error: 'Write a query first.' });
  });
  it('uses the result of the last statement when several run', async () => {
    const r = await runQuery('shop', 'SELECT 1; SELECT name FROM customers WHERE id = 1');
    expect(r).toEqual({ ok: true, columns: ['name'], rows: [['Asha']] });
  });
  it('a destructive query does not affect the next run', async () => {
    await runQuery('shop', 'DROP TABLE customers');
    const r = await runQuery('shop', 'SELECT COUNT(*) FROM customers');
    expect(r).toEqual({ ok: true, columns: ['COUNT(*)'], rows: [[8]] });
  });
});

describe('compareResults', () => {
  const a = { ok: true as const, columns: ['x'], rows: [[1], [2]] };
  it('ignores row order unless ordered', () => {
    const b = { ok: true as const, columns: ['y'], rows: [[2], [1]] };
    expect(compareResults(a, b, false)).toBe(true);
    expect(compareResults(a, b, true)).toBe(false);
  });
  it('ignores column names but not column count', () => {
    expect(compareResults(a, { ok: true, columns: ['x', 'z'], rows: [[1, 1], [2, 2]] }, false)).toBe(false);
  });
});

describe('checkSql', () => {
  it('passes the reference solution', async () => {
    expect((await checkSql(ex, ex.solution)).passed).toBe(true);
  });
  it('passes an equivalent query with different column aliases', async () => {
    const r = await checkSql(ex, "SELECT name AS n, city AS c FROM customers WHERE city = 'Pune'");
    expect(r.passed).toBe(true);
  });
  it('fails a wrong query with a helpful message', async () => {
    const r = await checkSql(ex, 'SELECT name, city FROM customers');
    expect(r.passed).toBe(false);
    expect(r.message).toMatch(/rows/i);
  });
  it('fails a query that errors', async () => {
    const r = await checkSql(ex, 'SELEC');
    expect(r.passed).toBe(false);
  });
});
