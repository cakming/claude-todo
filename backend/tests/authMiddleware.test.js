import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { authenticate, optionalAuthenticate, isAuthEnabled, requireRole, blockWritesForViewer } from '../src/middleware/authMiddleware.js';
import { generateToken } from '../src/utils/jwt.js';

function makeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

// Each test controls AUTH_ENABLED explicitly; start from a clean slate.
beforeEach(() => {
  delete process.env.AUTH_ENABLED;
});

test('isAuthEnabled is true only when AUTH_ENABLED === "true"', () => {
  process.env.AUTH_ENABLED = 'true';
  assert.equal(isAuthEnabled(), true);
  process.env.AUTH_ENABLED = 'false';
  assert.equal(isAuthEnabled(), false);
  delete process.env.AUTH_ENABLED;
  assert.equal(isAuthEnabled(), false);
});

test('authenticate skips entirely when auth is disabled', () => {
  const res = makeRes();
  let nexted = false;
  authenticate({ headers: {} }, res, () => {
    nexted = true;
  });
  assert.equal(nexted, true);
  assert.equal(res.statusCode, 200);
});

test('authenticate returns 401 when enabled and no token is provided', () => {
  process.env.AUTH_ENABLED = 'true';
  const res = makeRes();
  let nexted = false;
  authenticate({ headers: {} }, res, () => {
    nexted = true;
  });
  assert.equal(nexted, false);
  assert.equal(res.statusCode, 401);
});

test('authenticate returns 401 on a malformed authorization header', () => {
  process.env.AUTH_ENABLED = 'true';
  const res = makeRes();
  authenticate({ headers: { authorization: 'Token abc' } }, res, () => {});
  assert.equal(res.statusCode, 401);
});

test('authenticate returns 401 on an invalid token', () => {
  process.env.AUTH_ENABLED = 'true';
  const res = makeRes();
  authenticate({ headers: { authorization: 'Bearer not.a.valid.token' } }, res, () => {});
  assert.equal(res.statusCode, 401);
});

test('authenticate attaches req.user and calls next on a valid token', () => {
  process.env.AUTH_ENABLED = 'true';
  const token = generateToken({ userId: 'u1', username: 'alice' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = makeRes();
  let nexted = false;
  authenticate(req, res, () => {
    nexted = true;
  });
  assert.equal(nexted, true);
  assert.equal(res.statusCode, 200);
  assert.equal(req.user.userId, 'u1');
});

test('optionalAuthenticate continues (no 401) when enabled but no token', () => {
  process.env.AUTH_ENABLED = 'true';
  const req = { headers: {} };
  const res = makeRes();
  let nexted = false;
  optionalAuthenticate(req, res, () => {
    nexted = true;
  });
  assert.equal(nexted, true);
  assert.equal(res.statusCode, 200);
  assert.equal(req.user, undefined);
});

test('optionalAuthenticate sets req.user when a valid token is present', () => {
  process.env.AUTH_ENABLED = 'true';
  const token = generateToken({ userId: 'u9', username: 'bob' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = makeRes();
  optionalAuthenticate(req, res, () => {});
  assert.equal(req.user.userId, 'u9');
});

test('optionalAuthenticate ignores an invalid token and still continues', () => {
  process.env.AUTH_ENABLED = 'true';
  const req = { headers: { authorization: 'Bearer garbage' } };
  const res = makeRes();
  let nexted = false;
  optionalAuthenticate(req, res, () => {
    nexted = true;
  });
  assert.equal(nexted, true);
  assert.equal(req.user, undefined);
});

test('requireRole allows everything when auth is disabled', () => {
  const res = makeRes();
  let nexted = false;
  requireRole('admin')({ user: undefined }, res, () => {
    nexted = true;
  });
  assert.equal(nexted, true);
});

test('requireRole passes an admin and blocks a non-admin with 403', () => {
  process.env.AUTH_ENABLED = 'true';

  let nexted = false;
  requireRole('admin')({ user: { role: 'admin' } }, makeRes(), () => {
    nexted = true;
  });
  assert.equal(nexted, true);

  const res = makeRes();
  let blockedNext = false;
  requireRole('admin')({ user: { role: 'member' } }, res, () => {
    blockedNext = true;
  });
  assert.equal(blockedNext, false);
  assert.equal(res.statusCode, 403);
});

test('blockWritesForViewer: no-op when auth is disabled', () => {
  const res = makeRes();
  let called = false;
  blockWritesForViewer({ method: 'POST', user: { role: 'viewer' } }, res, () => { called = true; });
  assert.equal(called, true, 'open mode lets everything through');
});

test('blockWritesForViewer: viewer can read but not write (auth on)', () => {
  process.env.AUTH_ENABLED = 'true';

  // Reads pass.
  let readNext = false;
  blockWritesForViewer({ method: 'GET', user: { role: 'viewer' } }, makeRes(), () => { readNext = true; });
  assert.equal(readNext, true);

  // Writes are blocked with 403.
  const res = makeRes();
  let writeNext = false;
  blockWritesForViewer({ method: 'DELETE', user: { role: 'viewer' } }, res, () => { writeNext = true; });
  assert.equal(writeNext, false);
  assert.equal(res.statusCode, 403);
});

test('blockWritesForViewer: non-viewer roles can write (auth on)', () => {
  process.env.AUTH_ENABLED = 'true';
  for (const role of ['admin', 'editor', 'member']) {
    let next = false;
    blockWritesForViewer({ method: 'POST', user: { role } }, makeRes(), () => { next = true; });
    assert.equal(next, true, `${role} can write`);
  }
});
