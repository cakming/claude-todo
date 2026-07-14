import { useState, useEffect } from 'react';
import Modal from './Modal';
import { sharesApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

const EXPIRY_OPTIONS = [
  { label: 'Never', value: 0 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 }
];

// Manage a project's public read-only links: create (with optional expiry),
// copy, and revoke.
export default function ShareModal({ isOpen, onClose }) {
  const { currentProject, showToast } = useApp();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(0);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen && currentProject) load();
  }, [isOpen, currentProject]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await sharesApi.list(currentProject);
      setShares(res.data);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const urlFor = (token) => `${window.location.origin}/s/${token}`;

  const copy = async (token) => {
    try {
      await navigator.clipboard?.writeText(urlFor(token));
      showToast('Link copied', 'success');
    } catch (e) {
      showToast(urlFor(token), 'info');
    }
  };

  const create = async () => {
    setCreating(true);
    try {
      const res = await sharesApi.create(currentProject, {
        scope: 'project',
        expiresInDays: expiresInDays || undefined
      });
      await copy(res.token);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (token) => {
    try {
      await sharesApi.revoke(currentProject, token);
      showToast('Link revoked', 'success');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share links" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-700">Create a read-only project link</span>
          <select
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            aria-label="Link expiry"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button onClick={create} disabled={creating} className="btn-primary text-sm py-2">
            {creating ? 'Creating…' : 'Create link'}
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm py-4">Loading…</p>
        ) : shares.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No active links. Create one above.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {shares.map((s) => (
              <li key={s.token} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded mr-2 uppercase">{s.scope}</span>
                  <span className="text-sm text-gray-700 break-all">{urlFor(s.token)}</span>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {s.expires_at
                      ? `Expires ${new Date(s.expires_at).toLocaleDateString()}`
                      : 'No expiry'}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => copy(s.token)} className="btn-secondary text-sm py-1">
                    Copy
                  </button>
                  <button
                    onClick={() => revoke(s.token)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
