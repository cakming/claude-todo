import { useState, useEffect } from 'react';
import Modal from './Modal';
import { commentsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

// Render a comment body with @mentions highlighted.
function CommentBody({ text }) {
  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
  return (
    <span className="text-sm text-gray-800 whitespace-pre-wrap break-words">
      {parts.map((p, i) =>
        /^@[a-zA-Z0-9_.-]+$/.test(p) ? (
          <span key={i} className="text-blue-600 font-medium">{p}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  );
}

// A comment thread on an epic/feature/task. `target` = { type, id, title }.
export default function CommentsModal({ isOpen, onClose, target }) {
  const { currentProject, showToast } = useApp();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (isOpen && target) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, target?.id]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await commentsApi.list(currentProject, target.type, target.id);
      setComments(res.data);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const post = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      await commentsApi.create(currentProject, {
        target_type: target.type,
        target_id: target.id,
        body: draft
      });
      setDraft('');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id) => {
    try {
      await commentsApi.delete(currentProject, id);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (!target) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Comments — ${target.title}`} size="md">
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet. Start the thread.</p>
        ) : (
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {comments.map((c) => (
              <li key={c._id} className="group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">{c.author}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                    <button
                      onClick={() => remove(c._id)}
                      className="text-xs text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-700"
                      aria-label="Delete comment"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <CommentBody text={c.body} />
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-gray-100 pt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment… use @name to mention"
            aria-label="New comment"
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end mt-2">
            <button onClick={post} disabled={posting || !draft.trim()} className="btn-primary text-sm py-1">
              {posting ? 'Posting…' : 'Comment'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
