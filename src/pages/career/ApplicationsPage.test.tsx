// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ApplicationsPage from './ApplicationsPage';
import { useCareer } from '../../career/store';

describe('ApplicationsPage', () => {
  beforeEach(() => { localStorage.clear(); useCareer.getState().resetCareer(); });
  it('adds an application, moves its stage, and logs activity', async () => {
    render(<MemoryRouter><ApplicationsPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'Atlassian' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Senior Software Engineer' } });
    await userEvent.click(screen.getByRole('button', { name: 'Add application' }));
    expect(screen.getByText('Atlassian')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Stage for Atlassian'), 'screen');
    expect(useCareer.getState().data.applications[0].stage).toBe('screen');
    expect(useCareer.getState().data.activity.map((a) => a.kind)).toEqual(['application']);
  });
  it('stops at 500 applications so saved data stays loadable', async () => {
    const a = { company: 'X', role: '', stage: 'applied' as const, applied: '2026-10-01', next: null, notes: '', updated: '2026-10-01' };
    useCareer.setState((s) => ({ data: { ...s.data, applications: Array.from({ length: 500 }, (_, i) => ({ ...a, id: `a${i}` })) } }));
    render(<MemoryRouter><ApplicationsPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'Atlassian' } });
    await userEvent.click(screen.getByRole('button', { name: 'Add application' }));
    expect(screen.getByRole('alert')).toHaveTextContent('You can track up to 500 applications.');
    expect(useCareer.getState().data.applications).toHaveLength(500);
  }, 20_000); // renders 500 cards
  it('requires a company name', async () => {
    render(<MemoryRouter><ApplicationsPage /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Add application' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a company name.');
    expect(useCareer.getState().data.applications).toHaveLength(0);
  });
});
