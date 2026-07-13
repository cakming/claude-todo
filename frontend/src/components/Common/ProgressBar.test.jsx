import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from './ProgressBar.jsx';

describe('ProgressBar', () => {
  test('shows an empty state when there are no items', () => {
    render(<ProgressBar progress={{ total: 0, completed: 0, percentage: 0 }} />);
    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });

  test('renders the completed/total count and percentage', () => {
    render(<ProgressBar progress={{ total: 4, completed: 3, percentage: 75 }} />);
    expect(screen.getByText('3 / 4 completed')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
