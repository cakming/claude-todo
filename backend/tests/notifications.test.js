import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { channelsFor, notifyUser } from '../src/utils/notifications.js';

const ORIGINAL_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

afterEach(() => {
  if (ORIGINAL_TOKEN === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
  else process.env.TELEGRAM_BOT_TOKEN = ORIGINAL_TOKEN;
});

test('channelsFor: email available whenever the user has an address', () => {
  assert.deepEqual(channelsFor({ email: 'a@b.com' }), { email: true, telegram: false });
  assert.deepEqual(channelsFor({}), { email: false, telegram: false });
});

test('channelsFor: telegram requires both a bot token and a linked chat id', () => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  assert.equal(channelsFor({ telegram_chat_id: '123' }).telegram, false, 'no token -> off');

  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  assert.equal(channelsFor({ telegram_chat_id: '123' }).telegram, true, 'token + chat id -> on');
  assert.equal(channelsFor({}).telegram, false, 'token but no chat id -> off');
});

test('notifyUser attempts email (dev mailer) and skips telegram when unconfigured', async () => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  // No SMTP configured -> sendMail logs instead of throwing, so email counts as sent.
  const sent = await notifyUser({ email: 'a@b.com' }, { subject: 's', text: 't' });
  assert.deepEqual(sent, { email: true, telegram: false });
});

test('notifyUser never throws for a user with no channels', async () => {
  const sent = await notifyUser(null, { subject: 's', text: 't' });
  assert.deepEqual(sent, { email: false, telegram: false });
});
