import { test, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { makeCollection, makeRes } from './helpers/fakeCollection.js';

const U1 = 'aaaaaaaaaaaaaaaaaaaaaaaa'; // admin
const U2 = 'bbbbbbbbbbbbbbbbbbbbbbbb'; // member
const MISSING = 'cccccccccccccccccccccccc';

const users = makeCollection([]);

let listUsers;
let updateUserRole;
let deleteUser;
let resetUserPassword;

before(async () => {
  const mongoPath = fileURLToPath(new URL('../src/config/mongodb.js', import.meta.url));
  mock.module(mongoPath, {
    namedExports: { getDB: () => ({ collection: () => users }) }
  });
  ({ listUsers, updateUserRole, deleteUser, resetUserPassword } = await import(
    '../src/controllers/userController.js'
  ));
});

beforeEach(() => {
  users.setDocs([
    { _id: U1, username: 'admin', email: 'a@example.com', role: 'admin', created_at: new Date() },
    { _id: U2, username: 'bob', email: 'b@example.com', role: 'member', created_at: new Date() }
  ]);
});

test('listUsers returns users without passwords', async () => {
  const res = makeRes();
  await listUsers({}, res);
  assert.equal(res.body.data.length, 2);
  assert.ok(res.body.data.every((u) => u.password === undefined));
  assert.ok(res.body.data.some((u) => u.role === 'admin'));
});

test('updateUserRole changes a role, rejects invalid roles and missing users', async () => {
  const ok = makeRes();
  await updateUserRole({ params: { id: U2 }, body: { role: 'editor' } }, ok);
  assert.equal(ok.statusCode, 200);
  assert.equal(users.docs.find((u) => u._id === U2).role, 'editor');

  const bad = makeRes();
  await updateUserRole({ params: { id: U2 }, body: { role: 'wizard' } }, bad);
  assert.equal(bad.statusCode, 400);

  const missing = makeRes();
  await updateUserRole({ params: { id: MISSING }, body: { role: 'admin' } }, missing);
  assert.equal(missing.statusCode, 404);
});

test('deleteUser removes a user but refuses self-deletion', async () => {
  const self = makeRes();
  await deleteUser({ params: { id: U1 }, user: { userId: U1 } }, self);
  assert.equal(self.statusCode, 400);

  const ok = makeRes();
  await deleteUser({ params: { id: U2 }, user: { userId: U1 } }, ok);
  assert.equal(ok.statusCode, 200);
  assert.ok(!users.docs.some((u) => u._id === U2));
});

test('resetUserPassword validates and updates, 404 for missing', async () => {
  const weak = makeRes();
  await resetUserPassword({ params: { id: U2 }, body: { newPassword: 'weak' } }, weak);
  assert.equal(weak.statusCode, 400);

  const ok = makeRes();
  await resetUserPassword({ params: { id: U2 }, body: { newPassword: 'Brandnew1' } }, ok);
  assert.equal(ok.statusCode, 200);

  const missing = makeRes();
  await resetUserPassword({ params: { id: MISSING }, body: { newPassword: 'Brandnew1' } }, missing);
  assert.equal(missing.statusCode, 404);
});
