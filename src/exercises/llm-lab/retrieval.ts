const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'of', 'to', 'in', 'on', 'and', 'for', 'with', 'what', 'how']);

const wordsOf = (s: string): string[] => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

export function scoreChunk(query: string, text: string): number {
  const chunk = new Set(wordsOf(text));
  const q = new Set(wordsOf(query).filter((w) => !STOP.has(w)));
  let n = 0;
  for (const w of q) if (chunk.has(w)) n++;
  return n;
}

export function topK(query: string, chunks: { id: string; text: string }[], k: number): string[] {
  return chunks
    .map((c, i) => ({ id: c.id, i, score: scoreChunk(query, c.text) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, k)
    .map((c) => c.id);
}
