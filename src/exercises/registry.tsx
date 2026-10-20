import { lazy, Suspense } from 'react';
import type { Task } from '../schema';
import { QuestionView } from '../ui/QuestionView';

export type RunnerProps<E> = { exercise: E; onAttempt: (passed: boolean) => void };

const SqlRunner = lazy(() => import('./sql-query/Runner'));
const TerminalRunner = lazy(() => import('./terminal/Runner'));
const HttpRunner = lazy(() => import('./http-builder/Runner'));
const JsRunner = lazy(() => import('./js-code/Runner'));
const LlmLab = lazy(() => import('./llm-lab/Lab'));

const Loading = <p>Loading the exercise...</p>;

export function TaskRunner({ task, onAttempt }: { task: Task; onAttempt: (passed: boolean) => void }) {
  switch (task.kind) {
    case 'choice':
    case 'order':
    case 'fill':
      return <QuestionView q={task} onAnswered={onAttempt} allowRetry />;
    case 'sql-query':
      return <Suspense fallback={Loading}><SqlRunner exercise={task} onAttempt={onAttempt} /></Suspense>;
    case 'terminal':
      return <Suspense fallback={Loading}><TerminalRunner exercise={task} onAttempt={onAttempt} /></Suspense>;
    case 'http-builder':
      return <Suspense fallback={Loading}><HttpRunner exercise={task} onAttempt={onAttempt} /></Suspense>;
    case 'js-code':
      return <Suspense fallback={Loading}><JsRunner exercise={task} onAttempt={onAttempt} /></Suspense>;
    case 'llm-lab':
      return <Suspense fallback={Loading}><LlmLab exercise={task} onAttempt={onAttempt} /></Suspense>;
  }
}
