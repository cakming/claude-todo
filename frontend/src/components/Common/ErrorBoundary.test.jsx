import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary.jsx';

function Boom() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  test('renders a fallback when a child throws', () => {
    // React logs the caught error; silence it to keep test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload/ })).toBeInTheDocument();
  });

  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('all good')).toBeInTheDocument();
  });
});
