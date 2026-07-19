import logger from './logger.js';
import { sendMail } from './mailer.js';
import { sendTelegram } from './telegram.js';

// A small, pluggable notification layer. notifyUser() dispatches an event to
// every channel a user has configured — email (always available when the user
// has an address) and Telegram (when TELEGRAM_BOT_TOKEN is set and the user has
// linked a chat id). Best-effort: it never throws, so it can't break the action
// that triggered it.

/**
 * Which channels are available for this user, given current config.
 */
export function channelsFor(user) {
  return {
    email: !!user?.email,
    telegram: !!(process.env.TELEGRAM_BOT_TOKEN && user?.telegram_chat_id)
  };
}

/**
 * Notify a user across all configured channels. Returns which channels were
 * successfully sent (for logging/tests). Never throws.
 * @param {{email?: string, telegram_chat_id?: string}} user
 * @param {{subject: string, text: string}} event
 */
export async function notifyUser(user, { subject, text }) {
  const channels = channelsFor(user);
  const sent = { email: false, telegram: false };

  if (channels.email) {
    try {
      await sendMail({ to: user.email, subject, text });
      sent.email = true;
    } catch (e) {
      logger.warn({ err: e }, 'email notification failed');
    }
  }

  if (channels.telegram) {
    try {
      sent.telegram = await sendTelegram(user.telegram_chat_id, `${subject}\n\n${text}`);
    } catch (e) {
      logger.warn({ err: e }, 'telegram notification failed');
    }
  }

  return sent;
}
