import express from 'express';
import { getProjectTree, getEpicTree } from '../controllers/treeController.js';

const router = express.Router();

router.get('/', getProjectTree);
router.get('/epics/:id', getEpicTree);

export default router;
