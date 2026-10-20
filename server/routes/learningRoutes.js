import express from 'express';
import {
  getLearningRecords,
  addLearningRecord,
  updateLearningRecord,
  deleteLearningRecord,
} from '../controllers/learningController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All personal learning routes require authentication
router.use(protect);

router.route('/')
  .get(getLearningRecords)
  .post(addLearningRecord);

router.route('/:id')
  .patch(updateLearningRecord)
  .delete(deleteLearningRecord);

export default router;
