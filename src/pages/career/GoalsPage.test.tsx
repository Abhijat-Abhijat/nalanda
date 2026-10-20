// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import GoalsPage from './GoalsPage';
import { useCareer } from '../../career/store';

describe('GoalsPage', () => {
  beforeEach(() => { localStorage.clear(); useCareer.getState().resetCareer(); });
  it('shows this week against goals and edits a goal', async () => {
    useCareer.getState().log('interview');
    render(<MemoryRouter><GoalsPage /></MemoryRouter>);
    expect(screen.getByText('1 of 1 interview rounds')).toBeInTheDocument();
    const input = screen.getByLabelText('Lessons per week');
    await userEvent.clear(input);
    await userEvent.type(input, '8');
    expect(useCareer.getState().data.goals.lessons).toBe(8);
  });
});
