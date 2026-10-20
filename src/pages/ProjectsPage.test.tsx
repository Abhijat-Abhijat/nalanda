// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProjectsPage from './ProjectsPage';
import { useCareer } from '../career/store';

const renderPage = () => render(<MemoryRouter><ProjectsPage /></MemoryRouter>);

describe('ProjectsPage', () => {
  beforeEach(() => { localStorage.clear(); useCareer.getState().resetCareer(); });
  it('migrates statuses from the old key into the career store', () => {
    localStorage.setItem('nalanda-project-status', JSON.stringify({ 'raft-kv': 'shipped' }));
    renderPage();
    expect((screen.getByLabelText('Status for Replicated key-value store on Raft') as HTMLSelectElement).value).toBe('shipped');
    expect(useCareer.getState().data.projects['raft-kv']).toBe('shipped');
    expect(localStorage.getItem('nalanda-project-status')).toBeNull();
  });
  it('keeps old statuses when career data cannot be saved', () => {
    localStorage.setItem('nalanda-project-status', JSON.stringify({ 'raft-kv': 'shipped' }));
    useCareer.setState({ canSave: false });
    renderPage();
    expect(localStorage.getItem('nalanda-project-status')).not.toBeNull();
  });
  it('lists all 30 projects', () => {
    renderPage();
    expect(screen.getByText('30 of 30 projects shown')).toBeInTheDocument();
    expect(screen.getByText('Replicated key-value store on Raft')).toBeInTheDocument();
  });
  it('filters by track and by search', async () => {
    renderPage();
    await userEvent.selectOptions(screen.getByLabelText(/Track/), 'AI and ML');
    expect(screen.getByText('6 of 30 projects shown')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Search/), 'zzz-no-match');
    expect(screen.getByText('No projects match these filters.')).toBeInTheDocument();
  });
  it('remembers project status', async () => {
    const { unmount } = renderPage();
    await userEvent.selectOptions(screen.getByLabelText('Status for Replicated key-value store on Raft'), 'shipped');
    expect(screen.getAllByText('Shipped').length).toBeGreaterThan(0);
    unmount();
    renderPage();
    expect((screen.getByLabelText('Status for Replicated key-value store on Raft') as HTMLSelectElement).value).toBe('shipped');
  });
});
