import { getProjectCollection } from '../mongodb.js';
import { ItemType, ItemStatus } from '../schemas.js';

export async function searchItems(
  project: string,
  query?: string,
  type?: ItemType,
  status?: ItemStatus
): Promise<any[]> {
  const collection = getProjectCollection(project);

  const filter: any = {};

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  if (query) {
    // Search in title, desc, and uat fields
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { desc: { $regex: query, $options: 'i' } },
      { uat: { $regex: query, $options: 'i' } },
      { reference_file: { $regex: query, $options: 'i' } }
    ];
  }

  return await collection.find(filter).toArray();
}

export async function getItemsByStatus(
  project: string,
  status: ItemStatus,
  type?: ItemType
): Promise<any[]> {
  const collection = getProjectCollection(project);

  const query: any = { status };
  if (type) {
    query.type = type;
  }

  return await collection.find(query).toArray();
}

export async function getBlockedItems(project: string): Promise<any[]> {
  return await getItemsByStatus(project, 'blocked');
}

export async function getInProgressItems(project: string): Promise<any[]> {
  return await getItemsByStatus(project, 'in_progress');
}

export async function getRecentlyUpdated(
  project: string,
  limit: number = 10
): Promise<any[]> {
  const collection = getProjectCollection(project);

  return await collection.find({})
    .sort({ updated_at: -1 })
    .limit(limit)
    .toArray();
}
