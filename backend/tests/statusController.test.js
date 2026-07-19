import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  updateParentStatus,
  calculateProgress
} from '../src/controllers/statusController.js';
import { DOC_TYPES } from '../src/models/schemas.js';

/**
 * Minimal in-memory stand-in for a MongoDB collection.
 *
 * Supports the subset of the driver API that statusController uses:
 *   - find(query).toArray()
 *   - findOne(query)
 *   - updateOne(query, { $set })
 *
 * Ids are plain strings here; the production code uses ObjectIds, but the
 * auto-status logic only relies on equality, so strings exercise the same paths.
 */
function makeCollection(docs) {
  const matches = (doc, query) =>
    Object.entries(query).every(([key, value]) => {
      // Mongo semantics: { field: null } matches null or missing.
      if (value === null) return doc[key] === null || doc[key] === undefined;
      return String(doc[key]) === String(value);
    });

  return {
    docs,
    find(query) {
      return { toArray: async () => docs.filter((doc) => matches(doc, query)) };
    },
    async findOne(query) {
      return docs.find((doc) => matches(doc, query)) || null;
    },
    async updateOne(query, update) {
      const doc = docs.find((doc) => matches(doc, query));
      if (doc && update.$set) Object.assign(doc, update.$set);
      return { modifiedCount: doc ? 1 : 0 };
    }
  };
}

test('feature auto-completes and recurses to epic when all descendants are done', async () => {
  const docs = [
    { _id: 'e1', type: DOC_TYPES.EPIC, status: 'planning' },
    { _id: 'f1', type: DOC_TYPES.FEATURE, epic_id: 'e1', status: 'todo' },
    { _id: 't1', type: DOC_TYPES.TASK, feature_id: 'f1', status: 'done' },
    { _id: 't2', type: DOC_TYPES.TASK, feature_id: 'f1', status: 'done' }
  ];
  const collection = makeCollection(docs);

  await updateParentStatus(collection, 'f1', DOC_TYPES.FEATURE);

  const feature = docs.find((d) => d._id === 'f1');
  const epic = docs.find((d) => d._id === 'e1');
  assert.equal(feature.status, 'done', 'feature should auto-complete');
  assert.equal(epic.status, 'done', 'epic should recursively auto-complete');
});

test('feature reverts to in_progress when it was done but a child is no longer done', async () => {
  const docs = [
    { _id: 'e1', type: DOC_TYPES.EPIC, status: 'planning' },
    { _id: 'f1', type: DOC_TYPES.FEATURE, epic_id: 'e1', status: 'done' },
    { _id: 't1', type: DOC_TYPES.TASK, feature_id: 'f1', status: 'done' },
    { _id: 't2', type: DOC_TYPES.TASK, feature_id: 'f1', status: 'todo' }
  ];
  const collection = makeCollection(docs);

  await updateParentStatus(collection, 'f1', DOC_TYPES.FEATURE);

  const feature = docs.find((d) => d._id === 'f1');
  assert.equal(feature.status, 'in_progress', 'feature should revert from done');
});

test('parent is left untouched when it has no children', async () => {
  const docs = [{ _id: 'e1', type: DOC_TYPES.EPIC, status: 'planning' }];
  const collection = makeCollection(docs);

  await updateParentStatus(collection, 'e1', DOC_TYPES.EPIC);

  assert.equal(docs[0].status, 'planning', 'childless parent status must not change');
});

test('a blocked sibling prevents a feature from auto-completing', async () => {
  const docs = [
    { _id: 'f1', type: DOC_TYPES.FEATURE, epic_id: 'e1', status: 'in_progress' },
    { _id: 't1', type: DOC_TYPES.TASK, feature_id: 'f1', status: 'done' },
    { _id: 't2', type: DOC_TYPES.TASK, feature_id: 'f1', status: 'blocked' }
  ];
  const collection = makeCollection(docs);

  await updateParentStatus(collection, 'f1', DOC_TYPES.FEATURE);

  const feature = docs.find((d) => d._id === 'f1');
  assert.equal(feature.status, 'in_progress', 'feature must not complete while a task is blocked');
});

test('calculateProgress reports totals, completed count, and rounded percentage', async () => {
  const docs = [
    { _id: 'f1', type: DOC_TYPES.FEATURE, epic_id: 'e1', status: 'in_progress' },
    { _id: 't1', type: DOC_TYPES.TASK, feature_id: 'f1', status: 'done' },
    { _id: 't2', type: DOC_TYPES.TASK, feature_id: 'f1', status: 'done' },
    { _id: 't3', type: DOC_TYPES.TASK, feature_id: 'f1', status: 'todo' }
  ];
  const collection = makeCollection(docs);

  const progress = await calculateProgress(collection, 'f1', DOC_TYPES.FEATURE);

  assert.deepEqual(progress, { total: 3, completed: 2, percentage: 67 });
});

test('calculateProgress returns zeros for a parent with no children', async () => {
  const collection = makeCollection([]);

  const progress = await calculateProgress(collection, 'f1', DOC_TYPES.FEATURE);

  assert.deepEqual(progress, { total: 0, completed: 0, percentage: 0 });
});
