import { test, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { makeCollection } from './helpers/fakeCollection.js';

// Mutable state the mocked mongodb module reads/writes.
let existingProjects = [];
let droppedCollection = null;
const collection = makeCollection([]);
const trashColl = makeCollection([]); // the deleted_projects marker collection

let createProject;
let deleteProject;

before(async () => {
  const mongoPath = fileURLToPath(new URL('../src/config/mongodb.js', import.meta.url));
  mock.module(mongoPath, {
    namedExports: {
      listProjectCollections: async () => existingProjects,
      getProjectCollection: () => collection,
      createProjectIndexes: async () => {},
      getDB: () => ({
        dropCollection: async (name) => {
          droppedCollection = name;
        },
        collection: () => trashColl
      })
    }
  });
  ({ createProject, deleteProject } = await import('../src/controllers/projectController.js'));
});

beforeEach(() => {
  existingProjects = [];
  droppedCollection = null;
  collection.setDocs([]);
  trashColl.setDocs([]);
});

const res = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  }
});

test('createProject sanitizes the name (lowercase, spaces->_, strips specials)', async () => {
  const r = res();
  await createProject({ body: { name: 'My E-Commerce App' } }, r);

  assert.equal(r.statusCode, 201);
  assert.equal(r.body.data.name, 'my_ecommerce_app');
  assert.equal(r.body.data.originalName, 'My E-Commerce App');
});

test('createProject rejects an empty name with 400', async () => {
  const r = res();
  await createProject({ body: { name: '   ' } }, r);
  assert.equal(r.statusCode, 400);
});

test('createProject rejects a name with no alphanumerics with 400', async () => {
  const r = res();
  await createProject({ body: { name: '!!!@@@' } }, r);
  assert.equal(r.statusCode, 400);
});

test('createProject rejects a duplicate (post-sanitization) with 409', async () => {
  existingProjects = ['my_app'];
  const r = res();
  await createProject({ body: { name: 'My App' } }, r);
  assert.equal(r.statusCode, 409);
});

test('deleteProject soft-deletes (marks trashed, keeps the collection)', async () => {
  existingProjects = ['my_app'];
  const r = res();
  await deleteProject({ params: { name: 'my_app' } }, r);

  assert.equal(r.statusCode, 200);
  assert.equal(r.body.success, true);
  assert.equal(droppedCollection, null, 'collection is retained');
  assert.ok(trashColl.docs.some((d) => d.name === 'my_app'), 'project is marked trashed');
});

test('deleteProject returns 404 for an unknown project', async () => {
  existingProjects = [];
  const r = res();
  await deleteProject({ params: { name: 'ghost' } }, r);
  assert.equal(r.statusCode, 404);
  assert.equal(droppedCollection, null);
});
