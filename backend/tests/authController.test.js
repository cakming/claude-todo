import { test, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { makeCollection, makeRes } from './helpers/fakeCollection.js';
import { verifyToken } from '../src/utils/jwt.js';

// Shared in-memory "users" collection, injected in place of the real DB.
const users = makeCollection([]);

let register;
let login;

before(async () => {
  const mongoPath = fileURLToPath(new URL('../src/config/mongodb.js', import.meta.url));
  mock.module(mongoPath, {
    namedExports: {
      getDB: () => ({ collection: () => users }),
      getProjectCollection: () => users
    }
  });
  ({ register, login } = await import('../src/controllers/authController.js'));
});

beforeEach(() => {
  users.setDocs([]);
});

const req = (body) => ({ body });

test('register creates a user, hashes the password, and returns a valid token', async () => {
  const res = makeRes();
  await register(req({ username: 'alice', email: 'alice@example.com', password: 'secret1' }), res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.username, 'alice');

  // Password must be stored hashed, never in plaintext.
  const stored = users.docs.find((u) => u.username === 'alice');
  assert.ok(stored, 'user should be persisted');
  assert.notEqual(stored.password, 'secret1');

  // Returned token must be verifiable and carry the user identity.
  const decoded = verifyToken(res.body.data.token);
  assert.ok(decoded, 'token should verify');
  assert.equal(decoded.username, 'alice');
});

test('register rejects missing fields with 400', async () => {
  const res = makeRes();
  await register(req({ username: 'bob' }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('register rejects an invalid email with 400', async () => {
  const res = makeRes();
  await register(req({ username: 'bob', email: 'not-an-email', password: 'secret1' }), res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /email/i);
});

test('register rejects a weak password with 400', async () => {
  const res = makeRes();
  await register(req({ username: 'bob', email: 'bob@example.com', password: '123' }), res);
  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.body.errors));
});

test('register rejects a duplicate username with 409', async () => {
  await register(req({ username: 'alice', email: 'a@example.com', password: 'secret1' }), makeRes());

  const res = makeRes();
  await register(req({ username: 'alice', email: 'other@example.com', password: 'secret1' }), res);
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /username/i);
});

test('register rejects a duplicate email with 409', async () => {
  await register(req({ username: 'alice', email: 'a@example.com', password: 'secret1' }), makeRes());

  const res = makeRes();
  await register(req({ username: 'alice2', email: 'a@example.com', password: 'secret1' }), res);
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /email/i);
});

test('login succeeds with correct credentials and returns a token', async () => {
  await register(req({ username: 'alice', email: 'alice@example.com', password: 'secret1' }), makeRes());

  const res = makeRes();
  await login(req({ username: 'alice', password: 'secret1' }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(verifyToken(res.body.data.token), 'login token should verify');
});

test('login rejects a wrong password with 401', async () => {
  await register(req({ username: 'alice', email: 'alice@example.com', password: 'secret1' }), makeRes());

  const res = makeRes();
  await login(req({ username: 'alice', password: 'wrongpass' }), res);
  assert.equal(res.statusCode, 401);
});

test('login rejects an unknown user with 401', async () => {
  const res = makeRes();
  await login(req({ username: 'ghost', password: 'secret1' }), res);
  assert.equal(res.statusCode, 401);
});

test('login rejects missing fields with 400', async () => {
  const res = makeRes();
  await login(req({ username: 'alice' }), res);
  assert.equal(res.statusCode, 400);
});
