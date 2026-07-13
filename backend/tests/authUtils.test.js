import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validatePassword, validateEmail } from '../src/utils/auth.js';

test('validatePassword accepts a strong password', () => {
  const result = validatePassword('Secret12');
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validatePassword rejects passwords that miss a requirement', () => {
  assert.equal(validatePassword('Short1A').valid, false); // 7 chars, too short
  assert.equal(validatePassword('lowercase1').valid, false); // no uppercase
  assert.equal(validatePassword('UPPERCASE1').valid, false); // no lowercase
  assert.equal(validatePassword('NoNumbersHere').valid, false); // no digit
  assert.equal(validatePassword('').valid, false); // empty
});

test('validateEmail distinguishes valid from invalid addresses', () => {
  assert.equal(validateEmail('alice@example.com'), true);
  assert.equal(validateEmail('not-an-email'), false);
  assert.equal(validateEmail('a@b'), false);
});
