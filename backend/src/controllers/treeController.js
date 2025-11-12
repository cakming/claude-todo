import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../config/mongodb.js';
import { DOC_TYPES } from '../models/schemas.js';
import { calculateProgress } from './statusController.js';

/**
 * Build tree structure for entire project
 */
export async function getProjectTree(req, res) {
  try {
    const { project } = req.params;
    const collection = getProjectCollection(project);

    // Get all epics
    const epics = await collection.find({ type: DOC_TYPES.EPIC }).toArray();

    // Build tree with features and tasks
    const tree = await Promise.all(
      epics.map(async (epic) => {
        const features = await collection.find({
          type: DOC_TYPES.FEATURE,
          epic_id: epic._id
        }).toArray();

        const featuresWithTasks = await Promise.all(
          features.map(async (feature) => {
            const tasks = await collection.find({
              type: DOC_TYPES.TASK,
              feature_id: feature._id
            }).toArray();

            const progress = await calculateProgress(collection, feature._id, DOC_TYPES.FEATURE);

            return {
              ...feature,
              tasks,
              progress
            };
          })
        );

        const progress = await calculateProgress(collection, epic._id, DOC_TYPES.EPIC);

        return {
          ...epic,
          features: featuresWithTasks,
          progress
        };
      })
    );

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Error fetching project tree:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project tree'
    });
  }
}

/**
 * Build tree structure for a specific epic
 */
export async function getEpicTree(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    // Get the epic
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

    // Get all features for this epic
    const features = await collection.find({
      type: DOC_TYPES.FEATURE,
      epic_id: epic._id
    }).toArray();

    // Get tasks for each feature
    const featuresWithTasks = await Promise.all(
      features.map(async (feature) => {
        const tasks = await collection.find({
          type: DOC_TYPES.TASK,
          feature_id: feature._id
        }).toArray();

        const progress = await calculateProgress(collection, feature._id, DOC_TYPES.FEATURE);

        return {
          ...feature,
          tasks,
          progress
        };
      })
    );

    const progress = await calculateProgress(collection, epic._id, DOC_TYPES.EPIC);

    const tree = {
      ...epic,
      features: featuresWithTasks,
      progress
    };

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Error fetching epic tree:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch epic tree'
    });
  }
}
