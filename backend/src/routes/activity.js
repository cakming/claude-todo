import express from 'express';
import { getProjectActivity } from '../controllers/activityController.js';

const router = express.Router();

router.get('/', getProjectActivity);

export default router;
