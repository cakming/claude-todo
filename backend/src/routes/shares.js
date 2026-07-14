import express from 'express';
import { createShare, listShares, revokeShare } from '../controllers/sharesController.js';

const router = express.Router({ mergeParams: true });

router.get('/', listShares);
router.post('/', createShare);
router.delete('/:token', revokeShare);

export default router;
