import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../config/mongodb.js';
import { validateComment, createCommentDoc, DOC_TYPES, COMMENT_TARGETS } from '../models/schemas.js';
import { logActivity } from '../utils/activity.js';

/**
 * List comments for a target item (oldest first).
 * Query: ?target_type=task&target_id=<id>
 */
export async function getComments(req, res) {
  try {
    const { project } = req.params;
    const { target_type, target_id } = req.query;

    if (!COMMENT_TARGETS.includes(target_type) || !target_id) {
      return res.status(400).json({ success: false, error: 'target_type and target_id are required' });
    }
    let targetId;
    try {
      targetId = new ObjectId(target_id);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid target_id' });
    }

    const collection = getProjectCollection(project);
    const comments = await collection
      .find({ type: DOC_TYPES.COMMENT, target_type, target_id: targetId })
      .sort({ created_at: 1 })
      .toArray();

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
}

/**
 * Add a comment to a target item.
 */
export async function createComment(req, res) {
  try {
    const { project } = req.params;
    const collection = getProjectCollection(project);

    const errors = validateComment(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
    }

    // Verify the target exists and is live.
    const target = await collection.findOne({
      _id: new ObjectId(req.body.target_id),
      type: req.body.target_type,
      deleted_at: null
    });
    if (!target) {
      return res.status(404).json({ success: false, error: 'Target item not found' });
    }

    const doc = createCommentDoc(req.body, req.user?.username);
    const result = await collection.insertOne(doc);
    await logActivity(project, { action: 'commented', item_type: req.body.target_type, title: target.title });

    res.status(201).json({ success: true, data: { _id: result.insertedId, ...doc } });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, error: 'Failed to create comment' });
  }
}

/**
 * Delete a comment.
 */
export async function deleteComment(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    const result = await collection.deleteOne({ _id: new ObjectId(id), type: DOC_TYPES.COMMENT });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
}
