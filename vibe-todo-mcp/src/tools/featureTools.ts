import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../mongodb.js';
import { Feature, ItemStatus } from '../schemas.js';
import { validateTitle, validateItemStatus, validateObjectId } from '../utils/validation.js';
import { updateParentStatus } from '../utils/statusUpdates.js';

export async function listFeatures(project: string, epicId?: string): Promise<Feature[]> {
  const collection = getProjectCollection(project);

  const query: any = { type: 'feature' };
  if (epicId) {
    validateObjectId(epicId, 'epicId');
    query.epic_id = new ObjectId(epicId);
  }

  return await collection.find(query).toArray() as Feature[];
}

export async function getFeature(project: string, featureId: string): Promise<Feature> {
  validateObjectId(featureId, 'featureId');

  const collection = getProjectCollection(project);
  const feature = await collection.findOne({
    _id: new ObjectId(featureId),
    type: 'feature'
  }) as Feature | null;

  if (!feature) {
    throw new Error(`Feature not found with id: ${featureId}`);
  }

  return feature;
}

export async function createFeature(
  project: string,
  epicId: string,
  title: string,
  desc?: string,
  uat?: string,
  status: ItemStatus = 'todo',
  referenceFile?: string
): Promise<Feature> {
  validateObjectId(epicId, 'epicId');
  validateTitle(title);
  validateItemStatus(status);

  const collection = getProjectCollection(project);

  // Verify epic exists
  const epic = await collection.findOne({
    _id: new ObjectId(epicId),
    type: 'epic'
  });

  if (!epic) {
    throw new Error(`Epic not found with id: ${epicId}`);
  }

  const feature: Omit<Feature, '_id'> = {
    type: 'feature',
    epic_id: new ObjectId(epicId),
    title: title.trim(),
    desc: desc || '',
    uat: uat || '',
    status,
    reference_file: referenceFile || '',
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await collection.insertOne(feature);

  return {
    _id: result.insertedId,
    ...feature
  };
}

export async function updateFeature(
  project: string,
  featureId: string,
  updates: {
    title?: string;
    desc?: string;
    uat?: string;
    status?: ItemStatus;
    reference_file?: string;
  }
): Promise<Feature> {
  validateObjectId(featureId, 'featureId');

  if (updates.title !== undefined) {
    validateTitle(updates.title);
    updates.title = updates.title.trim();
  }

  if (updates.status !== undefined) {
    validateItemStatus(updates.status);
  }

  const collection = getProjectCollection(project);

  // Get current feature to know its epic
  const currentFeature = await collection.findOne({
    _id: new ObjectId(featureId),
    type: 'feature'
  }) as Feature | null;

  if (!currentFeature) {
    throw new Error(`Feature not found with id: ${featureId}`);
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(featureId), type: 'feature' },
    {
      $set: {
        ...updates,
        updated_at: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  // Update parent epic status if status changed
  if (updates.status) {
    await updateParentStatus(collection, currentFeature.epic_id, 'epic');
  }

  return result as Feature;
}

export async function deleteFeature(project: string, featureId: string): Promise<void> {
  validateObjectId(featureId, 'featureId');

  const collection = getProjectCollection(project);
  const featureObjectId = new ObjectId(featureId);

  // Get the feature to know its epic
  const feature = await collection.findOne({
    _id: featureObjectId,
    type: 'feature'
  }) as Feature | null;

  if (!feature) {
    throw new Error(`Feature not found with id: ${featureId}`);
  }

  // Delete all tasks belonging to this feature
  await collection.deleteMany({
    type: 'task',
    feature_id: featureObjectId
  });

  // Delete the feature
  await collection.deleteOne({
    _id: featureObjectId,
    type: 'feature'
  });

  // Update parent epic status
  await updateParentStatus(collection, feature.epic_id, 'epic');
}
