import { getDB, listProjectCollections, getProjectCollection, createProjectIndexes } from '../mongodb.js';
import { validateProjectName } from '../utils/validation.js';

export async function listProjects(): Promise<string[]> {
  return await listProjectCollections();
}

export async function createProject(name: string): Promise<{ name: string; originalName: string }> {
  const sanitizedName = validateProjectName(name);

  // Check if project already exists
  const projects = await listProjectCollections();
  if (projects.includes(sanitizedName)) {
    throw new Error(`Project '${sanitizedName}' already exists`);
  }

  // Create collection by inserting and removing a dummy document
  const collection = getProjectCollection(sanitizedName);
  const dummyDoc = { _dummy: true };
  await collection.insertOne(dummyDoc);
  await collection.deleteOne({ _dummy: true });

  // Create indexes
  await createProjectIndexes(sanitizedName);

  return {
    name: sanitizedName,
    originalName: name
  };
}

export async function deleteProject(name: string): Promise<void> {
  // Check if project exists
  const projects = await listProjectCollections();
  if (!projects.includes(name)) {
    throw new Error(`Project '${name}' not found`);
  }

  // Drop the collection
  const db = getDB();
  await db.dropCollection(`project_${name}`);
}

export async function getProjectStats(name: string): Promise<{
  epics: number;
  features: number;
  tasks: number;
  totalItems: number;
}> {
  const collection = getProjectCollection(name);

  const epics = await collection.countDocuments({ type: 'epic' });
  const features = await collection.countDocuments({ type: 'feature' });
  const tasks = await collection.countDocuments({ type: 'task' });

  return {
    epics,
    features,
    tasks,
    totalItems: epics + features + tasks
  };
}
