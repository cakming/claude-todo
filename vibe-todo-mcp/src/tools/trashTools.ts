import { Collection, ObjectId } from 'mongodb';
import { getProjectCollection } from '../mongodb.js';
import { updateParentStatus } from '../utils/statusUpdates.js';

// The trash bin surfaces soft-deleted items (deleted_at set) grouped by the
// delete batch they were removed in, so a cascaded delete restores as one unit.
// Mirrors the web app's trashController.

const TYPE_RANK: Record<string, number> = { epic: 0, feature: 1, task: 2, page: 3 };

interface TrashGroup {
  batch: string;
  deleted_at: Date;
  count: number;
  label: string;
  type: string;
}

// Trashed items older than the retention window (TRASH_RETENTION_DAYS, default
// 30; 0 disables) are auto-purged lazily when the trash is listed.
function retentionDays(): number {
  const v = Number(process.env.TRASH_RETENTION_DAYS);
  return Number.isFinite(v) && v >= 0 ? v : 30;
}

async function purgeExpired(collection: Collection): Promise<void> {
  const days = retentionDays();
  if (days <= 0) return;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  await collection.deleteMany({ deleted_at: { $ne: null, $lt: cutoff } });
}

export async function listTrash(
  project: string
): Promise<{ retentionDays: number; batches: TrashGroup[] }> {
  const collection = getProjectCollection(project);

  await purgeExpired(collection);

  const docs = await collection
    .find({ deleted_at: { $ne: null } })
    .sort({ deleted_at: -1 })
    .toArray();

  const groups = new Map<string, { batch: string; deleted_at: Date; items: any[] }>();
  for (const d of docs) {
    const key = String(d.deleted_batch);
    if (!groups.has(key)) {
      groups.set(key, { batch: key, deleted_at: d.deleted_at, items: [] });
    }
    groups.get(key)!.items.push({ _id: d._id, type: d.type, title: d.title });
  }

  const batches = [...groups.values()].map((g) => {
    const rep = [...g.items].sort(
      (a, b) => (TYPE_RANK[a.type] ?? 99) - (TYPE_RANK[b.type] ?? 99)
    )[0];
    return {
      batch: g.batch,
      deleted_at: g.deleted_at,
      count: g.items.length,
      label: rep?.title || '(untitled)',
      type: rep?.type
    };
  });

  return { retentionDays: retentionDays(), batches };
}

/**
 * Restore a whole delete batch and recompute affected parent statuses.
 */
export async function restoreTrash(project: string, batch: string): Promise<{ restored: number }> {
  let batchId: ObjectId;
  try {
    batchId = new ObjectId(batch);
  } catch (e) {
    throw new Error('Invalid batch id');
  }

  const collection = getProjectCollection(project);
  const docs = await collection.find({ deleted_batch: batchId }).toArray();
  if (docs.length === 0) {
    throw new Error('Nothing to restore for that batch');
  }

  await collection.updateMany(
    { deleted_batch: batchId },
    { $unset: { deleted_at: '', deleted_batch: '' } }
  );

  // Recompute parents now that children are live again.
  const featureParents = new Set<string>();
  const epicParents = new Set<string>();
  for (const d of docs) {
    if (d.type === 'task' && d.feature_id) featureParents.add(String(d.feature_id));
    if (d.type === 'feature' && d.epic_id) epicParents.add(String(d.epic_id));
  }
  for (const id of featureParents) {
    await updateParentStatus(collection, new ObjectId(id), 'feature');
  }
  for (const id of epicParents) {
    await updateParentStatus(collection, new ObjectId(id), 'epic');
  }

  return { restored: docs.length };
}

/**
 * Permanently delete a trashed batch, or all trash when batch === 'all'.
 */
export async function purgeTrash(project: string, batch: string): Promise<{ purged: number }> {
  const collection = getProjectCollection(project);

  if (batch === 'all') {
    const result = await collection.deleteMany({ deleted_at: { $ne: null } });
    return { purged: result.deletedCount };
  }

  let batchId: ObjectId;
  try {
    batchId = new ObjectId(batch);
  } catch (e) {
    throw new Error('Invalid batch id');
  }
  const result = await collection.deleteMany({ deleted_batch: batchId, deleted_at: { $ne: null } });
  return { purged: result.deletedCount };
}
