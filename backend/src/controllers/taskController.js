import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../config/mongodb.js';
import { validateTask, createTaskDoc, DOC_TYPES, ITEM_STATUS } from '../models/schemas.js';
import { updateParentStatus } from './statusController.js';
import { logActivity } from '../utils/activity.js';
import { applyListFilters } from '../utils/query.js';

/**
 * Get all tasks for a feature
 */
export async function getTasksByFeature(req, res) {
  try {
    const { project, featureId } = req.params;
    const collection = getProjectCollection(project);

    const query = applyListFilters(
      { type: DOC_TYPES.TASK, feature_id: new ObjectId(featureId) },
      req.query
    );
    const tasks = await collection.find(query).toArray();

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks'
    });
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskById(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    const task = await collection.findOne({
      _id: new ObjectId(id),
      type: DOC_TYPES.TASK
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task'
    });
  }
}

/**
 * Create a new task
 */
export async function createTask(req, res) {
  try {
    const { project, featureId } = req.params;
    const collection = getProjectCollection(project);

    // Verify feature exists
    const feature = await collection.findOne({
      _id: new ObjectId(featureId),
      type: DOC_TYPES.FEATURE
    });

    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }

    const taskData = { ...req.body, feature_id: featureId };
    const errors = validateTask(taskData);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    const taskDoc = createTaskDoc(taskData);
    const result = await collection.insertOne(taskDoc);
    await logActivity(project, { action: 'created', item_type: 'task', title: taskDoc.title });

    res.status(201).json({
      success: true,
      data: {
        _id: result.insertedId,
        ...taskDoc
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task'
    });
  }
}

/**
 * Update a task
 */
export async function updateTask(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    // Don't allow changing type, feature_id, or created_at
    const { type, feature_id, created_at, _id, ...updateData } = req.body;

    // Get current task to know its feature
    const currentTask = await collection.findOne({
      _id: new ObjectId(id),
      type: DOC_TYPES.TASK
    });

    if (!currentTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), type: DOC_TYPES.TASK },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    // Check if we need to update parent feature status
    if (updateData.status) {
      await updateParentStatus(collection, currentTask.feature_id, DOC_TYPES.FEATURE);
    }

    await logActivity(project, { action: 'updated', item_type: 'task', title: result?.title });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task'
    });
  }
}

/**
 * Bulk-update the status of many tasks, then recompute affected parents.
 */
export async function bulkUpdateTaskStatus(req, res) {
  try {
    const { project } = req.params;
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }
    if (!ITEM_STATUS.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of: ${ITEM_STATUS.join(', ')}` });
    }

    const collection = getProjectCollection(project);
    const objectIds = ids.map((id) => new ObjectId(id));
    const tasks = await collection.find({ type: DOC_TYPES.TASK, _id: { $in: objectIds } }).toArray();

    await collection.updateMany(
      { type: DOC_TYPES.TASK, _id: { $in: objectIds } },
      { $set: { status, updated_at: new Date() } }
    );

    await recomputeParents(collection, tasks);
    await logActivity(project, { action: 'updated', item_type: 'task', title: `${tasks.length} tasks` });
    res.json({ success: true, updated: tasks.length });
  } catch (error) {
    console.error('Error bulk-updating tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk-update tasks' });
  }
}

/**
 * Bulk-delete many tasks, then recompute affected parents.
 */
export async function bulkDeleteTasks(req, res) {
  try {
    const { project } = req.params;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }

    const collection = getProjectCollection(project);
    const objectIds = ids.map((id) => new ObjectId(id));
    const tasks = await collection.find({ type: DOC_TYPES.TASK, _id: { $in: objectIds } }).toArray();

    await collection.deleteMany({ type: DOC_TYPES.TASK, _id: { $in: objectIds } });

    await recomputeParents(collection, tasks);
    await logActivity(project, { action: 'deleted', item_type: 'task', title: `${tasks.length} tasks` });
    // Return the removed docs so the client can offer an undo (restore).
    res.json({ success: true, deleted: tasks.length, removed: tasks });
  } catch (error) {
    console.error('Error bulk-deleting tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk-delete tasks' });
  }
}

// Recompute parent feature status for the distinct features of the given tasks.
async function recomputeParents(collection, tasks) {
  const seen = new Set();
  for (const task of tasks) {
    const key = String(task.feature_id);
    if (seen.has(key)) continue;
    seen.add(key);
    await updateParentStatus(collection, task.feature_id, DOC_TYPES.FEATURE);
  }
}

/**
 * Delete a task
 */
export async function deleteTask(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    const taskId = new ObjectId(id);

    // Get the task to know its feature
    const task = await collection.findOne({
      _id: taskId,
      type: DOC_TYPES.TASK
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Delete the task
    await collection.deleteOne({
      _id: taskId,
      type: DOC_TYPES.TASK
    });

    // Update parent feature status
    await updateParentStatus(collection, task.feature_id, DOC_TYPES.FEATURE);

    await logActivity(project, { action: 'deleted', item_type: 'task', title: task.title });

    res.json({
      success: true,
      message: 'Task deleted successfully',
      removed: [task]
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
}
