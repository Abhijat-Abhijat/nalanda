// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MockInterviewPage, { requestFeedback } from './MockInterviewPage';
import { useCareer } from '../../career/store';

const req = { promptId: 'd-url', answer: 'x'.repeat(60) };
const res = (body: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body });

describe('requestFeedback', () => {
  it('returns validated feedback', async () => {
    const f = res({ scores: [4, 4, 4, 4], overall: 1, strengths: [], improvements: [], summary: 's' });
    expect((await requestFeedback('https://x', req, f as never)).overall).toBe(100);
  });
  it('falls back on malformed response', async () => {
    await expect(requestFeedback('https://x', req, res({ scores: 'nope' }) as never)).rejects.toThrow('bad_response');
  });
  it('reports unavailable on HTTP and network errors', async () => {
    await expect(requestFeedback('https://x', req, res({}, false) as never)).rejects.toThrow('unavailable');
    await expect(requestFeedback('https://x', req, vi.fn().mockRejectedValue(new TypeError('fetch failed')) as never)).rejects.toThrow('unavailable');
  });
});

describe('MockInterviewPage', () => {
  beforeEach(() => { localStorage.clear(); useCareer.getState().resetCareer(); });
  it('lets the learner retry AI feedback after a failure', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    render(<MemoryRouter><MockInterviewPage endpoint="https://x" /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: 'x'.repeat(60) } });
    await userEvent.click(screen.getByRole('button', { name: 'Get AI feedback' }));
    expect(await screen.findByText('AI feedback is unavailable right now. Score yourself with the rubric instead.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try AI again' }));
    expect(screen.getByRole('button', { name: 'Get AI feedback' })).toBeInTheDocument();
    f.mockRestore();
  });
  it('offers self-assessment when no backend is configured', async () => {
    render(<MemoryRouter><MockInterviewPage /></MemoryRouter>);
    expect(screen.getByText('AI feedback is unavailable right now. Score yourself with the rubric instead.')).toBeInTheDocument();
    const boxes = screen.getAllByRole('checkbox');
    await userEvent.click(boxes[0]);
    await userEvent.click(boxes[1]);
    expect(screen.getByText('Self-score: 2 of 4')).toBeInTheDocument();
  });
});
