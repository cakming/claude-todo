import { describe, test, expect } from 'vitest';
import {
  truncate,
  getStatusClass,
  getStatusDisplay,
  calculateProgress,
  hasBlockedChildren,
  sortByStatusPriority,
  filterByQuery
} from './helpers.js';

describe('truncate', () => {
  test('leaves short text untouched and truncates long text with an ellipsis', () => {
    expect(truncate('short', 100)).toBe('short');
    expect(truncate('abcdef', 3)).toBe('abc...');
    expect(truncate('', 5)).toBe('');
  });
});

describe('status helpers', () => {
  test('getStatusDisplay maps known statuses and falls back to the raw value', () => {
    expect(getStatusDisplay('in_progress')).toBe('In Progress');
    expect(getStatusDisplay('done')).toBe('Done');
    expect(getStatusDisplay('unknown')).toBe('unknown');
  });

  test('getStatusClass maps known statuses and defaults to status-todo', () => {
    expect(getStatusClass('done')).toBe('status-done');
    expect(getStatusClass('in_progress')).toBe('status-in-progress');
    expect(getStatusClass('nope')).toBe('status-todo');
  });
});

describe('calculateProgress', () => {
  test('reports totals, completed count, and rounded percentage', () => {
    const items = [{ status: 'done' }, { status: 'done' }, { status: 'todo' }];
    expect(calculateProgress(items)).toEqual({ total: 3, completed: 2, percentage: 67 });
  });

  test('returns zeros for an empty or missing list', () => {
    expect(calculateProgress([])).toEqual({ total: 0, completed: 0, percentage: 0 });
    expect(calculateProgress(undefined)).toEqual({ total: 0, completed: 0, percentage: 0 });
  });
});

describe('hasBlockedChildren', () => {
  test('detects a blocked task nested under a feature', () => {
    const epic = { features: [{ status: 'todo', tasks: [{ status: 'blocked' }] }] };
    expect(hasBlockedChildren(epic)).toBe(true);
  });

  test('returns false when nothing is blocked', () => {
    const epic = { features: [{ status: 'todo', tasks: [{ status: 'done' }] }] };
    expect(hasBlockedChildren(epic)).toBe(false);
    expect(hasBlockedChildren(null)).toBe(false);
  });
});

describe('filterByQuery', () => {
  const items = [
    { title: 'Login API', desc: 'auth endpoint' },
    { title: 'Cart UI', desc: 'shopping cart' },
    { title: 'Checkout', desc: 'payment flow' }
  ];

  test('returns all items for an empty query', () => {
    expect(filterByQuery(items, '')).toHaveLength(3);
    expect(filterByQuery(items, '   ')).toHaveLength(3);
  });

  test('matches title or desc, case-insensitively', () => {
    expect(filterByQuery(items, 'cart').map((i) => i.title)).toEqual(['Cart UI']);
    expect(filterByQuery(items, 'PAYMENT').map((i) => i.title)).toEqual(['Checkout']);
    expect(filterByQuery(items, 'api')).toHaveLength(1);
  });

  test('returns nothing when there is no match', () => {
    expect(filterByQuery(items, 'zzz')).toEqual([]);
  });
});

describe('sortByStatusPriority', () => {
  test('orders in_progress before todo before done, without mutating input', () => {
    const items = [{ status: 'done' }, { status: 'todo' }, { status: 'in_progress' }];
    const sorted = sortByStatusPriority(items);
    expect(sorted.map((i) => i.status)).toEqual(['in_progress', 'todo', 'done']);
    // original array order preserved
    expect(items[0].status).toBe('done');
  });
});
