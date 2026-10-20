import type { Boss } from '../../schema';

export const aiBoss: Boss = {
  id: 'ai-boss',
  title: 'Build a tiny question-answering flow',
  steps: [
    {
      kind: 'js-code', id: 'ai-boss-1', conceptId: 'rag', fnName: 'overlap',
      prompt: 'Write a function overlap(a, b) that returns how many distinct words appear in both strings. Ignore capital letters.',
      starter: 'function overlap(a, b) {\n  // your code\n}',
      cases: [
        { args: ['the cat sat', 'a cat on the mat'], expect: 2 },
        { args: ['x y', 'z'], expect: 0 },
        { args: ['Cat cat', 'CAT'], expect: 1 },
      ],
      solution: 'function overlap(a,b){const A=new Set(a.toLowerCase().split(/\\s+/).filter(Boolean));const B=new Set(b.toLowerCase().split(/\\s+/).filter(Boolean));let n=0;for(const w of A)if(B.has(w))n++;return n}',
      hint: 'Make a set of lowercase words for each string, then count the words that are in both.',
    },
    {
      kind: 'llm-lab', lab: 'retrieval', id: 'ai-boss-2', conceptId: 'chunking',
      prompt: 'A reader asks: how do I borrow books? Pick the two library chunks that help most.',
      query: 'borrow books', k: 2, hint: 'Look for chunks that share the words in the question.',
      chunks: [
        { id: 'hours', text: 'The library opens at nine and closes at five' },
        { id: 'limit', text: 'You may borrow five books at a time' },
        { id: 'renew', text: 'You may renew borrowed books online' },
        { id: 'address', text: 'The library is on Maple Street' },
      ],
    },
    {
      kind: 'order', id: 'ai-boss-3', conceptId: 'tokens',
      prompt: 'Put the parts of the prompt in the order a RAG system builds them.',
      items: ['System: answer only from the context', 'Context: the retrieved chunks', "Question: the user's question"],
      explain: 'Instructions first, then the facts, then the question.',
    },
  ],
};
