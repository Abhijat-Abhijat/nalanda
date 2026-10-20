import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { catalog } from '../content/catalog';
import { useWorld } from '../content/load';
import { useStore } from '../engine/store';
import { TaskRunner } from '../exercises/registry';
import { WorldStatus } from '../ui/WorldStatus';
import { isBossUnlocked } from '../unlock';

export default function BossPage() {
  const { worldId } = useParams();
  const { answer, attempt, passBoss, progress } = useStore();
  const outline = catalog.find((w) => w.id === worldId);
  const ws = useWorld(outline?.id);
  const [step, setStep] = useState(0);
  const [stepPassed, setStepPassed] = useState(false);
  const [defeated, setDefeated] = useState(false);
  const recorded = useRef(false);

  if (!outline) return <p>Boss not found. <Link to="/">Back to all worlds</Link></p>;
  if (!isBossUnlocked(outline, progress)) {
    return <p>This boss is locked. Pass every chapter exam first. <Link to={`/w/${outline.id}`}>Back to {outline.title}</Link></p>;
  }
  if (ws.status !== 'ready') return <WorldStatus state={ws} />;
  const world = ws.world;
  const steps = world.boss.steps;
  const task = steps[step];
  const last = step === steps.length - 1;

  const onAttempt = (passed: boolean) => {
    attempt(task.id);
    answer(task.conceptId, passed);
    if (!passed) return;
    setStepPassed(true);
    if (last && !recorded.current) { recorded.current = true; passBoss(world.id); setDefeated(true); }
  };
  const next = () => { setStep((s) => s + 1); setStepPassed(false); };

  return (
    <article className="narrow" style={{ ['--hue' as string]: world.hue }}>
      <Link to={`/w/${world.id}`} className="crumb">Back to {world.title}</Link>
      <h1>{world.boss.title}</h1>
      <ol className="boss-steps" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((s, i) => <li key={s.id} className={i < step || (i === step && stepPassed) ? 'done' : i === step ? 'now' : ''}>{i + 1}</li>)}
      </ol>
      <p className="muted">Step {step + 1} of {steps.length}</p>
      <section className="panel"><TaskRunner key={task.id} task={task} onAttempt={onAttempt} /></section>
      {stepPassed && !last && <button type="button" className="primary" onClick={next}>Next step</button>}
      {defeated && <p className="feedback good" role="status">Boss defeated. You cleared this world.</p>}
    </article>
  );
}
