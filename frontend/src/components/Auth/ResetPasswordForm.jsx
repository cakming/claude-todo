import { useState } from 'react';
import { resetPassword } from '../../services/auth';

export default function ResetPasswordForm({ initialEmail = '', initialToken = '', onSuccess, onBackToLogin }) {
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, token, password);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose a New Password</h2>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className={inputClass} />
          <input type="text" value={token} onChange={(e) => setToken(e.target.value)} required placeholder="Reset token (from the email)" className={inputClass} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="New password (min 8, upper/lower/number)" className={inputClass} />
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Confirm new password" className={inputClass} />
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
          <button type="button" onClick={onBackToLogin} className="w-full text-sm text-gray-600 hover:text-gray-800">
            Back to login
          </button>
        </form>
      </div>
    </div>
  );
}
