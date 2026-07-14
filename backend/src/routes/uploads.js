import express from 'express';
import multer from 'multer';
import { uploadImage, getImage } from '../controllers/uploadsController.js';

// Keep uploads in memory (they go straight to GridFS) and cap at 5 MB. Only
// image content types are accepted.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image uploads are allowed'));
  }
});

const router = express.Router({ mergeParams: true });

// Wrap multer so a rejected file (too large, wrong type) becomes a clean 400
// instead of bubbling to the generic 500 error handler.
function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}

router.post('/', handleUpload, uploadImage);
router.get('/:id', getImage);

export default router;
