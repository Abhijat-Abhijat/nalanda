// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MatchPage from './MatchPage';

describe('MatchPage', () => {
  it('shows gaps and a plan for a job description', async () => {
    render(<MemoryRouter><MatchPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Job description'), { target: { value: 'Backend role: Java, Kafka, Kubernetes, AWS, distributed systems.' } });
    await userEvent.click(screen.getByRole('button', { name: 'Analyse' }));
    expect(screen.getByRole('heading', { name: 'Gaps' })).toBeInTheDocument();
    // Once in the gap list, once in the study plan table.
    expect(screen.getAllByText('Kafka and messaging')).toHaveLength(2);
    expect(screen.getAllByRole('row').length).toBeGreaterThan(2);
  });
  it('explains when no skills are recognised', async () => {
    render(<MemoryRouter><MatchPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Job description'), { target: { value: 'Barista needed for weekend shifts.' } });
    await userEvent.click(screen.getByRole('button', { name: 'Analyse' }));
    expect(screen.getByText(/No technical skills recognised/)).toBeInTheDocument();
  });
});
