// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InterviewRun from './InterviewRun';
import { useCareer } from '../../career/store';
import type { Task } from '../../schema';

const q = (id: string) => ({ kind: 'choice', id, conceptId: 'c', prompt: `Question ${id}`, options: ['right', 'wrong'], answer: 0, explain: '' }) as unknown as Task;
const loader = async () => ({ coding: [], concepts: ['a', 'b', 'c', 'd', 'e', 'f'].map(q) });
const run = (path = '/career/interview/design-60/42') => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/career/interview/:templateId/:seed" element={<InterviewRun poolsLoader={loader} />} /></Routes>
  </MemoryRouter>,
);

describe('InterviewRun', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); useCareer.getState().resetCareer(); });
  afterEach(() => vi.useRealTimers());
  it('runs a round and records one result with a debrief', async () => {
    run();
    expect(await screen.findByText(/Question 1 of 7/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: /Clarified requirements/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish round' }));
    expect(await screen.findByRole('heading', { name: /Your score/ })).toBeInTheDocument();
    const [r] = useCareer.getState().data.interviews;
    expect(r).toMatchObject({ template: 'design-60', seed: 42 });
    expect(r.sections.find((s) => s.kind === 'design')?.selfScore).toBe(1);
    expect(useCareer.getState().data.activity.map((a) => a.kind)).toEqual(['interview']);
  });
  it('finishes once on time-up', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    run();
    await screen.findByText(/Question 1 of 7/);
    // Flush effects so the countdown interval exists, then jump past the 60-minute limit and let one tick notice it.
    await act(async () => {});
    await act(async () => { vi.setSystemTime(Date.now() + 61 * 60 * 1000); vi.advanceTimersByTime(1000); });
    expect(await screen.findByRole('heading', { name: /Your score/ })).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(useCareer.getState().data.interviews).toHaveLength(1);
  });
  it('keeps the clock running across a reload', async () => {
    sessionStorage.setItem('nalanda.interview.design-60.42', String(Date.now() - 61 * 60 * 1000));
    run();
    expect(await screen.findByRole('heading', { name: /Your score/ })).toBeInTheDocument();
    expect(useCareer.getState().data.interviews).toHaveLength(1);
  });
  it('announces the final minute', async () => {
    sessionStorage.setItem('nalanda.interview.design-60.42', String(Date.now() - 59 * 60 * 1000 - 5000));
    run();
    expect(await screen.findByText('1 minute left')).toBeInTheDocument();
  });
  it('shows a message for an unknown template', () => {
    run('/career/interview/nope/1');
    expect(screen.getByText('That interview round does not exist.')).toBeInTheDocument();
  });
});
