// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionView } from './QuestionView';
import type { ChoiceQ, OrderQ, FillQ } from '../schema';

const choice: ChoiceQ = { kind: 'choice', id: 'a', conceptId: 'c', prompt: 'Pick one', options: ['wrong', 'right'], answer: 1, explain: 'Because right.' };
const order: OrderQ = { kind: 'order', id: 'b', conceptId: 'c', prompt: 'Order these', items: ['first', 'second'], explain: 'Time order.' };
const fill: FillQ = { kind: 'fill', id: 'c', conceptId: 'c', prompt: 'Code ___', answers: ['404'], explain: 'Not found.' };

describe('QuestionView', () => {
  it('shuffles choice options so the right answer is not always first, and still scores correctly', async () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const onAnswered = vi.fn();
    render(<QuestionView q={choice} onAnswered={onAnswered} />);
    const labels = screen.getAllByRole('radio').map((r) => r.parentElement!.textContent!.trim());
    expect(labels).toEqual(['right', 'wrong']);
    await userEvent.click(screen.getByLabelText('right'));
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(onAnswered).toHaveBeenCalledWith(true);
    spy.mockRestore();
  });
  it('offers Try again after a wrong answer only when retry is allowed', async () => {
    const onAnswered = vi.fn();
    const { unmount } = render(<QuestionView q={choice} onAnswered={onAnswered} allowRetry />);
    await userEvent.click(screen.getByLabelText('wrong'));
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    await userEvent.click(screen.getByLabelText('right'));
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(onAnswered).toHaveBeenLastCalledWith(true);
    unmount();

    render(<QuestionView q={choice} onAnswered={() => {}} />);
    await userEvent.click(screen.getByLabelText('wrong'));
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });
  it('reports a correct choice and shows the explanation', async () => {
    const onAnswered = vi.fn();
    render(<QuestionView q={choice} onAnswered={onAnswered} />);
    await userEvent.click(screen.getByLabelText('right'));
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(onAnswered).toHaveBeenCalledWith(true);
    expect(screen.getByText('Because right.')).toBeInTheDocument();
  });
  it('disables checking until something is chosen', () => {
    render(<QuestionView q={choice} onAnswered={() => {}} />);
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
  });
  it('reports a wrong fill answer', async () => {
    const onAnswered = vi.fn();
    render(<QuestionView q={fill} onAnswered={onAnswered} />);
    await userEvent.type(screen.getByRole('textbox'), '500');
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(onAnswered).toHaveBeenCalledWith(false);
  });
  it('shows a shuffled order that differs from the answer, and the learner can fix it', async () => {
    const onAnswered = vi.fn();
    render(<QuestionView q={order} onAnswered={onAnswered} />);
    const names = () => screen.getAllByRole('listitem').map((li) => li.querySelector('span')!.textContent);
    expect(names()).toEqual(['second', 'first']);
    await userEvent.click(screen.getByRole('button', { name: 'Move up first' }));
    expect(names()).toEqual(['first', 'second']);
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(onAnswered).toHaveBeenCalledWith(true);
  });
});
