import { useState } from 'react';
import { forgotPassword } from '../../services/auth';

export default function ForgotPasswordForm({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Reset Password</h2>
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              If an account exists for <strong>{email}</strong>, a reset link has been sent. Check
              your email (or the server log in development).
            </p>
            <button onClick={onBackToLogin} className="text-indigo-600 hover:text-indigo-700 font-medium">
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                {error}
              </div>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <button type="button" onClick={onBackToLogin} className="w-full text-sm text-gray-600 hover:text-gray-800">
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
