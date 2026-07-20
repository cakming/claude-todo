import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../mongodb.js';
import { Comment, CommentTarget, COMMENT_TARGETS, parseMentions } from '../schemas.js';
import { validateObjectId } from '../utils/validation.js';

// Comment threads attach to an epic, feature, or task (type: 'comment'), stored
// in the per-project collection. @mentions are parsed from the body. Note: this
// tool records the mention list but does not dispatch email/Telegram
// notifications — those fire from the web-app request path.

function validateTarget(targetType: string): asserts targetType is CommentTarget {
  if (!COMMENT_TARGETS.includes(targetType as CommentTarget)) {
    throw new Error(`target_type must be one of: ${COMMENT_TARGETS.join(', ')}`);
  }
}

export async function listComments(
  project: string,
  targetType: string,
  targetId: string
): Promise<Comment[]> {
  validateTarget(targetType);
  validateObjectId(targetId, 'targetId');

  const collection = getProjectCollection(project);
  return (await collection
    .find({ type: 'comment', target_type: targetType, target_id: new ObjectId(targetId) })
    .sort({ created_at: 1 })
    .toArray()) as Comment[];
}

export async function addComment(
  project: string,
  targetType: string,
  targetId: string,
  body: string,
  author?: string
): Promise<Comment> {
  validateTarget(targetType);
  validateObjectId(targetId, 'targetId');

  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    throw new Error('body is required and must be a non-empty string');
  }

  const collection = getProjectCollection(project);

  // The target must exist and be live.
  const target = await collection.findOne({
    _id: new ObjectId(targetId),
    type: targetType,
    deleted_at: null
  });
  if (!target) {
    throw new Error(`Target ${targetType} not found with id: ${targetId}`);
  }

  const comment: Omit<Comment, '_id'> = {
    type: 'comment',
    target_type: targetType,
    target_id: new ObjectId(targetId),
    body: body.trim(),
    author: author || 'mcp',
    mentions: parseMentions(body),
    created_at: new Date()
  };

  const result = await collection.insertOne(comment);
  return { _id: result.insertedId, ...comment };
}

export async function deleteComment(project: string, commentId: string): Promise<void> {
  validateObjectId(commentId, 'commentId');

  const collection = getProjectCollection(project);
  const result = await collection.deleteOne({ _id: new ObjectId(commentId), type: 'comment' });
  if (result.deletedCount === 0) {
    throw new Error(`Comment not found with id: ${commentId}`);
  }
}
