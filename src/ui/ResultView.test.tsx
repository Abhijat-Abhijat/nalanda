// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResultView } from './ResultView';

describe('ResultView', () => {
  it('shows score, pass line, and weak concepts', () => {
    render(
      <MemoryRouter>
        <ResultView results={[{ conceptId: 'a', correct: true }, { conceptId: 'b', correct: false }]} titleFor={(c) => `Concept ${c}`} linkFor={() => '/x'} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/1 of 2 correct/)).toBeInTheDocument();
    expect(screen.getByText(/not passed yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Concept b' })).toHaveAttribute('href', '/x');
    expect(screen.queryByRole('link', { name: 'Concept a' })).toBeNull();
  });
  it('shows Passed. at 70 percent or more', () => {
    const results = Array.from({ length: 10 }, (_, i) => ({ conceptId: 'a', correct: i < 7 }));
    render(<MemoryRouter><ResultView results={results} titleFor={(c) => c} linkFor={() => '/x'} /></MemoryRouter>);
    expect(screen.getByText('Passed.')).toBeInTheDocument();
  });
});
