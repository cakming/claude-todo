import express from 'express';
import { listUsers, updateUserRole, deleteUser, resetUserPassword } from '../controllers/userController.js';

const router = express.Router();

// Mounted behind authenticate + requireRole('admin') in app.js.
router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/reset-password', resetUserPassword);

export default router;
