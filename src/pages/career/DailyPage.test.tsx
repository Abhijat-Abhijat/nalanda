// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DailyPage from './DailyPage';
import { useCareer } from '../../career/store';
import type { Task } from '../../schema';

const q = { kind: 'choice', id: 'q', conceptId: 'c', prompt: 'Daily concept?', options: ['yes', 'no'], answer: 0, explain: '' } as unknown as Task;
const loader = async () => ({ coding: [], concepts: [q] });

describe('DailyPage', () => {
  beforeEach(() => { localStorage.clear(); useCareer.getState().resetCareer(); });
  it('shows the concept question for today', async () => {
    render(<MemoryRouter><DailyPage poolsLoader={loader} /></MemoryRouter>);
    expect(await screen.findByText('Daily concept?')).toBeInTheDocument();
    expect(screen.getByText('No coding problem available.')).toBeInTheDocument();
  });
});
