import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { telegramConnect, telegramStatus, telegramDisconnect } from '../../services/auth';
import { useApp } from '../../context/AppContext';

// Manage where @mention notifications are delivered. Email always works when
// the account has an address; Telegram is a one-click connect: press a button,
// open the bot, tap Start, and the app auto-detects the link.
export default function NotificationsModal({ isOpen, onClose }) {
  const { showToast } = useApp();
  const [status, setStatus] = useState({ loading: true, linked: false, configured: false });
  const [connectUrl, setConnectUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (isOpen) refresh();
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const refresh = async () => {
    try {
      const s = await telegramStatus();
      setStatus({ loading: false, linked: s.linked, configured: s.configured });
      if (s.linked) {
        setConnectUrl(null);
        clearInterval(pollRef.current);
      }
      return s;
    } catch (e) {
      setStatus({ loading: false, linked: false, configured: false });
      return null;
    }
  };

  const startConnect = async () => {
    setBusy(true);
    try {
      const { url } = await telegramConnect();
      setConnectUrl(url);
      window.open(url, '_blank', 'noopener');
      // Poll for the link to complete (bot captures the chat id on Start).
      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const s = await refresh();
        if (s?.linked) showToast('Telegram connected', 'success');
      }, 3000);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await telegramDisconnect();
      showToast('Telegram disconnected', 'success');
      setConnectUrl(null);
      refresh();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          You'll get an <span className="font-medium">email</span> when someone{' '}
          <span className="font-medium">@mentions</span> you in a comment.
        </p>

        <div className="border-t border-gray-100 pt-4">
          <div className="text-sm font-medium text-gray-800 mb-1">Telegram</div>

          {status.loading ? (
            <p className="text-sm text-gray-500">Checking…</p>
          ) : !status.configured ? (
            <p className="text-sm text-gray-500">
              Telegram isn't set up on this server. Email notifications still work.
            </p>
          ) : status.linked ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">✓ Connected</span>
              <button onClick={disconnect} disabled={busy} className="text-sm text-red-600 hover:text-red-700">
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Get mention alerts in Telegram too. It takes one tap:
              </p>
              <ol className="text-sm text-gray-600 list-decimal pl-5 space-y-1">
                <li>Click <span className="font-medium">Connect Telegram</span> below.</li>
                <li>Telegram opens our bot — press <span className="font-medium">Start</span>.</li>
                <li>Come back here; it links automatically.</li>
              </ol>
              <div className="flex items-center gap-3 pt-1">
                <button onClick={startConnect} disabled={busy} className="btn-primary text-sm">
                  {connectUrl ? 'Waiting for Start…' : 'Connect Telegram'}
                </button>
                {connectUrl && (
                  <a href={connectUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
                    Reopen bot
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
