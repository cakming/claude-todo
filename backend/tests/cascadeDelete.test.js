import { test, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { makeCollection, makeRes } from './helpers/fakeCollection.js';
import { DOC_TYPES } from '../src/models/schemas.js';

// 24-char hex ids so the controllers' `new ObjectId(id)` calls round-trip.
const EPIC = '1111111111111111111111a1';
const F1 = '2222222222222222222222b1';
const F2 = '2222222222222222222222b2';
const T1 = '3333333333333333333333c1';
const T2 = '3333333333333333333333c2';
const T3 = '3333333333333333333333c3';
const MISSING = '9999999999999999999999f9';

const collection = makeCollection([]);

let deleteEpic;
let deleteFeature;

before(async () => {
  const mongoPath = fileURLToPath(new URL('../src/config/mongodb.js', import.meta.url));
  mock.module(mongoPath, {
    namedExports: {
      // Route the 'activity' log to a throwaway so it doesn't pollute doc counts.
      getDB: () => ({ collection: (name) => (name === 'activity' ? makeCollection([]) : collection) }),
      getProjectCollection: () => collection
    }
  });
  ({ deleteEpic } = await import('../src/controllers/epicController.js'));
  ({ deleteFeature } = await import('../src/controllers/featureController.js'));
});

function seedTree() {
  collection.setDocs([
    { _id: EPIC, type: DOC_TYPES.EPIC, status: 'in_progress' },
    { _id: F1, type: DOC_TYPES.FEATURE, epic_id: EPIC, status: 'in_progress' },
    { _id: F2, type: DOC_TYPES.FEATURE, epic_id: EPIC, status: 'in_progress' },
    { _id: T1, type: DOC_TYPES.TASK, feature_id: F1, status: 'todo' },
    { _id: T2, type: DOC_TYPES.TASK, feature_id: F1, status: 'done' },
    { _id: T3, type: DOC_TYPES.TASK, feature_id: F2, status: 'todo' }
  ]);
}

beforeEach(seedTree);

const req = (params) => ({ params });

// Soft-delete: docs remain in the collection but are flagged with deleted_at
// (and a shared deleted_batch) so they can be restored or purged from trash.
const isTrashed = (id) => {
  const doc = collection.docs.find((d) => d._id === id);
  return !!doc && !!doc.deleted_at;
};

test('deleteEpic soft-deletes every feature and task under one batch', async () => {
  const res = makeRes();
  await deleteEpic(req({ project: 'demo', id: EPIC }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.batch, 'returns a batch id for undo');

  // All docs still exist but are trashed together.
  assert.equal(collection.docs.length, 6, 'nothing is hard-deleted');
  assert.ok(collection.docs.every((d) => d.deleted_at), 'every doc is trashed');
  const batches = new Set(collection.docs.map((d) => String(d.deleted_batch)));
  assert.equal(batches.size, 1, 'all share one delete batch');
});

test('deleteEpic returns 404 when the epic does not exist', async () => {
  const res = makeRes();
  await deleteEpic(req({ project: 'demo', id: MISSING }), res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
  // Nothing should have been trashed.
  assert.ok(collection.docs.every((d) => !d.deleted_at));
});

test('deleteFeature trashes only its own tasks and leaves siblings intact', async () => {
  const res = makeRes();
  await deleteFeature(req({ project: 'demo', id: F1 }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.batch);

  assert.ok(isTrashed(F1), 'target feature is trashed');
  assert.ok(isTrashed(T1) && isTrashed(T2), 'its tasks are trashed');
  assert.ok(!isTrashed(EPIC), 'epic survives');
  assert.ok(!isTrashed(F2) && !isTrashed(T3), 'sibling feature and its task survive');
});

test('deleteFeature returns 404 when the feature does not exist', async () => {
  const res = makeRes();
  await deleteFeature(req({ project: 'demo', id: MISSING }), res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
  assert.ok(collection.docs.every((d) => !d.deleted_at));
});
