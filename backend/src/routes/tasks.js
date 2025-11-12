import express from 'express';
import { getTasksByFeature, getTaskById, createTask, updateTask, deleteTask } from '../controllers/taskController.js';

const router = express.Router();

// Routes with featureId parameter
router.get('/by-feature/:featureId', getTasksByFeature);
router.post('/by-feature/:featureId', createTask);

// Routes with task id
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
