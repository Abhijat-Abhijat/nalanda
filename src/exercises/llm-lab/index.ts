import type { LlmEx } from '../../schema';
import { tokenize } from './tokenizer';
import { nearest } from './embeddings';
import { topK } from './retrieval';

export function checkLlm(ex: LlmEx, answer: string | string[]): boolean {
  switch (ex.lab) {
    case 'tokenizer':
      return typeof answer === 'string' && tokenize(answer).length === ex.targetCount;
    case 'embeddings':
      return typeof answer === 'string' && answer === nearest(ex.anchor, ex.options);
    case 'retrieval': {
      if (!Array.isArray(answer)) return false;
      const want = new Set(topK(ex.query, ex.chunks, ex.k));
      const got = new Set(answer);
      return want.size === got.size && [...want].every((id) => got.has(id));
    }
  }
}
