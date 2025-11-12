import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { epicsApi, featuresApi } from '../services/api';
import EpicCard from '../components/Epic/EpicCard';
import EpicForm from '../components/Epic/EpicForm';
import Modal from '../components/Common/Modal';
import Loading from '../components/Common/Loading';
import EmptyState from '../components/Common/EmptyState';
import { calculateProgress } from '../utils/helpers';

export default function EpicView() {
  const { currentProject, showToast } = useApp();
  const [epics, setEpics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEpic, setEditingEpic] = useState(null);
  const [expandedEpic, setExpandedEpic] = useState(null);

  useEffect(() => {
    if (currentProject) {
      loadEpics();
    }
  }, [currentProject]);

  const loadEpics = async () => {
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

      setEpics(epicsWithProgress);
    } catch (error) {
      showToast('Failed to load epics', 'error');
    } finally {
      setLoading(false);
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

  if (epics.length === 0) {
    return (
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
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Epics</h2>
          <p className="text-gray-600 mt-1">
            Large bodies of work organized into features
          </p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          + Add Epic
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {epics.map(epic => (
          <EpicCard
            key={epic._id}
            epic={epic}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onExpand={setExpandedEpic}
          />
        ))}
      </div>

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
