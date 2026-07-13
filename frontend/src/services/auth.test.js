import { describe, test, expect, vi } from 'vitest';
import * as auth from './auth.js';

const jsonResponse = (body, ok = true, status = 200) =>
  vi.fn().mockResolvedValue({ ok, status, json: async () => body });

describe('token storage', () => {
  test('set/get/remove round-trip through localStorage', () => {
    expect(auth.getToken()).toBeNull();
    auth.setToken('abc');
    expect(auth.getToken()).toBe('abc');
    expect(auth.isAuthenticated()).toBe(true);
    auth.removeToken();
    expect(auth.getToken()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });

  test('getAuthHeaders returns a Bearer header only when a token is stored', () => {
    expect(auth.getAuthHeaders()).toEqual({});
    auth.setToken('tok');
    expect(auth.getAuthHeaders()).toEqual({ Authorization: 'Bearer tok' });
  });
});

describe('login / register', () => {
  test('login stores the token and returns the user data', async () => {
    global.fetch = jsonResponse({ success: true, data: { token: 't1', username: 'alice' } });
    const data = await auth.login('alice', 'pw');
    expect(data.username).toBe('alice');
    expect(auth.getToken()).toBe('t1');
  });

  test('login throws on a non-ok response and stores no token', async () => {
    global.fetch = jsonResponse({ message: 'bad creds' }, false, 401);
    await expect(auth.login('x', 'y')).rejects.toThrow('bad creds');
    expect(auth.getToken()).toBeNull();
  });

  test('register stores the token on success', async () => {
    global.fetch = jsonResponse({ success: true, data: { token: 't2' } });
    await auth.register('a', 'a@example.com', 'pw');
    expect(auth.getToken()).toBe('t2');
  });
});

describe('verifyToken / checkAuthEnabled', () => {
  test('verifyToken short-circuits to false with no stored token (no request)', async () => {
    global.fetch = vi.fn();
    expect(await auth.verifyToken()).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('verifyToken reflects the server success flag', async () => {
    auth.setToken('t');
    global.fetch = jsonResponse({ success: true });
    expect(await auth.verifyToken()).toBe(true);
  });

  test('checkAuthEnabled reads authEnabled from /health', async () => {
    global.fetch = jsonResponse({ authEnabled: true });
    expect(await auth.checkAuthEnabled()).toBe(true);
  });

  test('checkAuthEnabled returns false when the health check throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'));
    expect(await auth.checkAuthEnabled()).toBe(false);
  });
});
