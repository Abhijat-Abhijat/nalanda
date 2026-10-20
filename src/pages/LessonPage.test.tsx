// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Link, Route, Routes } from 'react-router-dom';
import LessonPage from './LessonPage';
import { useStore } from '../engine/store';
import { emptyProgress } from '../engine/progress';
import { lessonKey } from '../unlock';

beforeEach(() => useStore.setState({ progress: emptyProgress() }));

describe('LessonPage', () => {
  it('starts each lesson with a clean slate', async () => {
    useStore.setState({
      progress: {
        ...emptyProgress(),
        lessonsDone: { [lessonKey('http-web', 'web-arrives', 'l1')]: true },
      },
    });
    render(
      <MemoryRouter initialEntries={['/w/http-web/web-arrives/l1']}>
        <Link to="/w/http-web/web-arrives/l2">go to lesson two</Link>
        <Routes><Route path="/w/:worldId/:chapterId/:lessonId" element={<LessonPage />} /></Routes>
      </MemoryRouter>,
    );
    // The world chunk loads lazily; under a full parallel run that can take several seconds.
    await userEvent.click((await screen.findAllByLabelText('URL, HTTP, and HTML', {}, { timeout: 10_000 }))[0]);
    await userEvent.click(screen.getAllByRole('button', { name: 'Check answer' })[0]);
    expect(await screen.findByText('Exercise complete.', {}, { timeout: 10_000 })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'go to lesson two' }));
    expect(screen.queryByText('Exercise complete.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Next lesson' })).toBeDisabled();
  }, 20_000);

  it('does not open a locked lesson reached by typing its URL', () => {
    render(
      <MemoryRouter initialEntries={['/w/sql/asking-questions/l2']}>
        <Routes><Route path="/w/:worldId/:chapterId/:lessonId" element={<LessonPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/this lesson is locked/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next lesson' })).toBeNull();
  });
});
