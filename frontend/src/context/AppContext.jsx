import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { projectsApi } from '../services/api';

// Resolve the Socket.IO server origin from the API base. In production the API
// is same-origin (VITE_API_URL=/api) so we connect to window.location.origin;
// in dev it points at the backend (e.g. http://localhost:3001).
function socketUrl() {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  return base.startsWith('http') ? base.replace(/\/api\/?$/, '') : undefined;
}

const AppContext = createContext();

export function AppProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const toastIdRef = useRef(0);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Real-time updates via Socket.IO. The server emits on every change; views
  // watch `refreshTick` and reload silently (no spinner). Auto-reconnects.
  useEffect(() => {
    const url = socketUrl();
    const opts = { transports: ['websocket', 'polling'] };
    const socket = url ? io(url, opts) : io(opts);
    socket.on('project:updated', () => setRefreshTick((t) => t + 1));
    socket.on('projects:updated', () => loadProjects());
    return () => socket.disconnect();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.getAll();
      // Guard against stray/invalid collection names slipping into the UI.
      const validProjects = (response.data || []).filter(
        (name) => name && name !== 'undefined' && name !== 'null'
      );
      setProjects(validProjects);

      // Set first project as current if available and no current project
      if (validProjects.length > 0 && !currentProject) {
        setCurrentProject(validProjects[0]);
      }

      setError(null);
    } catch (err) {
      setError(err.message);
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name) => {
    try {
      const response = await projectsApi.create(name);
      await loadProjects();
      setCurrentProject(response.data.name);
      showToast('Project created successfully', 'success');
      return response.data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const deleteProject = async (name) => {
    try {
      await projectsApi.delete(name);
      await loadProjects();
      if (currentProject === name) {
        setCurrentProject(projects[0] || null);
      }
      showToast('Project deleted successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  // `options.action` = { label, onClick } renders an inline button (e.g. Undo)
  // and, since users need time to react, keeps that toast up longer.
  const showToast = (message, type = 'info', options = {}) => {
    const id = ++toastIdRef.current;
    const { action } = options;
    // Keep at most the 4 most recent toasts so they can't pile up and cover the UI.
    setToasts(prev => [...prev, { id, message, type, action }].slice(-4));

    setTimeout(() => {
      removeToast(id);
    }, action ? 8000 : 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const value = {
    projects,
    currentProject,
    setCurrentProject,
    loading,
    error,
    loadProjects,
    createProject,
    deleteProject,
    showToast,
    toasts,
    removeToast,
    refreshTick
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
