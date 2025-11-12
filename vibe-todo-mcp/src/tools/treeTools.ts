import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../mongodb.js';
import { EpicWithProgress, FeatureWithProgress } from '../schemas.js';
import { calculateProgress } from '../utils/statusUpdates.js';
import { validateObjectId } from '../utils/validation.js';

export async function getProjectTree(project: string): Promise<EpicWithProgress[]> {
  const collection = getProjectCollection(project);

  // Get all epics
  const epics = await collection.find({ type: 'epic' }).toArray();

  // Build tree with features and tasks
  const tree = await Promise.all(
    epics.map(async (epic) => {
      const features = await collection.find({
        type: 'feature',
        epic_id: epic._id
      }).toArray();

      const featuresWithTasks = await Promise.all(
        features.map(async (feature) => {
          const tasks = await collection.find({
            type: 'task',
            feature_id: feature._id
          }).toArray();

          const progress = await calculateProgress(collection, feature._id, 'feature');

          return {
            ...feature,
            tasks,
            progress
          } as FeatureWithProgress;
        })
      );

      const progress = await calculateProgress(collection, epic._id, 'epic');

      return {
        ...epic,
        features: featuresWithTasks,
        progress
      } as EpicWithProgress;
    })
  );

  return tree;
}

export async function getEpicTree(project: string, epicId: string): Promise<EpicWithProgress> {
  validateObjectId(epicId, 'epicId');

  const collection = getProjectCollection(project);

  // Get the epic
  const epic = await collection.findOne({
    _id: new ObjectId(epicId),
    type: 'epic'
  });

  if (!epic) {
    throw new Error(`Epic not found with id: ${epicId}`);
  }

  // Get all features for this epic
  const features = await collection.find({
    type: 'feature',
    epic_id: epic._id
  }).toArray();

  // Get tasks for each feature
  const featuresWithTasks = await Promise.all(
    features.map(async (feature) => {
      const tasks = await collection.find({
        type: 'task',
        feature_id: feature._id
      }).toArray();

      const progress = await calculateProgress(collection, feature._id, 'feature');

      return {
        ...feature,
        tasks,
        progress
      } as FeatureWithProgress;
    })
  );

  const progress = await calculateProgress(collection, epic._id, 'epic');

  return {
    ...epic,
    features: featuresWithTasks,
    progress
  } as EpicWithProgress;
}
