import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../config/mongodb.js';
import { DOC_TYPES } from '../models/schemas.js';
import { emitProjectUpdate } from '../realtime.js';

const ITEM_TYPES = [DOC_TYPES.EPIC, DOC_TYPES.FEATURE, DOC_TYPES.TASK, DOC_TYPES.PAGE];

/** Export a project's epics, features, and tasks as JSON. */
export async function exportProject(req, res) {
  try {
    const { project } = req.params;
    const collection = getProjectCollection(project);
    const data = await collection.find({ type: { $in: ITEM_TYPES }, deleted_at: null }).toArray();
    res.json({ success: true, project, exportedAt: new Date(), data });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export project' });
  }
}

/**
 * Import items into a project, replacing its current epics/features/tasks.
 * Ids are preserved so parent/child relationships stay intact.
 */
export async function importProject(req, res) {
  try {
    const { project } = req.params;
    const collection = getProjectCollection(project);
    const items = req.body?.data;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Expected an array of items in `data`' });
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
      return res.status(400).json({ success: false, error: 'Invalid id in import data' });
    }

    // Replace the existing epics/features/tasks.
    await collection.deleteMany({ type: { $in: ITEM_TYPES } });
    if (docs.length > 0) await collection.insertMany(docs);

    emitProjectUpdate(project);
    res.json({ success: true, imported: docs.length });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, error: 'Failed to import project' });
  }
}
