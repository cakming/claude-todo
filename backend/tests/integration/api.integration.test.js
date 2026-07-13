import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Full HTTP integration tests against a real (ephemeral) MongoDB. These exercise
// the actual Express routing, middleware, controllers, and driver queries —
// unlike the unit suites, which fake the data layer.

let mongod;
let app;
let getDB;
let closeDB;

before(async () => {
  mongod = await MongoMemoryServer.create();

  // Must be set BEFORE importing config/mongodb.js, which reads them at load.
  process.env.MONGODB_URI = mongod.getUri();
  process.env.DB_NAME = 'vibe_todo_test';
  process.env.NODE_ENV = 'test'; // prevents app.js from auto-starting a server
  delete process.env.AUTH_ENABLED; // auth off for these flows

  const mongo = await import('../../src/config/mongodb.js');
  getDB = mongo.getDB;
  closeDB = mongo.closeDB;
  await mongo.connectDB();

  ({ default: app } = await import('../../src/app.js'));
});

after(async () => {
  if (closeDB) await closeDB();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  // Isolate each test with a clean database.
  await getDB().dropDatabase();
});

// Helper: create a project and return its sanitized name.
async function makeProject(name = 'proj') {
  const res = await request(app).post('/api/projects').send({ name });
  return res.body.data.name;
}

test('GET /health reports running with auth disabled', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.authEnabled, false);
});

test('POST /api/projects sanitizes the name and it then appears in the list', async () => {
  const create = await request(app).post('/api/projects').send({ name: 'My Test App' });
  assert.equal(create.status, 201);
  assert.equal(create.body.data.name, 'my_test_app');

  const list = await request(app).get('/api/projects');
  assert.equal(list.status, 200);
  assert.ok(list.body.data.includes('my_test_app'));
});

test('requests against a non-existent project return 404', async () => {
  const res = await request(app).get('/api/does_not_exist/epics');
  assert.equal(res.status, 404);
});

test('creating an epic without a title returns 400', async () => {
  const project = await makeProject();
  const res = await request(app).post(`/api/${project}/epics`).send({ desc: 'no title' });
  assert.equal(res.status, 400);
});

test('completing all tasks propagates status up to the epic (auto-status)', async () => {
  const project = await makeProject();

  const epic = await request(app).post(`/api/${project}/epics`).send({ title: 'Epic 1' });
  const epicId = epic.body.data._id;

  const feature = await request(app)
    .post(`/api/${project}/features/by-epic/${epicId}`)
    .send({ title: 'Feature 1' });
  const featureId = feature.body.data._id;

  const t1 = await request(app)
    .post(`/api/${project}/tasks/by-feature/${featureId}`)
    .send({ title: 'Task 1' });
  const t2 = await request(app)
    .post(`/api/${project}/tasks/by-feature/${featureId}`)
    .send({ title: 'Task 2' });

  await request(app).put(`/api/${project}/tasks/${t1.body.data._id}`).send({ status: 'done' });
  await request(app).put(`/api/${project}/tasks/${t2.body.data._id}`).send({ status: 'done' });

  const tree = await request(app).get(`/api/${project}/tree`);
  assert.equal(tree.status, 200);
  const epicNode = tree.body.data.find((e) => e._id === epicId);
  assert.equal(epicNode.status, 'done', 'epic should auto-complete when all tasks are done');
  assert.equal(epicNode.features[0].status, 'done', 'feature should auto-complete too');
});

test('projects are isolated: one project cannot see another project\'s epics', async () => {
  const a = await makeProject('proj_a');
  const b = await makeProject('proj_b');

  await request(app).post(`/api/${a}/epics`).send({ title: 'Belongs to A' });

  const inA = await request(app).get(`/api/${a}/epics`);
  const inB = await request(app).get(`/api/${b}/epics`);

  assert.equal(inA.body.data.length, 1);
  assert.equal(inA.body.data[0].title, 'Belongs to A');
  assert.equal(inB.body.data.length, 0, 'project B must not see project A data');
});

test('getEpics paginates when a limit is provided', async () => {
  const project = await makeProject('paged');
  for (let i = 0; i < 5; i++) {
    await request(app).post(`/api/${project}/epics`).send({ title: `Epic ${i}` });
  }

  const page1 = await request(app).get(`/api/${project}/epics?limit=2&page=1`);
  assert.equal(page1.body.data.length, 2);
  assert.equal(page1.body.pagination.total, 5);
  assert.equal(page1.body.pagination.totalPages, 3);

  const page3 = await request(app).get(`/api/${project}/epics?limit=2&page=3`);
  assert.equal(page3.body.data.length, 1, 'last page has the remainder');

  // No limit -> all epics, no pagination metadata (backward compatible).
  const all = await request(app).get(`/api/${project}/epics`);
  assert.equal(all.body.data.length, 5);
  assert.equal(all.body.pagination, undefined);
});

test('the activity feed records create actions, newest first', async () => {
  const project = await makeProject();

  const epic = await request(app).post(`/api/${project}/epics`).send({ title: 'Logged Epic' });
  await request(app)
    .post(`/api/${project}/features/by-epic/${epic.body.data._id}`)
    .send({ title: 'Logged Feature' });

  const res = await request(app).get(`/api/${project}/activity`);
  assert.equal(res.status, 200);

  const actions = res.body.data.map((a) => `${a.action}:${a.item_type}`);
  assert.ok(actions.includes('created:epic'), 'epic creation logged');
  assert.ok(actions.includes('created:feature'), 'feature creation logged');
  assert.equal(res.body.data[0].item_type, 'feature', 'newest entry first');
});

test('tasks accept and return a due_date', async () => {
  const project = await makeProject('due');
  const epic = await request(app).post(`/api/${project}/epics`).send({ title: 'E' });
  const feature = await request(app)
    .post(`/api/${project}/features/by-epic/${epic.body.data._id}`)
    .send({ title: 'F' });
  const task = await request(app)
    .post(`/api/${project}/tasks/by-feature/${feature.body.data._id}`)
    .send({ title: 'T', due_date: '2026-12-31' });

  assert.equal(task.body.data.due_date, '2026-12-31');
});

test('export then import copies a project into another', async () => {
  const src = await makeProject('src');
  const epic = await request(app).post(`/api/${src}/epics`).send({ title: 'Exported Epic' });
  await request(app)
    .post(`/api/${src}/features/by-epic/${epic.body.data._id}`)
    .send({ title: 'Exported Feature' });

  const exported = await request(app).get(`/api/${src}/export`);
  assert.equal(exported.status, 200);
  assert.equal(exported.body.data.length, 2);

  const dst = await makeProject('dst');
  const imported = await request(app).post(`/api/${dst}/import`).send({ data: exported.body.data });
  assert.equal(imported.status, 200);
  assert.equal(imported.body.imported, 2);

  const epicsInDst = await request(app).get(`/api/${dst}/epics`);
  assert.equal(epicsInDst.body.data.length, 1);
  assert.equal(epicsInDst.body.data[0].title, 'Exported Epic');
});

test('bulk status and bulk delete update tasks and their parent feature', async () => {
  const project = await makeProject('bulk');
  const epic = await request(app).post(`/api/${project}/epics`).send({ title: 'E' });
  const feature = await request(app)
    .post(`/api/${project}/features/by-epic/${epic.body.data._id}`)
    .send({ title: 'F' });
  const fid = feature.body.data._id;
  const t1 = await request(app).post(`/api/${project}/tasks/by-feature/${fid}`).send({ title: 'T1' });
  const t2 = await request(app).post(`/api/${project}/tasks/by-feature/${fid}`).send({ title: 'T2' });
  const ids = [t1.body.data._id, t2.body.data._id];

  const bulk = await request(app).post(`/api/${project}/tasks/bulk/status`).send({ ids, status: 'done' });
  assert.equal(bulk.status, 200);
  assert.equal(bulk.body.updated, 2);

  // With all tasks done, the parent feature auto-completes.
  const tree = await request(app).get(`/api/${project}/tree`);
  assert.equal(tree.body.data[0].features[0].status, 'done');

  const del = await request(app).post(`/api/${project}/tasks/bulk/delete`).send({ ids });
  assert.equal(del.body.deleted, 2);
  const remaining = await request(app).get(`/api/${project}/tasks/by-feature/${fid}`);
  assert.equal(remaining.body.data.length, 0);

  // Validation: empty ids -> 400.
  const bad = await request(app).post(`/api/${project}/tasks/bulk/status`).send({ ids: [], status: 'done' });
  assert.equal(bad.status, 400);
});

test('deleting an epic cascades to its features and tasks', async () => {
  const project = await makeProject();

  const epic = await request(app).post(`/api/${project}/epics`).send({ title: 'Epic 1' });
  const epicId = epic.body.data._id;
  const feature = await request(app)
    .post(`/api/${project}/features/by-epic/${epicId}`)
    .send({ title: 'Feature 1' });
  await request(app)
    .post(`/api/${project}/tasks/by-feature/${feature.body.data._id}`)
    .send({ title: 'Task 1' });

  const del = await request(app).delete(`/api/${project}/epics/${epicId}`);
  assert.equal(del.status, 200);

  const tree = await request(app).get(`/api/${project}/tree`);
  assert.equal(tree.body.data.length, 0, 'no epics remain');

  // The whole project collection should be empty of documents now.
  const remaining = await getDB().collection(`project_${project}`).countDocuments();
  assert.equal(remaining, 0, 'features and tasks should be gone too');
});
