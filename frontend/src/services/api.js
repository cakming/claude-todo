import { getAuthHeaders } from './auth.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || data.error || 'An error occurred',
      response.status,
      data.details
    );
  }

  return data;
}

/**
 * Get default headers including auth if available
 */
function getDefaultHeaders() {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  };
}

// Projects API
export const projectsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (name) => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ name })
    });
    return handleResponse(response);
  },

  delete: async (name) => {
    const response = await fetch(`${API_BASE_URL}/projects/${name}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Epics API
export const epicsApi = {
  getAll: async (project) => {
    const response = await fetch(`${API_BASE_URL}/${project}/epics`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/epics/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (project, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/epics`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (project, id, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/epics/${id}`, {
      method: 'PUT',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/epics/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Features API
export const featuresApi = {
  getByEpic: async (project, epicId) => {
    const response = await fetch(`${API_BASE_URL}/${project}/features/by-epic/${epicId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/features/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (project, epicId, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/features/by-epic/${epicId}`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (project, id, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/features/${id}`, {
      method: 'PUT',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/features/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Tasks API
export const tasksApi = {
  getByFeature: async (project, featureId) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/by-feature/${featureId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (project, featureId, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/by-feature/${featureId}`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (project, id, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/${id}`, {
      method: 'PUT',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Tree API
export const treeApi = {
  getProject: async (project) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tree`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getEpic: async (project, epicId) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tree/epics/${epicId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

export { ApiError };
