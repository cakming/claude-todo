import { getDB } from '../config/mongodb.js';
import logger from './logger.js';

// Telegram bot integration. Sending works with just TELEGRAM_BOT_TOKEN. The
// one-click account linking uses long-polling (getUpdates) so no public webhook
// URL is needed: the user opens a deep link, presses Start, and the bot maps
// their chat id to their account automatically.

const LINKS = 'telegram_links';
const USERS = 'users';

function token() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function api(method) {
  return `https://api.telegram.org/bot${token()}/${method}`;
}

/** Send a message. No-op (returns false) when unconfigured. */
export async function sendTelegram(chatId, text) {
  if (!token() || !chatId) return false;
  try {
    const res = await fetch(api('sendMessage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    return res.ok;
  } catch (e) {
    logger.warn({ err: e }, 'telegram sendMessage failed');
    return false;
  }
}

let _botUsername = null;
/** Resolve the bot's @username (for building t.me deep links). Cached. */
export async function getBotUsername() {
  if (process.env.TELEGRAM_BOT_USERNAME) return process.env.TELEGRAM_BOT_USERNAME;
  if (_botUsername) return _botUsername;
  if (!token()) return null;
  const res = await fetch(api('getMe'));
  const data = await res.json();
  if (data.ok) _botUsername = data.result.username;
  return _botUsername;
}

/**
 * Handle one Telegram update. On `/start <code>`, link the chat to the account
 * that generated the code. Exported for testing.
 */
export async function handleUpdate(update) {
  const msg = update?.message;
  if (!msg || typeof msg.text !== 'string') return;
  const chatId = msg.chat?.id;
  const m = msg.text.trim().match(/^\/start(?:\s+(\S+))?/);
  if (!m) return;

  const code = m[1];
  if (!code) {
    await sendTelegram(chatId, 'Welcome! In the app open Notifications → Connect Telegram to link your account.');
    return;
  }

  const link = await getDB().collection(LINKS).findOne({ code });
  if (!link) {
    await sendTelegram(chatId, 'That link code is invalid or has expired — generate a new one in the app.');
    return;
  }

  await getDB().collection(USERS).updateOne(
    { username: link.username },
    { $set: { telegram_chat_id: String(chatId) } }
  );
  await getDB().collection(LINKS).deleteOne({ code });
  await sendTelegram(chatId, '✅ Linked! You’ll get a message here whenever someone @mentions you.');
}

let polling = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Start the long-polling loop (idempotent). No-op without a token. */
export async function startTelegramPolling() {
  if (!token() || polling) return;
  polling = true;

  // Auto-expire unused link codes after 15 minutes.
  try {
    await getDB().collection(LINKS).createIndex({ created_at: 1 }, { expireAfterSeconds: 900 });
  } catch (e) {
    logger.warn({ err: e }, 'could not create telegram_links TTL index');
  }

  logger.info('Telegram bot polling started');
  let offset = 0;
  while (polling) {
    try {
      const res = await fetch(api('getUpdates') + `?timeout=30&offset=${offset}`);
      const data = await res.json();
      if (data.ok) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      }
    } catch (e) {
      logger.warn({ err: e }, 'telegram polling error');
      await sleep(3000);
    }
  }
}

export function stopTelegramPolling() {
  polling = false;
}
