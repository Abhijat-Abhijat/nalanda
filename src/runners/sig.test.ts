import { describe, it, expect } from 'vitest';
import { parseSig, javaType, cppType, cppParamType, javaStarter, cppStarter, jsParamNames } from './sig';

describe('signatures', () => {
  it('parses params and return', () => {
    const s = parseSig('(int[] nums, int k) -> int[]');
    expect(s.params.map((p) => p.name)).toEqual(['nums', 'k']);
    expect(javaType(s.params[0].type)).toBe('int[]');
    expect(cppType(s.ret)).toBe('vector<int>');
  });
  it('maps nullable, nested, map, and any types', () => {
    const t = (x: string) => parseSig(`(${x} a) -> int`).params[0].type;
    expect(javaType(t('int?[]'))).toBe('Integer[]');
    expect(cppType(t('int?[]'))).toBe('vector<optional<int>>');
    expect(javaType(t('string[][]'))).toBe('String[][]');
    expect(javaType(t('map<int[]>'))).toBe('Map<String, int[]>');
    expect(javaType(t('map<int>'))).toBe('Map<String, Integer>');
    expect(cppType(t('map<int[]>'))).toBe('map<string, vector<int>>');
    expect(javaType(t('any'))).toBe('Object');
    expect(cppType(t('any'))).toBe('Json');
    expect(cppType(t('long'))).toBe('long long');
    expect(javaType(t('bool'))).toBe('boolean');
    expect(cppParamType(t('int'))).toBe('int');
    expect(cppParamType(t('string'))).toBe('string&');
    expect(cppParamType(t('int[]'))).toBe('vector<int>&');
  });
  it('rejects bad signatures', () => {
    expect(() => parseSig('(int[] nums) int')).toThrow('bad signature');
    expect(() => parseSig('(float x) -> int')).toThrow('bad signature');
  });
  it('generates LeetCode-style starters', () => {
    const s = parseSig('(int[] nums) -> bool');
    expect(javaStarter('containsDuplicate', s)).toBe('class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // your code\n    }\n}\n');
    expect(cppStarter('containsDuplicate', s)).toBe('class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // your code\n    }\n};\n');
  });
  it('reads JS parameter names from the starter', () => {
    expect(jsParamNames('f', 'class X {}\nfunction f(a, b = 2) {\n}')).toEqual(['a', 'b']);
    expect(jsParamNames('g', 'function g() {}')).toEqual([]);
  });
});
