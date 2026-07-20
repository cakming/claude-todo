import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../mongodb.js';
import { Page } from '../schemas.js';
import { validateTitle, validateObjectId } from '../utils/validation.js';

// Docs pages are free-form notes attached to a project, stored in the same
// per-project collection as the epic/feature/task tree (type: 'page'). Deletes
// are soft (set deleted_at + deleted_batch) so they land in the shared Trash
// and can be restored — matching the web app.

export async function listPages(project: string, search?: string): Promise<Page[]> {
  const collection = getProjectCollection(project);

  const query: any = { type: 'page', deleted_at: null };
  if (search && search.trim()) {
    const rx = { $regex: escapeRegex(search.trim()), $options: 'i' };
    query.$or = [{ title: rx }, { body: rx }];
  }

  return (await collection.find(query).sort({ updated_at: -1 }).toArray()) as Page[];
}

export async function getPage(project: string, pageId: string): Promise<Page> {
  validateObjectId(pageId, 'pageId');

  const collection = getProjectCollection(project);
  const page = (await collection.findOne({
    _id: new ObjectId(pageId),
    type: 'page',
    deleted_at: null
  })) as Page | null;

  if (!page) {
    throw new Error(`Page not found with id: ${pageId}`);
  }

  return page;
}

export async function createPage(project: string, title: string, body?: string): Promise<Page> {
  validateTitle(title);

  const collection = getProjectCollection(project);

  const page: Omit<Page, '_id'> = {
    type: 'page',
    title: title.trim(),
    body: typeof body === 'string' ? body : '',
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await collection.insertOne(page);
  return { _id: result.insertedId, ...page };
}

export async function updatePage(
  project: string,
  pageId: string,
  updates: { title?: string; body?: string }
): Promise<Page> {
  validateObjectId(pageId, 'pageId');

  const updateData: any = {};
  if (updates.title !== undefined) {
    validateTitle(updates.title);
    updateData.title = updates.title.trim();
  }
  if (updates.body !== undefined) {
    updateData.body = String(updates.body);
  }
  updateData.updated_at = new Date();

  const collection = getProjectCollection(project);
  const result = (await collection.findOneAndUpdate(
    { _id: new ObjectId(pageId), type: 'page', deleted_at: null },
    { $set: updateData },
    { returnDocument: 'after' }
  )) as Page | null;

  if (!result) {
    throw new Error(`Page not found with id: ${pageId}`);
  }

  return result;
}

/**
 * Soft-delete a page. Returns the batch id so the deletion can be restored
 * from the trash (mirrors the web app's undo).
 */
export async function deletePage(project: string, pageId: string): Promise<{ batch: string }> {
  validateObjectId(pageId, 'pageId');

  const collection = getProjectCollection(project);
  const page = await collection.findOne({
    _id: new ObjectId(pageId),
    type: 'page',
    deleted_at: null
  });

  if (!page) {
    throw new Error(`Page not found with id: ${pageId}`);
  }

  const batch = new ObjectId();
  await collection.updateOne(
    { _id: new ObjectId(pageId), type: 'page' },
    { $set: { deleted_at: new Date(), deleted_batch: batch } }
  );

  return { batch: batch.toString() };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
