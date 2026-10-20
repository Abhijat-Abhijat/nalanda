// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ExamPage from './ExamPage';
import BossPage from './BossPage';
import { useStore } from '../engine/store';
import { emptyProgress } from '../engine/progress';

beforeEach(() => useStore.setState({ progress: emptyProgress() }));

describe('locked pages', () => {
  it('does not open a locked exam by URL', () => {
    render(
      <MemoryRouter initialEntries={['/w/sql/asking-questions/exam']}>
        <Routes><Route path="/w/:worldId/:chapterId/exam" element={<ExamPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/this exam is locked/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check answer' })).toBeNull();
  });
  it('does not open a locked boss by URL', () => {
    render(
      <MemoryRouter initialEntries={['/w/sql/boss']}>
        <Routes><Route path="/w/:worldId/boss" element={<BossPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/this boss is locked/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check answer' })).toBeNull();
  });
});
