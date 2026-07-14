import { sharesApi } from '../services/api';

// Create a share link and copy it to the clipboard, reporting via a toast.
// scope is 'project' or 'page' (pageId required for 'page').
export async function createAndCopyShare({ project, scope, pageId, showToast }) {
  try {
    const res = await sharesApi.create(project, { scope, pageId });
    const url = `${window.location.origin}${res.path}`;
    let copied = false;
    try {
      await navigator.clipboard?.writeText(url);
      copied = true;
    } catch (e) {
      // Clipboard can be unavailable (permissions/insecure context); fall back
      // to just showing the URL.
    }
    showToast(copied ? `Read-only link copied: ${url}` : `Read-only link: ${url}`, 'success');
    return url;
  } catch (e) {
    showToast(e.message || 'Failed to create share link', 'error');
    return null;
  }
}
