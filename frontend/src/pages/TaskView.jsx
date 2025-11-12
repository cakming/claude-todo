import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { epicsApi, featuresApi, tasksApi } from '../services/api';
import TaskCard from '../components/Task/TaskCard';
import TaskForm from '../components/Task/TaskForm';
import Modal from '../components/Common/Modal';
import Loading from '../components/Common/Loading';
import EmptyState from '../components/Common/EmptyState';

export default function TaskView() {
  const { currentProject, showToast } = useApp();
  const [tasks, setTasks] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject]);

  const loadData = async () => {
    try {
      setLoading(true);
      const epicsResponse = await epicsApi.getAll(currentProject);

      const allFeatures = [];
      const allTasks = [];

      for (const epic of epicsResponse.data) {
        try {
          const featuresResponse = await featuresApi.getByEpic(currentProject, epic._id);

          for (const feature of featuresResponse.data) {
            allFeatures.push({
              ...feature,
              epicName: epic.title
            });

            try {
              const tasksResponse = await tasksApi.getByFeature(currentProject, feature._id);
              for (const task of tasksResponse.data) {
                allTasks.push({
                  ...task,
                  featureName: feature.title,
                  epicName: epic.title
                });
              }
            } catch (error) {
              console.error(`Failed to load tasks for feature ${feature._id}:`, error);
            }
          }
        } catch (error) {
          console.error(`Failed to load features for epic ${epic._id}:`, error);
        }
      }

      setFeatures(allFeatures);
      setTasks(allTasks);
    } catch (error) {
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingTask) {
        await tasksApi.update(currentProject, editingTask._id, formData);
        showToast('Task updated successfully', 'success');
      } else {
        await tasksApi.create(currentProject, formData.feature_id, formData);
        showToast('Task created successfully', 'success');
      }
      setShowModal(false);
      setEditingTask(null);
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async (task) => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    try {
      await tasksApi.delete(currentProject, task._id);
      showToast('Task deleted successfully', 'success');
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksApi.update(currentProject, task._id, { status: newStatus });
      showToast('Task status updated', 'success');
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (loading) {
    return <Loading message="Loading tasks..." />;
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="✅"
        title="No Tasks Yet"
        message="Create your first task under a feature to start tracking work."
        action={
          features.length > 0 ? (
            <button onClick={handleCreate} className="btn-primary">
              Create First Task
            </button>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">You need to create features first!</p>
            </div>
          )
        }
      />
    );
  }

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
    blocked: tasks.filter(t => t.status === 'blocked')
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-gray-600 mt-1">
            Individual work items organized by feature
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              List
            </button>
          </div>
          <button onClick={handleCreate} className="btn-primary">
            + Add Task
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* To Do Column */}
          <div>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <h3 className="font-semibold text-blue-900">
                To Do ({tasksByStatus.todo.length})
              </h3>
            </div>
            <div className="space-y-3">
              {tasksByStatus.todo.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  featureName={task.featureName}
                  epicName={task.epicName}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div>
            <div className="bg-yellow-50 rounded-lg p-3 mb-4">
              <h3 className="font-semibold text-yellow-900">
                In Progress ({tasksByStatus.in_progress.length})
              </h3>
            </div>
            <div className="space-y-3">
              {tasksByStatus.in_progress.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  featureName={task.featureName}
                  epicName={task.epicName}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>

          {/* Done Column */}
          <div>
            <div className="bg-green-50 rounded-lg p-3 mb-4">
              <h3 className="font-semibold text-green-900">
                Done ({tasksByStatus.done.length})
              </h3>
            </div>
            <div className="space-y-3">
              {tasksByStatus.done.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  featureName={task.featureName}
                  epicName={task.epicName}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>

          {/* Blocked Column */}
          <div>
            <div className="bg-red-50 rounded-lg p-3 mb-4">
              <h3 className="font-semibold text-red-900">
                Blocked ({tasksByStatus.blocked.length})
              </h3>
            </div>
            <div className="space-y-3">
              {tasksByStatus.blocked.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  featureName={task.featureName}
                  epicName={task.epicName}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              featureName={task.featureName}
              epicName={task.epicName}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm
          task={editingTask}
          features={features}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
        />
      </Modal>
    </div>
  );
}
