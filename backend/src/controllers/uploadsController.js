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

    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname || 'image', {
      contentType: req.file.mimetype,
      metadata: { project }
    });

    uploadStream.on('error', (err) => {
      console.error('Upload stream error:', err);
      if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to store image' });
    });
    uploadStream.on('finish', () => {
      const id = uploadStream.id.toString();
      res.status(201).json({ success: true, id, url: `/api/${project}/uploads/${id}` });
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
    const { project, id } = req.params;

    let fileId;
    try {
      fileId = new ObjectId(id);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid image id' });
    }

    const bucket = getBucket();
    const files = await bucket.find({ _id: fileId }).toArray();
    const file = files[0];
    if (!file || file.metadata?.project !== project) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = bucket.openDownloadStream(fileId);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ success: false, error: 'Image not found' });
    });
    stream.pipe(res);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch image' });
  }
}
