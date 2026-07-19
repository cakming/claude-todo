import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../config/mongodb.js';
import { DOC_TYPES } from '../models/schemas.js';
import { updateParentStatus } from './statusController.js';
import { logActivity } from '../utils/activity.js';

// Priority for choosing a batch's representative item (top of the subtree).
const TYPE_RANK = { epic: 0, feature: 1, task: 2, page: 3 };

// Trashed items older than this are auto-purged (0 disables). Configurable.
function retentionDays() {
  const v = Number(process.env.TRASH_RETENTION_DAYS);
  return Number.isFinite(v) && v >= 0 ? v : 30;
}

// Permanently remove trashed items past the retention window. Best-effort:
// runs lazily when the trash is listed, so no scheduler is needed.
async function purgeExpired(collection) {
  const days = retentionDays();
  if (days <= 0) return;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  await collection.deleteMany({ deleted_at: { $ne: null, $lt: cutoff } });
}

/**
 * List trashed items, grouped by the delete batch they were removed in
 * (so a cascaded epic delete shows as one restorable entry). Newest first.
 */
export async function listTrash(req, res) {
  try {
    const { project } = req.params;
    const collection = getProjectCollection(project);

    // Sweep out anything past the retention window before listing.
    await purgeExpired(collection);

    const docs = await collection
      .find({ deleted_at: { $ne: null } })
      .sort({ deleted_at: -1 })
      .toArray();

    const groups = new Map();
    for (const d of docs) {
      const key = String(d.deleted_batch);
      if (!groups.has(key)) {
        groups.set(key, { batch: key, deleted_at: d.deleted_at, items: [] });
      }
      groups.get(key).items.push({ _id: d._id, type: d.type, title: d.title });
    }

    const data = [...groups.values()].map((g) => {
      const rep = [...g.items].sort((a, b) => TYPE_RANK[a.type] - TYPE_RANK[b.type])[0];
      return {
        batch: g.batch,
        deleted_at: g.deleted_at,
        count: g.items.length,
        label: rep?.title || '(untitled)',
        type: rep?.type
      };
    });

    res.json({ success: true, data, retentionDays: retentionDays() });
  } catch (error) {
    console.error('Error listing trash:', error);
    res.status(500).json({ success: false, error: 'Failed to list trash' });
  }
}

/**
 * Restore a whole delete batch (undo). Clears the trash flags and recomputes
 * affected parent statuses.
 */
export async function restoreBatch(req, res) {
  try {
    const { project } = req.params;
    const { batch } = req.body || {};
    if (!batch) {
      return res.status(400).json({ success: false, error: 'batch is required' });
    }
    let batchId;
    try {
      batchId = new ObjectId(batch);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid batch id' });
    }

    const collection = getProjectCollection(project);
    const docs = await collection.find({ deleted_batch: batchId }).toArray();
    if (docs.length === 0) {
      return res.status(404).json({ success: false, error: 'Nothing to restore for that batch' });
    }

    await collection.updateMany(
      { deleted_batch: batchId },
      { $unset: { deleted_at: '', deleted_batch: '' } }
    );

    // Recompute parents now that children are live again.
    const featureParents = new Set();
    const epicParents = new Set();
    for (const d of docs) {
      if (d.type === DOC_TYPES.TASK && d.feature_id) featureParents.add(String(d.feature_id));
      if (d.type === DOC_TYPES.FEATURE && d.epic_id) epicParents.add(String(d.epic_id));
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
    console.error('Error restoring from trash:', error);
    res.status(500).json({ success: false, error: 'Failed to restore items' });
  }
}

/**
 * Permanently delete a trashed batch (or all trash when batch === 'all').
 */
export async function purgeBatch(req, res) {
  try {
    const { project, batch } = req.params;
    const collection = getProjectCollection(project);

    if (batch === 'all') {
      const result = await collection.deleteMany({ deleted_at: { $ne: null } });
      return res.json({ success: true, purged: result.deletedCount });
    }

    let batchId;
    try {
      batchId = new ObjectId(batch);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid batch id' });
    }
    const result = await collection.deleteMany({ deleted_batch: batchId, deleted_at: { $ne: null } });
    res.json({ success: true, purged: result.deletedCount });
  } catch (error) {
    console.error('Error purging trash:', error);
    res.status(500).json({ success: false, error: 'Failed to purge trash' });
  }
}
