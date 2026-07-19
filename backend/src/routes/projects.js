import express from 'express';
import {
  getProjects,
  createProject,
  deleteProject,
  getTrashedProjects,
  restoreProject,
  purgeProject
} from '../controllers/projectController.js';

const router = express.Router();

router.get('/', getProjects);
router.get('/trash', getTrashedProjects);
router.post('/', createProject);
router.post('/:name/restore', restoreProject);
router.delete('/:name/purge', purgeProject);
router.delete('/:name', deleteProject);

export default router;
