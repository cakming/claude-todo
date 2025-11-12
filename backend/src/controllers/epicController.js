import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../config/mongodb.js';
import { validateEpic, createEpicDoc, DOC_TYPES } from '../models/schemas.js';

/**
 * Get all epics for a project
 */
export async function getEpics(req, res) {
  try {
    const { project } = req.params;
    const collection = getProjectCollection(project);

    const epics = await collection.find({ type: DOC_TYPES.EPIC }).toArray();

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

    // Find all features belonging to this epic
    const features = await collection.find({
      type: DOC_TYPES.FEATURE,
      epic_id: epicId
    }).toArray();

    // Delete all tasks belonging to these features
    const featureIds = features.map(f => f._id);
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

    res.json({
      success: true,
      message: 'Epic and all related features and tasks deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting epic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete epic'
    });
  }
}
