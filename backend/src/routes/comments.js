import express from 'express';
import { getComments, createComment, deleteComment } from '../controllers/commentsController.js';

const router = express.Router({ mergeParams: true });

router.get('/', getComments);
router.post('/', createComment);
router.delete('/:id', deleteComment);

export default router;
