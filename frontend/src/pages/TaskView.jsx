import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
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
import { undoDeleteToast } from '../utils/undo';

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'To Do', header: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200' },
  { id: 'in_progress', label: 'In Progress', header: 'bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200' },
  { id: 'done', label: 'Done', header: 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200' },
  { id: 'blocked', label: 'Blocked', header: 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200' }
];

// A Kanban column that accepts dropped task cards.
function DroppableColumn({ id, label, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      data-testid={`column-${id}`}
      role="list"
      aria-label={label ? `${label} tasks` : undefined}
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
function DraggableTask({ id, label, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      aria-roledescription="Draggable task"
      aria-label={label}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

export default function TaskView({ drillFilter }) {
  const { currentProject, showToast, refreshTick } = useApp();
  const [tasks, setTasks] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const loadIdRef = useRef(0);

  const toggleSelect = (task) => {
    setSelectedIds((prev) =>
      prev.includes(task._id) ? prev.filter((id) => id !== task._id) : [...prev, task._id]
    );
  };

  const bulkMarkDone = async () => {
    const ids = selectedIds;
    const snapshot = tasks;
    // Optimistic: flip the selected cards to Done immediately, then reconcile.
    setTasks((ts) => ts.map((t) => (ids.includes(t._id) ? { ...t, status: 'done' } : t)));
    setSelectedIds([]);
    try {
      await tasksApi.bulkStatus(currentProject, ids, 'done');
      showToast(`${ids.length} task(s) marked done`, 'success');
    } catch (e) {
      setTasks(snapshot); // rollback
      showToast(e.message, 'error');
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected task(s)?`)) return;
    try {
      const res = await tasksApi.bulkDelete(currentProject, selectedIds);
      showToast(`${selectedIds.length} task(s) deleted`, 'success',
        undoDeleteToast({ project: currentProject, batch: res.batch, showToast, reload: loadData }));
      setSelectedIds([]);
      loadData();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject]);

  // Background refresh on the shared tick (skip while a modal is open).
  useEffect(() => {
    if (currentProject && refreshTick > 0 && !showModal) {
      loadData({ silent: true });
    }
  }, [refreshTick]);

  const loadData = async ({ silent } = {}) => {
    const loadId = ++loadIdRef.current;
    try {
      if (!silent) setLoading(true);
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
      if (!silent && loadId === loadIdRef.current) showToast('Failed to load tasks', 'error');
    } finally {
      if (!silent) setLoading(false);
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
      const res = await tasksApi.delete(currentProject, task._id);
      showToast('Task deleted successfully', 'success',
        undoDeleteToast({ project: currentProject, batch: res.batch, showToast, reload: loadData }));
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    const prev = task.status;
    if (prev === newStatus) return;
    // Optimistic: move the card right away (drag-drop and the status dropdown
    // both land here). The server emits a realtime update that silently
    // reconciles parent auto-status; on failure we roll the card back.
    setTasks((ts) => ts.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t)));
    try {
      await tasksApi.update(currentProject, task._id, { status: newStatus });
    } catch (error) {
      setTasks((ts) => ts.map((t) => (t._id === task._id ? { ...t, status: prev } : t)));
      showToast(error.message, 'error');
    }
  };

  // Require a small drag distance so clicks on the card's controls still work.
  // The KeyboardSensor lets keyboard users pick up a card (Space) and move it
  // between columns with the arrow keys.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

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

  // When drilled in from a Feature card, scope to that feature's tasks.
  const scopedTasks = drillFilter?.featureId
    ? tasks.filter((t) => String(t.feature_id) === String(drillFilter.featureId))
    : tasks;
  const visibleTasks = filterByQuery(scopedTasks, searchQuery);
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

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">{selectedIds.length} selected</span>
          <div className="flex items-center space-x-3">
            <button onClick={bulkMarkDone} className="btn-primary text-sm py-1">
              Mark Done
            </button>
            <button onClick={bulkDelete} className="text-sm text-red-600 hover:text-red-700">
              Delete
            </button>
            <button onClick={() => setSelectedIds([])} className="text-sm text-gray-600 hover:text-gray-800">
              Clear
            </button>
          </div>
        </div>
      )}

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
                <DroppableColumn id={col.id} label={col.label}>
                  {tasksByStatus[col.id].map(task => (
                    <DraggableTask key={task._id} id={task._id} label={`${task.title} (${col.label})`}>
                      <TaskCard
                        task={task}
                        featureName={task.featureName}
                        epicName={task.epicName}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        selected={selectedIds.includes(task._id)}
                        onToggleSelect={toggleSelect}
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
              selected={selectedIds.includes(task._id)}
              onToggleSelect={toggleSelect}
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
