import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../config/mongodb.js';
import { DOC_TYPES } from '../models/schemas.js';
import { updateParentStatus } from './statusController.js';
import { logActivity } from '../utils/activity.js';

const ITEM_TYPES = [DOC_TYPES.EPIC, DOC_TYPES.FEATURE, DOC_TYPES.TASK, DOC_TYPES.PAGE];

/**
 * Restore previously-deleted items (the undo of a delete). The client passes
 * back the exact documents the delete endpoint returned; ids are preserved so
 * parent/child links stay intact, and the operation is idempotent (upsert) so a
 * double-undo is harmless. Parent statuses are recomputed afterwards.
 */
export async function restoreItems(req, res) {
  try {
    const { project } = req.params;
    const items = req.body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }

    let docs;
    try {
      docs = items
        .filter((it) => ITEM_TYPES.includes(it.type))
        .map((it) => {
          const doc = { ...it };
          if (doc._id) doc._id = new ObjectId(doc._id);
          if (doc.epic_id) doc.epic_id = new ObjectId(doc.epic_id);
          if (doc.feature_id) doc.feature_id = new ObjectId(doc.feature_id);
          return doc;
        });
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid id in restore data' });
    }

    if (docs.length === 0) {
      return res.status(400).json({ success: false, error: 'No restorable items provided' });
    }

    const collection = getProjectCollection(project);
    await collection.bulkWrite(
      docs.map((doc) => ({
        replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true }
      }))
    );

    // Recompute affected parents: features roll up to their epic, tasks to their
    // feature. Dedup so each parent is recomputed once.
    const epicParents = new Set();
    const featureParents = new Set();
    for (const doc of docs) {
      if (doc.type === DOC_TYPES.FEATURE && doc.epic_id) epicParents.add(String(doc.epic_id));
      if (doc.type === DOC_TYPES.TASK && doc.feature_id) featureParents.add(String(doc.feature_id));
    }
    for (const id of featureParents) {
      await updateParentStatus(collection, new ObjectId(id), DOC_TYPES.FEATURE);
    }
    for (const id of epicParents) {
      await updateParentStatus(collection, new ObjectId(id), DOC_TYPES.EPIC);
    }

    await logActivity(project, { action: 'restored', item_type: 'item', title: `${docs.length} items` });
    res.json({ success: true, restored: docs.length });
  } catch (error) {
    console.error('Error restoring items:', error);
    res.status(500).json({ success: false, error: 'Failed to restore items' });
  }
}
