import express from 'express';
import {
  getTasksByFeature,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  bulkUpdateTaskStatus,
  bulkDeleteTasks
} from '../controllers/taskController.js';

const router = express.Router({ mergeParams: true });

// Bulk operations (before /:id so the path isn't captured as an id)
router.post('/bulk/status', bulkUpdateTaskStatus);
router.post('/bulk/delete', bulkDeleteTasks);

// Routes with featureId parameter
router.get('/by-feature/:featureId', getTasksByFeature);
router.post('/by-feature/:featureId', createTask);

// Routes with task id
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
