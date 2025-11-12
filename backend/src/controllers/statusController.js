import { DOC_TYPES } from '../models/schemas.js';

/**
 * Update parent status based on children status
 * Auto-updates feature/epic status to 'done' when all children are 'done'
 */
export async function updateParentStatus(collection, parentId, parentType) {
  try {
    let childType;
    let childKey;

    if (parentType === DOC_TYPES.EPIC) {
      childType = DOC_TYPES.FEATURE;
      childKey = 'epic_id';
    } else if (parentType === DOC_TYPES.FEATURE) {
      childType = DOC_TYPES.TASK;
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

    // Check if any child is blocked
    const anyBlocked = children.some(child => child.status === 'blocked');

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
      if (parentType === DOC_TYPES.FEATURE && parent.epic_id) {
        await updateParentStatus(collection, parent.epic_id, DOC_TYPES.EPIC);
      }
    }
  } catch (error) {
    console.error('Error updating parent status:', error);
  }
}

/**
 * Calculate progress for an item (epic or feature)
 */
export async function calculateProgress(collection, itemId, itemType) {
  let childType;
  let childKey;

  if (itemType === DOC_TYPES.EPIC) {
    childType = DOC_TYPES.FEATURE;
    childKey = 'epic_id';
  } else if (itemType === DOC_TYPES.FEATURE) {
    childType = DOC_TYPES.TASK;
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
