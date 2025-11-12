import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../Common/Modal';

export default function Header() {
  const { projects, currentProject, setCurrentProject, createProject } = useApp();
  const { authEnabled, isAuthenticated, user, logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setLoading(true);
      await createProject(newProjectName);
      setNewProjectName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              🎯 Vibe Coding Todo Manager
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Project Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Project:
              </label>
              <select
                value={currentProject || ''}
                onChange={(e) => setCurrentProject(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                + New Project
              </button>
            </div>

            {/* User Info and Logout (only show if auth is enabled) */}
            {authEnabled && isAuthenticated && user && (
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-300">
                <div className="text-sm">
                  <span className="text-gray-600">Logged in as </span>
                  <span className="font-medium text-gray-900">{user.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        size="sm"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <p className="mt-2 text-sm text-gray-500">
              Project names will be sanitized (lowercase, underscores)
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !newProjectName.trim()}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
