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
      data.error || 'An error occurred',
      response.status,
      data.details
    );
  }

  return data;
}

// Projects API
export const projectsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/projects`);
    return handleResponse(response);
  },

  create: async (name) => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return handleResponse(response);
  },

  delete: async (name) => {
    const response = await fetch(`${API_BASE_URL}/projects/${name}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};

// Epics API
export const epicsApi = {
  getAll: async (project) => {
    const response = await fetch(`${API_BASE_URL}/${project}/epics`);
    return handleResponse(response);
  },

  getById: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/epics/${id}`);
    return handleResponse(response);
  },

  create: async (project, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/epics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (project, id, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/epics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/epics/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};

// Features API
export const featuresApi = {
  getByEpic: async (project, epicId) => {
    const response = await fetch(`${API_BASE_URL}/${project}/features/by-epic/${epicId}`);
    return handleResponse(response);
  },

  getById: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/features/${id}`);
    return handleResponse(response);
  },

  create: async (project, epicId, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/features/by-epic/${epicId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (project, id, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/features/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/features/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};

// Tasks API
export const tasksApi = {
  getByFeature: async (project, featureId) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/by-feature/${featureId}`);
    return handleResponse(response);
  },

  getById: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/${id}`);
    return handleResponse(response);
  },

  create: async (project, featureId, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/by-feature/${featureId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (project, id, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};

// Tree API
export const treeApi = {
  getProject: async (project) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tree`);
    return handleResponse(response);
  },

  getEpic: async (project, epicId) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tree/epics/${epicId}`);
    return handleResponse(response);
  }
};

export { ApiError };
