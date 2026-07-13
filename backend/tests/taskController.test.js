import { test, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { makeCollection, makeRes } from './helpers/fakeCollection.js';
import { DOC_TYPES } from '../src/models/schemas.js';

const EPIC = '1111111111111111111111a1';
const F1 = '2222222222222222222222b1';
const T1 = '3333333333333333333333c1';
const T2 = '3333333333333333333333c2';
const MISSING = '9999999999999999999999f9';

const collection = makeCollection([]);

let createTask;
let updateTask;
let deleteTask;

before(async () => {
  const mongoPath = fileURLToPath(new URL('../src/config/mongodb.js', import.meta.url));
  mock.module(mongoPath, {
    namedExports: {
      getDB: () => ({ collection: (name) => (name === 'activity' ? makeCollection([]) : collection) }),
      getProjectCollection: () => collection
    }
  });
  ({ createTask, updateTask, deleteTask } = await import('../src/controllers/taskController.js'));
});

function seedTree() {
  collection.setDocs([
    { _id: EPIC, type: DOC_TYPES.EPIC, status: 'in_progress' },
    { _id: F1, type: DOC_TYPES.FEATURE, epic_id: EPIC, status: 'in_progress' },
    { _id: T1, type: DOC_TYPES.TASK, feature_id: F1, status: 'done' },
    { _id: T2, type: DOC_TYPES.TASK, feature_id: F1, status: 'todo' }
  ]);
}

beforeEach(seedTree);

const req = (params, body = {}) => ({ params, body });

test('createTask under an existing feature returns 201', async () => {
  const res = makeRes();
  await createTask(req({ project: 'demo', featureId: F1 }, { title: 'New task' }), res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.title, 'New task');
});

test('createTask under a missing feature returns 404', async () => {
  const res = makeRes();
  await createTask(req({ project: 'demo', featureId: MISSING }, { title: 'Orphan' }), res);
  assert.equal(res.statusCode, 404);
});

test('createTask without a title returns 400', async () => {
  const res = makeRes();
  await createTask(req({ project: 'demo', featureId: F1 }, { desc: 'no title' }), res);
  assert.equal(res.statusCode, 400);
});

test('updateTask to done completes the last open task and auto-completes the feature', async () => {
  const res = makeRes();
  // T1 is already done; marking T2 done means all tasks in F1 are done.
  await updateTask(req({ project: 'demo', id: T2 }, { status: 'done' }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);

  const feature = collection.docs.find((d) => d._id === F1);
  assert.equal(feature.status, 'done', 'feature should auto-complete via updateParentStatus');
});

test('updateTask on a missing task returns 404', async () => {
  const res = makeRes();
  await updateTask(req({ project: 'demo', id: MISSING }, { status: 'done' }), res);
  assert.equal(res.statusCode, 404);
});

test('deleteTask removes the task and returns success', async () => {
  const res = makeRes();
  await deleteTask(req({ project: 'demo', id: T1 }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(!collection.docs.some((d) => d._id === T1), 'task should be deleted');
});

test('deleteTask on a missing task returns 404', async () => {
  const res = makeRes();
  await deleteTask(req({ project: 'demo', id: MISSING }), res);
  assert.equal(res.statusCode, 404);
});
