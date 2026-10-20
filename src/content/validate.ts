import { parseSig, jsParamNames } from '../runners/sig';
import type { World, Task } from '../schema';

export function validateWorlds(worlds: World[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const claim = (id: string, where: string) => {
    if (seen.has(id)) errors.push(`duplicate id "${id}" at ${where}`);
    seen.add(id);
  };
  const checkTask = (t: Task, where: string, allowed?: Set<string>) => {
    claim(t.id, where);
    if (allowed && !allowed.has(t.conceptId)) errors.push(`conceptId "${t.conceptId}" not in conceptIds at ${where}`);
    if (t.kind === 'choice' && t.answer >= t.options.length) errors.push(`answer index out of range at ${where}`);
    if (t.kind === 'fill' && !t.prompt.includes('___')) errors.push(`fill prompt needs a blank (___) at ${where}`);
    if (t.kind === 'order' && new Set(t.items).size !== t.items.length) errors.push(`order items must be unique at ${where}`);
    if (t.kind === 'js-code' && t.langs?.includes('py') && !t.py?.solution) errors.push(`python exercise needs py.solution at ${where}`);
    if (t.kind === 'js-code' && (t.langs?.includes('java') || t.langs?.includes('cpp'))) {
      if (!t.sig) errors.push(`exercise needs sig at ${where}`);
      else {
        try {
          const n = parseSig(t.sig).params.length;
          if (n !== jsParamNames(t.fnName, t.starter).length) errors.push(`sig parameter count differs from JS at ${where}`);
        } catch (e) { errors.push(`${(e as Error).message} at ${where}`); }
      }
      if (t.langs.includes('java') && !t.java?.solution) errors.push(`exercise needs java.solution at ${where}`);
      if (t.langs.includes('cpp') && !t.cpp?.solution) errors.push(`exercise needs cpp.solution at ${where}`);
    }
  };
  const worldIds = new Set<string>();
  for (const w of worlds) {
    if (worldIds.has(w.id)) errors.push(`duplicate id "${w.id}" at world`);
    worldIds.add(w.id);
    const chapterIds = new Set<string>();
    for (const c of w.chapters) {
      if (chapterIds.has(c.id)) errors.push(`duplicate id "${c.id}" at ${w.id}`);
      chapterIds.add(c.id);
      const lessonIds = new Set<string>();
      const chapterConcepts = new Set<string>();
      for (const l of c.lessons) {
        if (lessonIds.has(l.id)) errors.push(`duplicate id "${l.id}" at ${w.id}/${c.id}`);
        lessonIds.add(l.id);
        l.conceptIds.forEach((x) => chapterConcepts.add(x));
        const allowed = new Set(l.conceptIds);
        const where = `${w.id}/${c.id}/${l.id}`;
        checkTask(l.exercise, `${where} exercise`, allowed);
        l.quiz.forEach((q, i) => checkTask(q, `${where} quiz ${i}`, allowed));
      }
      c.exam.forEach((q, i) => checkTask(q, `${w.id}/${c.id} exam ${i}`, chapterConcepts));
    }
    w.boss.steps.forEach((s, i) => checkTask(s, `${w.id} boss step ${i}`));
  }
  return errors;
}
