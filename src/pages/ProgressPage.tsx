import { useState, type ChangeEvent } from 'react';
import { catalog as worlds } from '../content/catalog';
import { useStore } from '../engine/store';
import { levelForXp } from '../engine/xp';
import { currentStreak, dayKey } from '../engine/streak';
import { exportJson } from '../engine/persistence';
import { lessonKey } from '../unlock';

const BADGES = [
  { id: 'first-lesson', name: 'First lesson', desc: 'Finish your first lesson' },
  { id: 'streak-3', name: 'Three-day streak', desc: 'Learn three days in a row' },
  { id: 'streak-7', name: 'Seven-day streak', desc: 'Learn seven days in a row' },
  { id: 'perfect-quiz', name: 'Perfect quiz', desc: 'Answer every question in a lesson quiz correctly' },
  { id: 'chapter-cleared', name: 'Chapter cleared', desc: 'Pass a chapter exam' },
  { id: 'world-cleared', name: 'World cleared', desc: 'Beat a world boss' },
  { id: 'review-hero', name: 'Review hero', desc: 'Clear 10 items from the Review pond' },
];

export default function ProgressPage() {
  const { progress, importProgress, reset } = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const lv = levelForXp(progress.xp);
  const today = dayKey(new Date());

  const download = () => {
    const blob = new Blob([exportJson(progress)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nalanda-progress.json';
    a.click();
  };
  const onImport = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMessage(importProgress(String(reader.result)) ? 'Imported.' : 'That file is not a valid Nalanda backup.');
    reader.readAsText(file);
    input.value = '';
  };
  const onReset = () => {
    if (window.confirm('Reset all progress? This cannot be undone. Export a backup first if you might want it.')) {
      reset();
      setMessage('Progress reset.');
    }
  };

  return (
    <article className="narrow wide">
      <h1>Your progress</h1>
      <dl className="tiles">
        <div><dt>Level</dt><dd>{lv.level}</dd></div>
        <div><dt>Experience</dt><dd>{progress.xp} XP</dd></div>
        <div><dt>Streak</dt><dd>{currentStreak(progress.streak, today)} {currentStreak(progress.streak, today) === 1 ? 'day' : 'days'}</dd></div>
      </dl>

      <h2>Badges</h2>
      <ul className="badges">
        {BADGES.map((b) => {
          const earned = progress.badges.includes(b.id);
          return (
            <li key={b.id} className={earned ? 'badge earned' : 'badge'}>
              <strong>{b.name}</strong> <span>{b.desc}</span> <em>{earned ? 'Earned' : 'Locked'}</em>
            </li>
          );
        })}
      </ul>

      <h2>Worlds</h2>
      <ul className="world-progress">
        {worlds.map((w) => {
          const total = w.chapters.reduce((n, c) => n + c.lessons.length, 0);
          const done = w.chapters.reduce((n, c) => n + c.lessons.filter((l) => progress.lessonsDone[lessonKey(w.id, c.id, l.id)]).length, 0);
          return (
            <li key={w.id} style={{ ['--hue' as string]: w.hue }}>
              <span className="wp-title">{w.title}</span>
              <span className="bar"><span style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></span>
              <span className="muted">{done} of {total} lessons{progress.bossesPassed[w.id] ? ', boss defeated' : ''}</span>
            </li>
          );
        })}
      </ul>

      <h2>Backup</h2>
      <div className="row">
        <button type="button" onClick={download}>Export progress</button>
        <label className="btn file-label">Import progress <input className="sr-only" type="file" accept="application/json" onChange={onImport} /></label>
        <button type="button" onClick={onReset}>Reset progress</button>
      </div>
      {message && <p role="status">{message}</p>}
    </article>
  );
}
