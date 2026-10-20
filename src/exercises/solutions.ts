import type { Task } from '../schema';
import { checkQuestion } from './quiz';
import { checkSql } from './sql-query/sqlRunner';
import { checkTerminal } from './terminal/checks';
import { checkHttp } from './http-builder/http';
import { runCases } from './js-code/runCases';
import { stripTypes } from '../runners/ts/strip';
import { checkLlm } from './llm-lab';
import { nearest } from './llm-lab/embeddings';
import { topK } from './llm-lab/retrieval';

export async function solutionPasses(task: Task): Promise<boolean> {
  switch (task.kind) {
    case 'choice': return checkQuestion(task, task.answer);
    case 'order': return checkQuestion(task, task.items);
    case 'fill': return checkQuestion(task, task.answers[0]);
    case 'sql-query': return (await checkSql(task, task.solution)).passed;
    case 'terminal': return checkTerminal(task, task.solution).passed;
    case 'http-builder': return checkHttp(task, task.solution).passed;
    case 'js-code':
      return runCases(task.solution, task.fnName, task.cases).passed
        && (!task.langs?.includes('ts') || runCases(stripTypes(task.solution), task.fnName, task.cases).passed);
    case 'llm-lab':
      switch (task.lab) {
        case 'tokenizer': return checkLlm(task, task.solution);
        case 'embeddings': return checkLlm(task, nearest(task.anchor, task.options));
        case 'retrieval': return checkLlm(task, topK(task.query, task.chunks, task.k));
      }
  }
}
