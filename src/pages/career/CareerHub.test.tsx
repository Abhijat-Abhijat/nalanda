// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CareerHub, { HUB_TOOLS } from './CareerHub';

describe('CareerHub', () => {
  it('links to every career tool and the projects page', () => {
    render(<MemoryRouter><CareerHub /></MemoryRouter>);
    expect(HUB_TOOLS).toHaveLength(12);
    expect(HUB_TOOLS.map((t) => t.to)).toContain('/projects');
    for (const t of HUB_TOOLS) expect(screen.getByRole('link', { name: new RegExp(t.title) })).toHaveAttribute('href', t.to);
  });
});
