import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { treeApi } from '../services/api';
import TreeNode from '../components/Tree/TreeNode';
import Loading from '../components/Common/Loading';
import EmptyState from '../components/Common/EmptyState';

export default function TreeView() {
  const { currentProject, showToast, refreshTick } = useApp();
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadIdRef = useRef(0);

  useEffect(() => {
    if (currentProject) {
      loadTree();
    }
  }, [currentProject]);

  useEffect(() => {
    if (currentProject && refreshTick > 0) {
      loadTree({ silent: true });
    }
  }, [refreshTick]);

  const loadTree = async ({ silent } = {}) => {
    const loadId = ++loadIdRef.current;
    try {
      if (!silent) setLoading(true);
      const response = await treeApi.getProject(currentProject);
      if (loadId !== loadIdRef.current) return;
      setTreeData(response.data);
    } catch (error) {
      if (!silent && loadId === loadIdRef.current) showToast('Failed to load tree view', 'error');
    } finally {
      if (!silent && loadId === loadIdRef.current) setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading tree view..." />;
  }

  if (treeData.length === 0) {
    return (
      <EmptyState
        icon="🌲"
        title="No Data Yet"
        message="Create epics, features, and tasks to see them in a hierarchical tree view."
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tree View</h2>
          <p className="text-gray-600 mt-1">
            Hierarchical view of all epics, features, and tasks
          </p>
        </div>
        <button onClick={loadTree} className="btn-secondary">
          🔄 Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          {treeData.map(epic => (
            <TreeNode key={epic._id} item={epic} level={0} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <span className="text-gray-700">Epic - Large body of work</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">✨</span>
            <span className="text-gray-700">Feature - User-facing functionality</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">✅</span>
            <span className="text-gray-700">Task - Individual work item</span>
          </div>
        </div>
      </div>
    </div>
  );
}
