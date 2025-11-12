import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../mongodb.js';
import { Task, ItemStatus } from '../schemas.js';
import { validateTitle, validateItemStatus, validateObjectId } from '../utils/validation.js';
import { updateParentStatus } from '../utils/statusUpdates.js';

export async function listTasks(project: string, featureId?: string): Promise<Task[]> {
  const collection = getProjectCollection(project);

  const query: any = { type: 'task' };
  if (featureId) {
    validateObjectId(featureId, 'featureId');
    query.feature_id = new ObjectId(featureId);
  }

  return await collection.find(query).toArray() as Task[];
}

export async function getTask(project: string, taskId: string): Promise<Task> {
  validateObjectId(taskId, 'taskId');

  const collection = getProjectCollection(project);
  const task = await collection.findOne({
    _id: new ObjectId(taskId),
    type: 'task'
  }) as Task | null;

  if (!task) {
    throw new Error(`Task not found with id: ${taskId}`);
  }

  return task;
}

export async function createTask(
  project: string,
  featureId: string,
  title: string,
  desc?: string,
  uat?: string,
  status: ItemStatus = 'todo',
  referenceFile?: string
): Promise<Task> {
  validateObjectId(featureId, 'featureId');
  validateTitle(title);
  validateItemStatus(status);

  const collection = getProjectCollection(project);

  // Verify feature exists
  const feature = await collection.findOne({
    _id: new ObjectId(featureId),
    type: 'feature'
  });

  if (!feature) {
    throw new Error(`Feature not found with id: ${featureId}`);
  }

  const task: Omit<Task, '_id'> = {
    type: 'task',
    feature_id: new ObjectId(featureId),
    title: title.trim(),
    desc: desc || '',
    uat: uat || '',
    status,
    reference_file: referenceFile || '',
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await collection.insertOne(task);

  return {
    _id: result.insertedId,
    ...task
  };
}

export async function updateTask(
  project: string,
  taskId: string,
  updates: {
    title?: string;
    desc?: string;
    uat?: string;
    status?: ItemStatus;
    reference_file?: string;
  }
): Promise<Task> {
  validateObjectId(taskId, 'taskId');

  if (updates.title !== undefined) {
    validateTitle(updates.title);
    updates.title = updates.title.trim();
  }

  if (updates.status !== undefined) {
    validateItemStatus(updates.status);
  }

  const collection = getProjectCollection(project);

  // Get current task to know its feature
  const currentTask = await collection.findOne({
    _id: new ObjectId(taskId),
    type: 'task'
  }) as Task | null;

  if (!currentTask) {
    throw new Error(`Task not found with id: ${taskId}`);
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(taskId), type: 'task' },
    {
      $set: {
        ...updates,
        updated_at: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  // Update parent feature status if status changed
  if (updates.status) {
    await updateParentStatus(collection, currentTask.feature_id, 'feature');
  }

  return result as Task;
}

export async function deleteTask(project: string, taskId: string): Promise<void> {
  validateObjectId(taskId, 'taskId');

  const collection = getProjectCollection(project);
  const taskObjectId = new ObjectId(taskId);

  // Get the task to know its feature
  const task = await collection.findOne({
    _id: taskObjectId,
    type: 'task'
  }) as Task | null;

  if (!task) {
    throw new Error(`Task not found with id: ${taskId}`);
  }

  // Delete the task
  await collection.deleteOne({
    _id: taskObjectId,
    type: 'task'
  });

  // Update parent feature status
  await updateParentStatus(collection, task.feature_id, 'feature');
}

export async function markTaskDone(project: string, taskId: string): Promise<Task> {
  return updateTask(project, taskId, { status: 'done' });
}

export async function markTaskInProgress(project: string, taskId: string): Promise<Task> {
  return updateTask(project, taskId, { status: 'in_progress' });
}

export async function markTaskBlocked(project: string, taskId: string): Promise<Task> {
  return updateTask(project, taskId, { status: 'blocked' });
}
