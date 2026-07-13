import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable
} from '@dnd-kit/core';
import { useApp } from '../context/AppContext';
import { epicsApi, featuresApi, tasksApi } from '../services/api';
import TaskCard from '../components/Task/TaskCard';
import TaskForm from '../components/Task/TaskForm';
import Modal from '../components/Common/Modal';
import Loading from '../components/Common/Loading';
import EmptyState from '../components/Common/EmptyState';
import { filterByQuery } from '../utils/helpers';

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'To Do', header: 'bg-blue-50 text-blue-900' },
  { id: 'in_progress', label: 'In Progress', header: 'bg-yellow-50 text-yellow-900' },
  { id: 'done', label: 'Done', header: 'bg-green-50 text-green-900' },
  { id: 'blocked', label: 'Blocked', header: 'bg-red-50 text-red-900' }
];

// A Kanban column that accepts dropped task cards.
function DroppableColumn({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      data-testid={`column-${id}`}
      className={`space-y-3 min-h-[80px] rounded-lg transition-colors ${
        isOver ? 'ring-2 ring-blue-400 bg-blue-50/40' : ''
      }`}
    >
      {children}
    </div>
  );
}

// A draggable wrapper around a task card. An 8px activation distance keeps the
// card's status <select> and menu clickable.
function DraggableTask({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

export default function TaskView() {
  const { currentProject, showToast } = useApp();
  const [tasks, setTasks] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const loadIdRef = useRef(0);

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject]);

  const loadData = async () => {
    const loadId = ++loadIdRef.current;
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

      if (loadId !== loadIdRef.current) return;
      setFeatures(allFeatures);
      setTasks(allTasks);
    } catch (error) {
      if (loadId === loadIdRef.current) showToast('Failed to load tasks', 'error');
    } finally {
      if (loadId === loadIdRef.current) setLoading(false);
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

  // Require a small drag distance so clicks on the card's controls still work.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find(t => t._id === active.id);
    if (task && task.status !== over.id) {
      handleStatusChange(task, over.id);
    }
  };

  if (loading) {
    return <Loading message="Loading tasks..." />;
  }

  if (tasks.length === 0) {
    return (
      <div>
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

  const visibleTasks = filterByQuery(tasks, searchQuery);
  const tasksByStatus = {
    todo: visibleTasks.filter(t => t.status === 'todo'),
    in_progress: visibleTasks.filter(t => t.status === 'in_progress'),
    done: visibleTasks.filter(t => t.status === 'done'),
    blocked: visibleTasks.filter(t => t.status === 'blocked')
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
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleCreate} className="btn-primary">
            + Add Task
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {KANBAN_COLUMNS.map(col => (
              <div key={col.id}>
                <div className={`rounded-lg p-3 mb-4 ${col.header}`}>
                  <h3 className="font-semibold">
                    {col.label} ({tasksByStatus[col.id].length})
                  </h3>
                </div>
                <DroppableColumn id={col.id}>
                  {tasksByStatus[col.id].map(task => (
                    <DraggableTask key={task._id} id={task._id}>
                      <TaskCard
                        task={task}
                        featureName={task.featureName}
                        epicName={task.epicName}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                      />
                    </DraggableTask>
                  ))}
                </DroppableColumn>
              </div>
            ))}
          </div>
        </DndContext>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleTasks.map(task => (
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
