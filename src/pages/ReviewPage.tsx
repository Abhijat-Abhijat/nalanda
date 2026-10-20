import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalog } from '../content/catalog';
import { loadWorld } from '../content/load';
import { useStore } from '../engine/store';
import { dueItems } from '../engine/review';
import { dayKey } from '../engine/streak';
import { findQuestionsByConcept } from '../engine/lookup';
import type { Question, World } from '../schema';
import { QuestionView } from '../ui/QuestionView';

function buildQueue(worlds: World[], conceptIds: string[]): Question[] {
  const queue: Question[] = [];
  for (const id of conceptIds) {
    const qs = findQuestionsByConcept(worlds, [id]);
    if (qs.length > 0) queue.push(qs[Math.floor(Math.random() * qs.length)]);
  }
  return queue;
}

export default function ReviewPage() {
  const { progress, review } = useStore();
  // Snapshot once: answering changes due dates, and the list must not shift under the learner.
  const [due] = useState(() => dueItems(progress.review, dayKey(new Date())).map((d) => d.conceptId));
  const [queue, setQueue] = useState<Question[] | null>(due.length === 0 ? [] : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (due.length === 0) return;
    let live = true;
    const want = new Set(due);
    // Only download the worlds that own a due concept.
    const ids = catalog.filter((w) => w.chapters.some((c) => c.lessons.some((l) => l.conceptIds.some((id) => want.has(id))))).map((w) => w.id);
    Promise.all(ids.map((id) => loadWorld(id)!))
      .then((ws) => live && setQueue(buildQueue(ws, due)))
      .catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [due]);

  return (
    <article className="narrow">
      <h1>Review pond</h1>
      <p className="lede">Ideas come back here just before you would forget them. Answer right and they return less often.</p>
      {failed && <p className="feedback bad" role="alert">Review questions could not be loaded. Check your connection and reload the page.</p>}
      {!failed && queue === null && <p className="muted" role="status">Loading...</p>}
      {queue?.length === 0 && (
        <section className="empty-card">
          <h2>Nothing due today.</h2>
          <p className="muted">Finish lessons to fill the pond. Come back tomorrow for the next batch.</p>
          <Link className="btn primary" to="/">Back to all worlds</Link>
        </section>
      )}
      {queue?.map((q) => (
        <QuestionView key={q.id} q={q} onAnswered={(ok) => review(q.conceptId, ok)} />
      ))}
    </article>
  );
}
