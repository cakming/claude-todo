import { getAuthHeaders } from './auth.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
// Origin the API is served from ('' when same-origin in production). Used to
// turn the relative upload URLs the server returns into absolute <img> srcs.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

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
  getAll: async (project, opts = {}) => {
    const qs = new URLSearchParams();
    if (opts.limit) qs.set('limit', opts.limit);
    if (opts.page) qs.set('page', opts.page);
    if (opts.search) qs.set('search', opts.search);
    if (opts.status) qs.set('status', opts.status);
    const query = qs.toString() ? `?${qs}` : '';
    const response = await fetch(`${API_BASE_URL}/${project}/epics${query}`, {
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
  },

  bulkStatus: async (project, ids, status) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/bulk/status`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ ids, status })
    });
    return handleResponse(response);
  },

  bulkDelete: async (project, ids) => {
    const response = await fetch(`${API_BASE_URL}/${project}/tasks/bulk/delete`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ ids })
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

// Export / Import API
export const exchangeApi = {
  export: async (project) => {
    const response = await fetch(`${API_BASE_URL}/${project}/export`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  import: async (project, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/import`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ data })
    });
    return handleResponse(response);
  }
};

// Doc pages API
export const pagesApi = {
  getAll: async (project, opts = {}) => {
    const qs = opts.search ? `?search=${encodeURIComponent(opts.search)}` : '';
    const response = await fetch(`${API_BASE_URL}/${project}/pages${qs}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/pages/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (project, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/pages`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (project, id, data) => {
    const response = await fetch(`${API_BASE_URL}/${project}/pages/${id}`, {
      method: 'PUT',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (project, id) => {
    const response = await fetch(`${API_BASE_URL}/${project}/pages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Image uploads (multipart). Returns an absolute URL ready to embed in markdown.
export const uploadsApi = {
  uploadImage: async (project, file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_BASE_URL}/${project}/uploads`, {
      method: 'POST',
      headers: getAuthHeaders(), // no Content-Type: the browser sets the multipart boundary
      body: form
    });
    const data = await handleResponse(response);
    return { ...data, url: `${API_ORIGIN}${data.url}` };
  }
};

// Restore (undo delete) API
export const restoreApi = {
  restore: async (project, items) => {
    const response = await fetch(`${API_BASE_URL}/${project}/restore`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ items })
    });
    return handleResponse(response);
  }
};

// Share links API
export const sharesApi = {
  list: async (project) => {
    const response = await fetch(`${API_BASE_URL}/${project}/shares`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (project, data = {}) => {
    const response = await fetch(`${API_BASE_URL}/${project}/shares`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  revoke: async (project, token) => {
    const response = await fetch(`${API_BASE_URL}/${project}/shares/${token}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Public (unauthenticated) read of a shared resource.
export const publicApi = {
  get: async (token) => {
    const response = await fetch(`${API_BASE_URL}/public/${token}`);
    return handleResponse(response);
  }
};

// Activity API
export const activityApi = {
  get: async (project) => {
    const response = await fetch(`${API_BASE_URL}/${project}/activity`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

export { ApiError };
