import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../config/mongodb.js';
import { validateEpic, createEpicDoc, DOC_TYPES } from '../models/schemas.js';
import { logActivity } from '../utils/activity.js';
import { applyListFilters } from '../utils/query.js';

/**
 * Get all epics for a project
 */
export async function getEpics(req, res) {
  try {
    const { project } = req.params;
    const collection = getProjectCollection(project);
    // Optional ?search= (title/desc) and ?status= filters.
    const query = applyListFilters({ type: DOC_TYPES.EPIC }, req.query);

    // Optional pagination: ?limit=N&page=P. Without `limit`, return everything
    // (backward compatible).
    const limit = parseInt(req.query.limit, 10);
    if (Number.isInteger(limit) && limit > 0) {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const total = await collection.countDocuments(query);
      const epics = await collection
        .find(query)
        .sort({ created_at: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      return res.json({
        success: true,
        data: epics,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    }

    const epics = await collection.find(query).sort({ created_at: 1 }).toArray();

    res.json({
      success: true,
      data: epics
    });
  } catch (error) {
    console.error('Error fetching epics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch epics'
    });
  }
}

/**
 * Get a single epic by ID
 */
export async function getEpicById(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    const epic = await collection.findOne({
      _id: new ObjectId(id),
      type: DOC_TYPES.EPIC
    });

    if (!epic) {
      return res.status(404).json({
        success: false,
        error: 'Epic not found'
      });
    }

    res.json({
      success: true,
      data: epic
    });
  } catch (error) {
    console.error('Error fetching epic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch epic'
    });
  }
}

/**
 * Create a new epic
 */
export async function createEpic(req, res) {
  try {
    const { project } = req.params;
    const collection = getProjectCollection(project);

    const errors = validateEpic(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    const epicDoc = createEpicDoc(req.body);
    const result = await collection.insertOne(epicDoc);
    await logActivity(project, { action: 'created', item_type: 'epic', title: epicDoc.title });

    res.status(201).json({
      success: true,
      data: {
        _id: result.insertedId,
        ...epicDoc
      }
    });
  } catch (error) {
    console.error('Error creating epic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create epic'
    });
  }
}

/**
 * Update an epic
 */
export async function updateEpic(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    // Don't allow changing type
    const { type, created_at, _id, ...updateData } = req.body;

    const errors = validateEpic({ title: updateData.title || 'dummy', ...updateData });
    if (errors.length > 0 && !(errors.length === 1 && errors[0].includes('Title'))) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), type: DOC_TYPES.EPIC },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Epic not found'
      });
    }

    await logActivity(project, { action: 'updated', item_type: 'epic', title: result.title });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating epic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update epic'
    });
  }
}

/**
 * Delete an epic and all its features and tasks
 */
export async function deleteEpic(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    const epicId = new ObjectId(id);

    // Capture the title before deletion for the activity log.
    const epicToDelete = await collection.findOne({ _id: epicId, type: DOC_TYPES.EPIC });

    // Find all features belonging to this epic
    const features = await collection.find({
      type: DOC_TYPES.FEATURE,
      epic_id: epicId
    }).toArray();

    // Capture child tasks before deleting so the client can undo the cascade.
    const featureIds = features.map(f => f._id);
    const tasks = featureIds.length > 0
      ? await collection.find({ type: DOC_TYPES.TASK, feature_id: { $in: featureIds } }).toArray()
      : [];

    // Delete all tasks belonging to these features
    if (featureIds.length > 0) {
      await collection.deleteMany({
        type: DOC_TYPES.TASK,
        feature_id: { $in: featureIds }
      });
    }

    // Delete all features
    await collection.deleteMany({
      type: DOC_TYPES.FEATURE,
      epic_id: epicId
    });

    // Delete the epic
    const result = await collection.deleteOne({
      _id: epicId,
      type: DOC_TYPES.EPIC
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Epic not found'
      });
    }

    await logActivity(project, { action: 'deleted', item_type: 'epic', title: epicToDelete?.title });

    res.json({
      success: true,
      message: 'Epic and all related features and tasks deleted successfully',
      removed: [epicToDelete, ...features, ...tasks].filter(Boolean)
    });
  } catch (error) {
    console.error('Error deleting epic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete epic'
    });
  }
}
