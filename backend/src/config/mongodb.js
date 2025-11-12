import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'vibe_todo_manager';

let client;
let db;

/**
 * Initialize MongoDB connection
 */
export async function connectDB() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log(`✅ Connected to MongoDB: ${dbName}`);
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Get database instance
 */
export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
}

/**
 * Get collection for a specific project
 */
export function getProjectCollection(projectName) {
  const collectionName = `project_${projectName}`;
  return getDB().collection(collectionName);
}

/**
 * List all project collections
 */
export async function listProjectCollections() {
  const collections = await getDB().listCollections().toArray();
  return collections
    .filter(col => col.name.startsWith('project_'))
    .map(col => col.name.replace('project_', ''));
}

/**
 * Create indexes for a project collection
 */
export async function createProjectIndexes(projectName) {
  const collection = getProjectCollection(projectName);

  // Index on type for faster filtering
  await collection.createIndex({ type: 1 });

  // Index on epic_id for features
  await collection.createIndex({ epic_id: 1 });

  // Index on feature_id for tasks
  await collection.createIndex({ feature_id: 1 });

  // Index on status for filtering
  await collection.createIndex({ status: 1 });

  // Compound index for queries
  await collection.createIndex({ type: 1, status: 1 });
}

/**
 * Close MongoDB connection
 */
export async function closeDB() {
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
}
