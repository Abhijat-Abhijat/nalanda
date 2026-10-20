// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CareerBanner from './CareerBanner';
import { useCareer } from '../../career/store';

describe('CareerBanner', () => {
  beforeEach(() => { localStorage.clear(); useCareer.getState().resetCareer(); });
  it('shows nothing when career data is healthy', () => {
    const { container } = render(<CareerBanner />);
    expect(container).toBeEmptyDOMElement();
  });
  it('offers the unreadable saved data as a download', () => {
    useCareer.setState({ status: 'corrupt', canSave: false, backup: '{"version":1}' });
    render(<CareerBanner />);
    expect(screen.getByRole('status')).toHaveTextContent(/could not be read/);
    expect(screen.getByRole('button', { name: 'Download saved data' })).toBeInTheDocument();
  });
  it('warns when changes are not being saved', () => {
    useCareer.setState({ saveFailed: true });
    render(<CareerBanner />);
    expect(screen.getByRole('status')).toHaveTextContent(/not saved/);
  });
});
