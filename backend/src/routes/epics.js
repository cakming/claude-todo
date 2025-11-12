import express from 'express';
import { getEpics, getEpicById, createEpic, updateEpic, deleteEpic } from '../controllers/epicController.js';

const router = express.Router();

router.get('/', getEpics);
router.post('/', createEpic);
router.get('/:id', getEpicById);
router.put('/:id', updateEpic);
router.delete('/:id', deleteEpic);

export default router;
