import { getAuthHeaders } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function handle(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || (data.errors && data.errors.join(', ')) || 'Request failed');
  }
  return data;
}

export const adminApi = {
  listUsers: async () =>
    handle(await fetch(`${API_BASE_URL}/admin/users`, { headers: getAuthHeaders() })),

  updateRole: async (id, role) =>
    handle(
      await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ role })
      })
    ),

  deleteUser: async (id) =>
    handle(
      await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
    ),

  resetPassword: async (id, newPassword) =>
    handle(
      await fetch(`${API_BASE_URL}/admin/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ newPassword })
      })
    )
};
