import { ObjectId, GridFSBucket } from 'mongodb';
import { getDB } from '../config/mongodb.js';

// Pluggable image storage. When GCS_BUCKET is set, images live in a Google
// Cloud Storage bucket (keeps MongoDB lean at image scale); otherwise they use
// GridFS inside MongoDB. Both are addressed by the same stable, unguessable
// token URL (/api/:project/uploads/:token), so switching backends never
// invalidates URLs already embedded in docs.

const GRIDFS_BUCKET = 'uploads';

export function gcsEnabled() {
  return !!process.env.GCS_BUCKET;
}

let _gcsBucket = null;
async function gcsBucket() {
  if (_gcsBucket) return _gcsBucket;
  const { Storage } = await import('@google-cloud/storage');
  // Credentials come from Application Default Credentials
  // (GOOGLE_APPLICATION_CREDENTIALS or the GCE metadata server).
  _gcsBucket = new Storage().bucket(process.env.GCS_BUCKET);
  return _gcsBucket;
}

function gridfs() {
  return new GridFSBucket(getDB(), { bucketName: GRIDFS_BUCKET });
}

// GCS object path — namespaced by project so one project can't read another's
// by guessing a token.
function objectName(project, token) {
  return `uploads/${project}/${token}`;
}

/**
 * Store an image. Returns the backend used.
 */
export async function saveImage({ project, token, buffer, contentType, filename }) {
  if (gcsEnabled()) {
    const file = (await gcsBucket()).file(objectName(project, token));
    await file.save(buffer, {
      contentType,
      resumable: false,
      metadata: { metadata: { project, token, filename: filename || 'image' } }
    });
    return 'gcs';
  }

  const bucket = gridfs();
  await new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename || 'image', {
      contentType,
      metadata: { project, token }
    });
    stream.on('error', reject);
    stream.on('finish', () => resolve());
    stream.end(buffer);
  });
  return 'gridfs';
}

/**
 * Resolve an image for reading, scoped to the project. Returns a readable
 * stream + content type, or null if not found. Legacy GridFS URLs that embed
 * the raw ObjectId still resolve.
 */
export async function resolveImage({ project, ref }) {
  if (gcsEnabled()) {
    const file = (await gcsBucket()).file(objectName(project, ref));
    const [exists] = await file.exists();
    if (!exists) return null;
    const [meta] = await file.getMetadata();
    return {
      stream: file.createReadStream(),
      contentType: meta.contentType || 'application/octet-stream'
    };
  }

  const bucket = gridfs();
  let f = (await bucket.find({ 'metadata.token': ref, 'metadata.project': project }).toArray())[0];
  if (!f && /^[a-f0-9]{24}$/i.test(ref)) {
    const legacy = (await bucket.find({ _id: new ObjectId(ref) }).toArray())[0];
    if (legacy && legacy.metadata?.project === project) f = legacy;
  }
  if (!f) return null;
  return {
    stream: bucket.openDownloadStream(f._id),
    contentType: f.contentType || 'application/octet-stream'
  };
}
