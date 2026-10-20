import { useParams, Link } from 'react-router-dom';
import { catalog as worlds } from '../content/catalog';
import { useStore } from '../engine/store';
import { MapTrail, type TrailNode } from '../ui/MapTrail';
import { Blocks } from '../ui/Story';
import { WorldIcon } from '../ui/Sketch';
import { isBossUnlocked, isExamUnlocked, isLessonUnlocked, lessonKey, chapterKey } from '../unlock';

export default function WorldMap() {
  const { worldId } = useParams();
  const p = useStore((s) => s.progress);
  const world = worlds.find((w) => w.id === worldId);
  if (!world) return <p>World not found. <Link to="/">Back to all worlds</Link></p>;
  const nodes: TrailNode[] = [];
  world.chapters.forEach((c, ci) => {
    c.lessons.forEach((l, li) => {
      const done = !!p.lessonsDone[lessonKey(world.id, c.id, l.id)];
      nodes.push({ id: l.id, label: l.title, to: `/w/${world.id}/${c.id}/${l.id}`, kind: 'lesson',
        state: done ? 'done' : isLessonUnlocked(world, ci, li, p) ? 'open' : 'locked' });
    });
    const passed = p.examsPassed[chapterKey(world.id, c.id)] !== undefined;
    nodes.push({ id: `${c.id}-exam`, label: `${c.title}: exam`, to: `/w/${world.id}/${c.id}/exam`, kind: 'exam',
      state: passed ? 'done' : isExamUnlocked(world, ci, p) ? 'open' : 'locked' });
  });
  nodes.push({ id: 'boss', label: world.boss.title, to: `/w/${world.id}/boss`, kind: 'boss',
    state: p.bossesPassed[world.id] ? 'done' : isBossUnlocked(world, p) ? 'open' : 'locked' });
  const done = nodes.filter((n) => n.state === 'done').length;
  return (
    <>
      <header className="world-hero" style={{ ['--hue' as string]: world.hue }}>
        <div className="world-hero-text">
          <Link to="/" className="crumb">All worlds</Link>
          <h1>{world.title}</h1>
          <p className="lede">{world.tagline}</p>
          <p className="muted steps-count">{done} of {nodes.length} steps complete</p>
        </div>
        <WorldIcon id={world.id} className="world-hero-icon" />
      </header>
      <div className="world-body">
        <section className="intro" aria-label="About this world"><Blocks blocks={world.intro} /></section>
        <MapTrail nodes={nodes} hue={world.hue} />
      </div>
    </>
  );
}
