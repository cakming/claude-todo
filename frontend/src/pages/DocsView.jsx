import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { pagesApi, uploadsApi } from '../services/api';
import { renderMarkdown } from '../utils/markdown';
import { undoDeleteToast } from '../utils/undo';
import { createAndCopyShare } from '../utils/share';
import Loading from '../components/Common/Loading';

// A simple Notion-lite docs surface: per-project markdown pages with live
// preview and image upload. Pages are separate from the epic/feature/task tree.
export default function DocsView() {
  const { currentProject, showToast, refreshTick } = useApp();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const loadIdRef = useRef(0);
  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);

  // Load on project change and (debounced) search.
  useEffect(() => {
    if (!currentProject) return;
    const handle = setTimeout(() => loadPages(), searchQuery ? 300 : 0);
    return () => clearTimeout(handle);
  }, [currentProject, searchQuery]);

  // Silent refresh of the list on the shared realtime tick (never touches the
  // editor, so in-progress edits are safe).
  useEffect(() => {
    if (currentProject && refreshTick > 0) loadPages({ silent: true });
  }, [refreshTick]);

  const loadPages = async ({ silent } = {}) => {
    const loadId = ++loadIdRef.current;
    try {
      if (!silent) setLoading(true);
      const res = await pagesApi.getAll(currentProject, { search: searchQuery || undefined });
      if (loadId !== loadIdRef.current) return;
      setPages(res.data);
    } catch (e) {
      if (!silent && loadId === loadIdRef.current) showToast('Failed to load pages', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const selectPage = (page) => {
    setSelectedId(page._id);
    setTitle(page.title);
    setBody(page.body || '');
    setEditing(true);
    setShowPreview(false);
  };

  const newPage = () => {
    setSelectedId(null);
    setTitle('');
    setBody('');
    setEditing(true);
    setShowPreview(false);
  };

  const closeEditor = () => {
    setEditing(false);
    setSelectedId(null);
    setTitle('');
    setBody('');
  };

  const save = async () => {
    if (!title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    try {
      const saved = selectedId
        ? await pagesApi.update(currentProject, selectedId, { title, body })
        : await pagesApi.create(currentProject, { title, body });
      setSelectedId(saved.data._id);
      showToast('Page saved', 'success');
      loadPages();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await pagesApi.delete(currentProject, selectedId);
      showToast('Page deleted', 'success',
        undoDeleteToast({ project: currentProject, removed: res.removed, showToast, reload: loadPages }));
      closeEditor();
      loadPages();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const onImageSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadsApi.uploadImage(currentProject, file);
      const snippet = `\n![${file.name}](${url})\n`;
      const el = bodyRef.current;
      if (el && typeof el.selectionStart === 'number') {
        const at = el.selectionStart;
        setBody(body.slice(0, at) + snippet + body.slice(at));
      } else {
        setBody((b) => b + snippet);
      }
      showToast('Image uploaded', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading docs..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Docs</h2>
          <p className="text-gray-600 mt-1">Project notes and documentation</p>
        </div>
        <button onClick={newPage} className="btn-primary">+ New Page</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Page list */}
        <div className="lg:col-span-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docs..."
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {pages.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">
              {searchQuery ? `No docs match "${searchQuery}".` : 'No pages yet. Create your first doc.'}
            </p>
          ) : (
            <ul className="space-y-1" aria-label="Doc pages">
              {pages.map((page) => (
                <li key={page._id}>
                  <button
                    onClick={() => selectPage(page)}
                    aria-current={selectedId === page._id}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedId === page._id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="block truncate">📄 {page.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Editor / preview */}
        <div className="lg:col-span-2">
          {!editing ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-500">
              Select a page to edit, or create a new one.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page title"
                aria-label="Page title"
                className="w-full mb-3 px-3 py-2 text-lg font-semibold border-b border-gray-200 focus:outline-none focus:border-blue-500"
              />

              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary text-sm py-1"
                >
                  {uploading ? 'Uploading…' : '🖼 Insert image'}
                </button>
                <button
                  onClick={() => setShowPreview((p) => !p)}
                  className="btn-secondary text-sm py-1"
                  aria-pressed={showPreview}
                >
                  {showPreview ? 'Edit' : 'Preview'}
                </button>
                <div className="flex-1" />
                {selectedId && (
                  <button
                    onClick={() => createAndCopyShare({ project: currentProject, scope: 'page', pageId: selectedId, showToast })}
                    className="btn-secondary text-sm py-1"
                    title="Create a public read-only link to this page"
                  >
                    Share
                  </button>
                )}
                <button onClick={save} className="btn-primary text-sm py-1">Save</button>
                {selectedId && (
                  <button onClick={remove} className="text-sm text-red-600 hover:text-red-700 px-2">
                    Delete
                  </button>
                )}
                <button onClick={closeEditor} className="text-sm text-gray-600 hover:text-gray-800 px-2">
                  Close
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onImageSelected}
                  className="hidden"
                />
              </div>

              {showPreview ? (
                <div
                  className="markdown-body min-h-[300px] px-1"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
                />
              ) : (
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write in markdown… # Heading, **bold**, - lists, and uploaded images."
                  aria-label="Page body"
                  className="w-full min-h-[300px] px-3 py-2 font-mono text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
