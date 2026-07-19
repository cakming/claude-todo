import { useState } from 'react';
import Modal from './Modal';
import { linkTelegram } from '../../services/auth';
import { useApp } from '../../context/AppContext';

// Let a signed-in user link a Telegram chat id so @mention notifications can be
// delivered there (in addition to email). Email always works when the account
// has an address; Telegram also requires the server's TELEGRAM_BOT_TOKEN.
export default function NotificationsModal({ isOpen, onClose }) {
  const { showToast } = useApp();
  const [chatId, setChatId] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (value) => {
    setSaving(true);
    try {
      await linkTelegram(value);
      showToast(value ? 'Telegram linked' : 'Telegram unlinked', 'success');
      if (!value) setChatId('');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          You'll get an email when someone <span className="font-medium">@mentions</span> you in a
          comment. To also receive Telegram messages, link your chat id below.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telegram chat id</label>
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="e.g. 123456789"
            aria-label="Telegram chat id"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Message <span className="font-mono">@userinfobot</span> on Telegram to find your chat id.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => save('')} disabled={saving} className="text-sm text-gray-600 hover:text-gray-800">
            Unlink
          </button>
          <button onClick={() => save(chatId)} disabled={saving || !chatId.trim()} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
