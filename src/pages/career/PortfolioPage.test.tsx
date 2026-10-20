// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PortfolioPage from './PortfolioPage';
import { useCareer } from '../../career/store';

describe('PortfolioPage', () => {
  beforeEach(() => { localStorage.clear(); useCareer.getState().resetCareer(); });
  it('shows an empty state and saves the name', async () => {
    render(<MemoryRouter><PortfolioPage /></MemoryRouter>);
    expect(screen.getByText('No completed lessons yet.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Your name'), 'Asha Rao');
    expect(useCareer.getState().data.resume.name).toBe('Asha Rao');
  });
  it('prints on request', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<MemoryRouter><PortfolioPage /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Print or save as PDF' }));
    expect(print).toHaveBeenCalledOnce();
  });
});
