import type { TemplateId } from '../paths';

export type SectionKind = 'coding' | 'concepts' | 'design' | 'behavioural';
export type RoundTemplate = { id: TemplateId; title: string; minutes: number; sections: { kind: SectionKind; count: number }[] };

export const TEMPLATES: RoundTemplate[] = [
  { id: 'coding-45', title: 'Coding round', minutes: 45, sections: [{ kind: 'coding', count: 2 }] },
  { id: 'phone-screen', title: 'Phone screen', minutes: 45, sections: [{ kind: 'coding', count: 1 }, { kind: 'concepts', count: 8 }] },
  { id: 'onsite-senior', title: 'Senior onsite (compressed)', minutes: 120, sections: [{ kind: 'coding', count: 2 }, { kind: 'concepts', count: 10 }, { kind: 'design', count: 1 }, { kind: 'behavioural', count: 2 }] },
  { id: 'design-60', title: 'System design round', minutes: 60, sections: [{ kind: 'design', count: 1 }, { kind: 'concepts', count: 6 }] },
  { id: 'behavioural-30', title: 'Behavioural round', minutes: 30, sections: [{ kind: 'behavioural', count: 3 }] },
];
