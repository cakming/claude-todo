import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { activityApi } from '../services/api';
import Loading from '../components/Common/Loading';
import EmptyState from '../components/Common/EmptyState';
import { formatDateTime, getTypeIcon } from '../utils/helpers';

const ACTION_STYLE = {
  created: 'text-green-700 bg-green-100',
  updated: 'text-blue-700 bg-blue-100',
  deleted: 'text-red-700 bg-red-100'
};

export default function ActivityView() {
  const { currentProject, showToast } = useApp();
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadIdRef = useRef(0);

  useEffect(() => {
    if (currentProject) {
      loadActivity();
    }
  }, [currentProject]);

  const loadActivity = async () => {
    const loadId = ++loadIdRef.current;
    try {
      setLoading(true);
      const response = await activityApi.get(currentProject);
      if (loadId !== loadIdRef.current) return;
      setActivity(response.data);
    } catch (error) {
      if (loadId === loadIdRef.current) showToast('Failed to load activity', 'error');
    } finally {
      if (loadId === loadIdRef.current) setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading activity..." />;
  }

  if (activity.length === 0) {
    return (
      <EmptyState
        icon="📜"
        title="No Activity Yet"
        message="Create, update, or delete epics, features, and tasks to see a history here."
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity</h2>
          <p className="text-gray-600 mt-1">Recent changes in this project</p>
        </div>
        <button onClick={loadActivity} className="btn-secondary">
          🔄 Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md divide-y divide-gray-100">
        {activity.map((entry, i) => (
          <div key={i} className="flex items-center space-x-3 px-4 py-3">
            <span className="text-xl">{getTypeIcon(entry.item_type)}</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                ACTION_STYLE[entry.action] || 'text-gray-700 bg-gray-100'
              }`}
            >
              {entry.action}
            </span>
            <span className="text-gray-900 font-medium flex-1 truncate">
              {entry.item_type}
              {entry.title ? `: ${entry.title}` : ''}
            </span>
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {formatDateTime(entry.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
