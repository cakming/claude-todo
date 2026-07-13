import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { adminApi } from '../services/admin';
import Loading from '../components/Common/Loading';

const ROLES = ['admin', 'editor', 'member', 'viewer'];

export default function AdminUsersView() {
  const { showToast } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminApi.listUsers();
      setUsers(res.data);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (u, role) => {
    try {
      await adminApi.updateRole(u.userId, role);
      showToast('Role updated', 'success');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const remove = async (u) => {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(u.userId);
      showToast('User deleted', 'success');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const reset = async (u) => {
    const pw = prompt(`New password for "${u.username}" (min 8, with upper, lower, number):`);
    if (!pw) return;
    try {
      await adminApi.resetPassword(u.userId, pw);
      showToast('Password reset', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading) return <Loading message="Loading users..." />;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <p className="text-gray-600 mt-1">Manage accounts and roles</p>
      </div>
      <div className="bg-white rounded-lg shadow-md divide-y divide-gray-100">
        {users.map((u) => (
          <div key={u.userId} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium text-gray-900">{u.username}</div>
              <div className="text-sm text-gray-500">{u.email}</div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={u.role}
                onChange={(e) => changeRole(u, e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button onClick={() => reset(u)} className="text-sm text-blue-600 hover:text-blue-700">
                Reset password
              </button>
              <button onClick={() => remove(u)} className="text-sm text-red-600 hover:text-red-700">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
