import express from 'express';
import { listTrash, restoreBatch, purgeBatch } from '../controllers/trashController.js';

const router = express.Router({ mergeParams: true });

router.get('/', listTrash);
router.post('/restore', restoreBatch);
router.delete('/:batch', purgeBatch);

export default router;
