import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { catalog } from '../content/catalog';
import { useWorld } from '../content/load';
import { useStore } from '../engine/store';
import { WorldStatus } from '../ui/WorldStatus';
import { drawExam, scoreExam } from '../engine/exam';
import { conceptTitle, lessonPathForConcept } from '../engine/lookup';
import { QuestionView } from '../ui/QuestionView';
import { ResultView } from '../ui/ResultView';
import { chapterKey, isExamUnlocked } from '../unlock';

export default function ExamPage() {
  const { worldId, chapterId } = useParams();
  const { answer, passExam, progress } = useStore();
  const outline = catalog.find((w) => w.id === worldId);
  const ci = outline ? outline.chapters.findIndex((c) => c.id === chapterId) : -1;
  const ws = useWorld(ci >= 0 ? worldId : undefined);
  const world = ws.status === 'ready' ? ws.world : undefined;
  const chapter = world?.chapters.find((c) => c.id === chapterId);
  const [round, setRound] = useState(0);
  const draw = useMemo(() => (chapter ? drawExam(chapter.exam, 8) : []), [chapter, round]);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const recorded = useRef(false);

  const complete = draw.length > 0 && Object.keys(results).length === draw.length;
  useEffect(() => {
    if (!complete || !world || !chapter) return;
    const score = scoreExam(draw.map((q) => results[q.id]));
    if (score.passed && !recorded.current) {
      recorded.current = true;
      passExam(chapterKey(world.id, chapter.id), score.pct);
    }
  }, [complete, draw, results, world, chapter, passExam]);

  if (!outline || ci < 0) return <p>Exam not found. <Link to="/">Back to all worlds</Link></p>;
  if (!isExamUnlocked(outline, ci, progress)) {
    return <p>This exam is locked. Finish every lesson in the chapter first. <Link to={`/w/${outline.id}`}>Back to {outline.title}</Link></p>;
  }
  if (!world || !chapter) return <WorldStatus state={ws} />;

  const retake = () => { setRound((r) => r + 1); setResults({}); recorded.current = false; };

  return (
    <article className="narrow" style={{ ['--hue' as string]: world.hue }}>
      <Link to={`/w/${world.id}`} className="crumb">Back to {world.title}</Link>
      <h1>{chapter.title}: exam</h1>
      <p className="lede">Eight questions drawn from this chapter. Score 70% to pass.</p>
      <p className="counter" aria-live="polite">{Object.keys(results).length} of {draw.length} answered</p>
      {draw.map((q) => (
        <QuestionView
          key={`${round}-${q.id}`} q={q}
          onAnswered={(ok) => { answer(q.conceptId, ok); setResults((r) => ({ ...r, [q.id]: ok })); }}
        />
      ))}
      {complete && (
        <>
          <ResultView
            results={draw.map((q) => ({ conceptId: q.conceptId, correct: results[q.id] }))}
            titleFor={(id) => conceptTitle(catalog, id)}
            linkFor={(id) => lessonPathForConcept(catalog, id)}
          />
          <button type="button" onClick={retake}>Retake exam</button>
        </>
      )}
    </article>
  );
}
