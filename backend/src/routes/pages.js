import express from 'express';
import {
  getPages,
  getPageById,
  createPage,
  updatePage,
  deletePage
} from '../controllers/pagesController.js';

const router = express.Router({ mergeParams: true });

router.get('/', getPages);
router.post('/', createPage);
router.get('/:id', getPageById);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

export default router;
