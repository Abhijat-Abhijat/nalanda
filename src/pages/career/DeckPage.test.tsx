// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DeckPage from './DeckPage';
import { useCareer } from '../../career/store';
import { DECK_CARDS } from '../../career/deck-data';

describe('DeckPage', () => {
  beforeEach(() => { localStorage.clear(); useCareer.getState().resetCareer(); });
  it('reviews a card and schedules it', async () => {
    render(<MemoryRouter initialEntries={['/career/deck?role=backend']}><DeckPage /></MemoryRouter>);
    const first = DECK_CARDS.find((c) => c.role === 'backend')!;
    expect(screen.getByText(first.q)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(screen.getByText(first.a)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'I knew it' }));
    expect(useCareer.getState().data.deck.find((c) => c.id === first.id)?.box).toBe(2);
  });
  it('switches roles', async () => {
    render(<MemoryRouter initialEntries={['/career/deck']}><DeckPage /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'behavioural' }));
    expect(screen.getByText(DECK_CARDS.find((c) => c.role === 'behavioural')!.q)).toBeInTheDocument();
  });
});
