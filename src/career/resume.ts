import type { CareerData } from './schema';

export type LintIssue = 'placeholder' | 'no-number' | 'weak-start' | 'too-long' | 'too-short' | 'first-person';
export const ISSUE_TEXT: Record<LintIssue, string> = {
  placeholder: 'Replace the bracketed placeholder with a real value.',
  'no-number': 'Add a measured result (a number, percentage, or time).',
  'weak-start': 'Start with a strong action verb such as Built, Cut, Led, or Designed.',
  'too-long': 'Keep bullets under about 220 characters.',
  'too-short': 'Add what you did and the result it had.',
  'first-person': 'Drop I, me, and my; resumes use implied first person.',
};
const WEAK = new Set(['responsible', 'worked', 'helped', 'assisted', 'participated', 'involved', 'tasked', 'duties']);

export function lintBullet(text: string): LintIssue[] {
  const t = text.trim();
  const out: LintIssue[] = [];
  if (/\[[^\]]*\]/.test(t)) out.push('placeholder');
  if (!/\d/.test(t)) out.push('no-number');
  if (WEAK.has((t.split(/\s+/)[0] ?? '').toLowerCase())) out.push('weak-start');
  if (t.length > 220) out.push('too-long');
  if (t.length < 40) out.push('too-short');
  if (/(^|[^A-Za-z])I(?![A-Za-z])/.test(t) || /(^|[^A-Za-z])(me|my)(?![A-Za-z])/i.test(t)) out.push('first-person');
  return out;
}

export function resumeMarkdown(r: CareerData['resume']): string {
  const out = [`# ${r.name || 'Your name'}`];
  if (r.headline) out.push('', r.headline);
  if (r.summary) out.push('', r.summary);
  const bullets = r.bullets.map((b) => b.text.trim()).filter(Boolean);
  if (bullets.length) out.push('', '## Highlights', '', ...bullets.map((b) => `- ${b}`));
  if (r.skills.length) out.push('', '## Skills', '', r.skills.join(', '));
  return out.join('\n') + '\n';
}
