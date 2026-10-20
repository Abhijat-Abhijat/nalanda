import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { catalog } from '../content/catalog';
import { useWorld } from '../content/load';
import { useStore } from '../engine/store';
import { WorldStatus } from '../ui/WorldStatus';
import { Blocks } from '../ui/Story';
import { Layers } from '../ui/Layers';
import { QuestionView } from '../ui/QuestionView';
import { TaskRunner } from '../exercises/registry';
import { isLessonUnlocked, lessonKey } from '../unlock';

// Keyed by route so moving to the next lesson starts with fresh state instead of inheriting the last lesson's progress.
export default function LessonPage() {
  const { worldId, chapterId, lessonId } = useParams();
  return <LessonView key={`${worldId}/${chapterId}/${lessonId}`} />;
}

const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function LessonView() {
  const { worldId, chapterId, lessonId } = useParams();
  const nav = useNavigate();
  const { answer, attempt, completeLesson, progress } = useStore();
  // The outline decides "not found" and "locked" instantly; the lesson body loads with its world.
  const outline = catalog.find((w) => w.id === worldId);
  const ci = outline ? outline.chapters.findIndex((c) => c.id === chapterId) : -1;
  const li = outline && ci >= 0 ? outline.chapters[ci].lessons.findIndex((l) => l.id === lessonId) : -1;
  const ws = useWorld(li >= 0 ? worldId : undefined);
  const world = ws.status === 'ready' ? ws.world : undefined;
  const chapter = world?.chapters[ci];
  const lesson = chapter?.lessons[li];
  const tries = useRef(0);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [firstTry, setFirstTry] = useState(false);
  const [quiz, setQuiz] = useState<Record<string, boolean>>({});

  if (!outline || li < 0) return <p>Lesson not found. <Link to="/">Back to all worlds</Link></p>;
  if (!isLessonUnlocked(outline, ci, li, progress)) {
    return <p>This lesson is locked. Finish the earlier lessons and exams first. <Link to={`/w/${outline.id}`}>Back to {outline.title}</Link></p>;
  }
  if (!world || !chapter || !lesson) return <WorldStatus state={ws} />;

  const quizCorrect = Object.values(quiz).filter(Boolean).length;
  const quizCount = Object.keys(quiz).length;
  const quizAnswered = quizCount === lesson.quiz.length;
  const quizOk = quizAnswered && quizCorrect / lesson.quiz.length >= 0.6;

  const onAttempt = (passed: boolean) => {
    tries.current += 1;
    attempt(lesson.exercise.id);
    answer(lesson.exercise.conceptId, passed);
    if (passed && !exerciseDone) { setExerciseDone(true); setFirstTry(tries.current === 1); }
  };
  const next = chapter.lessons[li + 1];
  const finish = () => {
    completeLesson(lessonKey(world.id, chapter.id, lesson.id), { exerciseFirstTry: firstTry, quizCorrect, quizTotal: lesson.quiz.length });
    nav(next ? `/w/${world.id}/${chapter.id}/${next.id}` : `/w/${world.id}`);
  };

  return (
    <div className="lesson-layout" style={{ ['--hue' as string]: world.hue }}>
      <aside className="lesson-rail" aria-label="Lesson outline">
        <Link to={`/w/${world.id}`} className="crumb">Back to {world.title}</Link>
        <p className="rail-chapter">{chapter.title}</p>
        <p className="rail-lesson">Lesson {li + 1} of {chapter.lessons.length}</p>
        <ol className="rail-steps">
          <li><button type="button" onClick={() => jump('story')}><span className="dot" aria-hidden="true" />Story</button></li>
          <li><button type="button" onClick={() => jump('closer')}><span className="dot" aria-hidden="true" />Look closer</button></li>
          <li><button type="button" onClick={() => jump('tryit')}><span className={exerciseDone ? 'dot done' : 'dot'} aria-hidden="true" />Try it{exerciseDone ? ' (done)' : ''}</button></li>
          <li><button type="button" onClick={() => jump('check')}><span className={quizAnswered ? 'dot done' : 'dot'} aria-hidden="true" />Quiz, {quizCount} of {lesson.quiz.length}</button></li>
        </ol>
      </aside>

      <article className="lesson">
        <p className="lesson-crumb"><Link to={`/w/${world.id}`}>{world.title}</Link> / {chapter.title} / Lesson {li + 1} of {chapter.lessons.length}</p>
        <h1>{lesson.title}</h1>
        <section id="story" aria-label="Story" className="panel">
          <h2>The story</h2>
          <Blocks blocks={lesson.story} />
        </section>
        <div id="closer"><Layers layers={lesson.layers} /></div>
        <section id="tryit" aria-label="Try it" className="panel panel-raised">
          <h2>Try it</h2>
          <TaskRunner key={lesson.exercise.id} task={lesson.exercise} onAttempt={onAttempt} />
          {exerciseDone && <p className="feedback good" role="status">Exercise complete.</p>}
        </section>
        <section id="check" aria-label="Check" className="panel">
          <h2>Check</h2>
          {lesson.quiz.map((q) => (
            <QuestionView key={q.id} q={q} onAnswered={(ok) => { answer(q.conceptId, ok); setQuiz((s) => ({ ...s, [q.id]: ok })); }} />
          ))}
        </section>
        <div className="lesson-actions">
          <button type="button" className="primary big" disabled={!(exerciseDone && quizOk)} onClick={finish}>
            {next ? 'Next lesson' : 'Finish chapter lessons'}
          </button>
          {!(exerciseDone && quizOk) && <p className="muted">Finish the exercise and score at least 60% on the quiz to continue.</p>}
          {quizAnswered && !quizOk && <p className="feedback bad">You need at least 60% on the quiz. Reload the lesson to try again.</p>}
        </div>
      </article>
    </div>
  );
}
