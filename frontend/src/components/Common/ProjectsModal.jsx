import { useState, useEffect } from 'react';
import Modal from './Modal';
import { projectsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

// Manage projects: move the current project to trash, and restore or
// permanently delete trashed projects.
export default function ProjectsModal({ isOpen, onClose }) {
  const { currentProject, deleteProject, loadProjects, showToast } = useApp();
  const [trashed, setTrashed] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) loadTrash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.trash();
      setTrashed(res.data);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const trashCurrent = async () => {
    if (!currentProject) return;
    if (!confirm(`Move project "${currentProject}" to trash? Its data is kept and can be restored.`)) return;
    try {
      await deleteProject(currentProject); // soft-delete + refresh (from context)
      loadTrash();
    } catch (e) {
      // deleteProject already toasts on failure
    }
  };

  const restore = async (name) => {
    try {
      await projectsApi.restore(name);
      showToast(`Restored "${name}"`, 'success');
      await loadProjects();
      loadTrash();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const purge = async (name) => {
    if (!confirm(`Permanently delete project "${name}" and all its data? This cannot be undone.`)) return;
    try {
      await projectsApi.purge(name);
      showToast(`Deleted "${name}"`, 'success');
      loadTrash();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage projects" size="md">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-800">Current project</div>
            <div className="text-sm text-gray-600">{currentProject || '—'}</div>
          </div>
          <button
            onClick={trashCurrent}
            disabled={!currentProject}
            className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-300"
          >
            Move to trash
          </button>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-800 mb-2">Trash</div>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : trashed.length === 0 ? (
            <p className="text-gray-500 text-sm">No trashed projects.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {trashed.map((p) => (
                <li key={p.name} className="py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-sm text-gray-800">{p.name}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {new Date(p.deleted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => restore(p.name)} className="btn-secondary text-sm py-1">
                      Restore
                    </button>
                    <button onClick={() => purge(p.name)} className="text-sm text-red-600 hover:text-red-700">
                      Delete forever
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
