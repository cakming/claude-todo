import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { trashApi } from '../services/api';
import Loading from '../components/Common/Loading';
import EmptyState from '../components/Common/EmptyState';

const TYPE_ICON = { epic: '📊', feature: '✨', task: '✅', page: '📄' };

// Persistent trash: deleted items (grouped by the delete batch they were
// removed in) that can be restored or permanently purged. Survives reloads,
// unlike the transient Undo toast.
export default function TrashView() {
  const { currentProject, showToast, refreshTick } = useApp();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadIdRef = useRef(0);

  useEffect(() => {
    if (currentProject) load();
  }, [currentProject]);

  useEffect(() => {
    if (currentProject && refreshTick > 0) load({ silent: true });
  }, [refreshTick]);

  const load = async ({ silent } = {}) => {
    const loadId = ++loadIdRef.current;
    try {
      if (!silent) setLoading(true);
      const res = await trashApi.list(currentProject);
      if (loadId !== loadIdRef.current) return;
      setGroups(res.data);
    } catch (e) {
      if (!silent && loadId === loadIdRef.current) showToast('Failed to load trash', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const restore = async (batch) => {
    try {
      await trashApi.restore(currentProject, batch);
      showToast('Restored', 'success');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const purge = async (group) => {
    if (!confirm(`Permanently delete "${group.label}"${group.count > 1 ? ` and ${group.count - 1} item(s)` : ''}? This cannot be undone.`)) {
      return;
    }
    try {
      await trashApi.purge(currentProject, group.batch);
      showToast('Permanently deleted', 'success');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const purgeAll = async () => {
    if (!confirm('Permanently delete everything in the trash? This cannot be undone.')) return;
    try {
      await trashApi.purge(currentProject, 'all');
      showToast('Trash emptied', 'success');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading) {
    return <Loading message="Loading trash..." />;
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon="🗑"
        title="Trash is empty"
        message="Deleted epics, features, tasks, and pages appear here. You can restore them or delete them permanently."
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trash</h2>
          <p className="text-gray-600 mt-1">Restore deleted items or remove them for good</p>
        </div>
        <button onClick={purgeAll} className="text-sm text-red-600 hover:text-red-700">
          Empty trash
        </button>
      </div>

      <div className="space-y-2">
        {groups.map((group) => (
          <div
            key={group.batch}
            className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg"
          >
            <div className="min-w-0">
              <span className="font-medium text-gray-900 truncate">
                {TYPE_ICON[group.type] || '🗑'} {group.label}
              </span>
              {group.count > 1 && (
                <span className="ml-2 text-xs text-gray-500">+{group.count - 1} nested item(s)</span>
              )}
              <span className="ml-2 text-xs text-gray-400">
                {new Date(group.deleted_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-3 shrink-0">
              <button onClick={() => restore(group.batch)} className="btn-secondary text-sm py-1">
                Restore
              </button>
              <button onClick={() => purge(group)} className="text-sm text-red-600 hover:text-red-700">
                Delete forever
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
