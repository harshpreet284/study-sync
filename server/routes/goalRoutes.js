import express from 'express';
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
} from '../controllers/goalController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All learning goal routes require authentication
router.use(protect);

router.route('/')
  .get(getGoals)
  .post(createGoal);

router.route('/:id')
  .get(getGoalById)
  .patch(updateGoal)
  .delete(deleteGoal);

export default router;
