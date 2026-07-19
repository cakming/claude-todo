import { trashApi } from '../services/api';

/**
 * Build the options object for showToast that appends an "Undo" button. The
 * button restores the delete `batch` from trash, reversing the delete (and its
 * cascade). Returns an empty object when there is no batch, so callers can
 * always spread it into showToast.
 */
export function undoDeleteToast({ project, batch, showToast, reload }) {
  if (!batch) return {};
  return {
    action: {
      label: 'Undo',
      onClick: async () => {
        try {
          await trashApi.restore(project, batch);
          showToast('Restored', 'success');
          reload();
        } catch (e) {
          showToast(e.message || 'Failed to restore', 'error');
        }
      }
    }
  };
}
