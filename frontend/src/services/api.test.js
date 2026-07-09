import { describe, test, expect, vi } from 'vitest';
import { projectsApi, epicsApi } from './api.js';
import { setToken } from './auth.js';

const okFetch = (body) =>
  vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body });

describe('api service', () => {
  test('projectsApi.getAll hits the projects endpoint and returns parsed data', async () => {
    const fetchSpy = okFetch({ success: true, data: ['p1'] });
    global.fetch = fetchSpy;

    const res = await projectsApi.getAll();
    expect(res.data).toEqual(['p1']);
    expect(fetchSpy.mock.calls[0][0]).toContain('/projects');
  });

  test('create sends a POST with a JSON body and content-type header', async () => {
    const fetchSpy = okFetch({ success: true, data: { name: 'my_app' } });
    global.fetch = fetchSpy;

    await projectsApi.create('My App');
    const [, options] = fetchSpy.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ name: 'My App' });
  });

  test('the auth header is attached when a token is stored', async () => {
    setToken('secret');
    const fetchSpy = okFetch({ success: true, data: [] });
    global.fetch = fetchSpy;

    await projectsApi.getAll();
    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer secret');
  });

  test('a non-ok response throws an ApiError carrying the status and message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' })
    });

    await expect(epicsApi.getAll('demo')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Not found'
    });
  });

  test('epicsApi.create targets the project-scoped epics endpoint', async () => {
    const fetchSpy = okFetch({ success: true, data: {} });
    global.fetch = fetchSpy;

    await epicsApi.create('demo', { title: 'E' });
    expect(fetchSpy.mock.calls[0][0]).toContain('/demo/epics');
  });
});
