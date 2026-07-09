import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';

import { AppProvider, useApp } from './AppContext.jsx';

vi.mock('../services/api', () => ({
  projectsApi: { getAll: vi.fn(), create: vi.fn(), delete: vi.fn() }
}));

import { projectsApi } from '../services/api';

function Probe() {
  const { projects, currentProject, loading, toasts, createProject } = useApp();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="count">{projects.length}</span>
      <span data-testid="current">{currentProject ?? 'none'}</span>
      <span data-testid="toasts">{toasts.length}</span>
      <button onClick={() => createProject('My App')}>create</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <AppProvider>
      <Probe />
    </AppProvider>
  );

describe('AppContext', () => {
  test('loads projects on mount and selects the first as current', async () => {
    projectsApi.getAll.mockResolvedValue({ data: ['alpha', 'beta'] });

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('current')).toHaveTextContent('alpha');
  });

  test('createProject calls the API, reloads, selects it, and pushes a toast', async () => {
    projectsApi.getAll
      .mockResolvedValueOnce({ data: [] }) // initial mount
      .mockResolvedValueOnce({ data: ['my_app'] }); // reload after create
    projectsApi.create.mockResolvedValue({ data: { name: 'my_app' } });

    renderProbe();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await act(async () => {
      fireEvent.click(screen.getByText('create'));
    });

    await waitFor(() => expect(screen.getByTestId('current')).toHaveTextContent('my_app'));
    expect(projectsApi.create).toHaveBeenCalledWith('My App');
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('toasts')).toHaveTextContent('1');
  });

  test('surfaces an error toast when project loading fails', async () => {
    projectsApi.getAll.mockRejectedValue(new Error('boom'));

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('toasts')).toHaveTextContent('1'));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
