import { describe, it, expect } from 'vitest';
import { formatRequest, evaluateRules, checkHttp } from './http';
import type { HttpEx, HttpRequest } from '../../schema';

const req = (over: Partial<HttpRequest> = {}): HttpRequest => ({ method: 'GET', url: 'https://example.com/books?id=7', headers: {}, body: '', ...over });

describe('formatRequest', () => {
  it('prints the start line, host, headers, and body', () => {
    const text = formatRequest(req({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"a":1}' }));
    expect(text).toBe('POST /books?id=7 HTTP/1.1\nHost: example.com\nContent-Type: application/json\n\n{"a":1}');
  });
  it('shows a plain message for an invalid url', () => {
    expect(formatRequest(req({ url: 'not a url' }))).toBe('Invalid URL: not a url');
  });
});

describe('evaluateRules', () => {
  it('checks method, host, path, and query', () => {
    const rules = [{ type: 'method' as const, equals: 'get' }, { type: 'host' as const, equals: 'example.com' }, { type: 'path' as const, equals: '/books' }, { type: 'query' as const, key: 'id', equals: '7' }];
    expect(evaluateRules(rules, req()).passed).toBe(true);
    expect(evaluateRules(rules, req({ url: 'https://example.com/books?id=8' })).failed).toEqual([rules[3]]);
  });
  it('checks headers case-insensitively, with and without a value', () => {
    const r = req({ headers: { authorization: 'Bearer abc' } });
    expect(evaluateRules([{ type: 'header', name: 'Authorization', equals: 'Bearer abc' }], r).passed).toBe(true);
    expect(evaluateRules([{ type: 'header', name: 'AUTHORIZATION' }], r).passed).toBe(true);
    expect(evaluateRules([{ type: 'header', name: 'X-Missing' }], r).passed).toBe(false);
  });
  it('checks json body keys and fails on invalid json', () => {
    const rule = [{ type: 'json' as const, key: 'title', equals: 'hi' }];
    expect(evaluateRules(rule, req({ body: '{"title":"hi"}' })).passed).toBe(true);
    expect(evaluateRules(rule, req({ body: '{"title":"no"}' })).passed).toBe(false);
    expect(evaluateRules(rule, req({ body: '{bad' })).passed).toBe(false);
  });
  it('an invalid url fails url rules without throwing', () => {
    expect(evaluateRules([{ type: 'host', equals: 'x' }], req({ url: 'nope' })).passed).toBe(false);
  });
});

describe('checkHttp', () => {
  it('passes the reference solution', () => {
    const ex: HttpEx = { kind: 'http-builder', id: 'h', conceptId: 'c', prompt: 'p', hint: 'h', starter: req({ url: '' }), solution: req(), rules: [{ type: 'path', equals: '/books' }] };
    expect(checkHttp(ex, ex.solution).passed).toBe(true);
  });
});
