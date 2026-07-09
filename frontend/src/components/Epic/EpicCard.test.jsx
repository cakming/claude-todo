import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EpicCard from './EpicCard.jsx';

const epic = {
  _id: 'e1',
  title: 'Checkout',
  desc: 'Checkout flow',
  status: 'in_progress',
  progress: { total: 3, completed: 1, percentage: 33 },
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z'
};

function renderCard(overrides = {}) {
  const handlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onExpand: vi.fn(),
    ...overrides
  };
  render(<EpicCard epic={epic} {...handlers} />);
  return handlers;
}

describe('EpicCard', () => {
  test('renders the title, status badge, and feature count', () => {
    renderCard();
    expect(screen.getByRole('heading', { name: /Checkout/ })).toBeInTheDocument();
    expect(screen.getByText('Checkout flow')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('3 features')).toBeInTheDocument();
  });

  test('the actions menu is hidden until toggled, then Edit fires onEdit', () => {
    const { onEdit } = renderCard();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('⋯'));
    fireEvent.click(screen.getByText('Edit'));

    expect(onEdit).toHaveBeenCalledWith(epic);
  });

  test('clicking the card body calls onExpand', () => {
    const { onExpand } = renderCard();
    fireEvent.click(screen.getByText('Checkout flow'));
    expect(onExpand).toHaveBeenCalledWith(epic);
  });
});
