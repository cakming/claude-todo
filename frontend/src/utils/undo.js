import { restoreApi } from '../services/api';

/**
 * Build the options object for showToast that appends an "Undo" button. The
 * button restores the documents a delete endpoint returned in `removed`,
 * reversing the delete (and its cascade). Returns an empty object when there is
 * nothing to restore, so callers can always spread it into showToast.
 */
export function undoDeleteToast({ project, removed, showToast, reload }) {
  if (!Array.isArray(removed) || removed.length === 0) return {};
  return {
    action: {
      label: 'Undo',
      onClick: async () => {
        try {
          await restoreApi.restore(project, removed);
          showToast('Restored', 'success');
          reload();
        } catch (e) {
          showToast(e.message || 'Failed to restore', 'error');
        }
      }
    }
  };
}
