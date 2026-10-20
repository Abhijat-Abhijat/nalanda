export const VOCAB = [
  'un', 'happi', 'ness', 'token', 'ize', 's', 'the', 'cat', 'sat', 'on', 'mat', 'a', 'is', 'learn', 'ing',
  'model', 'data', 'base', 'query', 'quer', 'y', 'hello', 'world', 'ai', 'rag', 'embed', 'ding', 'search',
  'dog', 'run', 'ning',
];

function splitWord(word: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < word.length) {
    let best = '';
    for (const v of VOCAB) if (v.length > best.length && word.startsWith(v, i)) best = v;
    if (best === '') best = word[i];
    out.push(best);
    i += best.length;
  }
  return out;
}

export function tokenize(text: string): string[] {
  const pieces = text.toLowerCase().match(/[a-z]+|\d+|[^\sa-z\d]/g) ?? [];
  return pieces.flatMap((p) => (/^[a-z]+$/.test(p) ? splitWord(p) : [p]));
}
