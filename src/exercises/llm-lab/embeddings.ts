export const VECTORS: Record<string, number[]> = {
  dog: [0.9, 0.0, 0.1],
  puppy: [0.95, 0.0, 0.05],
  cat: [0.85, 0.05, 0.1],
  apple: [0.0, 0.95, 0.05],
  banana: [0.0, 0.9, 0.1],
  pear: [0.0, 0.92, 0.04],
  car: [0.05, 0.0, 0.95],
  truck: [0.1, 0.0, 0.9],
  bus: [0.1, 0.0, 0.9],
};

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function nearest(anchor: string, options: string[]): string {
  const a = VECTORS[anchor];
  let best = options[0];
  let bestScore = -Infinity;
  for (const o of options) {
    const v = VECTORS[o];
    const score = a && v ? cosine(a, v) : 0;
    if (score > bestScore) { best = o; bestScore = score; }
  }
  return best;
}
