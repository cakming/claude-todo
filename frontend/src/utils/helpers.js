/**
 * Format date to readable string
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format datetime to readable string
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Truncate text to specified length
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get status color class
 */
export function getStatusClass(status) {
  const statusMap = {
    planning: 'status-planning',
    todo: 'status-todo',
    in_progress: 'status-in-progress',
    done: 'status-done',
    blocked: 'status-blocked'
  };
  return statusMap[status] || 'status-todo';
}

/**
 * Get status display name
 */
export function getStatusDisplay(status) {
  const statusMap = {
    planning: 'Planning',
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    blocked: 'Blocked'
  };
  return statusMap[status] || status;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(items, statusKey = 'status') {
  if (!items || items.length === 0) {
    return { total: 0, completed: 0, percentage: 0 };
  }

  const total = items.length;
  const completed = items.filter(item => item[statusKey] === 'done').length;
  const percentage = Math.round((completed / total) * 100);

  return { total, completed, percentage };
}

/**
 * Check if item has blocked children
 */
export function hasBlockedChildren(item) {
  if (!item) return false;

  if (item.features) {
    if (item.features.some(f => f.status === 'blocked')) return true;
    if (item.features.some(f => hasBlockedChildren(f))) return true;
  }

  if (item.tasks) {
    if (item.tasks.some(t => t.status === 'blocked')) return true;
  }

  return false;
}

/**
 * Get icon for item type
 */
export function getTypeIcon(type) {
  const iconMap = {
    epic: '📊',
    feature: '✨',
    task: '✅'
  };
  return iconMap[type] || '📄';
}

/**
 * Sort items by status priority
 */
export function sortByStatusPriority(items) {
  const statusPriority = {
    in_progress: 1,
    todo: 2,
    blocked: 3,
    planning: 4,
    done: 5
  };

  return [...items].sort((a, b) => {
    return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
  });
}
