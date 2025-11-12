import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { epicsApi, featuresApi, tasksApi } from '../services/api';
import FeatureCard from '../components/Feature/FeatureCard';
import FeatureForm from '../components/Feature/FeatureForm';
import Modal from '../components/Common/Modal';
import Loading from '../components/Common/Loading';
import EmptyState from '../components/Common/EmptyState';
import { calculateProgress } from '../utils/helpers';

export default function FeatureView() {
  const { currentProject, showToast } = useApp();
  const [features, setFeatures] = useState([]);
  const [epics, setEpics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [selectedEpicFilter, setSelectedEpicFilter] = useState('all');

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject]);

  const loadData = async () => {
    try {
      setLoading(true);
      const epicsResponse = await epicsApi.getAll(currentProject);
      setEpics(epicsResponse.data);

      // Load all features for all epics
      const allFeatures = [];
      for (const epic of epicsResponse.data) {
        try {
          const featuresResponse = await featuresApi.getByEpic(currentProject, epic._id);

          // Load tasks for each feature to calculate progress
          for (const feature of featuresResponse.data) {
            try {
              const tasksResponse = await tasksApi.getByFeature(currentProject, feature._id);
              const progress = calculateProgress(tasksResponse.data);
              allFeatures.push({
                ...feature,
                epicName: epic.title,
                progress
              });
            } catch (error) {
              allFeatures.push({
                ...feature,
                epicName: epic.title,
                progress: { total: 0, completed: 0, percentage: 0 }
              });
            }
          }
        } catch (error) {
          console.error(`Failed to load features for epic ${epic._id}:`, error);
        }
      }

      setFeatures(allFeatures);
    } catch (error) {
      showToast('Failed to load features', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFeature(null);
    setShowModal(true);
  };

  const handleEdit = (feature) => {
    setEditingFeature(feature);
    setShowModal(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingFeature) {
        await featuresApi.update(currentProject, editingFeature._id, formData);
        showToast('Feature updated successfully', 'success');
      } else {
        await featuresApi.create(currentProject, formData.epic_id, formData);
        showToast('Feature created successfully', 'success');
      }
      setShowModal(false);
      setEditingFeature(null);
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async (feature) => {
    if (!confirm(`Are you sure you want to delete "${feature.title}"? This will also delete all related tasks.`)) {
      return;
    }

    try {
      await featuresApi.delete(currentProject, feature._id);
      showToast('Feature deleted successfully', 'success');
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const filteredFeatures = selectedEpicFilter === 'all'
    ? features
    : features.filter(f => f.epic_id === selectedEpicFilter);

  if (loading) {
    return <Loading message="Loading features..." />;
  }

  if (features.length === 0) {
    return (
      <EmptyState
        icon="✨"
        title="No Features Yet"
        message="Create your first feature under an epic. Features contain tasks."
        action={
          epics.length > 0 ? (
            <button onClick={handleCreate} className="btn-primary">
              Create First Feature
            </button>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">You need to create an epic first!</p>
            </div>
          )
        }
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Features</h2>
          <p className="text-gray-600 mt-1">
            Feature implementations organized by epic
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedEpicFilter}
            onChange={(e) => setSelectedEpicFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Epics</option>
            {epics.map(epic => (
              <option key={epic._id} value={epic._id}>
                {epic.title}
              </option>
            ))}
          </select>
          <button onClick={handleCreate} className="btn-primary">
            + Add Feature
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map(feature => (
          <FeatureCard
            key={feature._id}
            feature={feature}
            epicName={feature.epicName}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onExpand={() => {}}
          />
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingFeature(null);
        }}
        title={editingFeature ? 'Edit Feature' : 'Create New Feature'}
      >
        <FeatureForm
          feature={editingFeature}
          epics={epics}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingFeature(null);
          }}
        />
      </Modal>
    </div>
  );
}
