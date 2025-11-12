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
  TASK: 'task'
};

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
    created_at: new Date(),
    updated_at: new Date()
  };
}
