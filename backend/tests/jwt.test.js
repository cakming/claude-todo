import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateToken, verifyToken, decodeToken } from '../src/utils/jwt.js';

test('generateToken produces a token that verifyToken can decode', () => {
  const token = generateToken({ userId: 'u1', username: 'alice', email: 'a@example.com' });
  assert.equal(typeof token, 'string');

  const decoded = verifyToken(token);
  assert.ok(decoded, 'a freshly signed token should verify');
  assert.equal(decoded.userId, 'u1');
  assert.equal(decoded.username, 'alice');
  assert.equal(decoded.email, 'a@example.com');
});

test('verifyToken returns null for a tampered/invalid token', () => {
  const token = generateToken({ userId: 'u1' });
  const tampered = `${token}x`;
  assert.equal(verifyToken(tampered), null);
  assert.equal(verifyToken('not.a.jwt'), null);
});

test('decodeToken reads the payload without verifying the signature', () => {
  const token = generateToken({ userId: 'u1', username: 'alice' });
  const decoded = decodeToken(token);
  assert.equal(decoded.userId, 'u1');
  assert.equal(decoded.username, 'alice');
});
