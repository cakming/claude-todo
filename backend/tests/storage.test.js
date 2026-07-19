import { test, before, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// Verify the GCS branch of the storage abstraction by mocking the
// @google-cloud/storage SDK. (The GridFS branch is covered by the integration
// suite against a real ephemeral Mongo.)

const calls = { saved: [], created: [], exists: true };

class FakeFile {
  constructor(name) {
    this.name = name;
  }
  async save(buffer, opts) {
    calls.saved.push({ name: this.name, size: buffer.length, opts });
  }
  async exists() {
    return [calls.exists];
  }
  async getMetadata() {
    return [{ contentType: 'image/png' }];
  }
  createReadStream() {
    calls.created.push(this.name);
    return { kind: 'stream', name: this.name };
  }
}

class FakeBucket {
  file(name) {
    return new FakeFile(name);
  }
}

class Storage {
  bucket() {
    return new FakeBucket();
  }
}

let saveImage;
let resolveImage;

before(async () => {
  mock.module('@google-cloud/storage', { namedExports: { Storage } });
  process.env.GCS_BUCKET = 'test-bucket';
  ({ saveImage, resolveImage } = await import('../src/utils/storage.js'));
});

afterEach(() => {
  calls.saved = [];
  calls.created = [];
  calls.exists = true;
});

test('saveImage writes to GCS under uploads/<project>/<token>', async () => {
  const backend = await saveImage({
    project: 'proj',
    token: 'tok123',
    buffer: Buffer.from('img-bytes'),
    contentType: 'image/png',
    filename: 'p.png'
  });
  assert.equal(backend, 'gcs');
  assert.equal(calls.saved.length, 1);
  assert.equal(calls.saved[0].name, 'uploads/proj/tok123');
  assert.equal(calls.saved[0].opts.contentType, 'image/png');
});

test('resolveImage returns a stream + content type for an existing object', async () => {
  const resolved = await resolveImage({ project: 'proj', ref: 'tok123' });
  assert.ok(resolved);
  assert.equal(resolved.contentType, 'image/png');
  assert.equal(resolved.stream.name, 'uploads/proj/tok123');
  assert.equal(calls.created.length, 1);
});

test('resolveImage returns null when the object does not exist', async () => {
  calls.exists = false;
  const resolved = await resolveImage({ project: 'proj', ref: 'missing' });
  assert.equal(resolved, null);
});

test('another project cannot resolve the same token (path-scoped)', async () => {
  // The lookup path includes the project, so a different project resolves a
  // different object name — isolation holds even with a known token.
  const resolved = await resolveImage({ project: 'other', ref: 'tok123' });
  assert.equal(resolved.stream.name, 'uploads/other/tok123');
});
