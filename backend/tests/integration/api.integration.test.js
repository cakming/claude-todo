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

test('epics can be searched and filtered by status server-side', async () => {
  const project = await makeProject('searchable');
  await request(app).post(`/api/${project}/epics`).send({ title: 'Payments epic', desc: 'stripe' });
  await request(app).post(`/api/${project}/epics`).send({ title: 'Search UI', desc: 'filtering' });
  const blocked = await request(app).post(`/api/${project}/epics`).send({ title: 'Blocked work' });
  await request(app).put(`/api/${project}/epics/${blocked.body.data._id}`).send({ status: 'blocked' });

  // Text search matches title OR desc, case-insensitively.
  const byTitle = await request(app).get(`/api/${project}/epics?search=payments`);
  assert.equal(byTitle.body.data.length, 1);
  assert.equal(byTitle.body.data[0].title, 'Payments epic');

  const byDesc = await request(app).get(`/api/${project}/epics?search=FILTER`);
  assert.equal(byDesc.body.data.length, 1);
  assert.equal(byDesc.body.data[0].title, 'Search UI');

  // Status filter.
  const onlyBlocked = await request(app).get(`/api/${project}/epics?status=blocked`);
  assert.equal(onlyBlocked.body.data.length, 1);
  assert.equal(onlyBlocked.body.data[0].title, 'Blocked work');

  // Search combines with pagination metadata.
  const paged = await request(app).get(`/api/${project}/epics?search=e&limit=1&page=1`);
  assert.ok(paged.body.pagination.total >= 1);
  assert.equal(paged.body.data.length, 1);

  // Regex metacharacters in the term are treated literally, not as a pattern.
  const literal = await request(app).get(`/api/${project}/epics?search=${encodeURIComponent('.*')}`);
  assert.equal(literal.body.data.length, 0, 'search term is escaped, not run as a regex');
});

test('tasks can be filtered by status within a feature', async () => {
  const project = await makeProject('taskfilter');
  const epic = await request(app).post(`/api/${project}/epics`).send({ title: 'E' });
  const feature = await request(app)
    .post(`/api/${project}/features/by-epic/${epic.body.data._id}`)
    .send({ title: 'F' });
  const fid = feature.body.data._id;
  const t1 = await request(app).post(`/api/${project}/tasks/by-feature/${fid}`).send({ title: 'Alpha' });
  await request(app).post(`/api/${project}/tasks/by-feature/${fid}`).send({ title: 'Beta' });
  await request(app).put(`/api/${project}/tasks/${t1.body.data._id}`).send({ status: 'done' });

  const done = await request(app).get(`/api/${project}/tasks/by-feature/${fid}?status=done`);
  assert.equal(done.body.data.length, 1);
  assert.equal(done.body.data[0].title, 'Alpha');

  const search = await request(app).get(`/api/${project}/tasks/by-feature/${fid}?search=bet`);
  assert.equal(search.body.data.length, 1);
  assert.equal(search.body.data[0].title, 'Beta');
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

test('deleting an epic returns the removed docs and they can be restored (undo)', async () => {
  const project = await makeProject('undo');
  const epic = await request(app).post(`/api/${project}/epics`).send({ title: 'E' });
  const epicId = epic.body.data._id;
  const feature = await request(app)
    .post(`/api/${project}/features/by-epic/${epicId}`)
    .send({ title: 'F' });
  await request(app)
    .post(`/api/${project}/tasks/by-feature/${feature.body.data._id}`)
    .send({ title: 'T' });

  const del = await request(app).delete(`/api/${project}/epics/${epicId}`);
  assert.equal(del.status, 200);
  assert.equal(del.body.removed.length, 3, 'epic + feature + task returned for undo');

  // Project is empty after delete.
  let tree = await request(app).get(`/api/${project}/tree`);
  assert.equal(tree.body.data.length, 0);

  // Restore re-inserts everything with original ids and relationships intact.
  const restore = await request(app).post(`/api/${project}/restore`).send({ items: del.body.removed });
  assert.equal(restore.status, 200);
  assert.equal(restore.body.restored, 3);

  tree = await request(app).get(`/api/${project}/tree`);
  assert.equal(tree.body.data.length, 1, 'epic is back');
  assert.equal(tree.body.data[0]._id, epicId, 'same id preserved');
  assert.equal(tree.body.data[0].features[0].title, 'F', 'feature restored under epic');
  assert.equal(tree.body.data[0].features[0].tasks[0].title, 'T', 'task restored under feature');

  // Restore is idempotent and validates input.
  const again = await request(app).post(`/api/${project}/restore`).send({ items: del.body.removed });
  assert.equal(again.body.restored, 3, 'double-undo is harmless');
  const bad = await request(app).post(`/api/${project}/restore`).send({ items: [] });
  assert.equal(bad.status, 400);
});

test('doc pages: full CRUD plus undo of a delete', async () => {
  const project = await makeProject('docs');

  // Empty to start.
  const empty = await request(app).get(`/api/${project}/pages`);
  assert.equal(empty.body.data.length, 0);

  // Create requires a title.
  const noTitle = await request(app).post(`/api/${project}/pages`).send({ body: 'x' });
  assert.equal(noTitle.status, 400);

  const created = await request(app)
    .post(`/api/${project}/pages`)
    .send({ title: 'Design Notes', body: '# Hello' });
  assert.equal(created.status, 201);
  const pageId = created.body.data._id;
  assert.equal(created.body.data.type, 'page');

  // Update title/body.
  const updated = await request(app)
    .put(`/api/${project}/pages/${pageId}`)
    .send({ body: '# Hello\n\nUpdated.' });
  assert.equal(updated.body.data.body, '# Hello\n\nUpdated.');

  // Search matches on title/body.
  const found = await request(app).get(`/api/${project}/pages?search=design`);
  assert.equal(found.body.data.length, 1);

  // Delete returns the removed doc; restore brings it back.
  const del = await request(app).delete(`/api/${project}/pages/${pageId}`);
  assert.equal(del.body.removed.length, 1);
  const gone = await request(app).get(`/api/${project}/pages`);
  assert.equal(gone.body.data.length, 0);

  const restore = await request(app).post(`/api/${project}/restore`).send({ items: del.body.removed });
  assert.equal(restore.body.restored, 1);
  const back = await request(app).get(`/api/${project}/pages`);
  assert.equal(back.body.data.length, 1);
  assert.equal(back.body.data[0]._id, pageId);
});

test('image upload stores to GridFS and serves it back; rejects non-images', async () => {
  const project = await makeProject('imgs');
  // 1x1 transparent PNG.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const up = await request(app)
    .post(`/api/${project}/uploads`)
    .attach('file', png, { filename: 'dot.png', contentType: 'image/png' });
  assert.equal(up.status, 201);
  assert.ok(up.body.url.startsWith(`/api/${project}/uploads/`));

  // Serve it back with the right content type.
  const get = await request(app).get(up.body.url);
  assert.equal(get.status, 200);
  assert.match(get.headers['content-type'], /image\/png/);
  assert.equal(get.body.length, png.length);

  // Non-image is rejected.
  const bad = await request(app)
    .post(`/api/${project}/uploads`)
    .attach('file', Buffer.from('not an image'), { filename: 'x.txt', contentType: 'text/plain' });
  assert.equal(bad.status, 400);

  // Another project can't read this project's upload by id.
  const other = await makeProject('imgs_other');
  const id = up.body.url.split('/').pop();
  const cross = await request(app).get(`/api/${other}/uploads/${id}`);
  assert.equal(cross.status, 404);
});

test('share links expose read-only project and page views publicly', async () => {
  const project = await makeProject('shared');
  const epic = await request(app).post(`/api/${project}/epics`).send({ title: 'Public Epic' });
  await request(app)
    .post(`/api/${project}/features/by-epic/${epic.body.data._id}`)
    .send({ title: 'Public Feature' });
  const page = await request(app).post(`/api/${project}/pages`).send({ title: 'Public Doc', body: '# Hi' });

  // Project share -> public tree.
  const projShare = await request(app).post(`/api/${project}/shares`).send({ scope: 'project' });
  assert.equal(projShare.status, 201);
  assert.ok(projShare.body.path.startsWith('/s/'));

  const pubProject = await request(app).get(`/api/public/${projShare.body.token}`);
  assert.equal(pubProject.status, 200);
  assert.equal(pubProject.body.scope, 'project');
  assert.equal(pubProject.body.data[0].title, 'Public Epic');
  assert.equal(pubProject.body.data[0].features[0].title, 'Public Feature');

  // Page share -> public single page.
  const pageShare = await request(app)
    .post(`/api/${project}/shares`)
    .send({ scope: 'page', pageId: page.body.data._id });
  assert.equal(pageShare.status, 201);
  const pubPage = await request(app).get(`/api/public/${pageShare.body.token}`);
  assert.equal(pubPage.body.scope, 'page');
  assert.equal(pubPage.body.data.title, 'Public Doc');
  assert.equal(pubPage.body.data.body, '# Hi');

  // A page share requires a valid pageId.
  const badPage = await request(app).post(`/api/${project}/shares`).send({ scope: 'page' });
  assert.equal(badPage.status, 400);

  // Unknown token -> 404.
  const missing = await request(app).get('/api/public/deadbeef');
  assert.equal(missing.status, 404);

  // Revoke kills public access.
  const list = await request(app).get(`/api/${project}/shares`);
  assert.equal(list.body.data.length, 2);
  const revoke = await request(app).delete(`/api/${project}/shares/${projShare.body.token}`);
  assert.equal(revoke.status, 200);
  const afterRevoke = await request(app).get(`/api/public/${projShare.body.token}`);
  assert.equal(afterRevoke.status, 404);
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
