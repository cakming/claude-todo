import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { epicsApi, featuresApi } from '../services/api';
import EpicCard from '../components/Epic/EpicCard';
import EpicForm from '../components/Epic/EpicForm';
import Modal from '../components/Common/Modal';
import Loading from '../components/Common/Loading';
import EmptyState from '../components/Common/EmptyState';
import { calculateProgress, filterByQuery } from '../utils/helpers';

export default function EpicView() {
  const { currentProject, showToast } = useApp();
  const [epics, setEpics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEpic, setEditingEpic] = useState(null);
  const [expandedEpic, setExpandedEpic] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const loadIdRef = useRef(0);

  useEffect(() => {
    if (currentProject) {
      loadEpics();
    }
  }, [currentProject]);

  const loadEpics = async () => {
    // Guard against out-of-order responses when the project changes mid-load.
    const loadId = ++loadIdRef.current;
    try {
      setLoading(true);
      const response = await epicsApi.getAll(currentProject);

      // Load features for each epic to calculate progress
      const epicsWithProgress = await Promise.all(
        response.data.map(async (epic) => {
          try {
            const featuresResponse = await featuresApi.getByEpic(currentProject, epic._id);
            const progress = calculateProgress(featuresResponse.data);
            return { ...epic, progress };
          } catch (error) {
            return { ...epic, progress: { total: 0, completed: 0, percentage: 0 } };
          }
        })
      );

      if (loadId !== loadIdRef.current) return; // a newer load superseded this one
      setEpics(epicsWithProgress);
    } catch (error) {
      if (loadId === loadIdRef.current) showToast('Failed to load epics', 'error');
    } finally {
      if (loadId === loadIdRef.current) setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEpic(null);
    setShowModal(true);
  };

  const handleEdit = (epic) => {
    setEditingEpic(epic);
    setShowModal(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingEpic) {
        await epicsApi.update(currentProject, editingEpic._id, formData);
        showToast('Epic updated successfully', 'success');
      } else {
        await epicsApi.create(currentProject, formData);
        showToast('Epic created successfully', 'success');
      }
      setShowModal(false);
      setEditingEpic(null);
      loadEpics();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async (epic) => {
    if (!confirm(`Are you sure you want to delete "${epic.title}"? This will also delete all related features and tasks.`)) {
      return;
    }

    try {
      await epicsApi.delete(currentProject, epic._id);
      showToast('Epic deleted successfully', 'success');
      loadEpics();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (loading) {
    return <Loading message="Loading epics..." />;
  }

  return (
    <div>
      {epics.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No Epics Yet"
          message="Create your first epic to organize your large body of work. Epics contain features and tasks."
          action={
            <button onClick={handleCreate} className="btn-primary">
              Create First Epic
            </button>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Epics</h2>
              <p className="text-gray-600 mt-1">
                Large bodies of work organized into features
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search epics..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleCreate} className="btn-primary">
                + Add Epic
              </button>
            </div>
          </div>

          {filterByQuery(epics, searchQuery).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No epics match "{searchQuery}".</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterByQuery(epics, searchQuery).map(epic => (
                <EpicCard
                  key={epic._id}
                  epic={epic}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onExpand={setExpandedEpic}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEpic(null);
        }}
        title={editingEpic ? 'Edit Epic' : 'Create New Epic'}
      >
        <EpicForm
          epic={editingEpic}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingEpic(null);
          }}
        />
      </Modal>
    </div>
  );
}
