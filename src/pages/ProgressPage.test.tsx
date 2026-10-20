// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProgressPage from './ProgressPage';
import { useStore } from '../engine/store';

describe('ProgressPage', () => {
  it('lists every badge with earned state', () => {
    render(<MemoryRouter><ProgressPage /></MemoryRouter>);
    expect(screen.getByText('First lesson')).toBeInTheDocument();
    expect(screen.getAllByText(/locked/i).length).toBeGreaterThan(0);
  });
  it('rejects an invalid import file with a clear message', async () => {
    render(<MemoryRouter><ProgressPage /></MemoryRouter>);
    const input = screen.getByLabelText('Import progress') as HTMLInputElement;
    await userEvent.upload(input, new File(['nope'], 'x.json', { type: 'application/json' }));
    expect(await screen.findByText('That file is not a valid Nalanda backup.')).toBeInTheDocument();
  });
  it('imports a valid backup', async () => {
    render(<MemoryRouter><ProgressPage /></MemoryRouter>);
    const good = JSON.stringify({ version: 1, xp: 321, streak: { count: 0, last: null }, lessonsDone: {}, attempts: {}, examsPassed: {}, bossesPassed: {}, history: {}, review: [], badges: [], perfectQuizzes: 0, reviewCleared: 0 });
    await userEvent.upload(screen.getByLabelText('Import progress'), new File([good], 'x.json', { type: 'application/json' }));
    expect(await screen.findByText('Imported.')).toBeInTheDocument();
    expect(useStore.getState().progress.xp).toBe(321);
  });
});
