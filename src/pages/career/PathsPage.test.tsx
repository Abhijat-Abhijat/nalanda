// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PathsPage from './PathsPage';
import PathDetailPage from './PathDetailPage';
import { useCareer } from '../../career/store';

const app = (at: string) => render(
  <MemoryRouter initialEntries={[at]}>
    <Routes>
      <Route path="/career/paths" element={<PathsPage />} />
      <Route path="/career/paths/:pathId" element={<PathDetailPage />} />
    </Routes>
  </MemoryRouter>,
);

describe('career paths pages', () => {
  beforeEach(() => { localStorage.clear(); useCareer.getState().resetCareer(); });
  it('lists all six paths with 0% Nalanda coverage', () => {
    app('/career/paths');
    expect(screen.getAllByText(/0% Nalanda coverage/)).toHaveLength(6);
  });
  it('lets the learner choose a path and shows the next step', async () => {
    app('/career/paths/backend-senior');
    await userEvent.click(screen.getByRole('button', { name: 'Make this my path' }));
    expect(useCareer.getState().data.pathId).toBe('backend-senior');
    expect(screen.getByText('This is your path.')).toBeInTheDocument();
    const next = screen.getByRole('heading', { name: 'Next step' }).closest('section')!;
    expect(within(next).getByRole('link')).toHaveAttribute('href', '/w/backend');
  });
  it('shows a not-found message for unknown paths', () => {
    app('/career/paths/nope');
    expect(screen.getByText('That career path does not exist.')).toBeInTheDocument();
  });
});
