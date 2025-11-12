import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../config/mongodb.js';
import { validateTask, createTaskDoc, DOC_TYPES } from '../models/schemas.js';
import { updateParentStatus } from './statusController.js';

/**
 * Get all tasks for a feature
 */
export async function getTasksByFeature(req, res) {
  try {
    const { project, featureId } = req.params;
    const collection = getProjectCollection(project);

    const tasks = await collection.find({
      type: DOC_TYPES.TASK,
      feature_id: new ObjectId(featureId)
    }).toArray();

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

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
}
