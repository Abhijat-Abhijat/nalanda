// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';

describe('Layout footer', () => {
  it('credits CheerpJ', () => {
    render(<MemoryRouter><Routes><Route element={<Layout />}><Route path="/" element={<p>home</p>} /></Route></Routes></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'CheerpJ' });
    expect(link.getAttribute('href')).toBe('https://cheerpj.com');
    expect(screen.getByText(/Java runs in your browser with/)).toBeTruthy();
  });
  it('highlights the Career tab on the projects page', () => {
    render(<MemoryRouter initialEntries={['/projects']}><Routes><Route element={<Layout />}><Route path="/projects" element={<p>projects</p>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Career' }).className).toContain('active');
  });
});
