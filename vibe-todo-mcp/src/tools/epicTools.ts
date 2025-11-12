import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../mongodb.js';
import { Epic, EpicStatus } from '../schemas.js';
import { validateTitle, validateEpicStatus, validateObjectId } from '../utils/validation.js';

export async function listEpics(project: string): Promise<Epic[]> {
  const collection = getProjectCollection(project);
  return await collection.find({ type: 'epic' }).toArray() as Epic[];
}

export async function getEpic(project: string, epicId: string): Promise<Epic> {
  validateObjectId(epicId, 'epicId');

  const collection = getProjectCollection(project);
  const epic = await collection.findOne({
    _id: new ObjectId(epicId),
    type: 'epic'
  }) as Epic | null;

  if (!epic) {
    throw new Error(`Epic not found with id: ${epicId}`);
  }

  return epic;
}

export async function createEpic(
  project: string,
  title: string,
  desc?: string,
  status: EpicStatus = 'planning'
): Promise<Epic> {
  validateTitle(title);
  validateEpicStatus(status);

  const collection = getProjectCollection(project);

  const epic: Omit<Epic, '_id'> = {
    type: 'epic',
    title: title.trim(),
    desc: desc || '',
    status,
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await collection.insertOne(epic);

  return {
    _id: result.insertedId,
    ...epic
  };
}

export async function updateEpic(
  project: string,
  epicId: string,
  updates: {
    title?: string;
    desc?: string;
    status?: EpicStatus;
  }
): Promise<Epic> {
  validateObjectId(epicId, 'epicId');

  if (updates.title !== undefined) {
    validateTitle(updates.title);
    updates.title = updates.title.trim();
  }

  if (updates.status !== undefined) {
    validateEpicStatus(updates.status);
  }

  const collection = getProjectCollection(project);

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(epicId), type: 'epic' },
    {
      $set: {
        ...updates,
        updated_at: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new Error(`Epic not found with id: ${epicId}`);
  }

  return result as Epic;
}

export async function deleteEpic(project: string, epicId: string): Promise<void> {
  validateObjectId(epicId, 'epicId');

  const collection = getProjectCollection(project);
  const epicObjectId = new ObjectId(epicId);

  // Find all features belonging to this epic
  const features = await collection.find({
    type: 'feature',
    epic_id: epicObjectId
  }).toArray();

  // Delete all tasks belonging to these features
  const featureIds = features.map(f => f._id);
  if (featureIds.length > 0) {
    await collection.deleteMany({
      type: 'task',
      feature_id: { $in: featureIds }
    });
  }

  // Delete all features
  await collection.deleteMany({
    type: 'feature',
    epic_id: epicObjectId
  });

  // Delete the epic
  const result = await collection.deleteOne({
    _id: epicObjectId,
    type: 'epic'
  });

  if (result.deletedCount === 0) {
    throw new Error(`Epic not found with id: ${epicId}`);
  }
}
