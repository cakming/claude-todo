import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'vibe_todo_manager';

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);

  console.error('✅ Connected to MongoDB:', DB_NAME);
  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
}

export function getProjectCollection(projectName: string): Collection {
  const collectionName = `project_${projectName}`;
  return getDB().collection(collectionName);
}

export async function listProjectCollections(): Promise<string[]> {
  const collections = await getDB().listCollections().toArray();
  return collections
    .filter(col => col.name.startsWith('project_'))
    .map(col => col.name.replace('project_', ''));
}

export async function createProjectIndexes(projectName: string): Promise<void> {
  const collection = getProjectCollection(projectName);

  await collection.createIndex({ type: 1 });
  await collection.createIndex({ epic_id: 1 });
  await collection.createIndex({ feature_id: 1 });
  await collection.createIndex({ status: 1 });
  await collection.createIndex({ type: 1, status: 1 });
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    console.error('✅ MongoDB connection closed');
  }
}
