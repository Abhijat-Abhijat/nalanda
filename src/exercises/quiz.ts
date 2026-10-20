import type { Question } from '../schema';

export const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export function checkQuestion(q: Question, answer: number | string[] | string): boolean {
  switch (q.kind) {
    case 'choice':
      return typeof answer === 'number' && answer === q.answer;
    case 'order':
      return Array.isArray(answer) && answer.length === q.items.length && answer.every((v, i) => v === q.items[i]);
    case 'fill': {
      if (typeof answer !== 'string' || norm(answer) === '') return false;
      return q.answers.some((a) => norm(a) === norm(answer));
    }
  }
}
