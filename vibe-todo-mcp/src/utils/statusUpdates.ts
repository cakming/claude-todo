import { Collection, ObjectId } from 'mongodb';
import { ItemType } from '../schemas.js';

export async function updateParentStatus(
  collection: Collection,
  parentId: ObjectId,
  parentType: ItemType
): Promise<void> {
  let childType: ItemType;
  let childKey: string;

  if (parentType === 'epic') {
    childType = 'feature';
    childKey = 'epic_id';
  } else if (parentType === 'feature') {
    childType = 'task';
    childKey = 'feature_id';
  } else {
    return; // Tasks don't have children
  }

  // Get all children
  const children = await collection.find({
    type: childType,
    [childKey]: parentId
  }).toArray();

  // If no children, don't auto-update status
  if (children.length === 0) {
    return;
  }

  // Check if all children are done
  const allDone = children.every(child => child.status === 'done');

  // Get current parent
  const parent = await collection.findOne({
    _id: parentId,
    type: parentType
  });

  if (!parent) {
    return;
  }

  let newStatus = parent.status;

  // Auto-update logic
  if (allDone && parent.status !== 'done') {
    newStatus = 'done';
  } else if (!allDone && parent.status === 'done') {
    // If parent is done but not all children are done, revert to in_progress
    newStatus = 'in_progress';
  }

  // Update parent if status changed
  if (newStatus !== parent.status) {
    await collection.updateOne(
      { _id: parentId, type: parentType },
      {
        $set: {
          status: newStatus,
          updated_at: new Date()
        }
      }
    );

    // Recursively update grandparent if this is a feature
    if (parentType === 'feature' && parent.epic_id) {
      await updateParentStatus(collection, parent.epic_id, 'epic');
    }
  }
}

export async function calculateProgress(
  collection: Collection,
  itemId: ObjectId,
  itemType: ItemType
): Promise<{ total: number; completed: number; percentage: number }> {
  let childType: ItemType;
  let childKey: string;

  if (itemType === 'epic') {
    childType = 'feature';
    childKey = 'epic_id';
  } else if (itemType === 'feature') {
    childType = 'task';
    childKey = 'feature_id';
  } else {
    return { total: 0, completed: 0, percentage: 0 };
  }

  const children = await collection.find({
    type: childType,
    [childKey]: itemId
  }).toArray();

  const total = children.length;
  const completed = children.filter(child => child.status === 'done').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}
