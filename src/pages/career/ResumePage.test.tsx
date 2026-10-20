// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResumePage from './ResumePage';
import { useCareer } from '../../career/store';

describe('ResumePage', () => {
  beforeEach(() => { localStorage.clear(); useCareer.getState().resetCareer(); });
  it('adds a bullet from a project template and shows the placeholder issue', async () => {
    render(<MemoryRouter><ResumePage /></MemoryRouter>);
    await userEvent.selectOptions(screen.getByLabelText('Start from a project'), 'raft-kv');
    expect(useCareer.getState().data.resume.bullets).toHaveLength(1);
    expect(screen.getByText('Replace the bracketed placeholder with a real value.')).toBeInTheDocument();
  });
  it('parses skills into a unique list on blur', async () => {
    render(<MemoryRouter><ResumePage /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText('Skills (comma separated)'), 'Go, Kafka, go , Kafka');
    await userEvent.tab();
    expect(useCareer.getState().data.resume.skills).toEqual(['Go', 'Kafka']);
  });
});
