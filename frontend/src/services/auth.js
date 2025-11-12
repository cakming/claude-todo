const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'vibe_todo_auth_token';

/**
 * Get stored authentication token
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Save authentication token
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove authentication token
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Get authorization headers
 */
export function getAuthHeaders() {
  const token = getToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }
  return {};
}

/**
 * Login user
 */
export async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  if (data.success && data.data.token) {
    setToken(data.data.token);
  }

  return data.data;
}

/**
 * Register new user
 */
export async function register(username, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  if (data.success && data.data.token) {
    setToken(data.data.token);
  }

  return data.data;
}

/**
 * Logout user
 */
export function logout() {
  removeToken();
}

/**
 * Verify token is still valid
 */
export async function verifyToken() {
  const token = getToken();
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        ...getAuthHeaders()
      }
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    return false;
  }
}

/**
 * Get user profile
 */
export async function getProfile() {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: {
      ...getAuthHeaders()
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get profile');
  }

  return data.data;
}

/**
 * Check if auth is enabled on the server
 */
export async function checkAuthEnabled() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const data = await response.json();
    return data.authEnabled === true;
  } catch (error) {
    // If health check fails, assume auth is disabled
    return false;
  }
}
