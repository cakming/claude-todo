import { createContext, useContext, useState, useEffect } from 'react';
import { projectsApi } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Drive periodic background refreshes (near-real-time updates across tabs).
  // Views watch `refreshTick` and reload silently (without a loading spinner).
  useEffect(() => {
    const id = setInterval(() => setRefreshTick((t) => t + 1), 10000);
    return () => clearInterval(id);
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

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
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
