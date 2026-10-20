import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DECK_CARDS } from '../../career/deck-data';
import { dueCards, deckStats } from '../../career/deck';
import { DECK_ROLES, type DeckRole } from '../../career/paths';
import { useCareer } from '../../career/store';
import { dayKey } from '../../engine/streak';

const isRole = (r: string | null): r is DeckRole => (DECK_ROLES as readonly string[]).includes(r ?? '');

export default function DeckPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('role');
  const role: DeckRole = isRole(raw) ? raw : 'backend';
  const deck = useCareer((s) => s.data.deck);
  // The queue is fixed per role so answering a card does not reshuffle the session.
  const queue = useMemo(() => dueCards(role, DECK_CARDS, useCareer.getState().data.deck, dayKey(new Date())), [role]);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const stats = deckStats(role, DECK_CARDS, deck);
  const card = queue[i];
  const answer = (ok: boolean) => {
    useCareer.getState().reviewCard(card.id, ok);
    if (i + 1 >= queue.length) useCareer.getState().log('deck');
    setShown(false);
    setI(i + 1);
  };
  return (
    <article className="narrow">
      <h1>Interview deck</h1>
      <div className="role-tabs" role="group" aria-label="Role">
        {DECK_ROLES.map((r) => <button key={r} className={r === role ? 'btn primary' : 'btn'} aria-pressed={r === role} onClick={() => { setParams({ role: r }); setI(0); setShown(false); }}>{r}</button>)}
      </div>
      <p className="muted">{stats.mastered} mastered · {stats.learning} learning · {stats.fresh} new</p>
      {card ? (
        <section className="flashcard">
          <p className="q">{card.q}</p>
          {shown ? (
            <>
              <p>{card.a}</p>
              <button className="btn primary" onClick={() => answer(true)}>I knew it</button>{' '}
              <button className="btn" onClick={() => answer(false)}>I did not know it</button>
            </>
          ) : <button className="btn primary" onClick={() => setShown(true)}>Show answer</button>}
          <p className="muted">Card {i + 1} of {queue.length}</p>
        </section>
      ) : <p>Done for today in this deck. Come back tomorrow, or try another role.</p>}
    </article>
  );
}
