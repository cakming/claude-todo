import { test, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { makeCollection, makeRes } from './helpers/fakeCollection.js';
import { verifyToken } from '../src/utils/jwt.js';

// Shared in-memory "users" collection, injected in place of the real DB.
const users = makeCollection([]);

let register;
let login;
let changePassword;

before(async () => {
  const mongoPath = fileURLToPath(new URL('../src/config/mongodb.js', import.meta.url));
  mock.module(mongoPath, {
    namedExports: {
      getDB: () => ({ collection: () => users }),
      getProjectCollection: () => users
    }
  });
  ({ register, login, changePassword } = await import('../src/controllers/authController.js'));
});

beforeEach(() => {
  users.setDocs([]);
});

const req = (body) => ({ body });

test('register creates a user, hashes the password, and returns a valid token', async () => {
  const res = makeRes();
  await register(req({ username: 'alice', email: 'alice@example.com', password: 'Secret12' }), res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.username, 'alice');

  // Password must be stored hashed, never in plaintext.
  const stored = users.docs.find((u) => u.username === 'alice');
  assert.ok(stored, 'user should be persisted');
  assert.notEqual(stored.password, 'Secret12');

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
  await register(req({ username: 'bob', email: 'not-an-email', password: 'Secret12' }), res);
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
  await register(req({ username: 'alice', email: 'a@example.com', password: 'Secret12' }), makeRes());

  const res = makeRes();
  await register(req({ username: 'alice', email: 'other@example.com', password: 'Secret12' }), res);
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /username/i);
});

test('register rejects a duplicate email with 409', async () => {
  await register(req({ username: 'alice', email: 'a@example.com', password: 'Secret12' }), makeRes());

  const res = makeRes();
  await register(req({ username: 'alice2', email: 'a@example.com', password: 'Secret12' }), res);
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /email/i);
});

test('login succeeds with correct credentials and returns a token', async () => {
  await register(req({ username: 'alice', email: 'alice@example.com', password: 'Secret12' }), makeRes());

  const res = makeRes();
  await login(req({ username: 'alice', password: 'Secret12' }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(verifyToken(res.body.data.token), 'login token should verify');
});

test('login rejects a wrong password with 401', async () => {
  await register(req({ username: 'alice', email: 'alice@example.com', password: 'Secret12' }), makeRes());

  const res = makeRes();
  await login(req({ username: 'alice', password: 'wrongpass' }), res);
  assert.equal(res.statusCode, 401);
});

test('login rejects an unknown user with 401', async () => {
  const res = makeRes();
  await login(req({ username: 'ghost', password: 'Secret12' }), res);
  assert.equal(res.statusCode, 401);
});

test('login rejects missing fields with 400', async () => {
  const res = makeRes();
  await login(req({ username: 'alice' }), res);
  assert.equal(res.statusCode, 400);
});

test('the first registered user is admin, later users are members', async () => {
  const r1 = makeRes();
  await register(req({ username: 'first', email: 'first@example.com', password: 'Secret12' }), r1);
  assert.equal(r1.body.data.role, 'admin');

  const r2 = makeRes();
  await register(req({ username: 'second', email: 'second@example.com', password: 'Secret12' }), r2);
  assert.equal(r2.body.data.role, 'member');
});

test('changePassword updates the password with the correct current one', async () => {
  const reg = makeRes();
  await register(req({ username: 'alice', email: 'alice@example.com', password: 'Secret12' }), reg);
  const userId = reg.body.data.userId;

  const res = makeRes();
  await changePassword(
    { user: { userId }, body: { currentPassword: 'Secret12', newPassword: 'Brandnew1' } },
    res
  );
  assert.equal(res.statusCode, 200);

  // The new password now logs in.
  const loginRes = makeRes();
  await login(req({ username: 'alice', password: 'Brandnew1' }), loginRes);
  assert.equal(loginRes.statusCode, 200);
});

test('changePassword rejects a wrong current password with 401', async () => {
  const reg = makeRes();
  await register(req({ username: 'alice', email: 'alice@example.com', password: 'Secret12' }), reg);

  const res = makeRes();
  await changePassword(
    { user: { userId: reg.body.data.userId }, body: { currentPassword: 'WrongPass1', newPassword: 'Brandnew1' } },
    res
  );
  assert.equal(res.statusCode, 401);
});

test('changePassword rejects a weak new password with 400', async () => {
  const reg = makeRes();
  await register(req({ username: 'alice', email: 'alice@example.com', password: 'Secret12' }), reg);

  const res = makeRes();
  await changePassword(
    { user: { userId: reg.body.data.userId }, body: { currentPassword: 'Secret12', newPassword: 'weak' } },
    res
  );
  assert.equal(res.statusCode, 400);
});
