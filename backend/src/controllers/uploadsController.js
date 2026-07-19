import crypto from 'crypto';
import { saveImage, resolveImage } from '../utils/storage.js';

/**
 * Store an uploaded image (multer put it on req.file as a memory buffer) and
 * return a stable, unguessable URL the client can embed in markdown/HTML.
 */
export async function uploadImage(req, res) {
  try {
    const { project } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded (field name must be "file")' });
    }

    // A 128-bit random access token makes the public URL unguessable.
    const token = crypto.randomBytes(16).toString('hex');
    const backend = await saveImage({
      project,
      token,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname
    });

    res.status(201).json({ success: true, url: `/api/${project}/uploads/${token}`, storage: backend });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, error: 'Failed to store image' });
  }
}

/**
 * Stream a stored image back to the browser. Public (no auth) so plain <img>
 * tags — including in shared pages — load; the ref is an unguessable,
 * project-scoped token.
 */
export async function getImage(req, res) {
  try {
    const { project, ref } = req.params;
    const resolved = await resolveImage({ project, ref });
    if (!resolved) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    res.set('Content-Type', resolved.contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    resolved.stream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ success: false, error: 'Image not found' });
    });
    resolved.stream.pipe(res);
  } catch (error) {
    console.error('Error fetching image:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to fetch image' });
  }
}
