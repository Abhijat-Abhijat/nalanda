import { catalog } from '../../content/catalog';
import { projects } from '../../content/projects';
import type { PathStep } from '../../career/paths';

const TEMPLATE_TITLE: Record<string, string> = {
  'coding-45': 'coding', 'phone-screen': 'phone screen', 'onsite-senior': 'senior onsite', 'design-60': 'system design', 'behavioural-30': 'behavioural',
};

export function stepLabel(s: PathStep): { text: string; to: string } {
  switch (s.kind) {
    case 'chapter': {
      const w = catalog.find((x) => x.id === s.world);
      const c = w?.chapters.find((x) => x.id === s.chapter);
      return { text: `Pass the ${c?.title ?? s.chapter} exam (${w?.title ?? s.world})`, to: `/w/${s.world}` };
    }
    case 'world': return { text: `Defeat the ${catalog.find((x) => x.id === s.world)?.title ?? s.world} boss`, to: `/w/${s.world}` };
    case 'project': return { text: `Ship the project "${projects.find((p) => p.id === s.project)?.title ?? s.project}"`, to: '/projects' };
    case 'interview': return { text: `Pass the ${TEMPLATE_TITLE[s.template]} round ${s.times} times with 70% or more`, to: '/career/interview' };
    case 'deck': return { text: `Master the ${s.role} interview deck`, to: `/career/deck?role=${s.role}` };
  }
}
