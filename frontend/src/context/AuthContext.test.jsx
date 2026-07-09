import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';

import { AuthProvider, useAuth } from './AuthContext.jsx';

vi.mock('../services/auth', () => ({
  checkAuthEnabled: vi.fn(),
  isAuthenticated: vi.fn(),
  verifyToken: vi.fn(),
  getProfile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn()
}));

import * as authService from '../services/auth';

function Probe() {
  const { loading, authEnabled, isAuthenticated, user, login } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="enabled">{String(authEnabled)}</span>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? user.username : 'none'}</span>
      <button onClick={() => login('bob', 'pw')}>login</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

beforeEach(() => {
  authService.isAuthenticated.mockReturnValue(false);
});

describe('AuthContext', () => {
  test('when auth is disabled it finishes loading, unauthenticated', async () => {
    authService.checkAuthEnabled.mockResolvedValue(false);

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('enabled')).toHaveTextContent('false');
    expect(screen.getByTestId('authed')).toHaveTextContent('false');
  });

  test('when enabled with a valid token it loads the user profile', async () => {
    authService.checkAuthEnabled.mockResolvedValue(true);
    authService.isAuthenticated.mockReturnValue(true);
    authService.verifyToken.mockResolvedValue(true);
    authService.getProfile.mockResolvedValue({ username: 'alice' });

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('alice'));
    expect(screen.getByTestId('enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('authed')).toHaveTextContent('true');
  });

  test('login() updates the user in context', async () => {
    authService.checkAuthEnabled.mockResolvedValue(false);
    authService.login.mockResolvedValue({ username: 'bob' });

    renderProbe();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await act(async () => {
      fireEvent.click(screen.getByText('login'));
    });

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('bob'));
    expect(authService.login).toHaveBeenCalledWith('bob', 'pw');
  });
});
