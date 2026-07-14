import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { epicsApi, featuresApi } from '../services/api';
import EpicCard from '../components/Epic/EpicCard';
import EpicForm from '../components/Epic/EpicForm';
import Modal from '../components/Common/Modal';
import Loading from '../components/Common/Loading';
import EmptyState from '../components/Common/EmptyState';
import { calculateProgress } from '../utils/helpers';
import { undoDeleteToast } from '../utils/undo';

export default function EpicView() {
  const { currentProject, showToast, refreshTick } = useApp();
  const [epics, setEpics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEpic, setEditingEpic] = useState(null);
  const [expandedEpic, setExpandedEpic] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const loadIdRef = useRef(0);
  const pageCountRef = useRef(1); // how many pages are currently shown

  const PAGE_SIZE = 9;

  // Load on project change and whenever the search term changes. Typing is
  // debounced; server-side search means results span all pages, not just the
  // ones already loaded.
  useEffect(() => {
    if (!currentProject) return;
    const handle = setTimeout(() => {
      pageCountRef.current = 1;
      loadEpics();
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(handle);
  }, [currentProject, searchQuery]);

  // Background refresh on the shared tick (no spinner, and not while editing).
  useEffect(() => {
    if (currentProject && refreshTick > 0 && !showModal) {
      loadEpics({ silent: true });
    }
  }, [refreshTick]);

  const withProgress = (epicList) =>
    Promise.all(
      epicList.map(async (epic) => {
        try {
          const featuresResponse = await featuresApi.getByEpic(currentProject, epic._id);
          return { ...epic, progress: calculateProgress(featuresResponse.data) };
        } catch (error) {
          return { ...epic, progress: { total: 0, completed: 0, percentage: 0 } };
        }
      })
    );

  // `more: true` appends the next page; otherwise (re)loads all shown pages.
  const loadEpics = async ({ silent, more } = {}) => {
    const loadId = ++loadIdRef.current;
    try {
      if (!silent && !more) setLoading(true);
      const page = more ? pageCountRef.current + 1 : 1;
      const limit = more ? PAGE_SIZE : PAGE_SIZE * pageCountRef.current;
      const response = await epicsApi.getAll(currentProject, {
        limit,
        page,
        search: searchQuery || undefined
      });
      const epicsWithProgress = await withProgress(response.data);

      if (loadId !== loadIdRef.current) return; // superseded
      setEpics((prev) => (more ? [...prev, ...epicsWithProgress] : epicsWithProgress));
      if (more) pageCountRef.current = page;

      const total = response.pagination?.total ?? epicsWithProgress.length;
      setHasMore(total > pageCountRef.current * PAGE_SIZE);
    } catch (error) {
      if (!silent && loadId === loadIdRef.current) showToast('Failed to load epics', 'error');
    } finally {
      if (!silent && !more) setLoading(false);
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
      const res = await epicsApi.delete(currentProject, epic._id);
      showToast('Epic deleted successfully', 'success',
        undoDeleteToast({ project: currentProject, removed: res.removed, showToast, reload: loadEpics }));
      loadEpics();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (loading) {
    return <Loading message="Loading epics..." />;
  }

  // A brand-new project (no epics and no active search) gets the big empty state.
  const isEmptyProject = epics.length === 0 && !searchQuery;

  return (
    <div>
      {isEmptyProject ? (
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

          {epics.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No epics match "{searchQuery}".</p>
          ) : (
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
          )}

          {hasMore && (
            <div className="flex justify-center mt-6">
              <button onClick={() => loadEpics({ more: true })} className="btn-secondary">
                Load more
              </button>
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
