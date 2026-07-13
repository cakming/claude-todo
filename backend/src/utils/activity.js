import { getDB } from '../config/mongodb.js';

const ACTIVITY_COLLECTION = 'activity';

/**
 * Record an activity entry. Best-effort: never throws so it can't break the
 * mutation that triggered it.
 * @param {string} project - project name
 * @param {{action: string, item_type: string, title?: string}} entry
 */
export async function logActivity(project, entry) {
  try {
    await getDB().collection(ACTIVITY_COLLECTION).insertOne({
      project,
      action: entry.action, // 'created' | 'updated' | 'deleted'
      item_type: entry.item_type, // 'epic' | 'feature' | 'task'
      title: entry.title || '',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
}

/**
 * Get recent activity for a project, newest first.
 */
export async function getActivity(project, limit = 50) {
  return getDB()
    .collection(ACTIVITY_COLLECTION)
    .find({ project })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}
