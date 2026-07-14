import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getDB, getProjectCollection } from '../config/mongodb.js';
import { DOC_TYPES } from '../models/schemas.js';
import { buildProjectTree } from './treeController.js';

const SHARES = 'shares';

// Share links live in a top-level `shares` collection keyed by an unguessable
// token. A share grants public, read-only access to either a whole project
// (its tree) or a single doc page.

/**
 * Create a share link for the current project. Body: { scope, pageId? } where
 * scope is 'project' (default) or 'page'.
 */
export async function createShare(req, res) {
  try {
    const { project } = req.params;
    const scope = req.body?.scope === 'page' ? 'page' : 'project';

    let pageId = null;
    if (scope === 'page') {
      const { pageId: rawId } = req.body || {};
      if (!rawId) {
        return res.status(400).json({ success: false, error: 'pageId is required for a page share' });
      }
      let oid;
      try {
        oid = new ObjectId(rawId);
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid pageId' });
      }
      const page = await getProjectCollection(project).findOne({ _id: oid, type: DOC_TYPES.PAGE });
      if (!page) {
        return res.status(404).json({ success: false, error: 'Page not found' });
      }
      pageId = rawId;
    }

    const token = crypto.randomBytes(16).toString('hex');
    await getDB().collection(SHARES).insertOne({
      token,
      project,
      scope,
      page_id: pageId,
      created_at: new Date()
    });

    res.status(201).json({ success: true, token, scope, path: `/s/${token}` });
  } catch (error) {
    console.error('Error creating share:', error);
    res.status(500).json({ success: false, error: 'Failed to create share' });
  }
}

/**
 * List share links for the current project.
 */
export async function listShares(req, res) {
  try {
    const { project } = req.params;
    const shares = await getDB()
      .collection(SHARES)
      .find({ project })
      .sort({ created_at: -1 })
      .toArray();
    res.json({ success: true, data: shares });
  } catch (error) {
    console.error('Error listing shares:', error);
    res.status(500).json({ success: false, error: 'Failed to list shares' });
  }
}

/**
 * Revoke (delete) a share link by token, scoped to the current project.
 */
export async function revokeShare(req, res) {
  try {
    const { project, token } = req.params;
    const result = await getDB().collection(SHARES).deleteOne({ token, project });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Share not found' });
    }
    res.json({ success: true, message: 'Share revoked' });
  } catch (error) {
    console.error('Error revoking share:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke share' });
  }
}

/**
 * Public, unauthenticated read of a shared resource by token. Returns only the
 * data the share exposes (a project tree, or a single page) — nothing that
 * would let the viewer mutate anything.
 */
export async function getPublicShare(req, res) {
  try {
    const { token } = req.params;
    const share = await getDB().collection(SHARES).findOne({ token });
    if (!share) {
      return res.status(404).json({ success: false, error: 'Share not found' });
    }

    const collection = getProjectCollection(share.project);

    if (share.scope === 'page') {
      const page = await collection.findOne({
        _id: new ObjectId(share.page_id),
        type: DOC_TYPES.PAGE,
        deleted_at: null
      });
      if (!page) {
        return res.status(404).json({ success: false, error: 'Shared page is no longer available' });
      }
      return res.json({
        success: true,
        scope: 'page',
        project: share.project,
        data: { _id: page._id, title: page.title, body: page.body, updated_at: page.updated_at }
      });
    }

    const tree = await buildProjectTree(collection);
    res.json({ success: true, scope: 'project', project: share.project, data: tree });
  } catch (error) {
    console.error('Error reading public share:', error);
    res.status(500).json({ success: false, error: 'Failed to read shared resource' });
  }
}
