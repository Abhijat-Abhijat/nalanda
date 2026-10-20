import { describe, it, expect } from 'vitest';
import { checkQuestion } from './quiz';
import type { ChoiceQ, OrderQ, FillQ } from '../schema';

const choice: ChoiceQ = { kind: 'choice', id: 'a', conceptId: 'c', prompt: 'p', options: ['x', 'y', 'z'], answer: 1, explain: 'e' };
const order: OrderQ = { kind: 'order', id: 'b', conceptId: 'c', prompt: 'p', items: ['one', 'two', 'three'], explain: 'e' };
const fill: FillQ = { kind: 'fill', id: 'c', conceptId: 'c', prompt: 'Status ___', answers: ['404', 'Not Found'], explain: 'e' };

describe('checkQuestion', () => {
  it('choice compares the selected index', () => {
    expect(checkQuestion(choice, 1)).toBe(true);
    expect(checkQuestion(choice, 0)).toBe(false);
  });
  it('order needs the exact sequence', () => {
    expect(checkQuestion(order, ['one', 'two', 'three'])).toBe(true);
    expect(checkQuestion(order, ['two', 'one', 'three'])).toBe(false);
    expect(checkQuestion(order, ['one', 'two'])).toBe(false);
  });
  it('fill ignores case and extra spaces', () => {
    expect(checkQuestion(fill, '  not   found ')).toBe(true);
    expect(checkQuestion(fill, '404')).toBe(true);
  });
  it('fill rejects empty or whitespace input', () => {
    expect(checkQuestion(fill, '')).toBe(false);
    expect(checkQuestion(fill, '   ')).toBe(false);
  });
  it('rejects the wrong answer type without throwing', () => {
    expect(checkQuestion(choice, 'x' as never)).toBe(false);
    expect(checkQuestion(order, 3 as never)).toBe(false);
  });
});
