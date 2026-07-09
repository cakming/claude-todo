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
