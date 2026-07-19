import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getDB, getProjectCollection } from '../mongodb.js';
import { Share, ShareScope } from '../schemas.js';
import { validateObjectId } from '../utils/validation.js';

// Share links grant public, read-only access to a whole project tree or a single
// doc page. They live in a top-level `shares` collection keyed by an unguessable
// token. Mirrors the web app's sharesController.

const SHARES = 'shares';

export async function listShares(project: string): Promise<Share[]> {
  return (await getDB()
    .collection(SHARES)
    .find({ project })
    .sort({ created_at: -1 })
    .toArray()) as unknown as Share[];
}

export async function createShare(
  project: string,
  scope: ShareScope = 'project',
  pageId?: string,
  expiresInDays?: number
): Promise<{ token: string; scope: ShareScope; path: string; expires_at: Date | null }> {
  const resolvedScope: ShareScope = scope === 'page' ? 'page' : 'project';

  let page_id: string | null = null;
  if (resolvedScope === 'page') {
    if (!pageId) {
      throw new Error('pageId is required for a page share');
    }
    validateObjectId(pageId, 'pageId');
    const page = await getProjectCollection(project).findOne({
      _id: new ObjectId(pageId),
      type: 'page'
    });
    if (!page) {
      throw new Error(`Page not found with id: ${pageId}`);
    }
    page_id = pageId;
  }

  // Optional expiry: a positive number of days sets expires_at.
  let expires_at: Date | null = null;
  if (Number.isFinite(expiresInDays) && (expiresInDays as number) > 0) {
    expires_at = new Date(Date.now() + (expiresInDays as number) * 24 * 60 * 60 * 1000);
  }

  const token = crypto.randomBytes(16).toString('hex');
  await getDB().collection(SHARES).insertOne({
    token,
    project,
    scope: resolvedScope,
    page_id,
    created_at: new Date(),
    expires_at
  });

  return { token, scope: resolvedScope, path: `/s/${token}`, expires_at };
}

export async function revokeShare(project: string, token: string): Promise<void> {
  const result = await getDB().collection(SHARES).deleteOne({ token, project });
  if (result.deletedCount === 0) {
    throw new Error('Share not found');
  }
}
