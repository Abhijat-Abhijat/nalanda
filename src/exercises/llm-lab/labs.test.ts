import { describe, it, expect } from 'vitest';
import { tokenize } from './tokenizer';
import { cosine, nearest } from './embeddings';
import { scoreChunk, topK } from './retrieval';
import { checkLlm } from './index';
import type { LlmEx } from '../../schema';

describe('tokenizer', () => {
  it('splits words by the vocabulary and keeps punctuation as tokens', () => {
    expect(tokenize('Unhappiness!')).toEqual(['un', 'happi', 'ness', '!']);
    expect(tokenize('the cat sat on the mat')).toEqual(['the', 'cat', 'sat', 'on', 'the', 'mat']);
  });
  it('falls back to single characters for unknown words and handles empty input', () => {
    expect(tokenize('zq')).toEqual(['z', 'q']);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('embeddings', () => {
  it('cosine is 1 for equal direction and handles zero vectors', () => {
    expect(cosine([1, 0], [2, 0])).toBeCloseTo(1);
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });
  it('finds the nearest word', () => {
    expect(nearest('puppy', ['banana', 'dog', 'car'])).toBe('dog');
    expect(nearest('apple', ['pear', 'truck', 'cat'])).toBe('pear');
  });
});

describe('retrieval', () => {
  const chunks = [
    { id: 'a', text: 'Cats sleep most of the day' },
    { id: 'b', text: 'The Eiffel Tower is in Paris' },
    { id: 'c', text: 'Paris is the capital of France' },
  ];
  it('scores by shared non-stopword query words', () => {
    expect(scoreChunk('capital of France', chunks[2].text)).toBe(2);
    expect(scoreChunk('capital of France', chunks[0].text)).toBe(0);
  });
  it('returns the top k chunk ids best first, ties by order', () => {
    expect(topK('Paris capital', chunks, 2)).toEqual(['c', 'b']);
    expect(topK('xyz', chunks, 2)).toEqual(['a', 'b']);
  });
});

describe('checkLlm', () => {
  it('tokenizer lab passes when the sentence has exactly the target token count', () => {
    const ex: LlmEx = { kind: 'llm-lab', lab: 'tokenizer', id: 'x', conceptId: 'c', prompt: 'p', targetCount: 6, solution: 'the cat sat on the mat', hint: 'h' };
    expect(checkLlm(ex, 'the cat sat on the mat')).toBe(true);
    expect(checkLlm(ex, 'the cat')).toBe(false);
  });
  it('embeddings lab passes for the nearest option', () => {
    const ex: LlmEx = { kind: 'llm-lab', lab: 'embeddings', id: 'x', conceptId: 'c', prompt: 'p', anchor: 'puppy', options: ['banana', 'dog', 'car'], hint: 'h' };
    expect(checkLlm(ex, 'dog')).toBe(true);
    expect(checkLlm(ex, 'car')).toBe(false);
  });
  it('retrieval lab compares the chosen ids as a set', () => {
    const ex: LlmEx = { kind: 'llm-lab', lab: 'retrieval', id: 'x', conceptId: 'c', prompt: 'p', query: 'Paris capital', k: 2, hint: 'h',
      chunks: [{ id: 'a', text: 'Cats sleep' }, { id: 'b', text: 'Eiffel Tower in Paris' }, { id: 'c', text: 'Paris is the capital' }] };
    expect(checkLlm(ex, ['b', 'c'])).toBe(true);
    expect(checkLlm(ex, ['c', 'b'])).toBe(true);
    expect(checkLlm(ex, ['a', 'c'])).toBe(false);
  });
  it('rejects an answer of the wrong type', () => {
    const ex: LlmEx = { kind: 'llm-lab', lab: 'embeddings', id: 'x', conceptId: 'c', prompt: 'p', anchor: 'puppy', options: ['dog', 'car'], hint: 'h' };
    expect(checkLlm(ex, ['dog'])).toBe(false);
  });
});
