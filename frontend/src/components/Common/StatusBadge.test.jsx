import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge.jsx';

describe('StatusBadge', () => {
  test('renders the human-readable label and status class', () => {
    render(<StatusBadge status="in_progress" />);
    const badge = screen.getByText('In Progress');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-badge', 'status-in-progress');
  });

  test('falls back to the raw status and status-todo class when unknown', () => {
    render(<StatusBadge status="mystery" />);
    const badge = screen.getByText('mystery');
    expect(badge).toHaveClass('status-todo');
  });
});
