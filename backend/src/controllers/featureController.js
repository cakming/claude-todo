import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../config/mongodb.js';
import { validateFeature, createFeatureDoc, DOC_TYPES } from '../models/schemas.js';
import { updateParentStatus } from './statusController.js';

/**
 * Get all features for an epic
 */
export async function getFeaturesByEpic(req, res) {
  try {
    const { project, epicId } = req.params;
    const collection = getProjectCollection(project);

    const features = await collection.find({
      type: DOC_TYPES.FEATURE,
      epic_id: new ObjectId(epicId)
    }).toArray();

    res.json({
      success: true,
      data: features
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch features'
    });
  }
}

/**
 * Get a single feature by ID
 */
export async function getFeatureById(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    const feature = await collection.findOne({
      _id: new ObjectId(id),
      type: DOC_TYPES.FEATURE
    });

    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }

    res.json({
      success: true,
      data: feature
    });
  } catch (error) {
    console.error('Error fetching feature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature'
    });
  }
}

/**
 * Create a new feature
 */
export async function createFeature(req, res) {
  try {
    const { project, epicId } = req.params;
    const collection = getProjectCollection(project);

    // Verify epic exists
    const epic = await collection.findOne({
      _id: new ObjectId(epicId),
      type: DOC_TYPES.EPIC
    });

    if (!epic) {
      return res.status(404).json({
        success: false,
        error: 'Epic not found'
      });
    }

    const featureData = { ...req.body, epic_id: epicId };
    const errors = validateFeature(featureData);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    const featureDoc = createFeatureDoc(featureData);
    const result = await collection.insertOne(featureDoc);

    res.status(201).json({
      success: true,
      data: {
        _id: result.insertedId,
        ...featureDoc
      }
    });
  } catch (error) {
    console.error('Error creating feature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create feature'
    });
  }
}

/**
 * Update a feature
 */
export async function updateFeature(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    // Don't allow changing type, epic_id, or created_at
    const { type, epic_id, created_at, _id, ...updateData } = req.body;

    // Get current feature to know its epic
    const currentFeature = await collection.findOne({
      _id: new ObjectId(id),
      type: DOC_TYPES.FEATURE
    });

    if (!currentFeature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), type: DOC_TYPES.FEATURE },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    // Check if we need to update parent epic status
    if (updateData.status) {
      await updateParentStatus(collection, currentFeature.epic_id, DOC_TYPES.EPIC);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating feature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feature'
    });
  }
}

/**
 * Delete a feature and all its tasks
 */
export async function deleteFeature(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    const featureId = new ObjectId(id);

    // Get the feature to know its epic
    const feature = await collection.findOne({
      _id: featureId,
      type: DOC_TYPES.FEATURE
    });

    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }

    // Delete all tasks belonging to this feature
    await collection.deleteMany({
      type: DOC_TYPES.TASK,
      feature_id: featureId
    });

    // Delete the feature
    await collection.deleteOne({
      _id: featureId,
      type: DOC_TYPES.FEATURE
    });

    // Update parent epic status
    await updateParentStatus(collection, feature.epic_id, DOC_TYPES.EPIC);

    res.json({
      success: true,
      message: 'Feature and all related tasks deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feature'
    });
  }
}
