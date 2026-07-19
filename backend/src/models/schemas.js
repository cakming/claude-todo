import { ObjectId } from 'mongodb';

/**
 * Valid status values
 */
export const EPIC_STATUS = ['planning', 'in_progress', 'done', 'blocked'];
export const ITEM_STATUS = ['todo', 'in_progress', 'done', 'blocked'];

/**
 * Document types
 */
export const DOC_TYPES = {
  EPIC: 'epic',
  FEATURE: 'feature',
  TASK: 'task',
  PAGE: 'page',
  COMMENT: 'comment'
};

// What a comment can be attached to.
export const COMMENT_TARGETS = ['epic', 'feature', 'task'];

/**
 * Validate Epic document
 */
export function validateEpic(data) {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (data.status && !EPIC_STATUS.includes(data.status)) {
    errors.push(`Status must be one of: ${EPIC_STATUS.join(', ')}`);
  }

  return errors;
}

/**
 * Validate Feature document
 */
export function validateFeature(data) {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!data.epic_id) {
    errors.push('epic_id is required');
  } else {
    try {
      new ObjectId(data.epic_id);
    } catch (e) {
      errors.push('epic_id must be a valid ObjectId');
    }
  }

  if (data.status && !ITEM_STATUS.includes(data.status)) {
    errors.push(`Status must be one of: ${ITEM_STATUS.join(', ')}`);
  }

  return errors;
}

/**
 * Validate Task document
 */
export function validateTask(data) {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!data.feature_id) {
    errors.push('feature_id is required');
  } else {
    try {
      new ObjectId(data.feature_id);
    } catch (e) {
      errors.push('feature_id must be a valid ObjectId');
    }
  }

  if (data.status && !ITEM_STATUS.includes(data.status)) {
    errors.push(`Status must be one of: ${ITEM_STATUS.join(', ')}`);
  }

  return errors;
}

/**
 * Validate Page (doc/note) document
 */
export function validatePage(data) {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (data.body !== undefined && typeof data.body !== 'string') {
    errors.push('body must be a string');
  }

  return errors;
}

/**
 * Create Page document. Pages are free-form markdown notes attached to a
 * project — separate from the epic/feature/task tree.
 */
export function createPageDoc(data) {
  return {
    type: DOC_TYPES.PAGE,
    title: data.title.trim(),
    body: typeof data.body === 'string' ? data.body : '',
    created_at: new Date(),
    updated_at: new Date()
  };
}

/**
 * Extract unique @mentions from comment text.
 */
export function parseMentions(body) {
  const found = new Set();
  const re = /@([a-zA-Z0-9_.-]+)/g;
  let m;
  while ((m = re.exec(body || '')) !== null) found.add(m[1]);
  return [...found];
}

/**
 * Validate a comment.
 */
export function validateComment(data) {
  const errors = [];
  if (!data.body || typeof data.body !== 'string' || data.body.trim().length === 0) {
    errors.push('body is required and must be a non-empty string');
  }
  if (!COMMENT_TARGETS.includes(data.target_type)) {
    errors.push(`target_type must be one of: ${COMMENT_TARGETS.join(', ')}`);
  }
  if (!data.target_id) {
    errors.push('target_id is required');
  } else {
    try {
      new ObjectId(data.target_id);
    } catch (e) {
      errors.push('target_id must be a valid ObjectId');
    }
  }
  return errors;
}

/**
 * Create a comment document.
 */
export function createCommentDoc(data, author) {
  return {
    type: DOC_TYPES.COMMENT,
    target_type: data.target_type,
    target_id: new ObjectId(data.target_id),
    body: data.body.trim(),
    author: author || 'anonymous',
    mentions: parseMentions(data.body),
    created_at: new Date()
  };
}

/**
 * Create Epic document
 */
export function createEpicDoc(data) {
  return {
    type: DOC_TYPES.EPIC,
    title: data.title.trim(),
    desc: data.desc || '',
    status: data.status || 'planning',
    created_at: new Date(),
    updated_at: new Date()
  };
}

/**
 * Create Feature document
 */
export function createFeatureDoc(data) {
  return {
    type: DOC_TYPES.FEATURE,
    epic_id: new ObjectId(data.epic_id),
    title: data.title.trim(),
    desc: data.desc || '',
    uat: data.uat || '',
    status: data.status || 'todo',
    reference_file: data.reference_file || '',
    created_at: new Date(),
    updated_at: new Date()
  };
}

/**
 * Create Task document
 */
export function createTaskDoc(data) {
  return {
    type: DOC_TYPES.TASK,
    feature_id: new ObjectId(data.feature_id),
    title: data.title.trim(),
    desc: data.desc || '',
    uat: data.uat || '',
    status: data.status || 'todo',
    reference_file: data.reference_file || '',
    due_date: data.due_date || null,
    created_at: new Date(),
    updated_at: new Date()
  };
}
