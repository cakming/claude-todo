import crypto from 'crypto';
import { ObjectId, GridFSBucket } from 'mongodb';
import { getDB } from '../config/mongodb.js';

const BUCKET_NAME = 'uploads';

// GridFS bucket for uploaded images. One shared bucket; each file records its
// project in metadata so uploads stay logically scoped per project.
function getBucket() {
  return new GridFSBucket(getDB(), { bucketName: BUCKET_NAME });
}

/**
 * Store an uploaded image (multer put it on req.file as a memory buffer) in
 * GridFS and return a URL the client can embed in markdown.
 */
export async function uploadImage(req, res) {
  try {
    const { project } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded (field name must be "file")' });
    }

    // A 128-bit random access token makes the public URL unguessable — unlike
    // an ObjectId, which encodes a timestamp+counter and is partly enumerable.
    const token = crypto.randomBytes(16).toString('hex');

    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname || 'image', {
      contentType: req.file.mimetype,
      metadata: { project, token }
    });

    uploadStream.on('error', (err) => {
      console.error('Upload stream error:', err);
      if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to store image' });
    });
    uploadStream.on('finish', () => {
      res.status(201).json({
        success: true,
        id: uploadStream.id.toString(),
        url: `/api/${project}/uploads/${token}`
      });
    });

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
}

/**
 * Stream a stored image back to the browser. Scoped to the project the file was
 * uploaded under, so one project can't read another's uploads by id.
 */
export async function getImage(req, res) {
  try {
    const { project, ref } = req.params;
    const bucket = getBucket();

    // Look up by the random access token, scoped to the project.
    let file = (await bucket.find({ 'metadata.token': ref, 'metadata.project': project }).toArray())[0];

    // Backward compatibility: older URLs embed the GridFS ObjectId directly.
    if (!file && /^[a-f0-9]{24}$/i.test(ref)) {
      const legacy = (await bucket.find({ _id: new ObjectId(ref) }).toArray())[0];
      if (legacy && legacy.metadata?.project === project) file = legacy;
    }

    if (!file) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = bucket.openDownloadStream(file._id);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ success: false, error: 'Image not found' });
    });
    stream.pipe(res);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch image' });
  }
}
