import { test, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { makeCollection, makeRes } from './helpers/fakeCollection.js';
import { DOC_TYPES } from '../src/models/schemas.js';

const EPIC = '1111111111111111111111a1';
const F1 = '2222222222222222222222b1';
const F2 = '2222222222222222222222b2';
const T1 = '3333333333333333333333c1';
const T2 = '3333333333333333333333c2';
const T3 = '3333333333333333333333c3';
const MISSING = '9999999999999999999999f9';

const collection = makeCollection([]);

let getProjectTree;
let getEpicTree;

before(async () => {
  const mongoPath = fileURLToPath(new URL('../src/config/mongodb.js', import.meta.url));
  mock.module(mongoPath, {
    namedExports: {
      getDB: () => ({ collection: () => collection }),
      getProjectCollection: () => collection
    }
  });
  ({ getProjectTree, getEpicTree } = await import('../src/controllers/treeController.js'));
});

beforeEach(() => {
  collection.setDocs([
    { _id: EPIC, type: DOC_TYPES.EPIC, status: 'in_progress' },
    { _id: F1, type: DOC_TYPES.FEATURE, epic_id: EPIC, status: 'in_progress' },
    { _id: F2, type: DOC_TYPES.FEATURE, epic_id: EPIC, status: 'in_progress' },
    { _id: T1, type: DOC_TYPES.TASK, feature_id: F1, status: 'done' },
    { _id: T2, type: DOC_TYPES.TASK, feature_id: F1, status: 'todo' },
    { _id: T3, type: DOC_TYPES.TASK, feature_id: F2, status: 'done' }
  ]);
});

const req = (params) => ({ params });

test('getProjectTree nests features and tasks under each epic with progress', async () => {
  const res = makeRes();
  await getProjectTree(req({ project: 'demo' }), res);

  assert.equal(res.statusCode, 200);
  const tree = res.body.data;
  assert.equal(tree.length, 1, 'one epic');
  assert.equal(tree[0].features.length, 2, 'two features under the epic');

  const f1 = tree[0].features.find((f) => f._id === F1);
  assert.equal(f1.tasks.length, 2, 'F1 has two tasks');
  // F1 has 1 of 2 tasks done -> 50%. Confirms calculateProgress is wired in.
  assert.equal(f1.progress.percentage, 50);
});

test('getEpicTree returns the nested tree for an existing epic', async () => {
  const res = makeRes();
  await getEpicTree(req({ project: 'demo', id: EPIC }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data._id, EPIC);
  assert.equal(res.body.data.features.length, 2);
});

test('getEpicTree returns 404 for a missing epic', async () => {
  const res = makeRes();
  await getEpicTree(req({ project: 'demo', id: MISSING }), res);
  assert.equal(res.statusCode, 404);
});
