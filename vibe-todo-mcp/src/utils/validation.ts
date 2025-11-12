import { ObjectId } from 'mongodb';
import { EPIC_STATUSES, ITEM_STATUSES, EpicStatus, ItemStatus } from '../schemas.js';

export function validateObjectId(id: string, fieldName: string = 'id'): void {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}: must be a valid MongoDB ObjectId`);
  }
}

export function validateTitle(title: string): void {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Title is required and must be a non-empty string');
  }
}

export function validateEpicStatus(status: string): asserts status is EpicStatus {
  if (!EPIC_STATUSES.includes(status as EpicStatus)) {
    throw new Error(`Status must be one of: ${EPIC_STATUSES.join(', ')}`);
  }
}

export function validateItemStatus(status: string): asserts status is ItemStatus {
  if (!ITEM_STATUSES.includes(status as ItemStatus)) {
    throw new Error(`Status must be one of: ${ITEM_STATUSES.join(', ')}`);
  }
}

export function validateProjectName(name: string): string {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Project name is required and must be a non-empty string');
  }

  // Sanitize project name
  const sanitized = name.toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  if (sanitized.length === 0) {
    throw new Error('Project name must contain at least one alphanumeric character');
  }

  return sanitized;
}
