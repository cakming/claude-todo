import express from 'express';
import { getFeaturesByEpic, getFeatureById, createFeature, updateFeature, deleteFeature } from '../controllers/featureController.js';

const router = express.Router();

// Routes with epicId parameter
router.get('/by-epic/:epicId', getFeaturesByEpic);
router.post('/by-epic/:epicId', createFeature);

// Routes with feature id
router.get('/:id', getFeatureById);
router.put('/:id', updateFeature);
router.delete('/:id', deleteFeature);

export default router;
